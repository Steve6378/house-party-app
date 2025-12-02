# Yorru - AI Routes
# Version: 0.0.2

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import openai
import json

from models.event import Event
from models.user import User
from models.message import Message
from models.ground_truth import GroundTruthFact
from models.event_photo import EventPhoto
from models.event_document import EventDocument
from models.event_faq import EventFAQ
import uuid
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
            event_context += f"- {fact.content}\n"

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


class GeneralQueryRequest(BaseModel):
    """Request schema for general AI query (ChatGPT-like)"""
    question: str


class GeneralQueryResponse(BaseModel):
    """Response schema for general query"""
    answer: str


@router.post("/general-query", response_model=GeneralQueryResponse)
async def general_query(
    request: GeneralQueryRequest,
    current_user: User = Depends(get_current_user)
):
    """
    General AI assistant (ChatGPT-like responses).

    **Authentication required.**

    Answers any general question without event-specific context.
    Use this for general knowledge questions like recipes, tips, etc.
    """
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Be concise and direct in your responses."
                },
                {
                    "role": "user",
                    "content": request.question
                }
            ],
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
