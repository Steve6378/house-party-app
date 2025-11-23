# Yorru - Event Model
# Version: 0.0.1

from sqlalchemy import Column, String, Date, Time, Integer, Numeric, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class Event(Base, TimestampMixin):
    """
    Events (parties, gatherings, etc.) organized by users/groups.
    
    Relationships:
    - host: User who is the main host
    - group: Group organizing this event
    - cohosts: Additional hosts (via EventCoHost)
    - attendees: Users attending (via EventAttendance)
    - ground_truth_facts: Factual information about the event
    - messages: Chat messages for this event
    - escalated_questions: Questions that couldn't be answered
    - suggestions: AI-generated suggestions
    - todos: Task list for this event
    - guest_preferences: Individual attendee preferences
    """
    __tablename__ = "events"
    
    # Primary key
    id = Column(String, primary_key=True)
    
    # Basic info
    name = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    # Values: "tight_knit", "big_party", "frat_party", "professional", "casual"
    
    # Relationships (foreign keys)
    main_host_id = Column(String, ForeignKey("users.id"), nullable=False)
    group_id = Column(String, ForeignKey("groups.id"))
    
    # Date/time
    date = Column(Date, nullable=False)
    time = Column(Time)
    
    # Location
    address = Column(Text)

    # Media
    cover_image_url = Column(Text)  # URL to event cover image
    
    # Budget/capacity
    budget_per_person = Column(Numeric(10, 2))
    expected_guests = Column(Integer)
    max_capacity = Column(Integer)  # Venue capacity limit

    # RSVP
    rsvp_deadline = Column(DateTime)  # RSVP cutoff date
    requires_approval = Column(Boolean, default=False, nullable=False)  # Host must approve RSVPs

    # Event status
    status = Column(String, default="active", nullable=False)
    # Values: "active", "ended", "archived", "cancelled", "deleted"
    archived_at = Column(DateTime)
    deleted_at = Column(DateTime)

    # Privacy/visibility
    visibility = Column(String, default="private", nullable=False)
    # Values: "private", "group_only", "public"
    
    # Relationships
    host = relationship("User", back_populates="hosted_events", foreign_keys=[main_host_id])
    group = relationship("Group", back_populates="events")
    cohosts = relationship("EventCoHost", back_populates="event")
    attendees = relationship("EventAttendance", back_populates="event")
    ground_truth_facts = relationship("GroundTruthFact", back_populates="event")
    messages = relationship("Message", back_populates="event")
    escalated_questions = relationship("EscalatedQuestion", back_populates="event")
    suggestions = relationship("Suggestion", back_populates="event")
    todos = relationship("Todo", back_populates="event")
    guest_preferences = relationship("GuestPreferences", back_populates="event")
    polls = relationship("Poll", back_populates="event")
    
    def __repr__(self):
        return f"<Event(id={self.id}, name={self.name}, date={self.date})>"
