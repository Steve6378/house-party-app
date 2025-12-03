# Yorru - Attendance and Membership Models
# Version: 0.0.1

from sqlalchemy import Column, String, ForeignKey, Integer, DateTime, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class EventAttendance(Base, TimestampMixin):
    """
    Many-to-many relationship: Users ↔ Events

    Tracks who's attending which events and their RSVP status.
    Supports inviting unregistered users (user_id can be NULL).

    Relationships:
    - event: The event being attended
    - user: The user attending (None for pending unregistered invitations)
    """
    __tablename__ = "event_attendance"

    # Primary key
    id = Column(String, primary_key=True)

    # Foreign keys (user_id nullable for unregistered users)
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    # RSVP data
    rsvp_status = Column(String, default="pending", nullable=False)
    # Values: "pending", "yes", "no", "maybe"
    plus_ones = Column(Integer, default=0)
    rsvp_notes = Column(String)  # "Bringing my sister" or "PENDING_EMAIL:user@example.com"

    # Relationships
    event = relationship("Event", back_populates="attendees")
    user = relationship("User", back_populates="event_attendance")

    def __repr__(self):
        return f"<EventAttendance(id={self.id}, event_id={self.event_id}, user_id={self.user_id}, status={self.rsvp_status})>"


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


class InviteLink(Base):
    """
    Shareable invite links for events and groups.

    Supports:
    - Event invitations (as attendee or co-host)
    - Group invitations (as member or admin)
    - Expiration dates and usage limits

    Relationships:
    - creator: The user who created the invite link
    """
    __tablename__ = "invite_links"

    id = Column(String, primary_key=True)
    token = Column(String(32), unique=True, nullable=False)
    link_type = Column(String(20), nullable=False)  # 'event', 'group', 'cohost'
    target_id = Column(String, nullable=False)  # event_id or group_id
    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"))
    role = Column(String(50), default="attendee")  # 'attendee', 'cohost', 'member', 'admin'
    expires_at = Column(DateTime, nullable=True)
    max_uses = Column(Integer, nullable=True)
    use_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<InviteLink(token={self.token}, type={self.link_type}, target={self.target_id})>"
