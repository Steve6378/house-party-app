# Yorru - Attendance and Membership Models
# Version: 0.0.1

from sqlalchemy import Column, String, ForeignKey, Integer, DateTime
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class EventAttendance(Base, TimestampMixin):
    """
    Many-to-many relationship: Users ↔ Events
    
    Tracks who's attending which events and their RSVP status.
    
    Relationships:
    - event: The event being attended
    - user: The user attending
    """
    __tablename__ = "event_attendance"
    
    # Composite primary key
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # RSVP data
    rsvp_status = Column(String, default="pending", nullable=False)
    # Values: "pending", "yes", "no", "maybe"
    plus_ones = Column(Integer, default=0)
    rsvp_notes = Column(String)  # "Bringing my sister"
    
    # Relationships
    event = relationship("Event", back_populates="attendees")
    user = relationship("User", back_populates="event_attendance")
    
    def __repr__(self):
        return f"<EventAttendance(event_id={self.event_id}, user_id={self.user_id}, status={self.rsvp_status})>"


class GroupMembership(Base, TimestampMixin):
    """
    Many-to-many relationship: Users ↔ Groups
    
    Tracks which users belong to which friend groups.
    
    Relationships:
    - group: The friend group
    - user: The member
    """
    __tablename__ = "group_memberships"
    
    # Composite primary key
    group_id = Column(String, ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # Membership data
    role = Column(String, default="member")
    # Values: "admin", "member"
    
    # Relationships
    group = relationship("Group", back_populates="members")
    user = relationship("User", back_populates="group_memberships")
    
    def __repr__(self):
        return f"<GroupMembership(group_id={self.group_id}, user_id={self.user_id}, role={self.role})>"


class EventCoHost(Base, TimestampMixin):
    """
    Co-hosts for events (in addition to main_host_id).
    
    Allows multiple hosts to manage an event with different permission levels.
    
    Relationships:
    - event: The event being co-hosted
    - user: The co-host user
    """
    __tablename__ = "event_cohosts"
    
    # Composite primary key
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # Permission level
    permissions = Column(String, default="edit_facts", nullable=False)
    # Values: "edit_all", "edit_facts", "view_only"
    added_at = Column(DateTime)  # When they became co-host
    
    # Relationships
    event = relationship("Event", back_populates="cohosts")
    user = relationship("User", back_populates="cohosts")
    
    def __repr__(self):
        return f"<EventCoHost(event_id={self.event_id}, user_id={self.user_id}, permissions={self.permissions})>"
