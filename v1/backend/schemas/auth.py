# Festivio - Auth Schemas
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
    status: str
    email_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
