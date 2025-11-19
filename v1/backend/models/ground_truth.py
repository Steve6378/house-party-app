# Festivio - Ground Truth Models
# Version: 0.0.1

from sqlalchemy import Column, String, Text, ForeignKey, ARRAY, DateTime
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from .base import Base, TimestampMixin


class GroundTruthFact(Base, TimestampMixin):
    """
    Host-verified factual information about events.
    
    Examples:
    - address: "123 Main St, Los Angeles, CA"
    - parking: "Free street parking available"
    - dress_code: "Casual, comfortable clothing"
    
    The 'embedding' field enables semantic search.
    
    Relationships:
    - event: The event this fact belongs to
    - change_logs: History of edits to this fact
    - escalated_question: Question that created this fact (if any)
    """
    __tablename__ = "ground_truth_facts"
    
    # Primary key
    id = Column(String, primary_key=True)
    
    # Foreign key
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    
    # Fact data
    key = Column(String, nullable=False)  # "address", "parking", etc.
    value = Column(Text, nullable=False)  # The actual information
    keywords = Column(ARRAY(Text))  # For keyword matching
    
    # Semantic search
    embedding = Column(Vector(1536))  # OpenAI text-embedding-3-small
    
    # Metadata
    importance = Column(String, default="medium")
    # Values: "critical", "high", "medium", "low"
    
    # Relationships
    event = relationship("Event", back_populates="ground_truth_facts")
    change_logs = relationship("GroundTruthChangeLog", back_populates="fact")
    
    def __repr__(self):
        return f"<GroundTruthFact(id={self.id}, key={self.key})>"


class GroundTruthChangeLog(Base, TimestampMixin):
    """
    Audit trail for ground truth fact edits.
    
    Tracks who changed what and when.
    
    Relationships:
    - fact: The fact that was changed
    - changed_by_user: User who made the change
    """
    __tablename__ = "ground_truth_change_logs"
    
    # Primary key (auto-generated)
    id = Column(String, primary_key=True)
    
    # Foreign keys
    fact_id = Column(String, ForeignKey("ground_truth_facts.id", ondelete="CASCADE"), nullable=False)
    changed_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Change data
    old_value = Column(Text)
    new_value = Column(Text)
    change_type = Column(String)  # "created", "updated", "deleted"
    
    # Relationships
    fact = relationship("GroundTruthFact", back_populates="change_logs")
    changed_by_user = relationship("User")
    
    def __repr__(self):
        return f"<GroundTruthChangeLog(id={self.id}, fact_id={self.fact_id})>"
