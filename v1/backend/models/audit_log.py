# Festivio - Audit Log Model
# Version: 0.0.1

from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB, INET
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class AuditLog(Base, TimestampMixin):
    """
    System audit trail - tracks all important actions.
    
    Examples:
    - User created an event
    - Host edited ground truth fact
    - Guest asked a question
    - Admin deleted a user
    
    Useful for:
    - Debugging issues
    - Security monitoring
    - Compliance/legal requirements
    - Understanding user behavior
    
    Relationships:
    - user: User who performed the action (null for system actions)
    - event: Event the action relates to (null for non-event actions)
    """
    __tablename__ = "audit_log"
    
    # Primary key
    id = Column(String, primary_key=True)
    
    # Foreign keys
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"))
    event_id = Column(String, ForeignKey("events.id", ondelete="SET NULL"))
    
    # Action data
    action = Column(String, nullable=False)
    # Values: "created_event", "edited_ground_truth", "deleted_user", 
    #         "asked_question", "rsvp_yes", "created_poll", etc.
    details = Column(JSONB)  # Additional context about the action
    
    # Request metadata
    ip_address = Column(INET)  # IP address of request
    user_agent = Column(String)  # Browser/client info
    
    # Relationships
    user = relationship("User")
    event = relationship("Event")
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, user_id={self.user_id})>"
