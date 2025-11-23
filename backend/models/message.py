# Yorru - Message Model
# Version: 0.0.1

from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class Message(Base, TimestampMixin):
    """
    Chat messages for group general chat OR event-specific chat.

    Message types:
    - "user": Regular user message
    - "system": System notification (e.g., "John joined the chat")
    - "assistant": AI bot response

    Message belongs to EITHER:
    - Group general chat (group_id set, event_id NULL) - social/casual discussion
    - Event chat (event_id set, group_id NULL) - logistics for specific event

    Relationships:
    - event: The event this message belongs to (if event chat)
    - group: The group this message belongs to (if general chat)
    - sender: User who sent the message (null for system/assistant messages)

    TODO: Add read receipts (MessageRead table)
    """
    __tablename__ = "messages"

    # Primary key (auto-generated)
    id = Column(String, primary_key=True)

    # Foreign keys (exactly one must be set - enforced by DB constraint)
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"))  # Event chat
    group_id = Column(String, ForeignKey("groups.id", ondelete="CASCADE"))  # General chat
    sender_id = Column(String, ForeignKey("users.id"))  # Null for system/assistant
    
    # Message data
    message_type = Column(String, default="user", nullable=False)
    # Values: "user", "system", "assistant"
    content = Column(Text, nullable=False)
    
    # Edit/delete tracking
    is_edited = Column(Boolean, default=False, nullable=False)
    edited_at = Column(DateTime)
    is_deleted = Column(Boolean, default=False, nullable=False)  # Soft delete
    deleted_at = Column(DateTime)
    
    # Relationships
    event = relationship("Event", back_populates="messages")
    group = relationship("Group", back_populates="general_chat_messages")
    sender = relationship("User", back_populates="messages_sent")

    # TODO: Add read receipts
    # read_receipts = relationship("MessageRead", back_populates="message")

    def __repr__(self):
        chat_type = "event" if self.event_id else "group"
        chat_id = self.event_id or self.group_id
        return f"<Message(id={self.id}, {chat_type}_id={chat_id}, type={self.message_type})>"
