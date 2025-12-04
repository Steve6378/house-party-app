# Yorru - AI Routes
# Version: 0.0.2

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import openai
import json
import httpx

from models.event import Event
from models.user import User
from models.message import Message
from models.ground_truth import GroundTruthFact
from models.event_photo import EventPhoto
from models.event_document import EventDocument
from models.event_faq import EventFAQ
import uuid
from datetime import datetime
from utils.database import get_db
from routes.auth import get_current_user
from services.permissions import require_event_access
from services.event_rag import query_event_ai
from services.websocket_manager import manager
from config import settings

router = APIRouter(prefix="/ai", tags=["ai"])

# Configure OpenAI
openai.api_key = settings.OPENAI_API_KEY


class ConversationMessage(BaseModel):
    """A single conversation message for history"""
    role: str  # 'user' or 'assistant'
    content: str


class HostAssistRequest(BaseModel):
    """Request schema for host assist"""
    event_id: str
    task: str
    context: Optional[dict] = None
    conversation_history: Optional[List[ConversationMessage]] = None


class ProposedAction(BaseModel):
    """An action the AI wants to perform, requiring user confirmation"""
    function: str
    args: dict
    description: str  # Human-readable description of what will happen


class HostAssistResponse(BaseModel):
    """Response schema for host assist"""
    response: str
    proposed_action: Optional[ProposedAction] = None


