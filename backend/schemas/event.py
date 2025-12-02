# Yorru - Event Schemas
# Version: 0.0.1

from pydantic import BaseModel, Field, field_serializer, field_validator
from datetime import date, time, datetime
from typing import Optional, Union, Any, List
import json


class EventCreate(BaseModel):
    """Schema for creating a new event (main_host_id is auto-set to logged-in user)"""
    name: str = Field(..., min_length=1, max_length=255)
    event_type: str = Field(default="custom", min_length=1, max_length=50, description="Custom event type (e.g., 'tight_knit', 'big_party', 'birthday', etc.)")
    date: date
    time: Optional[str] = None
    address: Optional[str] = None
    group_id: Optional[str] = None
    budget_per_person: Optional[float] = None
    expected_guests: Optional[int] = Field(None, ge=1)
    visibility: Optional[str] = Field(default="private", pattern="^(private|group_only|public)$")

    # Description and topics
    description: Optional[str] = Field(None, max_length=2000, description="Event description")
    topics: Optional[List[str]] = Field(None, description="List of topic tags for the event")

    # Online/Offline
    is_online: Optional[bool] = Field(default=False, description="True for online events, False for in-person")
    online_link: Optional[str] = Field(None, description="Zoom/Meet link for online events")

    # Payment
    is_paid: Optional[bool] = Field(default=False, description="True if event requires payment")
    ticket_price: Optional[float] = Field(None, ge=0, description="Price per person if paid event")

    # Location coordinates for nearby discovery
    latitude: Optional[float] = None
    longitude: Optional[float] = None


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

    # Description and topics
    description: Optional[str] = Field(None, max_length=2000)
    topics: Optional[List[str]] = None

    # Online/Offline
    is_online: Optional[bool] = None
    online_link: Optional[str] = None

    # Payment
    is_paid: Optional[bool] = None
    ticket_price: Optional[float] = Field(None, ge=0)

    # Location coordinates
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class UserBasic(BaseModel):
    """Basic user info for nested responses"""
    id: str
    name: str
    email: str

    class Config:
        from_attributes = True


class AttendeeBasic(BaseModel):
    """Basic attendee info for event list responses"""
    user_id: Optional[str] = None
    rsvp_status: str

    class Config:
        from_attributes = True


class EventResponse(BaseModel):
    """Schema for event response (detailed)"""
    id: str
    name: str
    event_type: str
    date: date
    time: Any = None
    address: Optional[str]
    budget_per_person: Optional[float]
    expected_guests: Optional[int]
    status: str
    visibility: str
    created_at: datetime
    updated_at: datetime

    # Description and topics
    description: Optional[str] = None
    topics: Optional[List[str]] = None

    # Online/Offline
    is_online: Optional[bool] = False
    online_link: Optional[str] = None

    # Payment
    is_paid: Optional[bool] = False
    ticket_price: Optional[float] = None

    # Location coordinates
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    # Cover image
    cover_image_url: Optional[str] = None
    cover_image_type: Optional[str] = None  # "uploaded", "ai_generated", "none"

    # Related data
    main_host_id: str
    group_id: Optional[str]

    @field_validator('topics', mode='before')
    @classmethod
    def parse_topics(cls, v: Any) -> Optional[List[str]]:
        """Parse topics from JSON string (stored in DB) to list"""
        if v is None:
            return None
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    @field_serializer('time')
    def serialize_time(self, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, time):
            return v.strftime('%H:%M')
        return str(v)

    class Config:
        from_attributes = True


class EventListItem(BaseModel):
    """Schema for event in list view (summary)"""
    id: str
    name: str
    event_type: str
    date: date
    time: Any = None
    address: Optional[str] = None
    status: str
    visibility: str
    is_online: Optional[bool] = False
    is_paid: Optional[bool] = False
    ticket_price: Optional[float] = None
    main_host_id: str
    created_at: datetime
    expected_guests: Optional[int] = None
    attendees: List[AttendeeBasic] = []

    # Cover image
    cover_image_url: Optional[str] = None
    cover_image_type: Optional[str] = None

    @field_serializer('time')
    def serialize_time(self, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, time):
            return v.strftime('%H:%M')
        return str(v)

    class Config:
        from_attributes = True


class EventListResponse(BaseModel):
    """Schema for paginated event list"""
    total: int
    events: list[EventListItem]
    skip: int
    limit: int
