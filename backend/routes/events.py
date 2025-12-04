# Yorru - Event Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import text as sql_text
from typing import Optional
from datetime import datetime
import uuid
import json
import openai

from config import settings

from models.event import Event
from models.user import User
from models.message import Message
from models.ground_truth import GroundTruthFact
from schemas.event import EventCreate, EventUpdate, EventResponse, EventListResponse, EventListItem
from utils.database import get_db
from routes.auth import get_current_user
from services.permissions import get_user_events, require_event_access
from services.sanitize import sanitize_event_name, sanitize_event_address
from services.embeddings import embed_text
from services.websocket_manager import manager

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

    # Convert to response format with attendees explicitly included
    events_data = []
    for event in paginated_events:
        event_dict = {
            "id": event.id,
            "name": event.name,
            "event_type": event.event_type,
            "date": event.date,
            "time": event.time,
            "address": event.address,
            "status": event.status,
            "visibility": event.visibility,
            "is_online": event.is_online,
            "is_paid": event.is_paid,
            "ticket_price": event.ticket_price,
            "main_host_id": event.main_host_id,
            "created_at": event.created_at,
            "expected_guests": event.expected_guests,
            "cover_image_url": event.cover_image_url,
            "cover_image_type": event.cover_image_type,
            "attendees": [
                {"user_id": a.user_id, "rsvp_status": a.rsvp_status}
                for a in event.attendees
            ] if event.attendees else []
        }
        events_data.append(event_dict)

    return {
        "total": total,
        "events": events_data,
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

    # Convert topics list to JSON string for storage
    topics_json = json.dumps(event_data.topics) if event_data.topics else None

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
        visibility=event_data.visibility,
        # Description and topics
        description=event_data.description,
        topics=topics_json,
        # Online/Offline
        is_online=event_data.is_online or False,
        online_link=event_data.online_link,
        is_paid=event_data.is_paid or False,
        ticket_price=event_data.ticket_price,
        latitude=event_data.latitude,
        longitude=event_data.longitude
    )

    # Save to database
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
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

    # Parse date string to date object if provided
    if "date" in update_data and update_data["date"]:
        from datetime import datetime as dt
        try:
            update_data["date"] = dt.strptime(update_data["date"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail="Invalid date format. Use YYYY-MM-DD")

    # Apply updates
    for field, value in update_data.items():
        setattr(event, field, value)

    # Sync ground truth facts when event details change
    # This ensures ground truth stays in sync with event data
    ground_truth_mappings = {
        "time": "event_time",
        "date": "event_date",
        "address": "event_address",
        "budget_per_person": "budget_per_person",
        "expected_guests": "expected_guests"
    }

    for event_field, gt_key in ground_truth_mappings.items():
        if event_field in update_data:
            # Find existing ground truth fact
            gt_fact = db.query(GroundTruthFact).filter(
                GroundTruthFact.event_id == event_id,
                GroundTruthFact.key == gt_key
            ).first()

            new_value = str(update_data[event_field])

            if gt_fact:
                # Update existing fact
                gt_fact.value = new_value
                gt_fact.updated_at = datetime.utcnow()

                # Try to regenerate embedding (if pgvector is available)
                try:
                    text_to_embed = f"{gt_key}: {new_value}"
                    embedding = embed_text(text_to_embed)
                    embedding_str = '[' + ','.join(map(str, embedding)) + ']'

                    db.execute(sql_text("""
                        UPDATE ground_truth_facts
                        SET embedding = CAST(:embedding AS vector), updated_at = NOW()
                        WHERE id = :id
                    """), {
                        "embedding": embedding_str,
                        "id": gt_fact.id
                    })
                except Exception:
                    # Embedding column doesn't exist - just update the value without embedding
                    pass
            else:
                # Create new ground truth fact
                gt_id = f"gt-{event_id[:8]}-{gt_key}-{uuid.uuid4().hex[:8]}"

                try:
                    # Try to create with embedding (if pgvector is available)
                    text_to_embed = f"{gt_key}: {new_value}"
                    embedding = embed_text(text_to_embed)
                    embedding_str = '[' + ','.join(map(str, embedding)) + ']'

                    db.execute(sql_text("""
                        INSERT INTO ground_truth_facts
                        (id, event_id, key, value, keywords, embedding, importance, created_at, updated_at)
                        VALUES
                        (:id, :event_id, :key, :value, :keywords, CAST(:embedding AS vector), :importance, NOW(), NOW())
                    """), {
                        "id": gt_id,
                        "event_id": event_id,
                        "key": gt_key,
                        "value": new_value,
                        "keywords": None,
                        "embedding": embedding_str,
                        "importance": "high"
                    })
                except Exception:
                    # Embedding column doesn't exist - create without embedding
                    db.execute(sql_text("""
                        INSERT INTO ground_truth_facts
                        (id, event_id, key, value, keywords, importance, created_at, updated_at)
                        VALUES
                        (:id, :event_id, :key, :value, :keywords, :importance, NOW(), NOW())
                    """), {
                        "id": gt_id,
                        "event_id": event_id,
                        "key": gt_key,
                        "value": new_value,
                        "keywords": None,
                        "importance": "high"
                    })

    # Save changes
    db.commit()
    db.refresh(event)

    # Broadcast changes to group chat if significant fields changed
    broadcast_fields = {"time", "date", "address", "name"}
    changed_broadcast_fields = set(update_data.keys()) & broadcast_fields

    if changed_broadcast_fields:
        # Build change summary
        changes = []
        field_labels = {
            "name": "Event name",
            "date": "Date",
            "time": "Time",
            "address": "Location"
        }
        for field in changed_broadcast_fields:
            label = field_labels.get(field, field)
            changes.append(f"{label}: {update_data[field]}")

        change_message = f"📢 Event updated! " + ", ".join(changes)

        # Create system message
        broadcast_msg = Message(
            id=str(uuid.uuid4()),
            event_id=event_id,
            sender_id=None,
            message_type="system",
            content=change_message
        )
        db.add(broadcast_msg)
        db.commit()

        # Broadcast via WebSocket
        try:
            await manager.broadcast_to_event(event_id, {
                "type": "message",
                "data": {
                    "id": broadcast_msg.id,
                    "sender_id": None,
                    "sender_name": "Yorru AI",
                    "message_type": "system",
                    "content": change_message,
                    "created_at": broadcast_msg.created_at.isoformat(),
                    "is_announcement": True
                }
            })
        except Exception as e:
            print(f"Failed to broadcast event update: {e}")

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


@router.get("/discover/public", response_model=EventListResponse)
def discover_public_events(
    skip: int = Query(0, ge=0, description="Number of events to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max events to return"),
    latitude: Optional[float] = Query(None, description="User's latitude for nearby events"),
    longitude: Optional[float] = Query(None, description="User's longitude for nearby events"),
    radius_km: Optional[float] = Query(50, description="Search radius in kilometers"),
    is_online: Optional[bool] = Query(None, description="Filter for online events only"),
    is_free: Optional[bool] = Query(None, description="Filter for free events only"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Discover public events nearby.

    **Authentication required.**

    Returns public events that anyone can join. If coordinates are provided,
    returns events sorted by distance.

    - **latitude/longitude**: User's location for distance calculation
    - **radius_km**: Search radius (default: 50km)
    - **is_online**: Filter online events only
    - **is_free**: Filter free events only
    """
    from datetime import date as date_type
    from math import radians, cos, sin, asin, sqrt

    # Haversine formula to calculate distance between two points
    def haversine(lat1, lon1, lat2, lon2):
        if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
            return float('inf')

        # Convert to floats
        lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)

        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        km = 6371 * c  # Earth's radius in km
        return km

    # Query public events that are active and not in the past
    today = date_type.today()
    query = db.query(Event).filter(
        Event.visibility == "public",
        Event.status == "active",
        Event.date >= today
    )

    # Filter by online/offline
    if is_online is True:
        query = query.filter(Event.is_online == True)
    elif is_online is False:
        query = query.filter(Event.is_online == False)

    # Filter by free/paid
    if is_free is True:
        query = query.filter(Event.is_paid == False)
    elif is_free is False:
        query = query.filter(Event.is_paid == True)

    events = query.all()

    # Calculate distance and filter by radius if coordinates provided
    events_with_distance = []
    for event in events:
        if latitude is not None and longitude is not None and not event.is_online:
            distance = haversine(latitude, longitude, event.latitude, event.longitude)
            if distance <= radius_km:
                events_with_distance.append((event, distance))
        else:
            # Include online events or events without distance filter
            events_with_distance.append((event, float('inf') if event.is_online else float('inf')))

    # Sort by distance (nearest first), then by date
    events_with_distance.sort(key=lambda x: (x[1], x[0].date))

    # Get total count
    total = len(events_with_distance)

    # Apply pagination
    paginated = events_with_distance[skip:skip + limit]
    paginated_events = [e[0] for e in paginated]

    return {
        "total": total,
        "events": paginated_events,
        "skip": skip,
        "limit": limit
    }


@router.post("/{event_id}/join")
def join_public_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Join a public event.

    **Authentication required.**

    Allows a user to join a public event. Creates an attendance record.
    """
    from models.event_attendance import EventAttendance

    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if event is public
    if event.visibility != "public":
        raise HTTPException(status_code=403, detail="This event is not public")

    # Check if event is active
    if event.status != "active":
        raise HTTPException(status_code=400, detail="This event is not active")

    # Check if user is already attending
    existing = db.query(EventAttendance).filter(
        EventAttendance.event_id == event_id,
        EventAttendance.user_id == current_user.id
    ).first()

    if existing:
        return {"message": "You are already attending this event", "status": existing.status}

    # Create attendance record
    attendance = EventAttendance(
        id=f"attend-{uuid.uuid4()}",
        event_id=event_id,
        user_id=current_user.id,
        status="going" if not event.requires_approval else "pending",
        rsvp_timestamp=datetime.utcnow()
    )

    db.add(attendance)
    db.commit()

    return {
        "message": "Successfully joined the event" if not event.requires_approval else "Join request submitted, awaiting host approval",
        "status": attendance.status,
        "event_id": event_id
    }


# ==================== COVER IMAGE ENDPOINTS ====================

@router.post("/{event_id}/cover-image")
async def upload_cover_image(
    event_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a cover image for an event.

    **Authentication required.**

    Only the host and co-hosts can upload cover images.

    Supported formats: jpg, jpeg, png, gif, webp
    Max file size: 10MB
    """
    from services.r2_storage import R2Storage

    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission to edit
    require_event_access(current_user, event, db, action="edit")

    # Validate file type
    allowed_types = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    file_ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if file_ext not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    # Read file data
    file_data = await file.read()

    # Validate file size (10MB max)
    if len(file_data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max size: 10MB")

    # Determine content type
    content_type_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp"
    }
    content_type = content_type_map.get(file_ext, "image/jpeg")

    # Upload to R2 storage
    storage = R2Storage()
    result = storage.upload_file(
        file_data=file_data,
        event_id=event_id,
        file_ext=file_ext.lstrip("."),
        content_type=content_type
    )

    # Update event with cover image info
    event.cover_image_path = result["file_path"]
    event.cover_image_url = result.get("public_url") or f"/api/events/{event_id}/cover-image"
    event.cover_image_type = "uploaded"

    db.commit()

    return {
        "message": "Cover image uploaded successfully",
        "cover_image_url": event.cover_image_url,
        "cover_image_type": "uploaded"
    }


@router.get("/{event_id}/cover-image")
async def get_cover_image(
    event_id: str,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get the cover image for an event.

    Returns the image file directly.

    - Public events: No auth required
    - Private events: Requires token query param with valid JWT
    """
    from services.r2_storage import R2Storage
    from services.auth import decode_access_token

    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check access for private events
    if event.visibility == "private":
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required for private event")
        try:
            user_id = decode_access_token(token)
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token")
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=401, detail="Invalid token")
            require_event_access(user, event, db, action="view")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")

    if not event.cover_image_path:
        raise HTTPException(status_code=404, detail="No cover image found")

    # Get file from storage
    storage = R2Storage()
    file_data = storage.get_file(event.cover_image_path)

    if not file_data:
        raise HTTPException(status_code=404, detail="Cover image file not found")

    # Determine content type from path
    file_ext = ""
    if "." in event.cover_image_path:
        file_ext = event.cover_image_path.split(".")[-1].lower()
    content_type_map = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp"
    }
    content_type = content_type_map.get(file_ext, "image/jpeg")

    return Response(content=file_data, media_type=content_type)


@router.post("/{event_id}/cover-image/generate")
async def generate_cover_image(
    event_id: str,
    preview: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate an AI cover image for an event based on its title and description.

    **Authentication required.**

    Only the host and co-hosts can generate cover images.
    Uses OpenAI DALL-E to generate an event-appropriate image.

    If preview=true, only generates and returns the URL without saving.
    """
    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission to edit
    require_event_access(current_user, event, db, action="edit")

    # Build prompt for image generation
    event_type = event.event_type or "event"
    topics = ""
    if event.topics:
        try:
            topics_list = json.loads(event.topics)
            if topics_list:
                topics = ", ".join(topics_list[:3])
        except (json.JSONDecodeError, TypeError):
            pass

    prompt = f"A beautiful, modern event cover image for a {event_type} event"
    if event.name:
        prompt += f" called '{event.name}'"
    if topics:
        prompt += f" featuring themes of {topics}"
    if event.description:
        # Add a snippet of the description
        desc_snippet = event.description[:100] if len(event.description) > 100 else event.description
        prompt += f". Event description: {desc_snippet}"

    prompt += ". Professional, high-quality, vibrant colors, no text or words in the image."

    try:
        # Configure OpenAI
        openai.api_key = settings.OPENAI_API_KEY

        # Generate image using DALL-E
        response = openai.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1792x1024",  # Wide format for cover images
            quality="standard",
            n=1
        )

        # Get the generated image URL
        generated_url = response.data[0].url

        # Only save if not preview mode
        if not preview:
            # Update event with the generated image URL
            event.cover_image_url = generated_url
            event.cover_image_type = "ai_generated"
            event.cover_image_path = None  # No local path for AI-generated images
            db.commit()

        return {
            "message": "Cover image generated successfully" if not preview else "Cover image preview generated",
            "cover_image_url": generated_url,
            "cover_image_type": "ai_generated",
            "preview": preview
        }

    except Exception as e:
        print(f"AI image generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate cover image. Please try again or upload an image manually."
        )


class ApplyCoverImageRequest(BaseModel):
    """Request to apply an existing URL as cover image"""
    cover_image_url: str


@router.post("/{event_id}/cover-image/apply")
async def apply_cover_image(
    event_id: str,
    request: ApplyCoverImageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Apply an existing image URL as the event's cover image.

    **Authentication required.**

    Used to confirm a preview-generated cover image.
    """
    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission to edit
    require_event_access(current_user, event, db, action="edit")

    # Update event with the image URL
    event.cover_image_url = request.cover_image_url
    event.cover_image_type = "ai_generated"
    event.cover_image_path = None

    db.commit()

    return {
        "message": "Cover image applied successfully",
        "cover_image_url": request.cover_image_url
    }


@router.delete("/{event_id}/cover-image")
async def delete_cover_image(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete the cover image for an event.

    **Authentication required.**

    Only the host and co-hosts can delete cover images.
    """
    from services.r2_storage import R2Storage

    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission to edit
    require_event_access(current_user, event, db, action="edit")

    # Delete from storage if it's an uploaded image
    if event.cover_image_path:
        storage = R2Storage()
        storage.delete_file(event.cover_image_path)

    # Clear cover image fields
    event.cover_image_path = None
    event.cover_image_url = None
    event.cover_image_type = "none"

    db.commit()

    return {"message": "Cover image deleted successfully"}
