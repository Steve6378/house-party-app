# Yorru - Event Photos Model
# Version: 0.0.1

from sqlalchemy import Column, String, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

# Note: pgvector disabled until installed
# from pgvector.sqlalchemy import Vector


class EventPhoto(Base, TimestampMixin):
    """
    Photos uploaded to event chat with AI-generated descriptions and embeddings.

    These photos are associated with events and can be searched using natural language
    queries like "show me photos from the football event last Sunday".

    Relationships:
    - event: The event this photo belongs to
    - uploaded_by_user: User who uploaded the photo
    """
    __tablename__ = "event_photos"

    # Primary key
    id = Column(String, primary_key=True)

    # Foreign keys
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)

    # File info
    filename = Column(String, nullable=False)  # Original filename
    file_path = Column(String, nullable=False)  # Path on server
    file_type = Column(String, nullable=False)  # "jpg", "png", "gif", "webp"
    file_size = Column(Integer, nullable=False)  # Size in bytes

    # AI-generated metadata for search
    description = Column(Text)  # AI-generated description of the photo
    tags = Column(Text)  # Comma-separated tags (people, food, venue, etc.)

    # Embedding for semantic search - disabled until pgvector is installed
    # embedding = Column(Vector(1536))

    # Face recognition: JSON array of face encodings (each is a 128-float array)
    face_encodings = Column(Text)  # JSON: [[128 floats], [128 floats], ...]

    # Optional context from chat
    caption = Column(Text)  # User-provided caption when uploading
    message_id = Column(String, ForeignKey("messages.id", ondelete="SET NULL"))  # Link to chat message

    # Relationships
    event = relationship("Event", back_populates="photos")
    uploaded_by_user = relationship("User")
    message = relationship("Message")

    def __repr__(self):
        return f"<EventPhoto(id={self.id}, filename={self.filename}, event_id={self.event_id})>"
