# Festivio - Poll Models
# Version: 0.0.1

from sqlalchemy import Column, String, Text, ForeignKey, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class Poll(Base, TimestampMixin):
    """
    Polls for group voting (e.g., "What time works best?", "Pizza or tacos?")
    
    Examples:
    - "What should we eat?" options: ["Pizza", "Thai", "Mexican"]
    - "What time works for everyone?" options: ["6pm", "7pm", "8pm"]
    
    Relationships:
    - event: Event this poll belongs to
    - created_by_user: User who created the poll
    - votes: Individual votes (via PollVote)
    """
    __tablename__ = "polls"
    
    # Primary key
    id = Column(String, primary_key=True)
    
    # Foreign keys
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"))
    
    # Poll data
    question = Column(Text, nullable=False)
    options = Column(JSONB, nullable=False)  # ["Option 1", "Option 2", ...]
    closes_at = Column(DateTime)  # Optional poll expiration
    
    # Relationships
    event = relationship("Event", back_populates="polls")
    created_by_user = relationship("User", back_populates="polls_created")
    votes = relationship("PollVote", back_populates="poll")
    
    def __repr__(self):
        return f"<Poll(id={self.id}, question={self.question[:30]})>"


class PollVote(Base):
    """
    Individual votes on polls.
    
    Each user can vote once per poll.
    
    Relationships:
    - poll: The poll being voted on
    - user: The user who voted
    """
    __tablename__ = "poll_votes"
    
    # Composite primary key
    poll_id = Column(String, ForeignKey("polls.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # Vote data
    option_index = Column(Integer, nullable=False)  # Index into poll.options array
    voted_at = Column(DateTime)
    
    # Relationships
    poll = relationship("Poll", back_populates="votes")
    user = relationship("User", back_populates="poll_votes")
    
    def __repr__(self):
        return f"<PollVote(poll_id={self.poll_id}, user_id={self.user_id}, option={self.option_index})>"
