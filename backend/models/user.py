# Yorru - User Model
# Version: 0.0.1

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class GroupMembership(Base):
    """
    Group membership linking users to groups with roles.

    Relationships:
    - group: The group this membership belongs to
    - user: The user who is a member
    """
    __tablename__ = "group_memberships"

    # Composite primary key
    group_id = Column(String, ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    # Membership info
    role = Column(String, default="member", nullable=False)  # 'member' or 'admin'
    joined_at = Column(DateTime, nullable=False)

    # Relationships
    group = relationship("Group", back_populates="members")
    user = relationship("User", back_populates="group_memberships")

    def __repr__(self):
        return f"<GroupMembership(group_id={self.group_id}, user_id={self.user_id}, role={self.role})>"


class User(Base, TimestampMixin):
    """
    User accounts for the application.
    
    Relationships:
    - hosted_events: Events where this user is the main host
    - cohosts: Events where this user is a co-host
    - group_memberships: Groups this user belongs to
    - messages_sent: Messages sent by this user
    - guest_preferences: Per-event preferences for this user
    - escalated_questions: Questions asked by this user
    """
    __tablename__ = "users"
    
    # Primary key
    id = Column(String, primary_key=True)
    
    # Profile
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String)
    
    # Authentication
    password_hash = Column(String)  # For email/password login
    google_id = Column(String, unique=True)  # For Google OAuth
    email_verified = Column(Boolean, default=False, nullable=False)
    
    # Account status
    status = Column(String, default="active", nullable=False)
    # Values: "active", "suspended", "deleted", "pending_verification"
    deleted_at = Column(DateTime)
    
    # Relationships
    hosted_events = relationship("Event", back_populates="host", foreign_keys="Event.main_host_id")
    cohosts = relationship("EventCoHost", back_populates="user")
    group_memberships = relationship("GroupMembership", back_populates="user")
    messages_sent = relationship("Message", back_populates="sender")
    guest_preferences = relationship("GuestPreferences", back_populates="user")
    group_preferences = relationship("GroupPreferences", back_populates="user")
    escalated_questions = relationship("EscalatedQuestion", back_populates="user")
    todos_assigned = relationship("Todo", back_populates="assigned_user")
    event_attendance = relationship("EventAttendance", back_populates="user")
    polls_created = relationship("Poll", back_populates="created_by_user")
    poll_votes = relationship("PollVote", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, name={self.name}, email={self.email})>"
