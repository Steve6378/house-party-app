# Yorru - Event Schemas
# Version: 0.0.1

from pydantic import BaseModel, Field
from datetime import date, time, datetime
from typing import Optional


class EventCreate(BaseModel):
    """Schema for creating a new event (main_host_id is auto-set to logged-in user)"""
    name: str = Field(..., min_length=1, max_length=255)
    event_type: str = Field(..., min_length=1, max_length=50, description="Custom event type (e.g., 'tight_knit', 'big_party', 'birthday', etc.)")
    date: date
    time: Optional[time] = None
    address: Optional[str] = None
    group_id: Optional[str] = None
    budget_per_person: Optional[float] = None
    expected_guests: Optional[int] = Field(None, ge=1)
    visibility: str = Field("private", pattern="^(private|group_only|public)$")


class EventUpdate(BaseModel):
    """Schema for updating an existing event (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    event_type: Optional[str] = Field(None, min_length=1, max_length=50, description="Custom event type")
    date: Optional[date] = None
    time: Optional[time] = None
    address: Optional[str] = None
    budget_per_person: Optional[float] = None
    expected_guests: Optional[int] = Field(None, ge=1)
    visibility: Optional[str] = Field(None, pattern="^(private|group_only|public)$")
    status: Optional[str] = Field(None, pattern="^(active|ended|archived|cancelled|deleted)$")


class UserBasic(BaseModel):
    """Basic user info for nested responses"""
    id: str
    name: str
    email: str
    
    class Config:
        from_attributes = True


class EventResponse(BaseModel):
    """Schema for event response (detailed)"""
    id: str
    name: str
    event_type: str
    date: date
    time: Optional[time]
    address: Optional[str]
    budget_per_person: Optional[float]
    expected_guests: Optional[int]
    status: str
    visibility: str
    created_at: datetime
    updated_at: datetime
    
    # Related data
    main_host_id: str
    group_id: Optional[str]
    
    class Config:
        from_attributes = True


class EventListItem(BaseModel):
    """Schema for event in list view (summary)"""
    id: str
    name: str
    event_type: str
    date: date
    status: str
    main_host_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class EventListResponse(BaseModel):
    """Schema for paginated event list"""
    total: int
    events: list[EventListItem]
    skip: int
    limit: int
