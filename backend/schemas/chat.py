# Yorru - Chat Schemas
# Version: 0.0.1

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SendMessageRequest(BaseModel):
    """Schema for sending a message to event chat"""
    content: str = Field(..., min_length=1, description="Message content")


class MessageResponse(BaseModel):
    """Schema for chat message response"""
    id: str
    event_id: str
    sender_id: Optional[str]
    sender_name: Optional[str] = None
    message_type: str  # "user", "system", "assistant"
    content: str
    is_edited: bool = False
    is_deleted: bool = False
    created_at: datetime
    edited_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WebSocketMessage(BaseModel):
    """Schema for WebSocket message broadcast"""
    type: str  # "message", "user_joined", "user_left", "typing", "error"
    data: dict
