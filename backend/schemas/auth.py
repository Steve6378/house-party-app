# Yorru - Auth Schemas
# Version: 0.0.1

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class UserRegister(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for token response"""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    name: str


class UserResponse(BaseModel):
    """Schema for user profile response"""
    id: str
    email: str
    name: str
    phone: Optional[str]
    age: Optional[str]
    bio: Optional[str]
    profile_photo: Optional[str]
    address: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    email_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    age: Optional[str] = Field(None, max_length=3)
    bio: Optional[str] = Field(None, max_length=500)
    address: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
