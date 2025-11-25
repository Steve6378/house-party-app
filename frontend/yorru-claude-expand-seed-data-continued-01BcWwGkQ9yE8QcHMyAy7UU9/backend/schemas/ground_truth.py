# Yorru - Ground Truth Schemas
# Version: 0.0.1

from pydantic import BaseModel, Field
from typing import Optional


class GroundTruthQuery(BaseModel):
    """Schema for querying ground truth facts"""
    question: str = Field(..., min_length=1, max_length=500, description="The question to ask")
    

class GroundTruthAnswer(BaseModel):
    """Schema for ground truth answer response"""
    question: str
    answer: Optional[str] = None
    source: Optional[str] = None  # "keyword_match" or "semantic_search"
    confidence: Optional[float] = None  # For keyword match (1.0) or semantic distance (0.0-2.0)
    key: Optional[str] = None  # Fact key (e.g., "address", "parking")
    found: bool = False  # Whether an answer was found
    

class GroundTruthCreate(BaseModel):
    """Schema for creating a new ground truth fact"""
    key: str = Field(..., min_length=1, max_length=255)
    value: str = Field(..., min_length=1)
    keywords: list[str] = Field(default_factory=list)
    importance: str = Field("medium", pattern="^(critical|high|medium|low)$")


class GroundTruthUpdate(BaseModel):
    """Schema for updating a ground truth fact"""
    value: Optional[str] = Field(None, min_length=1)
    keywords: Optional[list[str]] = None
    importance: Optional[str] = Field(None, pattern="^(critical|high|medium|low)$")
