# Yorru - Questionnaire Schemas
# Version: 0.0.1

from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime


class QuestionnaireSubmitRequest(BaseModel):
    """Schema for submitting questionnaire responses"""
    responses: Dict[str, Any]
    """
    Example:
    {
        "dress_code": "Casual, comfortable clothing",
        "parking": "Free street parking available on Main St",
        "food_options": "Pizza, vegetarian options available",
        "alcohol": "BYOB - bring your own beverages",
        "special_instructions": "Please arrive between 7-8pm",
        "theme": "80s retro party",
        "accessibility": "Wheelchair accessible entrance on side"
    }
    """


class QuestionnaireResponse(BaseModel):
    """Schema for questionnaire response"""
    id: str
    event_id: str
    filled_by: str
    responses: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
