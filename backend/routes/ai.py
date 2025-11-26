# Yorru - AI Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import openai

from models.event import Event
from models.user import User
from models.message import Message
from models.ground_truth import GroundTruthFact
from utils.database import get_db
from routes.auth import get_current_user
from services.permissions import require_event_access
from services.event_rag import query_event_ai
from config import settings

router = APIRouter(prefix="/ai", tags=["ai"])

# Configure OpenAI
openai.api_key = settings.OPENAI_API_KEY


class HostAssistRequest(BaseModel):
    """Request schema for host assist"""
    event_id: str
    task: str
    context: Optional[dict] = None


class HostAssistResponse(BaseModel):
    """Response schema for host assist"""
    response: str


class GuestQueryRequest(BaseModel):
    """Request schema for guest query"""
    event_id: str
    question: str


class GuestQueryResponse(BaseModel):
    """Response schema for guest query"""
    answer: str
    sources: list[str]
    event_id: str


@router.post("/host-assist", response_model=HostAssistResponse)
async def host_assist(
    request: HostAssistRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI assistant for event hosts.

    **Authentication required.**

    Helps hosts with various event planning tasks like:
    - Suggesting party ideas
    - Generating shopping lists
    - Planning timelines
    - Creating task lists

    Only the host and co-hosts can use this feature.
    """
    # Get the event
    event = db.query(Event).filter(Event.id == request.event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission to use host assist (must be host or co-host)
    require_event_access(current_user, event, db, action="edit")

    # Fetch event messages (chat history) for context
    try:
        messages = db.query(Message).filter(
            Message.event_id == request.event_id
        ).order_by(Message.created_at.desc()).limit(50).all()
    except:
        messages = []

    # Fetch ground truth facts (host-uploaded information)
    try:
        ground_truth_facts = db.query(GroundTruthFact).filter(
            GroundTruthFact.event_id == request.event_id
        ).all()
    except:
        ground_truth_facts = []

    # Build context for OpenAI
    event_context = f"""
Event Details:
- Name: {event.name}
- Type: {event.event_type}
- Date: {event.date}
- Time: {event.time or 'Not set'}
- Location: {event.address or 'Not set'}
- Expected Guests: {event.expected_guests or 'Not set'}
- Budget per Person: ${event.budget_per_person or 'Not set'}

User Request: {request.task}
"""

    # Add ground truth facts (RAG context from host documents/facts)
    if ground_truth_facts:
        event_context += "\n\nHost-Provided Information (Ground Truth):\n"
        for fact in ground_truth_facts:
            event_context += f"- {fact.content}\n"

    # Add recent chat messages for additional context
    if messages:
        event_context += "\n\nRecent Event Chat (last 20 messages):\n"
        for msg in reversed(messages[:20]):  # Show oldest to newest
            sender = msg.sender.name if msg.sender else "System"
            event_context += f"- {sender}: {msg.content}\n"

    # Add additional context if provided
    if request.context:
        event_context += f"\n\nAdditional Context: {request.context}"

    try:
        # Call OpenAI API
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful event planning assistant. Help the host plan and organize their event. Be concise, practical, and actionable. Provide specific suggestions based on the event details."
                },
                {
                    "role": "user",
                    "content": event_context
                }
            ],
            temperature=0.7,
            max_tokens=500
        )

        ai_response = response.choices[0].message.content

        return HostAssistResponse(response=ai_response)

    except Exception as e:
        print(f"OpenAI API error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate AI response. Please try again."
        )


@router.post("/guest-query", response_model=GuestQueryResponse)
async def guest_query(
    request: GuestQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI assistant for event guests to ask questions.

    **Authentication required.**

    Uses RAG (Retrieval-Augmented Generation) to answer guest questions
    based on event-specific context:
    - Chat history
    - Uploaded documents (PDFs, etc.)
    - Host questionnaire responses
    - Event details

    All data is isolated to the specific event.
    """
    # Get the event
    event = db.query(Event).filter(Event.id == request.event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has access to view the event
    require_event_access(current_user, event, db, action="view")

    try:
        # Query event-specific RAG system
        result = await query_event_ai(request.event_id, request.question, db)

        return GuestQueryResponse(
            answer=result["answer"],
            sources=result["sources"],
            event_id=result["event_id"]
        )

    except Exception as e:
        print(f"RAG query error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate AI response. Please try again."
        )
