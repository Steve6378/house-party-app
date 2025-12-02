# Yorru - Event FAQ Model
# Version: 0.0.1

from sqlalchemy import Column, String, Text, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

# Note: pgvector disabled until installed
# from pgvector.sqlalchemy import Vector


class EventFAQ(Base, TimestampMixin):
    """
    Auto-generated FAQs from frequently asked guest questions.

    The AI tracks questions asked by guests and automatically creates
    public FAQs for the top 5 most common questions.

    Relationships:
    - event: The event this FAQ belongs to
    """
    __tablename__ = "event_faqs"

    # Primary key
    id = Column(String, primary_key=True)

    # Foreign keys
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)

    # FAQ content
    question = Column(Text, nullable=False)  # The question
    answer = Column(Text, nullable=False)  # AI-generated or host-provided answer

    # Tracking
    frequency = Column(Integer, default=1)  # How many times this was asked
    is_public = Column(Boolean, default=False)  # Whether to show publicly

    # Source tracking
    similar_questions = Column(Text)  # JSON list of similar questions that contributed
    last_asked_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"))

    # Embedding for semantic search - disabled until pgvector is installed
    # embedding = Column(Vector(1536))

    # Relationships
    event = relationship("Event", back_populates="faqs")
    last_asked_by_user = relationship("User")

    def __repr__(self):
        return f"<EventFAQ(id={self.id}, question={self.question[:50]}..., frequency={self.frequency})>"