# Define OpenAI tools for event modifications
EVENT_MODIFICATION_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "update_event_name",
            "description": "Update the name/title of the event",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "The new event name"}
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_event_date",
            "description": "Update the event date",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "The new date in YYYY-MM-DD format"}
                },
                "required": ["date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_event_time",
            "description": "Update the event start time",
            "parameters": {
                "type": "object",
                "properties": {
                    "time": {"type": "string", "description": "The new time in HH:MM format (24-hour)"}
                },
                "required": ["time"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_event_location",
            "description": "Update the event address/location",
            "parameters": {
                "type": "object",
                "properties": {
                    "address": {"type": "string", "description": "The new address or location"}
                },
                "required": ["address"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_event_description",
            "description": "Update the event description",
            "parameters": {
                "type": "object",
                "properties": {
                    "description": {"type": "string", "description": "The new event description"}
                },
                "required": ["description"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_expected_guests",
            "description": "Update the expected number of guests",
            "parameters": {
                "type": "object",
                "properties": {
                    "expected_guests": {"type": "integer", "description": "The expected number of guests"}
                },
                "required": ["expected_guests"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_budget",
            "description": "Update the budget per person",
            "parameters": {
                "type": "object",
                "properties": {
                    "budget_per_person": {"type": "number", "description": "The budget per person in dollars"}
                },
                "required": ["budget_per_person"]
            }
        }
    }
]


def get_action_description(function_name: str, args: dict) -> str:
    """Generate human-readable description of an action"""
    descriptions = {
        "update_event_name": f"Change event name to \"{args.get('name')}\"",
        "update_event_date": f"Change event date to {args.get('date')}",
        "update_event_time": f"Change event time to {args.get('time')}",
        "update_event_location": f"Change location to \"{args.get('address')}\"",
        "update_event_description": f"Update event description",
        "update_expected_guests": f"Set expected guests to {args.get('expected_guests')}",
        "update_budget": f"Set budget to ${args.get('budget_per_person')} per person"
    }
    return descriptions.get(function_name, f"Execute {function_name}")


class GuestQueryRequest(BaseModel):
    """Request schema for guest query"""
    event_id: str
    question: str
    conversation_history: Optional[List[ConversationMessage]] = None


class GuestQueryResponse(BaseModel):
    """Response schema for guest query"""
    answer: Optional[str] = None
    sources: list[str] = []
    event_id: str
    skip_response: bool = False


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

    # Fetch uploaded documents (PDFs, etc.)
    try:
        uploaded_documents = db.query(EventDocument).filter(
            EventDocument.event_id == request.event_id
        ).all()
    except:
        uploaded_documents = []

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
            event_context += f"- {fact.key}: {fact.value}\n"

    # Add uploaded document content
    if uploaded_documents:
        event_context += "\n\nUploaded Documents:\n"
        for doc in uploaded_documents:
            if doc.extracted_text:
                # Limit each document to 2000 chars to avoid token limits
                text_preview = doc.extracted_text[:2000]
                if len(doc.extracted_text) > 2000:
                    text_preview += "..."
                event_context += f"\n--- Document: {doc.filename} ---\n{text_preview}\n"

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
        # Build messages array with conversation history for context
        messages = [
            {
                "role": "system",
                "content": """You are a helpful event planning assistant. Help the host plan and organize their event. Be concise, practical, and actionable. Provide specific suggestions based on the event details.

When the user asks to UPDATE or CHANGE event details (like date, time, location, name, description, budget, or expected guests), use the appropriate tool to make that change. Only use tools when the user explicitly wants to make a change.

When there's conversation history, use it to understand follow-up questions and maintain context."""
            }
        ]

        # Add conversation history if provided
        if request.conversation_history:
            for msg in request.conversation_history[-6:]:  # Last 6 messages for context
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })

        # Add current request with event context
        messages.append({
            "role": "user",
            "content": event_context
        })

        # Call OpenAI API with tools for event modifications
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=EVENT_MODIFICATION_TOOLS,
            tool_choice="auto",  # Let AI decide when to use tools
            temperature=0.7,
            max_tokens=500
        )

        message = response.choices[0].message

        # Check if AI wants to call a tool (modify event)
        if message.tool_calls:
            tool_call = message.tool_calls[0]
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)

            # Return proposed action for user confirmation
            return HostAssistResponse(
                response=message.content or f"I'll help you {get_action_description(function_name, function_args).lower()}. Please confirm this change.",
                proposed_action=ProposedAction(
                    function=function_name,
                    args=function_args,
                    description=get_action_description(function_name, function_args)
                )
            )

        # No tool call - just a regular response
        return HostAssistResponse(response=message.content)

    except Exception as e:
        print(f"OpenAI API error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate AI response. Please try again."
        )


class ExecuteActionRequest(BaseModel):
    """Request to execute a confirmed AI action"""
    event_id: str
    function: str
    args: dict


class ExecuteActionResponse(BaseModel):
    """Response after executing an action"""
    success: bool
    message: str


@router.post("/execute-action", response_model=ExecuteActionResponse)
async def execute_ai_action(
    request: ExecuteActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Execute a confirmed AI action to modify event details.

    **Authentication required. Host/co-host only.**

    This endpoint executes actions that were proposed by the AI assistant
    and confirmed by the user.
    """
    # Get the event
    event = db.query(Event).filter(Event.id == request.event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission (must be host or co-host)
    require_event_access(current_user, event, db, action="edit")

    # Map function names to event fields
    field_mapping = {
        "update_event_name": ("name", "name"),
        "update_event_date": ("date", "date"),
        "update_event_time": ("time", "time"),
        "update_event_location": ("address", "address"),
        "update_event_description": ("description", "description"),
        "update_expected_guests": ("expected_guests", "expected_guests"),
        "update_budget": ("budget_per_person", "budget_per_person")
    }

    if request.function not in field_mapping:
        raise HTTPException(status_code=400, detail=f"Unknown function: {request.function}")

    field_name, arg_key = field_mapping[request.function]

    if arg_key not in request.args:
        raise HTTPException(status_code=400, detail=f"Missing required argument: {arg_key}")

    try:
        # Update the event field
        new_value = request.args[arg_key]
        setattr(event, field_name, new_value)
        db.commit()

        return ExecuteActionResponse(
            success=True,
            message=f"Successfully updated {field_name.replace('_', ' ')}"
        )

    except Exception as e:
        db.rollback()
        print(f"Error executing AI action: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to execute action. Please try again."
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
        # Convert conversation history to list of dicts if provided
        conv_history = None
        if request.conversation_history:
            conv_history = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]

        # Query event-specific RAG system with conversation history
        result = await query_event_ai(request.event_id, request.question, db, conv_history)

        return GuestQueryResponse(
            answer=result["answer"],
            sources=result["sources"],
            event_id=result["event_id"],
            skip_response=result.get("skip_response", False)
        )

    except Exception as e:
        print(f"RAG query error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate AI response. Please try again."
        )


class GeneralQueryRequest(BaseModel):
    """Request schema for general AI query (ChatGPT-like)"""
    question: str
    conversation_history: Optional[List[ConversationMessage]] = None
    event_id: Optional[str] = None  # Optional: include event documents in context


class GeneralQueryResponse(BaseModel):
    """Response schema for general query"""
    answer: str


@router.post("/general-query", response_model=GeneralQueryResponse)
async def general_query(
    request: GeneralQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    General AI assistant (ChatGPT-like responses).

    **Authentication required.**

    Answers any general question. If event_id is provided, includes
    uploaded documents in the context for event-specific questions.
    """
    try:
        # Build document context if event_id provided
        document_context = ""
        if request.event_id:
            # Get uploaded documents for this event
            uploaded_documents = db.query(EventDocument).filter(
                EventDocument.event_id == request.event_id
            ).all()

            if uploaded_documents:
                document_context = "\n\nUploaded Documents for this event:\n"
                for doc in uploaded_documents:
                    if doc.extracted_text:
                        # Limit each document to 3000 chars
                        doc_preview = doc.extracted_text[:3000]
                        if len(doc.extracted_text) > 3000:
                            doc_preview += "... [truncated]"
                        document_context += f"\n--- {doc.filename} ---\n{doc_preview}\n"

        # Build system message
        system_content = "You are a helpful assistant. Be concise and direct in your responses. When there's conversation history, use it to understand follow-up questions and maintain context."
        if document_context:
            system_content += f"\n\nYou have access to the following event documents. Use them to answer questions about the event:{document_context}"

        # Build messages array with conversation history for context
        messages = [
            {
                "role": "system",
                "content": system_content
            }
        ]

        # Add conversation history if provided
        if request.conversation_history:
            for msg in request.conversation_history[-6:]:  # Last 6 messages for context
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })

        # Add current question
        messages.append({
            "role": "user",
            "content": request.question
        })

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )

        return GeneralQueryResponse(answer=response.choices[0].message.content)

    except Exception as e:
        print(f"General query error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate AI response. Please try again."
        )


