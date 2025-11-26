# Yorru - Attendance/Invitation Schemas
# Version: 0.0.1

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class InviteUserRequest(BaseModel):
    """Schema for inviting a user to an event"""
    email: str = Field(..., description="Email of user to invite")
    message: Optional[str] = Field(None, description="Optional invitation message")


class UpdateAttendanceRequest(BaseModel):
    """Schema for updating attendance/RSVP status"""
    rsvp_status: str = Field(..., pattern="^(yes|no|maybe)$")
    plus_ones: Optional[int] = Field(0, ge=0)
    rsvp_notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    """Schema for attendance record response"""
    id: str
    event_id: str
    user_id: Optional[str]  # None for pending invitations to unregistered users
    rsvp_status: str
    plus_ones: int
    rsvp_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InvitationWithEvent(BaseModel):
    """Schema for invitation with event details"""
    event_id: str
    event_name: str
    event_date: str
    event_time: Optional[str]
    event_address: Optional[str]
    host_name: str
    rsvp_status: str
    created_at: datetime

    class Config:
        from_attributes = True
