# Yorru - Configuration Management
# Version: 0.0.1
# Yorru (夜 - "yoru" meaning night in Japanese) - Night Event Planning Platform

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    DATABASE_URL: str
    OPENAI_API_KEY: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60 * 24 * 7  # 7 days

    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = "../../.env"
        case_sensitive = True

settings = Settings()
