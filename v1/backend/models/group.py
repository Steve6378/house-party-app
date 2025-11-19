# Festivio - Group Model
# Version: 0.0.1

from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class Group(Base, TimestampMixin):
    """
    Friend groups that organize events together.
    
    Relationships:
    - members: Users in this group (via GroupMembership)
    - events: Events organized by this group
    - group_preferences: Standing preferences for group members
    """
    __tablename__ = "groups"
    
    # Primary key
    id = Column(String, primary_key=True)
    
    # Group info
    name = Column(String, nullable=False)
    description = Column(String)
    is_private = Column(Boolean, default=True, nullable=False)  # Invite-only vs public
    
    # Relationships
    members = relationship("GroupMembership", back_populates="group")
    events = relationship("Event", back_populates="group")
    group_preferences = relationship("GroupPreferences", back_populates="group")
    
    def __repr__(self):
        return f"<Group(id={self.id}, name={self.name})>"
