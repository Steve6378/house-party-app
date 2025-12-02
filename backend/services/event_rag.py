# Yorru - Event-Specific RAG Pipeline
# Version: 0.0.2
# Intelligent query routing with selective context retrieval

from typing import List, Tuple, Dict
from sqlalchemy.orm import Session
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import DocArrayInMemorySearch
from langchain.schema import Document
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
import json

from models.event import Event
from models.message import Message
from models.event_document import EventDocument
from models.questionnaire import EventQuestionnaire
from config import settings


class EventRAG:
    """
    Event-specific RAG (Retrieval-Augmented Generation) pipeline.

    Uses intelligent query routing to:
    1. Determine if RAG is needed at all
    2. If needed, determine what context sources to query
    3. Retrieve only relevant context
    4. Generate response with that context
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

        self.router_llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            openai_api_key=settings.OPENAI_API_KEY
        )

        # Text splitter for chunking documents
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

        self.vector_store = None

    def _route_query(self, question: str) -> Dict:
        """
        Use LLM to determine if/how to route the query.

        Returns:
            Dict with:
            - needs_rag: bool - whether RAG is needed
            - context_types: list - which context sources to query
            - direct_response: str|None - response if no RAG needed
            - search_focus: str - what to search for if RAG needed
        """
        routing_prompt = """Analyze this user message and determine how to respond.

User message: "{question}"

Respond in JSON format only:
{{
    "needs_rag": true or false,
    "context_types": ["event_info", "chat_history", "documents", "questionnaire"],
    "direct_response": "response if needs_rag is false, otherwise null",
    "search_focus": "what to search for if needs_rag is true, otherwise null"
}}

Rules:
- needs_rag = false for: greetings (hi, hello, hey, yo), thanks, goodbyes, casual chat (how are you, lol, ok), general knowledge NOT about this specific event
- needs_rag = true for: questions about event details (when, where, what), what was discussed in chat, uploaded documents, schedules, locations, attendees, food, dress code, anything event-specific
- context_types: only include what's relevant:
  - "event_info" for date, time, location, budget, guest count
  - "chat_history" for what people said, discussions, decisions
  - "documents" for uploaded PDFs, files, menus, schedules
  - "questionnaire" for host preferences, special requirements
- direct_response: be friendly and brief for greetings, mention you can help with event questions
- search_focus: the specific thing to look for in context

Output ONLY valid JSON."""

        try:
            response = self.router_llm.invoke(routing_prompt.format(question=question))
            # Clean response - remove markdown if present
            content = response.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            result = json.loads(content)
            return result
        except (json.JSONDecodeError, Exception) as e:
            print(f"Router error: {e}, falling back to RAG")
            return {
                "needs_rag": True,
                "context_types": ["event_info", "chat_history"],
                "direct_response": None,
                "search_focus": question
            }

    def _load_context_by_type(self, context_types: List[str]) -> List[Document]:
        """Load only the requested context types."""
        documents = []

        if "event_info" in context_types:
            event = self.db.query(Event).filter(Event.id == self.event_id).first()
            if event:
                event_info = f"""Event: {event.name}
Type: {event.event_type}
Date: {event.date}
Time: {event.time if event.time else 'TBD'}
Address: {event.address if event.address else 'TBD'}
Expected Guests: {event.expected_guests if event.expected_guests else 'TBD'}
Budget per Person: ${event.budget_per_person if event.budget_per_person else 'TBD'}
Description: {event.description if event.description else 'No description'}"""
                documents.append(Document(
                    page_content=event_info,
                    metadata={"source": "event_info", "event_id": self.event_id}
                ))

        if "questionnaire" in context_types:
            questionnaire = self.db.query(EventQuestionnaire).filter(
                EventQuestionnaire.event_id == self.event_id
            ).first()
            if questionnaire and questionnaire.responses:
                q_text = "Host Questionnaire Responses:\n"
                for key, value in questionnaire.responses.items():
                    q_text += f"{key}: {value}\n"
                documents.append(Document(
                    page_content=q_text,
                    metadata={"source": "questionnaire", "event_id": self.event_id}
                ))

        if "chat_history" in context_types:
            messages = self.db.query(Message).filter(
                Message.event_id == self.event_id,
                Message.is_deleted == False
            ).order_by(Message.created_at.desc()).limit(30).all()

            if messages:
                chat_text = "Recent Chat Messages:\n"
                for msg in reversed(messages):
                    sender = "AI" if msg.message_type == "assistant" else "User"
                    chat_text += f"{sender}: {msg.content}\n"
                documents.append(Document(
                    page_content=chat_text,
                    metadata={"source": "chat", "event_id": self.event_id}
                ))

        if "documents" in context_types:
            uploaded_docs = self.db.query(EventDocument).filter(
                EventDocument.event_id == self.event_id
            ).all()
            for doc in uploaded_docs:
                if doc.extracted_text:
                    documents.append(Document(
                        page_content=f"Document: {doc.filename}\n\n{doc.extracted_text}",
                        metadata={"source": "uploaded_document", "filename": doc.filename, "event_id": self.event_id}
                    ))

        return documents

    def answer_question(self, question: str) -> Tuple[str, List[str]]:
        """
        Answer a question using intelligent routing and selective RAG.
        """
        # Step 1: Route the query
        routing = self._route_query(question)

        # Step 2: If no RAG needed, return direct response
        if not routing.get("needs_rag", True):
            direct = routing.get("direct_response")
            if direct:
                return direct, []
            return "Hey! How can I help you with this event?", []

        # Step 3: Load only relevant context
        context_types = routing.get("context_types", ["event_info", "chat_history"])
        documents = self._load_context_by_type(context_types)

        if not documents:
            return "I don't have enough information about this event yet. The host hasn't added details.", []

        # Step 4: Build vector store with selective context
        chunks = self.text_splitter.split_documents(documents)
        self.vector_store = DocArrayInMemorySearch.from_documents(
            chunks,
            embedding=self.embeddings
        )

        # Step 5: Retrieve relevant chunks
        search_query = routing.get("search_focus") or question
        retriever = self.vector_store.as_retriever(search_kwargs={"k": 4})

        # Step 6: Generate response
        template = """You are a helpful assistant for an event. Answer based on the context provided.
Be concise (1-3 sentences). If the info isn't in the context, say so briefly.

Context:
{context}

Question: {question}

Answer:"""

        prompt = ChatPromptTemplate.from_template(template)

        def format_docs(docs):
            return "\n\n".join([doc.page_content for doc in docs])

        chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )

        answer = chain.invoke(search_query)

        # Get sources
        source_docs = retriever.get_relevant_documents(search_query)
        sources = list(set([
            doc.metadata.get("source", "unknown").replace("_", " ").title()
            for doc in source_docs
        ]))

        return answer, sources


async def query_event_ai(event_id: str, question: str, db: Session) -> dict:
    """Query the event-specific AI with a question."""
    rag = EventRAG(event_id, db)
    answer, sources = rag.answer_question(question)
    return {"answer": answer, "sources": sources, "event_id": event_id}
