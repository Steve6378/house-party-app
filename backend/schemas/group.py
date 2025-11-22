# Yorru - Group Schemas
# Version: 0.0.1

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class GroupCreate(BaseModel):
    """Schema for creating a new group"""
    name: str = Field(..., min_length=1, max_length=255, description="Group name")
    description: Optional[str] = Field(None, max_length=1000, description="Group description")
    is_private: bool = Field(True, description="Whether the group is invite-only")


class GroupUpdate(BaseModel):
    """Schema for updating a group"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_private: Optional[bool] = None


class GroupMemberAdd(BaseModel):
    """Schema for adding a member to a group"""
    user_id: str = Field(..., description="User ID to add to the group")
    role: str = Field("member", description="Role: 'admin' or 'member'")


class GroupMemberResponse(BaseModel):
    """Schema for group member information"""
    user_id: str
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True


class GroupResponse(BaseModel):
    """Schema for group response"""
    id: str
    name: str
    description: Optional[str]
    is_private: bool
    created_at: datetime
    updated_at: datetime
    member_count: Optional[int] = None

    class Config:
        from_attributes = True


class GroupDetailResponse(GroupResponse):
    """Schema for detailed group response with members"""
    members: List[GroupMemberResponse] = []

    class Config:
        from_attributes = True
