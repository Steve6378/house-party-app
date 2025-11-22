# Yorru - Configuration Management
# Version: 0.0.1
# Yorru (夜 - "yoru" meaning night in Japanese) - Night Event Planning Platform

from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    """Application settings loaded from environment variables

    In development: Loads from ../.env file (yorru/.env)
    In production: Uses environment variables from Railway/hosting platform
    """

    DATABASE_URL: str
    OPENAI_API_KEY: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60 * 24 * 7  # 7 days

    ENVIRONMENT: str = "development"  # development, staging, production
    DEBUG: bool = True

    class Config:
        # Look for .env in parent directory (yorru/.env)
        # In production (Railway), environment variables override .env
        env_file = "../.env"
        case_sensitive = True

settings = Settings()

# Auto-adjust DEBUG based on ENVIRONMENT
if settings.ENVIRONMENT == "production":
    settings.DEBUG = False
