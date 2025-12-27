# Yorru - Authentication Service
# Version: 0.0.1

from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from config import settings
import hashlib

# Password hashing
# Use bcrypt with a lower cost factor (12) for reasonable performance
# Default is 13 which can be very slow on some systems
# 12 rounds is still very secure (~250ms per hash) but much faster than 13 (~500ms)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

def _prehash_password(password: str) -> str:
    """
    Pre-hash password with SHA256 to handle bcrypt's 72-byte limit.
    This allows arbitrarily long passwords while maintaining security.
    """
    return hashlib.sha256(password.encode()).hexdigest()

def hash_password(password: str) -> str:
    """Hash a password using SHA256 + bcrypt"""
    prehashed = _prehash_password(password)
    return pwd_context.hash(prehashed)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    prehashed = _prehash_password(plain_password)
    return pwd_context.verify(prehashed, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token (short-lived, 15 min default).

    Args:
        data: Payload to encode (usually {"sub": user_id})
        expires_delta: Token expiration time (default: from settings)

    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token (long-lived, 7 days default).

    Refresh tokens are used to obtain new access tokens without re-authenticating.
    They should only be sent to the /api/auth/refresh endpoint.

    Args:
        data: Payload to encode (usually {"sub": user_id})
        expires_delta: Token expiration time (default: from settings)

    Returns:
        Encoded JWT refresh token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRATION_DAYS)

    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    return encoded_jwt


def decode_access_token(token: str) -> Optional[str]:
    """
    Decode a JWT access token and return the user ID.

    Args:
        token: JWT token string

    Returns:
        User ID if valid, None if invalid/expired
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        return user_id
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[str]:
    """
    Decode a JWT refresh token and return the user ID.

    Only accepts tokens with type="refresh" to prevent access tokens
    from being used as refresh tokens.

    Args:
        token: JWT refresh token string

    Returns:
        User ID if valid refresh token, None if invalid/expired/wrong type
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        # Verify this is a refresh token, not an access token
        if payload.get("type") != "refresh":
            return None
        user_id: str = payload.get("sub")
        return user_id
    except JWTError:
        return None
