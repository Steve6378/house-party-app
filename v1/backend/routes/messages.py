# Festivio - Message Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import uuid

from models.message import Message
from models.event import Event
from models.user import User
from schemas.message import MessageCreate, MessageUpdate, MessageResponse, MessageListResponse
from utils.database import get_db
from routes.auth import get_current_user

router = APIRouter(prefix="/events", tags=["messages"])


@router.post("/{event_id}/messages", response_model=MessageResponse, status_code=201)
def send_message(
    event_id: str,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to an event chat.

    **Authentication required.**

    Requires:
    - **content**: Message text (1-10,000 characters)
    - **message_type**: Optional, defaults to "user"

    TODO: Check if user is invited to event before allowing messages
    """
    # Check if event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # TODO: Check if user is invited/member of this event
    # For now, any logged-in user can message any event

    # Generate message ID
    message_id = f"msg-{uuid.uuid4()}"

    # Create message
    new_message = Message(
        id=message_id,
        event_id=event_id,
        sender_id=current_user.id,
        message_type=message_data.message_type,
        content=message_data.content,
        is_edited=False,
        is_deleted=False
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return new_message


@router.get("/{event_id}/messages", response_model=MessageListResponse)
def list_messages(
    event_id: str,
    skip: int = Query(0, ge=0, description="Number of messages to skip"),
    limit: int = Query(50, ge=1, le=100, description="Max messages to return"),
    include_deleted: bool = Query(False, description="Include soft-deleted messages"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List messages for an event with pagination.

    **Authentication required.**

    - **skip**: Pagination offset (default: 0)
    - **limit**: Max results (default: 50, max: 100)
    - **include_deleted**: Show deleted messages (default: false)

    Messages are ordered by creation time (oldest first).

    TODO: Check if user is invited to event before showing messages
    """
    # Check if event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # TODO: Check if user is invited/member of this event

    # Build query
    query = db.query(Message).filter(Message.event_id == event_id)

    # Filter out deleted messages unless requested
    if not include_deleted:
        query = query.filter(Message.is_deleted == False)

    # Get total count
    total = query.count()

    # Apply pagination and fetch (oldest first)
    messages = query.order_by(Message.created_at.asc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "messages": messages,
        "skip": skip,
        "limit": limit
    }


@router.put("/messages/{message_id}", response_model=MessageResponse)
def edit_message(
    message_id: str,
    updates: MessageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Edit a message.

    **Authentication required.**

    Only the sender can edit their own messages.
    System and assistant messages cannot be edited.
    """
    # Get message
    message = db.query(Message).filter(Message.id == message_id).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Check if user is the sender
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the sender can edit this message")

    # Can't edit system or assistant messages
    if message.message_type in ["system", "assistant"]:
        raise HTTPException(status_code=403, detail="Cannot edit system or assistant messages")

    # Can't edit deleted messages
    if message.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot edit deleted message")

    # Update message
    message.content = updates.content
    message.is_edited = True
    message.edited_at = datetime.utcnow()

    db.commit()
    db.refresh(message)

    return message


# Separate router for message-specific routes
message_router = APIRouter(prefix="/messages", tags=["messages"])


@message_router.delete("/{message_id}")
def delete_message(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft delete a message.

    **Authentication required.**

    Only the sender can delete their own messages.
    Sets is_deleted=True and records deletion timestamp.
    Data is preserved in database.
    """
    # Get message
    message = db.query(Message).filter(Message.id == message_id).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Check if user is the sender
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the sender can delete this message")

    # Already deleted?
    if message.is_deleted:
        raise HTTPException(status_code=400, detail="Message already deleted")

    # Soft delete
    message.is_deleted = True
    message.deleted_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Message deleted successfully",
        "message_id": message_id,
        "deleted_at": message.deleted_at
    }


@message_router.get("/{message_id}", response_model=MessageResponse)
def get_message(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a single message by ID.

    **Authentication required.**

    TODO: Check if user has access to this event before showing message
    """
    message = db.query(Message).filter(Message.id == message_id).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # TODO: Check if user is invited to the event this message belongs to

    return message
