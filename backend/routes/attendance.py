# Yorru - Attendance & Invitation Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from models.event import Event
from models.user import User
from models.attendance import EventAttendance
from schemas.attendance import (
    InviteUserRequest,
    UpdateAttendanceRequest,
    AttendanceResponse,
    InvitationWithEvent
)
from utils.database import get_db
from routes.auth import get_current_user
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
