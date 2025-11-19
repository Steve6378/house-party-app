# Festivio - Permission Service
# Version: 0.0.1

"""
Centralized permission checking for events, messages, and ground truth.

Permission Levels:
- Host: Full control (main_host_id)
- Co-Host: Can edit based on permissions level (edit_all, edit_facts, view_only)
- Attendee: Can view event and participate in discussions
- Group Member: Can view group-only events
- Public: Can view public events only
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.event import Event
from models.attendance import EventAttendance, EventCoHost, GroupMembership
from models.user import User


def is_event_host(user_id: str, event: Event) -> bool:
    """Check if user is the main host of an event"""
    return event.main_host_id == user_id


def is_event_cohost(user_id: str, event: Event, db: Session) -> bool:
    """Check if user is a co-host of an event"""
    cohost = db.query(EventCoHost).filter(
        EventCoHost.event_id == event.id,
        EventCoHost.user_id == user_id
    ).first()
    return cohost is not None


def get_cohost_permissions(user_id: str, event: Event, db: Session) -> str | None:
    """Get co-host permission level (edit_all, edit_facts, view_only) or None"""
    cohost = db.query(EventCoHost).filter(
        EventCoHost.event_id == event.id,
        EventCoHost.user_id == user_id
    ).first()
    return cohost.permissions if cohost else None


def is_event_attendee(user_id: str, event: Event, db: Session) -> bool:
    """Check if user is an attendee/invited to an event"""
    attendance = db.query(EventAttendance).filter(
        EventAttendance.event_id == event.id,
        EventAttendance.user_id == user_id
    ).first()
    return attendance is not None


def is_group_member(user_id: str, group_id: str, db: Session) -> bool:
    """Check if user is a member of a group"""
    if not group_id:
        return False

    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == user_id
    ).first()
    return membership is not None


def is_group_admin(user_id: str, group_id: str, db: Session) -> bool:
    """Check if user is an admin of a group"""
    if not group_id:
        return False

    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == user_id,
        GroupMembership.role == "admin"
    ).first()
    return membership is not None


def can_view_event(user: User, event: Event, db: Session) -> bool:
    """
    Check if user can view an event based on visibility settings.

    - Private: Only host, co-hosts, and invited attendees
    - Group-only: Only group members (and host/co-hosts/attendees)
    - Public: Any logged-in user
    """
    # Host and co-hosts can always view
    if is_event_host(user.id, event):
        return True
    if is_event_cohost(user.id, event, db):
        return True

    # Check visibility
    if event.visibility == "public":
        return True

    if event.visibility == "group_only":
        # Must be group member OR invited attendee
        if event.group_id and is_group_member(user.id, event.group_id, db):
            return True
        if is_event_attendee(user.id, event, db):
            return True
        return False

    if event.visibility == "private":
        # Must be invited attendee
        return is_event_attendee(user.id, event, db)

    return False


def can_edit_event(user: User, event: Event, db: Session) -> bool:
    """
    Check if user can edit an event.

    Only host and co-hosts with edit_all permissions can edit events.
    """
    if is_event_host(user.id, event):
        return True

    cohost_perms = get_cohost_permissions(user.id, event, db)
    return cohost_perms == "edit_all"


def can_delete_event(user: User, event: Event, db: Session) -> bool:
    """
    Check if user can delete an event.

    Only the main host can delete events.
    """
    return is_event_host(user.id, event)


def can_edit_ground_truth(user: User, event: Event, db: Session) -> bool:
    """
    Check if user can edit ground truth facts for an event.

    Host and co-hosts with edit_all or edit_facts permissions can edit.
    """
    if is_event_host(user.id, event):
        return True

    cohost_perms = get_cohost_permissions(user.id, event, db)
    return cohost_perms in ["edit_all", "edit_facts"]


def require_event_access(user: User, event: Event, db: Session, action: str = "view"):
    """
    Raise 403 error if user doesn't have required access to event.

    Args:
        user: Current user
        event: Event to check
        db: Database session
        action: Type of access needed (view, edit, delete, edit_facts)
    """
    if action == "view":
        if not can_view_event(user, event, db):
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to view this event"
            )

    elif action == "edit":
        if not can_edit_event(user, event, db):
            raise HTTPException(
                status_code=403,
                detail="Only the host and co-hosts with edit permissions can modify this event"
            )

    elif action == "delete":
        if not can_delete_event(user, event, db):
            raise HTTPException(
                status_code=403,
                detail="Only the main host can delete this event"
            )

    elif action == "edit_facts":
        if not can_edit_ground_truth(user, event, db):
            raise HTTPException(
                status_code=403,
                detail="Only the host and co-hosts with edit permissions can modify event facts"
            )

    else:
        raise ValueError(f"Unknown action: {action}")


def get_user_events(user: User, db: Session, status: str = None, event_type: str = None):
    """
    Get all events the user has access to.

    Returns events where user is:
    - Host
    - Co-host
    - Invited attendee
    - Group member (for group-only events)
    - Public events
    """
    # Start with base query
    query = db.query(Event)

    # Apply filters
    if status:
        query = query.filter(Event.status == status)
    if event_type:
        query = query.filter(Event.event_type == event_type)

    # Get all events and filter by permission
    all_events = query.all()
    accessible_events = [
        event for event in all_events
        if can_view_event(user, event, db)
    ]

    return accessible_events
