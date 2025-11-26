# Yorru - Questionnaire Model
# Version: 0.0.1

from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class EventQuestionnaire(Base, TimestampMixin):
    """
    Host questionnaire responses for AI context.

    Hosts fill out a questionnaire about their event to provide
    the AI with important details for answering guest questions.

    Relationships:
    - event: The event this questionnaire belongs to
    - filled_by_user: User who filled out the questionnaire
    """
    __tablename__ = "event_questionnaires"

    # Primary key
    id = Column(String, primary_key=True)

    # Foreign keys
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, unique=True)
    filled_by = Column(String, ForeignKey("users.id"), nullable=False)

    # Questionnaire responses (stored as JSON for flexibility)
    responses = Column(JSON, nullable=False)
    """
    Example structure:
    {
        "dress_code": "Casual, comfortable clothing",
        "parking": "Free street parking available on Main St",
        "food_options": "Pizza, vegetarian options available",
        "alcohol": "BYOB - bring your own beverages",
        "special_instructions": "Please arrive between 7-8pm",
        "theme": "80s retro party",
        "accessibility": "Wheelchair accessible entrance on side",
        ...
    }
    """

    # Relationships
    event = relationship("Event", back_populates="questionnaire")
    filled_by_user = relationship("User")

    def __repr__(self):
        return f"<EventQuestionnaire(id={self.id}, event_id={self.event_id})>"
