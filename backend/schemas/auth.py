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
    """Schema for token response (includes refresh token)"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 900  # Access token expires in 15 min (900 seconds)
    user_id: str
    email: str
    name: str


class RefreshRequest(BaseModel):
    """Schema for token refresh request"""
    refresh_token: str


class RefreshResponse(BaseModel):
    """Schema for token refresh response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 900  # 15 minutes in seconds


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
    has_face_encoding: bool = False

    class Config:
        from_attributes = True

    @classmethod
    def model_validate(cls, obj, **kwargs):
        """Custom validation to compute has_face_encoding from model"""
        if hasattr(obj, 'face_encoding'):
            # Convert ORM object to dict and add has_face_encoding
            data = {
                'id': obj.id,
                'email': obj.email,
                'name': obj.name,
                'phone': obj.phone,
                'age': obj.age,
                'bio': obj.bio,
                'profile_photo': obj.profile_photo,
                'address': obj.address,
                'latitude': obj.latitude,
                'longitude': obj.longitude,
                'status': obj.status,
                'email_verified': obj.email_verified,
                'created_at': obj.created_at,
                'has_face_encoding': bool(obj.face_encoding)
            }
            return super().model_validate(data, **kwargs)
        return super().model_validate(obj, **kwargs)


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    age: Optional[str] = Field(None, max_length=3)
    bio: Optional[str] = Field(None, max_length=500)
    address: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
