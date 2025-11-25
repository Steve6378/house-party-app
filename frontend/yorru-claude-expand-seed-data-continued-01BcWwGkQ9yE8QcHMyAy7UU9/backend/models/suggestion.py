# Yorru - Suggestion Model
# Version: 0.0.1

from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class Suggestion(Base, TimestampMixin):
    """
    AI-generated suggestions for event planning.
    
    Examples:
    - "Consider renting chairs for 30+ guests"
    - "Weather forecast shows rain - suggest indoor backup plan"
    - "Based on budget, recommend potluck-style food"
    
    Workflow:
    - AI generates suggestion
    - User can accept, dismiss, or convert to todo
    
    Relationships:
    - event: Event this suggestion is for
    - created_todo: Todo created from this suggestion (if converted)
    """
    __tablename__ = "suggestions"
    
    # Primary key (auto-generated)
    id = Column(String, primary_key=True)
    
    # Foreign keys
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    created_todo_id = Column(String, ForeignKey("todos.id"))  # Link if converted to todo
    
    # Suggestion data
    suggestion_type = Column(String, nullable=False)
    # Values: "budget", "logistics", "weather", "attendance", "general"
    content = Column(Text, nullable=False)
    reasoning = Column(Text)  # Why the AI made this suggestion
    
    # Status tracking
    status = Column(String, default="pending", nullable=False)
    # Values: "pending", "accepted", "dismissed", "converted_to_todo"
    dismissed_reason = Column(Text)  # Why user dismissed it
    
    # Relationships
    event = relationship("Event", back_populates="suggestions")
    created_todo = relationship("Todo", foreign_keys=[created_todo_id])  # One-way
    
    def __repr__(self):
        return f"<Suggestion(id={self.id}, type={self.suggestion_type}, status={self.status})>"
