# Yorru - Attendance & Invitation Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import secrets

from models.event import Event
from models.user import User
from models.group import Group
from models.attendance import EventAttendance, EventCoHost, InviteLink
from schemas.attendance import (
    InviteUserRequest,
    UpdateAttendanceRequest,
    AttendanceResponse,
    InvitationWithEvent,
    AddCoHostRequest,
    UpdateCoHostRequest,
    CoHostResponse,
    CreateInviteLinkRequest,
    InviteLinkResponse,
    InviteDetailsResponse,
    AcceptInviteResponse
)
from utils.database import get_db
from routes.auth import get_current_user, get_current_user_optional
from services.permissions import require_event_access

router = APIRouter(prefix="/events", tags=["attendance"])


@router.post("/{event_id}/invite", response_model=AttendanceResponse)
async def invite_user_to_event(
    event_id: str,
    request: InviteUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Invite a user to an event by email.

    **Authentication required.**

    Only the host or co-hosts can invite users.
    Creates a pending attendance record for the invited user.
    """
    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if current user has permission to invite (must be host or co-host)
    require_event_access(current_user, event, db, action="edit")

    # Find user by email (may or may not exist)
    invited_user = db.query(User).filter(User.email == request.email).first()

    if invited_user:
        # User exists - check if already invited
        existing_attendance = db.query(EventAttendance).filter(
            EventAttendance.event_id == event_id,
            EventAttendance.user_id == invited_user.id
        ).first()

        if existing_attendance:
            raise HTTPException(
                status_code=400,
                detail=f"User {request.email} is already invited or attending this event"
            )

        # Create attendance record with pending status
        attendance = EventAttendance(
            id=f"attendance-{uuid.uuid4()}",
            event_id=event_id,
            user_id=invited_user.id,
            rsvp_status="pending",
            plus_ones=0
        )

        db.add(attendance)
        db.commit()
        db.refresh(attendance)

        return attendance
    else:
        # User doesn't exist yet - create placeholder invitation
        # Check if email is already invited (by email stored in rsvp_notes)
        existing_email_invite = db.query(EventAttendance).filter(
            EventAttendance.event_id == event_id,
            EventAttendance.user_id == None,
            EventAttendance.rsvp_notes.contains(request.email)
        ).first()

        if existing_email_invite:
            raise HTTPException(
                status_code=400,
                detail=f"Email {request.email} already has a pending invitation"
            )

        # Create attendance record without user_id (pending registration)
        # Store email in rsvp_notes temporarily
        attendance = EventAttendance(
            id=f"attendance-{uuid.uuid4()}",
            event_id=event_id,
            user_id=None,  # Will be filled when user registers
            rsvp_status="pending",
            plus_ones=0,
            rsvp_notes=f"PENDING_EMAIL:{request.email}"  # Store email for matching later
        )

        db.add(attendance)
        db.commit()
        db.refresh(attendance)

        return attendance


@router.get("/invitations", response_model=List[InvitationWithEvent])
async def get_my_invitations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all pending invitations for the current user.

    **Authentication required.**

    Returns events where the user has a pending invitation.
    """
    # Get all pending attendance records for current user
    pending_attendances = db.query(EventAttendance).filter(
        EventAttendance.user_id == current_user.id,
        EventAttendance.rsvp_status == "pending"
    ).all()

    invitations = []
    for attendance in pending_attendances:
        event = db.query(Event).filter(Event.id == attendance.event_id).first()
        if event:
            # Get host name
            host = db.query(User).filter(User.id == event.main_host_id).first()

            invitations.append({
                "event_id": event.id,
                "event_name": event.name,
                "event_date": str(event.date),
                "event_time": str(event.time) if event.time else None,
                "event_address": event.address,
                "host_name": host.name if host else "Unknown",
                "rsvp_status": attendance.rsvp_status,
                "created_at": attendance.created_at
            })

    return invitations


@router.put("/{event_id}/attendance", response_model=AttendanceResponse)
async def update_attendance(
    event_id: str,
    request: UpdateAttendanceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update attendance/RSVP status for an event.

    **Authentication required.**

    User can accept (yes), decline (no), or maybe their invitation.
    """
    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get attendance record
    attendance = db.query(EventAttendance).filter(
        EventAttendance.event_id == event_id,
        EventAttendance.user_id == current_user.id
    ).first()

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="No invitation found for this event"
        )

    # Update attendance
    attendance.rsvp_status = request.rsvp_status
    attendance.plus_ones = request.plus_ones
    attendance.rsvp_notes = request.rsvp_notes

    db.commit()
    db.refresh(attendance)

    return attendance


@router.get("/{event_id}/attendees", response_model=List[dict])
async def get_event_attendees(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all attendees for an event.

    **Authentication required.**

    Returns list of users who are attending (rsvp_status = 'yes').
    """
    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has access to view attendees
    require_event_access(current_user, event, db, action="view")

    # Get all attendees with 'yes' status
    attendances = db.query(EventAttendance).filter(
        EventAttendance.event_id == event_id,
        EventAttendance.rsvp_status == "yes"
    ).all()

    attendees = []
    for attendance in attendances:
        user = db.query(User).filter(User.id == attendance.user_id).first()
        if user:
            attendees.append({
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "plus_ones": attendance.plus_ones,
                "rsvp_notes": attendance.rsvp_notes
            })

    return attendees


# ============================================
# Co-Host Management Routes
# ============================================

@router.post("/{event_id}/cohosts", response_model=CoHostResponse, status_code=201)
async def add_cohost(
    event_id: str,
    request: AddCoHostRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a co-host to an event by email.

    **Authentication required. Must be the main host.**

    Permissions:
    - edit_all: Can edit everything including event details
    - edit_facts: Can edit ground truth facts only
    - view_only: Can view host dashboard but not edit
    """
    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Only main host can add co-hosts
    if event.main_host_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the main host can add co-hosts"
        )

    # Find user by email
    user_to_add = db.query(User).filter(User.email == request.email).first()
    if not user_to_add:
        raise HTTPException(
            status_code=404,
            detail=f"No user found with email {request.email}"
        )

    # Check if already a co-host
    existing = db.query(EventCoHost).filter(
        EventCoHost.event_id == event_id,
        EventCoHost.user_id == user_to_add.id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="User is already a co-host for this event"
        )

    # Can't add main host as co-host
    if user_to_add.id == event.main_host_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot add the main host as a co-host"
        )

    # Create co-host record
    cohost = EventCoHost(
        event_id=event_id,
        user_id=user_to_add.id,
        permissions=request.permissions,
        added_at=datetime.now()
    )

    db.add(cohost)
    db.commit()

    return CoHostResponse(
        user_id=user_to_add.id,
        email=user_to_add.email,
        name=user_to_add.name,
        permissions=request.permissions,
        added_at=cohost.added_at
    )


@router.get("/{event_id}/cohosts", response_model=List[CoHostResponse])
async def list_cohosts(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all co-hosts for an event.

    **Authentication required.**
    """
    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has access to view
    require_event_access(current_user, event, db, action="view")

    # Get all co-hosts
    cohosts = db.query(EventCoHost).filter(
        EventCoHost.event_id == event_id
    ).all()

    result = []
    for cohost in cohosts:
        user = db.query(User).filter(User.id == cohost.user_id).first()
        if user:
            result.append(CoHostResponse(
                user_id=user.id,
                email=user.email,
                name=user.name,
                permissions=cohost.permissions,
                added_at=cohost.added_at
            ))

    return result


@router.put("/{event_id}/cohosts/{user_id}", response_model=CoHostResponse)
async def update_cohost_permissions(
    event_id: str,
    user_id: str,
    request: UpdateCoHostRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a co-host's permissions.

    **Authentication required. Must be the main host.**
    """
    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Only main host can update co-host permissions
    if event.main_host_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the main host can update co-host permissions"
        )

    # Get the co-host record
    cohost = db.query(EventCoHost).filter(
        EventCoHost.event_id == event_id,
        EventCoHost.user_id == user_id
    ).first()

    if not cohost:
        raise HTTPException(status_code=404, detail="Co-host not found")

    # Update permissions
    cohost.permissions = request.permissions
    db.commit()

    # Get user info for response
    user = db.query(User).filter(User.id == user_id).first()

    return CoHostResponse(
        user_id=user.id,
        email=user.email,
        name=user.name,
        permissions=cohost.permissions,
        added_at=cohost.added_at
    )


@router.delete("/{event_id}/cohosts/{user_id}")
async def remove_cohost(
    event_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a co-host from an event.

    **Authentication required. Must be the main host.**
    """
    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Only main host can remove co-hosts
    if event.main_host_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the main host can remove co-hosts"
        )

    # Get the co-host record
    cohost = db.query(EventCoHost).filter(
        EventCoHost.event_id == event_id,
        EventCoHost.user_id == user_id
    ).first()

    if not cohost:
        raise HTTPException(status_code=404, detail="Co-host not found")

    db.delete(cohost)
    db.commit()

    return {"message": "Co-host removed successfully", "user_id": user_id}


# ============================================
# Invite Link Routes (Events)
# ============================================

def generate_token(length: int = 8) -> str:
    """Generate a short, URL-safe token."""
    return secrets.token_urlsafe(length)[:length]


@router.post("/{event_id}/invite-link", response_model=InviteLinkResponse, status_code=201)
async def create_event_invite_link(
    event_id: str,
    request: CreateInviteLinkRequest,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a shareable invite link for an event.

    **Authentication required. Must be host or co-host.**

    - role: 'attendee' (default) or 'cohost'
    - expires_in_hours: Optional expiration (1-720 hours)
    - max_uses: Optional usage limit (1-1000)
    """
    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission (must be host or co-host)
    require_event_access(current_user, event, db, action="edit")

    # Validate role
    if request.role not in ["attendee", "cohost"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be 'attendee' or 'cohost'"
        )

    # Generate unique token
    token = generate_token()
    while db.query(InviteLink).filter(InviteLink.token == token).first():
        token = generate_token()

    # Calculate expiration
    expires_at = None
    if request.expires_in_hours:
        expires_at = datetime.now() + timedelta(hours=request.expires_in_hours)

    # Create invite link
    invite_link = InviteLink(
        id=f"invite-{uuid.uuid4()}",
        token=token,
        link_type="event",
        target_id=event_id,
        created_by=current_user.id,
        role=request.role,
        expires_at=expires_at,
        max_uses=request.max_uses,
        use_count=0,
        is_active=True,
        created_at=datetime.now()
    )

    db.add(invite_link)
    db.commit()
    db.refresh(invite_link)

    # Build full URL
    base_url = str(req.base_url).rstrip("/")
    url = f"{base_url}/invite/{token}"

    response = InviteLinkResponse.model_validate(invite_link)
    response.url = url

    return response


@router.get("/{event_id}/invite-links", response_model=List[InviteLinkResponse])
async def list_event_invite_links(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all active invite links for an event.

    **Authentication required. Must be host or co-host.**
    """
    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission
    require_event_access(current_user, event, db, action="edit")

    # Get active invite links
    links = db.query(InviteLink).filter(
        InviteLink.target_id == event_id,
        InviteLink.link_type == "event",
        InviteLink.is_active == True
    ).all()

    return [InviteLinkResponse.model_validate(link) for link in links]


@router.delete("/{event_id}/invite-link/{token}")
async def revoke_event_invite_link(
    event_id: str,
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoke an invite link.

    **Authentication required. Must be host or co-host.**
    """
    # Get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission
    require_event_access(current_user, event, db, action="edit")

    # Get the invite link
    link = db.query(InviteLink).filter(
        InviteLink.token == token,
        InviteLink.target_id == event_id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Invite link not found")

    # Deactivate instead of delete (for audit purposes)
    link.is_active = False
    db.commit()

    return {"message": "Invite link revoked", "token": token}


# ============================================
# Public Invite Routes (no auth required for viewing)
# ============================================

# Create a separate router for public invite endpoints
invite_router = APIRouter(tags=["invites"])


@invite_router.get("/invite/{token}", response_model=InviteDetailsResponse)
async def get_invite_details(
    token: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get details about an invite link.

    **No authentication required.**

    Returns information about what the invite is for without accepting it.
    """
    # Get the invite link
    link = db.query(InviteLink).filter(InviteLink.token == token).first()

    if not link:
        return InviteDetailsResponse(
            link_type="unknown",
            target_name="Unknown",
            target_id="",
            role="",
            host_name=None,
            expires_at=None,
            is_valid=False,
            message="Invite link not found"
        )

    # Check if link is still valid
    is_valid = True
    message = None

    if not link.is_active:
        is_valid = False
        message = "This invite link has been revoked"
    elif link.expires_at and link.expires_at < datetime.now():
        is_valid = False
        message = "This invite link has expired"
    elif link.max_uses and link.use_count >= link.max_uses:
        is_valid = False
        message = "This invite link has reached its maximum uses"

    # Get target details
    target_name = "Unknown"
    host_name = None

    if link.link_type in ["event", "cohost"]:
        event = db.query(Event).filter(Event.id == link.target_id).first()
        if event:
            target_name = event.name
            host = db.query(User).filter(User.id == event.main_host_id).first()
            if host:
                host_name = host.name
    elif link.link_type == "group":
        group = db.query(Group).filter(Group.id == link.target_id).first()
        if group:
            target_name = group.name

    return InviteDetailsResponse(
        link_type=link.link_type,
        target_name=target_name,
        target_id=link.target_id,
        role=link.role,
        host_name=host_name,
        expires_at=link.expires_at,
        is_valid=is_valid,
        message=message
    )


@invite_router.post("/invite/{token}/accept", response_model=AcceptInviteResponse)
async def accept_invite(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accept an invite link.

    **Authentication required.**

    Adds the user to the event/group based on the invite link's role.
    """
    # Get the invite link
    link = db.query(InviteLink).filter(InviteLink.token == token).first()

    if not link:
        raise HTTPException(status_code=404, detail="Invite link not found")

    # Validate link
    if not link.is_active:
        raise HTTPException(status_code=400, detail="This invite link has been revoked")

    if link.expires_at and link.expires_at < datetime.now():
        raise HTTPException(status_code=400, detail="This invite link has expired")

    if link.max_uses and link.use_count >= link.max_uses:
        raise HTTPException(status_code=400, detail="This invite link has reached its maximum uses")

    # Handle based on link type
    if link.link_type == "event":
        event = db.query(Event).filter(Event.id == link.target_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Check if already attending
        existing = db.query(EventAttendance).filter(
            EventAttendance.event_id == link.target_id,
            EventAttendance.user_id == current_user.id
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="You are already part of this event")

        # Add as attendee
        attendance = EventAttendance(
            id=f"attendance-{uuid.uuid4()}",
            event_id=link.target_id,
            user_id=current_user.id,
            rsvp_status="yes",
            plus_ones=0
        )
        db.add(attendance)

        # If role is cohost, also add as co-host
        if link.role == "cohost":
            cohost = EventCoHost(
                event_id=link.target_id,
                user_id=current_user.id,
                permissions="edit_facts",
                added_at=datetime.now()
            )
            db.add(cohost)

    elif link.link_type == "group":
        from models.user import GroupMembership

        group = db.query(Group).filter(Group.id == link.target_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        # Check if already a member
        existing = db.query(GroupMembership).filter(
            GroupMembership.group_id == link.target_id,
            GroupMembership.user_id == current_user.id
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="You are already a member of this group")

        # Add as member
        membership = GroupMembership(
            group_id=link.target_id,
            user_id=current_user.id,
            role=link.role if link.role in ["member", "admin"] else "member",
            joined_at=datetime.now()
        )
        db.add(membership)

    else:
        raise HTTPException(status_code=400, detail=f"Unknown invite type: {link.link_type}")

    # Increment use count
    link.use_count += 1
    db.commit()

    return AcceptInviteResponse(
        success=True,
        message=f"Successfully joined as {link.role}",
        link_type=link.link_type,
        target_id=link.target_id,
        role=link.role
    )
