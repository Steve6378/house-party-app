# Yorru - Chat Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime

from models.event import Event
from models.message import Message
from models.user import User
from schemas.chat import SendMessageRequest, MessageResponse
from utils.database import get_db
from routes.auth import get_current_user
from services.permissions import require_event_access
from services.websocket_manager import manager

router = APIRouter(prefix="/events", tags=["chat"])


@router.websocket("/{event_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    event_id: str,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time event chat.

    Clients connect with their JWT token as a query parameter.
    All messages are isolated to the specific event room.
    """
    # Validate token and get user
    try:
        from services.auth import decode_access_token
        user_id = decode_access_token(token)  # Returns user_id string or None
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=1008, reason="User not found")
            return
    except Exception as e:
        await websocket.close(code=1008, reason="Authentication failed")
        return

    # Verify event exists and user has access
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        await websocket.close(code=1008, reason="Event not found")
        return

    try:
        require_event_access(user, event, db, action="view")
    except HTTPException:
        await websocket.close(code=1008, reason="Access denied")
        return

    # Connect to event room
    await manager.connect(websocket, event_id)

    # Notify room that user joined
    await manager.broadcast_to_event(event_id, {
        "type": "user_joined",
        "data": {
            "user_id": user.id,
            "user_name": user.name,
            "timestamp": datetime.utcnow().isoformat()
        }
    })

    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()

            # Check if message starts with ## (group broadcast)
            is_group_broadcast = data.startswith("##")
            content = data[2:].strip() if is_group_broadcast else data

            # Save message to event chat
            message = Message(
                id=str(uuid.uuid4()),
                event_id=event_id,
                sender_id=user.id,
                message_type="user",
                content=content
            )
            db.add(message)
            db.commit()
            db.refresh(message)

            # Broadcast to event chat
            await manager.broadcast_to_event(event_id, {
                "type": "message",
                "data": {
                    "id": message.id,
                    "sender_id": user.id,
                    "sender_name": user.name,
                    "message_type": "user",
                    "content": message.content,
                    "created_at": message.created_at.isoformat(),
                    "group_broadcast": is_group_broadcast
                }
            })

            # If ## prefix, also post to group chat
            if is_group_broadcast and event.group_id:
                # Create a message in the group's general chat
                # Group messages are stored as messages with event_id = group_id
                group_message = Message(
                    id=str(uuid.uuid4()),
                    event_id=event.group_id,  # Store in group's messages
                    sender_id=user.id,
                    message_type="user",
                    content=f"[From {event.name}] {content}"
                )
                db.add(group_message)
                db.commit()
                db.refresh(group_message)

                # Broadcast to group chat room
                await manager.broadcast_to_event(event.group_id, {
                    "type": "message",
                    "data": {
                        "id": group_message.id,
                        "sender_id": user.id,
                        "sender_name": user.name,
                        "message_type": "user",
                        "content": group_message.content,
                        "created_at": group_message.created_at.isoformat(),
                        "from_event": event.name
                    }
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket, event_id)
        # Notify room that user left
        await manager.broadcast_to_event(event_id, {
            "type": "user_left",
            "data": {
                "user_id": user.id,
                "user_name": user.name,
                "timestamp": datetime.utcnow().isoformat()
            }
        })


@router.get("/{event_id}/messages", response_model=List[MessageResponse])
async def get_event_messages(
    event_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get chat message history for an event.

    **Authentication required.**

    Returns messages ordered by creation time (oldest first).
    """
    # Verify event exists and user has access
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    require_event_access(current_user, event, db, action="view")

    # Get messages for this event only
    messages = db.query(Message).filter(
        Message.event_id == event_id,
        Message.is_deleted == False
    ).order_by(Message.created_at.asc()).offset(skip).limit(limit).all()

    # Add sender names and profile photos
    result = []
    for message in messages:
        message_dict = {
            "id": message.id,
            "event_id": message.event_id,
            "sender_id": message.sender_id,
            "sender_name": None,
            "sender_profile_photo": None,
            "message_type": message.message_type,
            "content": message.content,
            "is_edited": message.is_edited,
            "is_deleted": message.is_deleted,
            "created_at": message.created_at,
            "edited_at": message.edited_at
        }

        if message.sender_id:
            sender = db.query(User).filter(User.id == message.sender_id).first()
            if sender:
                message_dict["sender_name"] = sender.name
                if sender.profile_photo:
                    message_dict["sender_profile_photo"] = f"/api/auth/users/{sender.id}/photo"

        result.append(message_dict)

    return result


@router.post("/{event_id}/messages", response_model=MessageResponse)
async def send_message(
    event_id: str,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to event chat (HTTP endpoint).

    **Authentication required.**

    This is a fallback for clients that don't use WebSocket.
    WebSocket is preferred for real-time chat.
    """
    # Verify event exists and user has access
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    require_event_access(current_user, event, db, action="view")

    # Check if message starts with ## (group broadcast)
    is_group_broadcast = request.content.startswith("##")
    content = request.content[2:].strip() if is_group_broadcast else request.content

    # Create message in event chat
    message = Message(
        id=str(uuid.uuid4()),
        event_id=event_id,
        sender_id=current_user.id,
        message_type="user",
        content=content
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    # Broadcast via WebSocket to event chat
    await manager.broadcast_to_event(event_id, {
        "type": "message",
        "data": {
            "id": message.id,
            "sender_id": current_user.id,
            "sender_name": current_user.name,
            "message_type": "user",
            "content": message.content,
            "created_at": message.created_at.isoformat(),
            "group_broadcast": is_group_broadcast
        }
    })

    # If ## prefix, also post to group chat
    if is_group_broadcast and event.group_id:
        # Create a message in the group's general chat
        group_message = Message(
            id=str(uuid.uuid4()),
            event_id=event.group_id,  # Store in group's messages
            sender_id=current_user.id,
            message_type="user",
            content=f"[From {event.name}] {content}"
        )
        db.add(group_message)
        db.commit()
        db.refresh(group_message)

        # Broadcast to group chat room
        await manager.broadcast_to_event(event.group_id, {
            "type": "message",
            "data": {
                "id": group_message.id,
                "sender_id": current_user.id,
                "sender_name": current_user.name,
                "message_type": "user",
                "content": group_message.content,
                "created_at": group_message.created_at.isoformat(),
                "from_event": event.name
            }
        })

    return {
        "id": message.id,
        "event_id": message.event_id,
        "sender_id": message.sender_id,
        "sender_name": current_user.name,
        "sender_profile_photo": f"/api/auth/users/{current_user.id}/photo" if current_user.profile_photo else None,
        "message_type": message.message_type,
        "content": message.content,
        "is_edited": message.is_edited,
        "is_deleted": message.is_deleted,
        "created_at": message.created_at,
        "edited_at": message.edited_at
    }
