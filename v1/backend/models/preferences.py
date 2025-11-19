# Festivio - Preferences Models
# Version: 0.0.1

from sqlalchemy import Column, String, ForeignKey, ARRAY, Text, Numeric
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class GuestPreferences(Base, TimestampMixin):
    """
    Per-event preferences for individual attendees.
    
    Examples:
    - Sarah is vegetarian for THIS specific event
    - John has mobility issues for THIS event's venue
    
    Scope: One event, one user
    
    Relationships:
    - event: The specific event these preferences apply to
    - user: The user with these preferences
    """
    __tablename__ = "guest_preferences"
    
    # Primary key (auto-generated)
    id = Column(String, primary_key=True)
    
    # Foreign keys (composite unique constraint)
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Preferences
    dietary_restrictions = Column(ARRAY(Text))  # ["vegetarian", "gluten-free"]
    accessibility_needs = Column(ARRAY(Text))  # ["wheelchair", "hearing_impaired"]
    arrival_time = Column(String)  # "Will arrive late around 8pm"
    notes = Column(Text)
    
    # Relationships
    event = relationship("Event", back_populates="guest_preferences")
    user = relationship("User", back_populates="guest_preferences")
    
    def __repr__(self):
        return f"<GuestPreferences(id={self.id}, event_id={self.event_id}, user_id={self.user_id})>"


class GroupPreferences(Base, TimestampMixin):
    """
    Standing preferences for a user across ALL events in a group.
    
    Examples:
    - Sarah's max budget for Friend Group 6 events: $50
    - John prefers outdoor venues for this group
    
    Scope: One group, one user (reusable across events)
    
    Relationships:
    - group: The friend group these preferences apply to
    - user: The user with these preferences
    """
    __tablename__ = "group_preferences"
    
    # Primary key (auto-generated)
    id = Column(String, primary_key=True)
    
    # Foreign keys (composite unique constraint)
    group_id = Column(String, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Preferences
    dietary_restrictions = Column(ARRAY(Text))  # Standing dietary needs
    budget_max = Column(Numeric(10, 2))  # Max willing to spend per event
    venue_preferences = Column(JSONB)  # {"indoor": true, "outdoor": false, "accessibility": true}
    notes = Column(Text)
    
    # Relationships
    group = relationship("Group", back_populates="group_preferences")
    user = relationship("User", back_populates="group_preferences")
    
    def __repr__(self):
        return f"<GroupPreferences(id={self.id}, group_id={self.group_id}, user_id={self.user_id})>"
