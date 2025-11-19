# Festivio - Message Model
# Version: 0.0.1

from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class Message(Base, TimestampMixin):
    """
    Chat messages for event discussions.
    
    Message types:
    - "user": Regular user message
    - "system": System notification (e.g., "John joined the chat")
    - "assistant": AI bot response
    
    Relationships:
    - event: The event this message belongs to
    - sender: User who sent the message (null for system/assistant messages)
    
    TODO: Add read receipts (MessageRead table)
    """
    __tablename__ = "messages"
    
    # Primary key (auto-generated)
    id = Column(String, primary_key=True)
    
    # Foreign keys
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
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
    sender = relationship("User", back_populates="messages_sent")
    
    # TODO: Add read receipts
    # read_receipts = relationship("MessageRead", back_populates="message")
    
    def __repr__(self):
        return f"<Message(id={self.id}, type={self.message_type}, sender_id={self.sender_id})>"
