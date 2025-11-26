# Yorru - Group Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
import uuid

from models.group import Group
from models.user import User, GroupMembership
from models.message import Message
from schemas.group import (
    GroupCreate,
    GroupUpdate,
    GroupResponse,
    GroupDetailResponse,
    GroupMemberAdd,
    GroupMemberResponse
)
from schemas.message import MessageCreate, MessageResponse, MessageListResponse
from routes.auth import get_current_user
from services.sanitize import sanitize_text
from utils.database import get_db

router = APIRouter(tags=["groups"])


@router.post("/groups", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    group_data: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new group.

    - User who creates the group becomes the admin
    - Group ID is auto-generated
    """
    # Generate group ID
    group_id = f"group-{uuid.uuid4()}"

    # Create group
    new_group = Group(
        id=group_id,
        name=group_data.name,
        description=group_data.description,
        is_private=group_data.is_private
    )

    db.add(new_group)
    db.flush()  # Get the ID before committing

    # Add creator as admin member
    membership = GroupMembership(
        group_id=new_group.id,
        user_id=current_user.id,
        role="admin",
        joined_at=datetime.now()
    )

    db.add(membership)
    db.commit()
    db.refresh(new_group)

    # Return with member count
    response = GroupResponse.model_validate(new_group)
    response.member_count = 1

    return response


@router.get("/groups", response_model=List[GroupResponse])
def list_user_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all groups the current user is a member of.

    - Returns groups with member counts
    - Ordered by most recently updated
    """
    # Get groups where user is a member
    memberships = db.query(GroupMembership).filter(
        GroupMembership.user_id == current_user.id
    ).all()

    group_ids = [m.group_id for m in memberships]

    if not group_ids:
        return []

    # Get groups with member counts
    groups = db.query(
        Group,
        func.count(GroupMembership.user_id).label('member_count')
    ).join(
        GroupMembership, Group.id == GroupMembership.group_id
    ).filter(
        Group.id.in_(group_ids)
    ).group_by(
        Group.id
    ).order_by(
        Group.updated_at.desc()
    ).all()

    # Convert to response format
    results = []
    for group, member_count in groups:
        group_response = GroupResponse.model_validate(group)
        group_response.member_count = member_count
        results.append(group_response)

    return results


@router.get("/groups/{group_id}", response_model=GroupDetailResponse)
def get_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a group.

    - Includes list of members
    - User must be a member of the group to view it
    """
    # Check if group exists
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    # Check if user is a member
    is_member = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == current_user.id
    ).first()

    if not is_member and group.is_private:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group"
        )

    # Get members
    members = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id
    ).all()

    # Build response
    group_response = GroupDetailResponse.model_validate(group)
    group_response.members = [GroupMemberResponse.model_validate(m) for m in members]
    group_response.member_count = len(members)

    return group_response


@router.put("/groups/{group_id}", response_model=GroupResponse)
def update_group(
    group_id: str,
    group_data: GroupUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update group information.

    - Only group admins can update the group
    """
    # Check if group exists
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    # Check if user is admin
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == current_user.id
    ).first()

    if not membership or membership.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group admins can update the group"
        )

    # Update fields
    if group_data.name is not None:
        group.name = group_data.name
    if group_data.description is not None:
        group.description = group_data.description
    if group_data.is_private is not None:
        group.is_private = group_data.is_private

    db.commit()
    db.refresh(group)

    # Get member count
    member_count = db.query(func.count(GroupMembership.user_id)).filter(
        GroupMembership.group_id == group_id
    ).scalar()

    response = GroupResponse.model_validate(group)
    response.member_count = member_count

    return response


