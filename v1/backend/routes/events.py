# Festivio - Event Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import uuid

from models.event import Event
from models.user import User
from schemas.event import EventCreate, EventUpdate, EventResponse, EventListResponse, EventListItem
from utils.database import get_db
from routes.auth import get_current_user
from services.permissions import get_user_events, require_event_access
from services.sanitize import sanitize_event_name, sanitize_event_address

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=EventListResponse)
def list_events(
    skip: int = Query(0, ge=0, description="Number of events to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max events to return"),
    status: Optional[str] = Query("active", description="Filter by status"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List events with pagination and filters.

    **Authentication required.**

    Only returns events you have permission to view:
    - Events you're hosting or co-hosting
    - Events you're invited to
    - Group events (if you're in the group)
    - Public events

    - **skip**: Pagination offset (default: 0)
    - **limit**: Max results (default: 20, max: 100)
    - **status**: Filter by status (default: active)
    - **event_type**: Filter by type (optional)
    """
    # Get all events user has access to (with filters applied)
    accessible_events = get_user_events(current_user, db, status=status, event_type=event_type)

    # Sort by date (newest first)
    accessible_events.sort(key=lambda e: e.date, reverse=True)

    # Get total count
    total = len(accessible_events)

    # Apply pagination manually
    paginated_events = accessible_events[skip:skip + limit]

    return {
        "total": total,
        "events": paginated_events,
        "skip": skip,
        "limit": limit
    }


@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a single event by ID.

    **Authentication required.**

    Returns detailed event information if you have permission to view it.
    """
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission to view this event
    require_event_access(current_user, event, db, action="view")

    return event


@router.post("", response_model=EventResponse, status_code=201)
def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new event.

    **Authentication required.**

    The logged-in user automatically becomes the main host.

    Requires:
    - **name**: Event name (will be sanitized to remove HTML)
    - **event_type**: Custom event type
    - **date**: Event date
    """
    # Generate unique ID
    event_id = f"event-{uuid.uuid4()}"

    # Sanitize inputs to prevent XSS
    sanitized_name = sanitize_event_name(event_data.name)
    sanitized_address = sanitize_event_address(event_data.address) if event_data.address else None

    # Create event object (main_host_id is automatically set to current user)
    new_event = Event(
        id=event_id,
        name=sanitized_name,
        event_type=event_data.event_type,
        date=event_data.date,
        time=event_data.time,
        address=sanitized_address,
        main_host_id=current_user.id,  # Auto-set to logged-in user
        group_id=event_data.group_id,
        budget_per_person=event_data.budget_per_person,
        expected_guests=event_data.expected_guests,
        status="active",
        visibility=event_data.visibility
    )

    # Save to database
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: str,
    updates: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing event.

    **Authentication required.**

    Only the host and co-hosts with edit_all permissions can update the event.

    All fields are optional - only provided fields will be updated.
    """
    # Get existing event
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission to edit
    require_event_access(current_user, event, db, action="edit")

    # Get update data
    update_data = updates.model_dump(exclude_unset=True)

    # Sanitize text fields if present
    if "name" in update_data:
        update_data["name"] = sanitize_event_name(update_data["name"])
    if "address" in update_data and update_data["address"]:
        update_data["address"] = sanitize_event_address(update_data["address"])

    # Apply updates
    for field, value in update_data.items():
        setattr(event, field, value)

    # Save changes
    db.commit()
    db.refresh(event)

    return event


@router.delete("/{event_id}")
def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft delete an event.

    **Authentication required.**

    Only the main host can delete events.

    Sets status to 'deleted' and records deletion timestamp.
    Data is preserved in database.
    """
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission to delete (host only)
    require_event_access(current_user, event, db, action="delete")

    # Soft delete
    event.status = "deleted"
    event.deleted_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Event deleted successfully",
        "event_id": event_id,
        "deleted_at": event.deleted_at
    }


@router.post("/{event_id}/archive")
def archive_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Archive an event.

    **Authentication required.**

    Only the host and co-hosts with edit_all permissions can archive events.

    Sets status to 'archived' and records archive timestamp.
    """
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission to edit
    require_event_access(current_user, event, db, action="edit")

    # Archive
    event.status = "archived"
    event.archived_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Event archived successfully",
        "event_id": event_id,
        "archived_at": event.archived_at
    }
