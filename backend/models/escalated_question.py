# Yorru - Escalated Question Model
# Version: 0.0.1

from sqlalchemy import Column, String, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class EscalatedQuestion(Base, TimestampMixin):
    """
    Questions the AI couldn't answer, escalated to the host.
    
    Workflow:
    1. Guest asks question → AI can't find answer
    2. Create EscalatedQuestion, notify host
    3. Host answers → Update resolution
    4. Optionally create GroundTruthFact for future questions
    
    Relationships:
    - event: Event this question is about
    - user: User who asked the question
    - created_fact: Ground truth fact created from this question (if any)
    """
    __tablename__ = "escalated_questions"
    
    # Primary key (auto-generated)
    id = Column(String, primary_key=True)
    
    # Foreign keys
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_fact_id = Column(String, ForeignKey("ground_truth_facts.id"))  # Link to created fact
    
    # Question data
    question = Column(Text, nullable=False)
    ai_response = Column(Text)  # What the AI said before escalating
    
    # Status
    host_notified = Column(Boolean, default=False, nullable=False)
    notified_at = Column(DateTime)
    resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime)
    resolution = Column(Text)  # Host's answer
    
    # Relationships
    event = relationship("Event", back_populates="escalated_questions")
    user = relationship("User", back_populates="escalated_questions")
    created_fact = relationship("GroundTruthFact")  # One-way relationship
    
    def __repr__(self):
        return f"<EscalatedQuestion(id={self.id}, resolved={self.resolved})>"