@router.delete("/groups/{group_id}", status_code=status.HTTP_200_OK)
def delete_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a group.

    - Only group admins can delete the group
    - This will cascade delete all memberships
    - Events in the group will have group_id set to NULL
    """
    # Check if group exists
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    # Check if user is admin
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == current_user.id
    ).first()

    if not membership or membership.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group admins can delete the group"
        )

    # Delete group (cascade will handle memberships)
    db.delete(group)
    db.commit()

    return {
        "message": "Group deleted successfully",
        "group_id": group_id
    }


@router.post("/groups/{group_id}/members", response_model=GroupMemberResponse, status_code=status.HTTP_201_CREATED)
def add_group_member(
    group_id: str,
    member_data: GroupMemberAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a member to the group.

    - Only group admins can add members
    - User must exist in the system
    """
    # Check if group exists
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    # Check if current user is admin
    admin_membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == current_user.id
    ).first()

    if not admin_membership or admin_membership.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group admins can add members"
        )

    # Check if user to add exists
    user_to_add = db.query(User).filter(User.id == member_data.user_id).first()
    if not user_to_add:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if user is already a member
    existing_membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == member_data.user_id
    ).first()

    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this group"
        )

    # Add membership
    new_membership = GroupMembership(
        group_id=group_id,
        user_id=member_data.user_id,
        role=member_data.role,
        joined_at=datetime.now()
    )

    db.add(new_membership)
    db.commit()
    db.refresh(new_membership)

    return GroupMemberResponse.model_validate(new_membership)


@router.delete("/groups/{group_id}/members/{user_id}", status_code=status.HTTP_200_OK)
def remove_group_member(
    group_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a member from the group.

    - Admins can remove any member
    - Members can remove themselves
    - Cannot remove the last admin
    """
    # Check if group exists
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    # Check if membership exists
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == user_id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not a member of this group"
        )

    # Check permissions
    current_user_membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == current_user.id
    ).first()

    # User can remove themselves OR admins can remove anyone
    is_self_removal = user_id == current_user.id
    is_admin = current_user_membership and current_user_membership.role == "admin"

    if not (is_self_removal or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to remove this member"
        )

    # Don't allow removing the last admin
    if membership.role == "admin":
        admin_count = db.query(func.count(GroupMembership.user_id)).filter(
            GroupMembership.group_id == group_id,
            GroupMembership.role == "admin"
        ).scalar()

        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last admin. Promote another member to admin first."
            )

    # Remove membership
    db.delete(membership)
    db.commit()

    return {
        "message": "Member removed successfully",
        "group_id": group_id,
        "user_id": user_id
    }


@router.get("/groups/{group_id}/events")
def list_group_events(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all events for a group.

    - User must be a member of the group
    """
    from models.event import Event

    # Check if group exists
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    # Check if user is a member
    is_member = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == current_user.id
    ).first()

    if not is_member and group.is_private:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group"
        )

    # Get events
    events = db.query(Event).filter(
        Event.group_id == group_id,
        Event.status != "deleted"
    ).order_by(Event.date.desc()).all()

    return {
        "group_id": group_id,
        "group_name": group.name,
        "event_count": len(events),
        "events": events
    }


@router.get("/groups/{group_id}/messages", response_model=MessageListResponse)
def get_group_messages(
    group_id: str,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get general chat messages for a group.

    - Returns messages in the group's general chat (not event-specific)
    - Only group members can view messages
    - Messages are ordered by creation time (newest first)
    """
    # Check if group exists
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    # Check if user is a member
    is_member = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == current_user.id
    ).first()

    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of this group to view messages"
        )

    # Get total count
    total = db.query(func.count(Message.id)).filter(
        Message.group_id == group_id,
        Message.is_deleted == False
    ).scalar()

    # Get messages
    messages = db.query(Message).filter(
        Message.group_id == group_id,
        Message.is_deleted == False
    ).order_by(Message.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "messages": messages,
        "skip": skip,
        "limit": limit
    }


@router.post("/groups/{group_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_group_message(
    group_id: str,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to the group's general chat.

    - Only group members can send messages
    - Message content is sanitized to prevent XSS
    """
    # Check if group exists
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    # Check if user is a member
    is_member = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == current_user.id
    ).first()

    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of this group to send messages"
        )

    # Sanitize message content
    sanitized_content = sanitize_message_content(message_data.content, allow_formatting=True)

    # Create message
    message_id = f"msg-{uuid.uuid4()}"
    new_message = Message(
        id=message_id,
        group_id=group_id,  # Group general chat
        event_id=None,  # Not event-specific
        sender_id=current_user.id,
        message_type=message_data.message_type,
        content=sanitized_content
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return new_message
