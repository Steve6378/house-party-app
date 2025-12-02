# Yorru - Event-Specific RAG Pipeline
# Version: 0.0.1
# Based on labb10 rag_chain_v2.py and llm_rag.py

from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import DocArrayInMemorySearch
from langchain.schema import Document
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser

from models.event import Event
from models.message import Message
from models.event_document import EventDocument
from models.questionnaire import EventQuestionnaire
from config import settings
import json


class EventRAG:
    """
    Event-specific RAG (Retrieval-Augmented Generation) pipeline.

    Retrieves relevant context from:
    1. Event chat messages
    2. Uploaded documents (PDFs, etc.)
    3. Host questionnaire responses

    All data is isolated per event - only accesses data for the specific event.
    """

    def __init__(self, event_id: str, db: Session):
        self.event_id = event_id
        self.db = db

        # Initialize OpenAI models
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=settings.OPENAI_API_KEY
        )

        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.2,
            openai_api_key=settings.OPENAI_API_KEY
        )

        # Text splitter for chunking documents
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

        # Vector store (will be populated with event data)
        self.vector_store = None

    def load_event_context(self) -> List[Document]:
        """
        Load all context for this event into Document objects.

        Returns:
            List of LangChain Document objects with event context
        """
        documents = []

        # 1. Load event basic info
        event = self.db.query(Event).filter(Event.id == self.event_id).first()
        if event:
            event_info = f"""
Event: {event.name}
Type: {event.event_type}
Date: {event.date}
Time: {event.time if event.time else 'TBD'}
Address: {event.address if event.address else 'TBD'}
Expected Guests: {event.expected_guests if event.expected_guests else 'TBD'}
Budget per Person: ${event.budget_per_person if event.budget_per_person else 'TBD'}
"""
            documents.append(Document(
                page_content=event_info,
                metadata={"source": "event_info", "event_id": self.event_id}
            ))

        # 2. Load questionnaire responses
        questionnaire = self.db.query(EventQuestionnaire).filter(
            EventQuestionnaire.event_id == self.event_id
        ).first()

        if questionnaire:
            q_text = "Host Questionnaire Responses:\n"
            for key, value in questionnaire.responses.items():
                q_text += f"{key}: {value}\n"

            documents.append(Document(
                page_content=q_text,
                metadata={"source": "questionnaire", "event_id": self.event_id}
            ))

        # 3. Load chat messages (recent conversation context)
        messages = self.db.query(Message).filter(
            Message.event_id == self.event_id,
            Message.is_deleted == False
        ).order_by(Message.created_at.desc()).limit(50).all()

        if messages:
            # Group messages into chunks of ~10 messages
            for i in range(0, len(messages), 10):
                chunk = messages[i:i+10]
                chat_text = "Recent Chat Messages:\n"
                for msg in reversed(chunk):  # Reverse to show oldest first in chunk
                    sender = "AI" if msg.message_type == "assistant" else "User"
                    chat_text += f"{sender}: {msg.content}\n"

                documents.append(Document(
                    page_content=chat_text,
                    metadata={"source": "chat", "event_id": self.event_id}
                ))

        # 4. Load uploaded documents (PDFs, etc.)
        uploaded_docs = self.db.query(EventDocument).filter(
            EventDocument.event_id == self.event_id
        ).all()

        for doc in uploaded_docs:
            if doc.extracted_text:
                documents.append(Document(
                    page_content=f"Document: {doc.filename}\n\n{doc.extracted_text}",
                    metadata={
                        "source": "uploaded_document",
                        "filename": doc.filename,
                        "event_id": self.event_id
                    }
                ))

        return documents

    def build_vector_store(self):
        """Build vector store from event context"""
        documents = self.load_event_context()

        if not documents:
            # No context available, create empty store
            self.vector_store = DocArrayInMemorySearch.from_texts(
                ["No context available for this event yet."],
                embedding=self.embeddings
            )
            return

        # Split documents into chunks
        chunks = self.text_splitter.split_documents(documents)

        # Create vector store
        self.vector_store = DocArrayInMemorySearch.from_documents(
            chunks,
            embedding=self.embeddings
        )

    def answer_question(self, question: str, conversation_history: Optional[List[dict]] = None) -> Tuple[str, List[str]]:
        """
        Answer a question using RAG pipeline.

        Args:
            question: User's question
            conversation_history: Optional list of previous messages for context

        Returns:
            Tuple of (answer, sources)
        """
        # Build/rebuild vector store with latest event data
        self.build_vector_store()

        # Create retriever
        retriever = self.vector_store.as_retriever(
            search_kwargs={"k": 5}  # Retrieve top 5 most relevant chunks
        )

        # Build conversation context if provided
        conv_context = ""
        if conversation_history:
            conv_context = "\n\nPrevious conversation:\n"
            for msg in conversation_history[-6:]:  # Last 6 messages for context
                role = "User" if msg.get("role") == "user" else "Assistant"
                conv_context += f"{role}: {msg.get('content', '')}\n"

        # Create prompt template with conversation history
        template = """You are a concise AI assistant helping with questions about an event's group chat.
Answer ONLY based on the chat messages and documents provided. Be brief and direct - 1-3 sentences max.
If the info isn't in the context, just say "I don't see that discussed in the chat yet."

IMPORTANT: If there's previous conversation context, use it to understand follow-up questions.
For example, if the previous answer mentioned someone is cooking salmon and the user asks "what should I make",
suggest something that complements what others are making.

Context from chat and documents:
{context}
{conv_history}
Current question: {question}

Brief answer:"""

        prompt = ChatPromptTemplate.from_template(template)

        # Create RAG chain
        def format_docs(docs):
            return "\n\n".join([doc.page_content for doc in docs])

        # Get context documents
        context_docs = retriever.get_relevant_documents(question)
        context_text = format_docs(context_docs)

        # Format the prompt with all variables
        formatted_prompt = prompt.format(
            context=context_text,
            conv_history=conv_context,
            question=question
        )

        # Get answer using LLM directly
        from langchain.schema import HumanMessage
        answer = self.llm.invoke([HumanMessage(content=formatted_prompt)]).content

        # Get source documents
        sources = []
        for doc in context_docs:
            source_type = doc.metadata.get("source", "unknown")
            if source_type == "uploaded_document":
                sources.append(f"Document: {doc.metadata.get('filename', 'Unknown')}")
            elif source_type == "questionnaire":
                sources.append("Host Questionnaire")
            elif source_type == "chat":
                sources.append("Chat History")
            elif source_type == "event_info":
                sources.append("Event Details")

        # Remove duplicates
        sources = list(set(sources))

        return answer, sources


async def query_event_ai(event_id: str, question: str, db: Session, conversation_history: Optional[List[dict]] = None) -> dict:
    """
    Query the event-specific AI with a question.

    Args:
        event_id: ID of the event
        question: User's question
        db: Database session
        conversation_history: Optional list of previous messages [{"role": "user/assistant", "content": "..."}]

    Returns:
        Dictionary with answer and sources
    """
    rag = EventRAG(event_id, db)
    answer, sources = rag.answer_question(question, conversation_history)

    return {
        "answer": answer,
        "sources": sources,
        "event_id": event_id
    }
