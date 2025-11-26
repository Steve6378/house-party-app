# Yorru - Questionnaire Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from models.event import Event
from models.questionnaire import EventQuestionnaire
from models.user import User
from schemas.questionnaire import QuestionnaireSubmitRequest, QuestionnaireResponse
from utils.database import get_db
from routes.auth import get_current_user
from services.permissions import require_event_access

router = APIRouter(prefix="/events", tags=["questionnaire"])


@router.post("/{event_id}/questionnaire", response_model=QuestionnaireResponse)
async def submit_questionnaire(
    event_id: str,
    request: QuestionnaireSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit or update questionnaire responses for an event.

    **Authentication required.**

    Only hosts and co-hosts can fill out questionnaires.
    If a questionnaire already exists, it will be updated.

    The questionnaire helps the AI answer guest questions by providing
    additional context about the event (dress code, parking, food, etc.)
    """
    # Verify event exists and user has permission
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    require_event_access(current_user, event, db, action="edit")

    # Check if questionnaire already exists
    existing = db.query(EventQuestionnaire).filter(
        EventQuestionnaire.event_id == event_id
    ).first()

    if existing:
        # Update existing questionnaire
        existing.responses = request.responses
        existing.filled_by = current_user.id
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new questionnaire
        questionnaire = EventQuestionnaire(
            id=str(uuid.uuid4()),
            event_id=event_id,
            filled_by=current_user.id,
            responses=request.responses
        )
        db.add(questionnaire)
        db.commit()
        db.refresh(questionnaire)
        return questionnaire


@router.get("/{event_id}/questionnaire", response_model=QuestionnaireResponse)
async def get_questionnaire(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get questionnaire responses for an event.

    **Authentication required.**

    Returns the questionnaire if it exists.
    """
    # Verify event exists and user has access
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    require_event_access(current_user, event, db, action="view")

    # Get questionnaire
    questionnaire = db.query(EventQuestionnaire).filter(
        EventQuestionnaire.event_id == event_id
    ).first()

    if not questionnaire:
        raise HTTPException(
            status_code=404,
            detail="Questionnaire not found. Host needs to fill it out first."
        )

    return questionnaire
