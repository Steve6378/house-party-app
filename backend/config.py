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
    JWT_EXPIRATION_MINUTES: int = 15  # Short-lived access token (was 7 days)
    REFRESH_TOKEN_EXPIRATION_DAYS: int = 7  # Long-lived refresh token

    # Google Maps API for vendor recommendations
    GOOGLE_MAPS_API_KEY: str = "AIzaSyArl429AzBBxRq75I44ql0B7U56Gx0dMCo"

    # IPInfo API for location detection
    IPINFO_API_KEY: str = "66e8a1256f48d9"


    # Cloudflare R2 Storage (S3-compatible)
    R2_ACCOUNT_ID: Optional[str] = None
    R2_ACCESS_KEY_ID: Optional[str] = None
    R2_SECRET_ACCESS_KEY: Optional[str] = None
    R2_BUCKET_NAME: str = "yorru-photos"
    R2_PUBLIC_URL: Optional[str] = None  # Your R2 public bucket URL or custom domain

    ENVIRONMENT: str = "development"  # development, staging, production
    DEBUG: bool = True

    # Cookie settings for httpOnly auth
    COOKIE_DOMAIN: Optional[str] = None  # None = current domain only
    COOKIE_SECURE: bool = True  # Always use Secure in production (HTTPS only)
    COOKIE_SAMESITE: str = "lax"  # "lax" allows top-level navigations, "strict" is more secure
    COOKIE_PATH: str = "/"

    # CSRF protection
    CSRF_SECRET_KEY: Optional[str] = None  # Falls back to JWT_SECRET_KEY if not set

    class Config:
        # Look for .env in parent directory (yorru/.env)
        # Override with ENV_FILE environment variable for staging/testing
        # In production (Railway), environment variables override .env
        env_file = os.getenv("ENV_FILE", "../.env")
        case_sensitive = True

settings = Settings()

# Auto-adjust settings based on ENVIRONMENT
if settings.ENVIRONMENT == "production":
    settings.DEBUG = False
else:
    # In development, allow non-HTTPS cookies
    settings.COOKIE_SECURE = False

# CSRF key fallback
if not settings.CSRF_SECRET_KEY:
    settings.CSRF_SECRET_KEY = settings.JWT_SECRET_KEY
