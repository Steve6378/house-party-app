# Yorru - Photo Schemas
# Version: 0.0.1

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PhotoResponse(BaseModel):
    """Schema for photo response"""
    id: str
    event_id: str
    uploaded_by: str
    uploaded_by_name: Optional[str] = None
    filename: str
    file_path: str
    file_type: str
    file_size: int
    description: Optional[str] = None
    tags: Optional[str] = None
    caption: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PhotoUploadResponse(BaseModel):
    """Schema for photo upload response"""
    id: str
    event_id: str
    filename: str
    file_type: str
    file_size: int
    description: Optional[str] = None
    tags: Optional[str] = None
    message: str


class PhotoSearchRequest(BaseModel):
    """Schema for AI photo search request"""
    query: str  # e.g., "pics from the football event last Sunday"
    event_id: Optional[str] = None  # Optional: search within specific event
    limit: int = 10


class PhotoSearchResponse(BaseModel):
    """Schema for AI photo search response"""
    query: str
    photos: List[PhotoResponse]
    total_found: int
    message: str
