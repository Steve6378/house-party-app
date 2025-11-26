# Yorru - Event Documents Model
# Version: 0.0.1

from sqlalchemy import Column, String, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class EventDocument(Base, TimestampMixin):
    """
    Documents uploaded by hosts for AI context.

    These documents are processed to extract text and provide
    context for the AI to answer guest questions.

    Relationships:
    - event: The event this document belongs to
    - uploaded_by_user: User who uploaded the document
    """
    __tablename__ = "event_documents"

    # Primary key
    id = Column(String, primary_key=True)

    # Foreign keys
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)

    # File info
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # Path on server
    file_type = Column(String, nullable=False)  # "pdf", "txt", "docx", etc.
    file_size = Column(Integer, nullable=False)  # Size in bytes

    # Extracted content
    extracted_text = Column(Text)  # Full text extracted from document

    # Relationships
    event = relationship("Event", back_populates="documents")
    uploaded_by_user = relationship("User")

    def __repr__(self):
        return f"<EventDocument(id={self.id}, filename={self.filename}, event_id={self.event_id})>"
