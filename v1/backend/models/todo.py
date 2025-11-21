# Yorru - Todo Model
# Version: 0.0.1

from sqlalchemy import Column, String, Text, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class Todo(Base, TimestampMixin):
    """
    Task list for event planning.
    
    Examples:
    - "Buy decorations" - assigned to Sarah, due Nov 20
    - "Book venue" - assigned to host, completed
    - "Send invites" - no assignment, pending
    
    Relationships:
    - event: Event this todo belongs to
    - assigned_user: User assigned to complete this task
    - created_from_suggestion: Suggestion that generated this todo (if any)
    """
    __tablename__ = "todos"
    
    # Primary key (auto-generated)
    id = Column(String, primary_key=True)
    
    # Foreign keys
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    assigned_to = Column(String, ForeignKey("users.id"))  # Can be unassigned
    created_from_suggestion_id = Column(String, ForeignKey("suggestions.id"))  # Optional link
    
    # Task data
    task = Column(Text, nullable=False)
    notes = Column(Text)
    
    # Status
    completed = Column(Boolean, default=False, nullable=False)
    due_date = Column(Date)
    
    # Relationships
    event = relationship("Event", back_populates="todos")
    assigned_user = relationship("User", back_populates="todos_assigned")
    created_from_suggestion = relationship("Suggestion", foreign_keys=[created_from_suggestion_id])
    
    def __repr__(self):
        return f"<Todo(id={self.id}, task={self.task[:30]}, completed={self.completed})>"
