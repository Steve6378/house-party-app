# Yorru - Attendance/Invitation Schemas
# Version: 0.0.1

from pydantic import BaseModel, Field
from typing import Optional, List
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


# ============================================
# Co-Host Schemas
# ============================================

class AddCoHostRequest(BaseModel):
    """Schema for adding a co-host to an event"""
    email: str = Field(..., description="Email of user to add as co-host")
    permissions: str = Field("edit_facts", pattern="^(edit_all|edit_facts|view_only)$")


class UpdateCoHostRequest(BaseModel):
    """Schema for updating co-host permissions"""
    permissions: str = Field(..., pattern="^(edit_all|edit_facts|view_only)$")


class CoHostResponse(BaseModel):
    """Schema for co-host information"""
    user_id: str
    email: str
    name: str
    permissions: str
    added_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================
# Invite Link Schemas
# ============================================

class CreateInviteLinkRequest(BaseModel):
    """Schema for creating an invite link"""
    role: str = Field("attendee", description="Role for invited users: 'attendee', 'cohost', 'member', 'admin'")
    expires_in_hours: Optional[int] = Field(None, ge=1, le=720, description="Hours until link expires (max 30 days)")
    max_uses: Optional[int] = Field(None, ge=1, le=1000, description="Maximum number of uses")


class InviteLinkResponse(BaseModel):
    """Schema for invite link response"""
    id: str
    token: str
    link_type: str
    target_id: str
    role: str
    expires_at: Optional[datetime]
    max_uses: Optional[int]
    use_count: int
    is_active: bool
    created_at: datetime
    url: Optional[str] = None  # Full URL for convenience

    class Config:
        from_attributes = True


class InviteDetailsResponse(BaseModel):
    """Schema for public invite details (before accepting)"""
    link_type: str
    target_name: str
    target_id: str
    role: str
    host_name: Optional[str]
    expires_at: Optional[datetime]
    is_valid: bool
    message: Optional[str] = None  # e.g., "Link expired" or "Link has reached max uses"


class AcceptInviteResponse(BaseModel):
    """Schema for accepting an invite"""
    success: bool
    message: str
    link_type: str
    target_id: str
    role: str
