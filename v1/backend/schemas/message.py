# Festivio - Message Schemas
# Version: 0.0.1

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class MessageCreate(BaseModel):
    """Schema for creating a new message"""
    content: str = Field(..., min_length=1, max_length=10000, description="Message content")
    message_type: str = Field("user", pattern="^(user|system|assistant)$", description="Message type")


class MessageUpdate(BaseModel):
    """Schema for updating a message"""
    content: str = Field(..., min_length=1, max_length=10000, description="Updated message content")


class UserBasic(BaseModel):
    """Basic user info for message sender"""
    id: str
    name: str
    email: str

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """Schema for message response"""
    id: str
    event_id: str
    sender_id: Optional[str]
    message_type: str
    content: str
    is_edited: bool
    edited_at: Optional[datetime]
    is_deleted: bool
    deleted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    # Nested sender info (only if sender exists)
    sender: Optional[UserBasic] = None

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    """Schema for paginated message list"""
    total: int
    messages: list[MessageResponse]
    skip: int
    limit: int
