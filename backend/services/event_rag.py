# Yorru - Event-Specific RAG Pipeline
# Version: 0.0.3
# Intelligent query routing with selective context retrieval and conversation history

from typing import List, Tuple, Dict, Optional
from sqlalchemy.orm import Session
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import DocArrayInMemorySearch
from langchain.schema import Document, HumanMessage
from langchain.prompts import ChatPromptTemplate
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
    "skip_response": true or false,
    "context_types": ["event_info", "chat_history", "documents", "questionnaire"],
    "direct_response": "response if needs_rag is false and skip_response is false, otherwise null",
    "search_focus": "what to search for if needs_rag is true, otherwise null"
}}

Rules:
- skip_response = true for: messages that don't need a response like "lol", "ok", "cool", "nice", "haha", "k", single emojis, acknowledgments that don't ask anything
- needs_rag = false for: greetings (hi, hello, hey, yo, sup, how are you, how r u), thanks, goodbyes, general knowledge NOT about this specific event
- needs_rag = true for: questions about event details (when, where, what), what was discussed in chat, uploaded documents, schedules, locations, attendees, food, dress code, anything event-specific
- context_types: only include what's relevant:
  - "event_info" for date, time, location, budget, guest count
  - "chat_history" for what people said, discussions, decisions
  - "documents" for uploaded PDFs, files, menus, schedules
  - "questionnaire" for host preferences, special requirements
- direct_response: KEEP IT SHORT (1 sentence max). Examples:
  - "hi" -> "Hey! What can I help you with?"
  - "how are you" -> "I'm good! Need help with the event?"
  - "thanks" -> "No problem!"
  - "lol" -> skip_response=true, direct_response=null
  - "ok" -> skip_response=true, direct_response=null
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

    def answer_question(self, question: str, conversation_history: Optional[List[dict]] = None) -> Tuple[str, List[str]]:
        """
        Answer a question using intelligent routing and selective RAG.

        Args:
            question: User's question
            conversation_history: Optional list of previous messages for context

        Returns:
            Tuple of (answer, sources)
        """
        # Step 1: Route the query
        routing = self._route_query(question)

        # Step 2: If skip_response is true, return None to indicate no response needed
        if routing.get("skip_response", False):
            return None, []

        # Step 3: If no RAG needed, return direct response
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
        retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})

        # Build conversation context if provided
        conv_context = ""
        if conversation_history:
            conv_context = "\n\nPrevious conversation:\n"
            for msg in conversation_history[-6:]:  # Last 6 messages for context
                role = "User" if msg.get("role") == "user" else "Assistant"
                conv_context += f"{role}: {msg.get('content', '')}\n"

        # Step 6: Generate response with conversation-aware prompt
        template = """You are a concise AI assistant helping with questions about an event.
Answer ONLY based on the context provided. Be brief and direct - 1-3 sentences max.
If the info isn't in the context, just say "I don't see that in the event details yet."

IMPORTANT: If there's previous conversation context, use it to understand follow-up questions.
For example, if the previous answer mentioned someone is cooking salmon and the user asks "what should I make",
suggest something that complements what others are making.

Context from event:
{context}
{conv_history}
Current question: {question}

Answer:"""

        prompt = ChatPromptTemplate.from_template(template)

        def format_docs(docs):
            return "\n\n".join([doc.page_content for doc in docs])

        # Get context documents
        context_docs = retriever.get_relevant_documents(search_query)
        context_text = format_docs(context_docs)

        # Format the prompt with all variables
        formatted_prompt = prompt.format(
            context=context_text,
            conv_history=conv_context,
            question=question
        )

        # Get answer using LLM
        answer = self.llm.invoke([HumanMessage(content=formatted_prompt)]).content

        # Get source documents with better formatting
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
        Dictionary with answer and sources, or skip_response=True if no response needed
    """
    rag = EventRAG(event_id, db)
    answer, sources = rag.answer_question(question, conversation_history)

    # If answer is None, it means no response is needed
    if answer is None:
        return {
            "skip_response": True,
            "answer": None,
            "sources": [],
            "event_id": event_id
        }

    return {
        "skip_response": False,
        "answer": answer,
        "sources": sources,
        "event_id": event_id
    }