class FaceSearchRequest(BaseModel):
    """Request schema for face-based photo search"""
    event_id: str


class FaceSearchPhotoResponse(BaseModel):
    """Response schema for a matched photo"""
    id: str
    file_path: str
    description: Optional[str] = None
    confidence: float


class FaceSearchResponse(BaseModel):
    """Response schema for face search"""
    photos: List[FaceSearchPhotoResponse]
    message: str
    total_found: int


@router.post("/find-my-photos", response_model=FaceSearchResponse)
async def find_my_photos(
    request: FaceSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Find photos containing the current user's face.

    **Authentication required.**

    Uses face recognition to match the user's profile photo against
    event photos to find pictures containing them.

    Requirements:
    - User must have uploaded a profile photo with a clear face
    - Event must have photos with face encodings extracted
    """
    # Check if face recognition is available
    try:
        from services.face_recognition import is_available, compare_faces, encoding_from_json
        if not is_available():
            return FaceSearchResponse(
                photos=[],
                message="Face recognition is not available. Please contact support.",
                total_found=0
            )
    except ImportError:
        return FaceSearchResponse(
            photos=[],
            message="Face recognition service is not installed.",
            total_found=0
        )

    # Get the event
    event = db.query(Event).filter(Event.id == request.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has access to view the event
    require_event_access(current_user, event, db, action="view")

    # Check if user has a face encoding from their profile photo
    if not current_user.face_encoding:
        return FaceSearchResponse(
            photos=[],
            message="Please upload a profile photo with a clear face to use this feature. Go to Settings to upload your photo.",
            total_found=0
        )

    # Parse user's face encoding
    try:
        user_encoding = json.loads(current_user.face_encoding)
    except (json.JSONDecodeError, TypeError):
        return FaceSearchResponse(
            photos=[],
            message="Your profile photo could not be processed for face recognition. Please try uploading a new photo with a clear face.",
            total_found=0
        )

    # Get all photos for this event that have face encodings
    photos = db.query(EventPhoto).filter(
        EventPhoto.event_id == request.event_id,
        EventPhoto.face_encodings.isnot(None)
    ).all()

    if not photos:
        return FaceSearchResponse(
            photos=[],
            message="No photos with faces detected in this event yet. Try uploading more photos!",
            total_found=0
        )

    # Search for matches
    matched_photos = []
    for photo in photos:
        try:
            photo_encodings = json.loads(photo.face_encodings)
            if not photo_encodings:
                continue

            # Compare faces (tolerance of 0.5 for OpenCV histogram-based matching)
            is_match, distance = compare_faces(user_encoding, photo_encodings, tolerance=0.5)

            if is_match:
                confidence = max(0, 1 - distance)  # Convert distance to confidence
                matched_photos.append({
                    "id": photo.id,
                    "file_path": f"/api/events/photos/{photo.id}/file",
                    "description": photo.description,
                    "confidence": round(confidence, 2)
                })
        except (json.JSONDecodeError, TypeError) as e:
            print(f"Error parsing face encodings for photo {photo.id}: {e}")
            continue

    # Sort by confidence (best matches first)
    matched_photos.sort(key=lambda x: x["confidence"], reverse=True)

    if matched_photos:
        message = f"Found {len(matched_photos)} photo(s) with you in them!"
    else:
        message = "No photos with your face found in this event. Try uploading more photos or ensuring your profile photo has a clear face."

    return FaceSearchResponse(
        photos=matched_photos,
        message=message,
        total_found=len(matched_photos)
    )


# ==================== FAQ ENDPOINTS ====================

class FAQItem(BaseModel):
    """Response schema for a single FAQ item"""
    id: str
    question: str
    answer: str
    frequency: int


class FAQListResponse(BaseModel):
    """Response schema for FAQ list"""
    faqs: List[FAQItem]
    event_id: str


class RecordFAQRequest(BaseModel):
    """Request schema for recording a FAQ question"""
    event_id: str
    question: str
    answer: str


class RecordFAQResponse(BaseModel):
    """Response schema for recording a FAQ"""
    success: bool
    faq_id: str
    is_new: bool


@router.post("/record-faq", response_model=RecordFAQResponse)
async def record_faq(
    request: RecordFAQRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record a question asked via #general to the FAQ system.

    **Authentication required.**

    This endpoint tracks questions asked by guests via the #general AI mode.
    Questions are stored with their frequency, and the top 5 most asked
    questions automatically become the event's FAQ.
    """
    # Get the event
    event = db.query(Event).filter(Event.id == request.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has access to view the event
    require_event_access(current_user, event, db, action="view")

    # Normalize the question (lowercase, strip whitespace)
    normalized_question = request.question.strip().lower()

    # Check if a similar question already exists (exact match for now)
    existing_faq = db.query(EventFAQ).filter(
        EventFAQ.event_id == request.event_id,
        EventFAQ.question.ilike(f"%{normalized_question}%")
    ).first()

    if existing_faq:
        # Increment frequency
        existing_faq.frequency += 1
        existing_faq.last_asked_by = current_user.id
        # Update answer if this is a newer/better answer
        existing_faq.answer = request.answer
        db.commit()
        return RecordFAQResponse(
            success=True,
            faq_id=existing_faq.id,
            is_new=False
        )
    else:
        # Create new FAQ entry
        new_faq = EventFAQ(
            id=f"faq-{uuid.uuid4()}",
            event_id=request.event_id,
            question=request.question.strip(),
            answer=request.answer,
            frequency=1,
            is_public=True,
            last_asked_by=current_user.id
        )
        db.add(new_faq)
        db.commit()
        return RecordFAQResponse(
            success=True,
            faq_id=new_faq.id,
            is_new=True
        )


@router.get("/faq/{event_id}", response_model=FAQListResponse)
async def get_event_faqs(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the top 5 most frequently asked questions for an event.

    **Authentication required.**

    Returns the FAQ list sorted by frequency (most asked first),
    limited to 5 items.
    """
    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has access to view the event
    require_event_access(current_user, event, db, action="view")

    # Get top 5 FAQs by frequency
    faqs = db.query(EventFAQ).filter(
        EventFAQ.event_id == event_id,
        EventFAQ.is_public == True
    ).order_by(EventFAQ.frequency.desc()).limit(5).all()

    return FAQListResponse(
        faqs=[
            FAQItem(
                id=faq.id,
                question=faq.question,
                answer=faq.answer,
                frequency=faq.frequency
            )
            for faq in faqs
        ],
        event_id=event_id
    )


# ==================== EVENT DESCRIPTION GENERATION ====================

class GenerateDescriptionRequest(BaseModel):
    """Request schema for generating event description"""
    name: str
    event_type: str
    topics: Optional[List[str]] = None
    date: Optional[str] = None
    address: Optional[str] = None
    expected_guests: Optional[int] = None
    is_online: Optional[bool] = False


class GenerateDescriptionResponse(BaseModel):
    """Response schema for generated description"""
    description: str


@router.post("/generate-description", response_model=GenerateDescriptionResponse)
async def generate_event_description(
    request: GenerateDescriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate an AI-powered description for an event.

    **Authentication required.**

    Uses event details (name, type, topics, etc.) to generate
    an engaging description that hosts can use or edit.
    """
    # Build context for the AI
    topics_str = ", ".join(request.topics) if request.topics else "general"
    location_str = "online" if request.is_online else (request.address or "a location TBD")
    guests_str = f"approximately {request.expected_guests} guests" if request.expected_guests else "guests"
    date_str = request.date or "an upcoming date"

    prompt = f"""Generate a short, engaging event description (2-3 sentences) for the following event:

Event Name: {request.name}
Event Type: {request.event_type}
Topics/Categories: {topics_str}
Date: {date_str}
Location: {location_str}
Expected Attendance: {guests_str}

The description should:
- Be welcoming and inviting
- Highlight what makes this event special
- Be appropriate for the event type (casual for parties, professional for networking, etc.)
- NOT include specific dates, times, or addresses (those are shown separately)
- Be 2-3 sentences maximum

Write only the description, no quotes or additional text."""

    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that writes engaging event descriptions. Be concise and match the tone to the event type."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=200
        )

        description = response.choices[0].message.content.strip()
        # Remove any surrounding quotes if present
        if description.startswith('"') and description.endswith('"'):
            description = description[1:-1]

        return GenerateDescriptionResponse(description=description)

    except Exception as e:
        print(f"Description generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate description. Please try again."
        )


# ==================== BROADCAST ENDPOINT ====================

class BroadcastRequest(BaseModel):
    """Request schema for broadcasting a message to event chat"""
    event_id: str
    message: str
    message_type: str = "announcement"


class BroadcastResponse(BaseModel):
    """Response schema for broadcast"""
    success: bool
    message_id: str
    message: str


@router.post("/broadcast", response_model=BroadcastResponse)
async def broadcast_message(
    request: BroadcastRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Broadcast a message to the event's group chat.

    **Authentication required.**

    This endpoint allows hosts/co-hosts to send announcements
    to all event attendees. The message is saved to the event chat
    and broadcast via WebSocket to connected clients.

    Only the host and co-hosts can use this feature.
    """
    # Get the event
    event = db.query(Event).filter(Event.id == request.event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission (must be host or co-host)
    require_event_access(current_user, event, db, action="edit")

    # Create the message in the event chat
    message = Message(
        id=str(uuid.uuid4()),
        event_id=request.event_id,
        sender_id=current_user.id,
        message_type=request.message_type,
        content=request.message
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    # Broadcast via WebSocket to all connected clients in this event
    await manager.broadcast_to_event(request.event_id, {
        "type": "message",
        "data": {
            "id": message.id,
            "sender_id": current_user.id,
            "sender_name": current_user.name,
            "message_type": request.message_type,
            "content": message.content,
            "created_at": message.created_at.isoformat(),
            "is_broadcast": True
        }
    })

    return BroadcastResponse(
        success=True,
        message_id=message.id,
        message="Message broadcast successfully to event chat"
    )


# ==================== RECOMMENDATION ENDPOINT (Google Places API) ====================

class PlaceResult(BaseModel):
    """A single place result from Google Places"""
    name: str
    address: str
    rating: Optional[float] = None
    total_ratings: Optional[int] = None
    price_level: Optional[int] = None
    place_id: str
    types: List[str] = []
    opening_hours: Optional[str] = None
    maps_url: Optional[str] = None


class RecommendationRequest(BaseModel):
    """Request schema for place recommendations"""
    event_id: str
    query: str  # e.g., "Italian restaurants", "coffee shops", "florists"
    radius: int = 5000  # meters (default 5km)


class RecommendationResponse(BaseModel):
    """Response schema for recommendations"""
    places: List[PlaceResult]
    message: str
    total_found: int


@router.post("/recommendation", response_model=RecommendationResponse)
async def get_recommendations(
    request: RecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get place recommendations near the event location using Google Places API.

    **Authentication required.**

    Searches for places matching the query near the event's location.
    Returns real Google Places results with ratings, addresses, etc.
    """
    # Get the event
    event = db.query(Event).filter(Event.id == request.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has access to view the event
    require_event_access(current_user, event, db, action="view")

    # Check if event has location data
    if not event.latitude or not event.longitude:
        # Fall back to user's location if available
        if current_user.latitude and current_user.longitude:
            lat, lng = current_user.latitude, current_user.longitude
        else:
            return RecommendationResponse(
                places=[],
                message="No location set for this event. Please add an address to get nearby recommendations.",
                total_found=0
            )
    else:
        lat, lng = event.latitude, event.longitude

    try:
        # Use Google Places Text Search API
        base_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"

        params = {
            "query": request.query,
            "location": f"{lat},{lng}",
            "radius": request.radius,
            "key": settings.GOOGLE_MAPS_API_KEY
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(base_url, params=params)
            data = response.json()

        if data.get("status") != "OK":
            if data.get("status") == "ZERO_RESULTS":
                return RecommendationResponse(
                    places=[],
                    message=f"No places found matching '{request.query}' near this location.",
                    total_found=0
                )
            print(f"Google Places API error: {data.get('status')} - {data.get('error_message', 'Unknown error')}")
            raise HTTPException(status_code=500, detail="Failed to fetch recommendations")

        # Parse results
        places = []
        for result in data.get("results", [])[:10]:  # Limit to top 10
            # Get opening hours status
            opening_hours = None
            if result.get("opening_hours"):
                opening_hours = "Open now" if result["opening_hours"].get("open_now") else "Closed"

            # Generate Google Maps URL
            maps_url = f"https://www.google.com/maps/place/?q=place_id:{result['place_id']}"

            places.append(PlaceResult(
                name=result.get("name", "Unknown"),
                address=result.get("formatted_address", "Address unavailable"),
                rating=result.get("rating"),
                total_ratings=result.get("user_ratings_total"),
                price_level=result.get("price_level"),
                place_id=result["place_id"],
                types=result.get("types", []),
                opening_hours=opening_hours,
                maps_url=maps_url
            ))

        if places:
            message = f"Found {len(places)} places matching '{request.query}' near your event!"
        else:
            message = f"No places found matching '{request.query}' near this location."

        return RecommendationResponse(
            places=places,
            message=message,
            total_found=len(places)
        )

    except httpx.RequestError as e:
        print(f"HTTP request error: {e}")
        raise HTTPException(status_code=500, detail="Failed to connect to Google Places API")
    except Exception as e:
        print(f"Recommendation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch recommendations")
