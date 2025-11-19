# Festivio - Event Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import uuid

from models.event import Event
from schemas.event import EventCreate, EventUpdate, EventResponse, EventListResponse, EventListItem
from utils.database import get_db

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=EventListResponse)
def list_events(
    skip: int = Query(0, ge=0, description="Number of events to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max events to return"),
    status: Optional[str] = Query("active", description="Filter by status"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    db: Session = Depends(get_db)
):
    """
    List events with pagination and filters.
    
    - **skip**: Pagination offset (default: 0)
    - **limit**: Max results (default: 20, max: 100)
    - **status**: Filter by status (default: active)
    - **event_type**: Filter by type (optional)
    """
    # Build query
    query = db.query(Event)
    
    # Apply filters
    if status:
        query = query.filter(Event.status == status)
    if event_type:
        query = query.filter(Event.event_type == event_type)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and fetch
    events = query.order_by(Event.date.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "events": events,
        "skip": skip,
        "limit": limit
    }


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    """
    Get a single event by ID.
    
    Returns detailed event information.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return event


@router.post("", response_model=EventResponse, status_code=201)
def create_event(event_data: EventCreate, db: Session = Depends(get_db)):
    """
    Create a new event.
    
    Requires:
    - **name**: Event name
    - **event_type**: Type (tight_knit, big_party, etc.)
    - **date**: Event date
    - **main_host_id**: User ID of the host
    """
    # Generate unique ID
    event_id = f"event-{uuid.uuid4()}"
    
    # Create event object
    new_event = Event(
        id=event_id,
        name=event_data.name,
        event_type=event_data.event_type,
        date=event_data.date,
        time=event_data.time,
        address=event_data.address,
        main_host_id=event_data.main_host_id,
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
    db: Session = Depends(get_db)
):
    """
    Update an existing event.
    
    All fields are optional - only provided fields will be updated.
    """
    # Get existing event
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Update fields (only non-None values)
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
    
    # Save changes
    db.commit()
    db.refresh(event)
    
    return event


@router.delete("/{event_id}")
def delete_event(event_id: str, db: Session = Depends(get_db)):
    """
    Soft delete an event.
    
    Sets status to 'deleted' and records deletion timestamp.
    Data is preserved in database.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
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
def archive_event(event_id: str, db: Session = Depends(get_db)):
    """
    Archive an event.
    
    Sets status to 'archived' and records archive timestamp.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Archive
    event.status = "archived"
    event.archived_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Event archived successfully",
        "event_id": event_id,
        "archived_at": event.archived_at
    }
