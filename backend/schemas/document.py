# Yorru - Document Schemas
# Version: 0.0.1

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentResponse(BaseModel):
    """Schema for document response"""
    id: str
    event_id: str
    uploaded_by: str
    filename: str
    file_type: str
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    """Schema for document upload response"""
    id: str
    event_id: str
    filename: str
    file_type: str
    file_size: int
    extracted_text_length: int
    message: str
