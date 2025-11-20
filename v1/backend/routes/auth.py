# Festivio - Auth Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid

from models.user import User
from schemas.auth import UserRegister, UserLogin, Token, UserResponse
from services.auth import hash_password, verify_password, create_access_token, decode_access_token
from services.sanitize import sanitize_text
from utils.database import get_db

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()


@router.post("/register", response_model=Token, status_code=201)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user.
    
    Creates a new user account with email/password authentication.
    Returns a JWT token for immediate login.
    
    Requirements:
    - Email must be unique
    - Password must be at least 8 characters
    - Name is required
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate user ID
    user_id = f"user-{uuid.uuid4()}"
    
    # Hash password
    hashed_password = hash_password(user_data.password)

    # Sanitize user inputs
    sanitized_name = sanitize_text(user_data.name, allow_basic_formatting=False)
    sanitized_phone = sanitize_text(user_data.phone, allow_basic_formatting=False) if user_data.phone else None

    # Create user
    new_user = User(
        id=user_id,
        email=user_data.email,
        password_hash=hashed_password,
        name=sanitized_name,
        phone=sanitized_phone,
        status="active",
        email_verified=False  # TODO: Add email verification flow
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": new_user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "email": new_user.email,
        "name": new_user.name
    }


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password.
    
    Returns a JWT token for authenticated requests.
    
    Token expires in 7 days by default.
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if account is active
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user.status}"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "name": user.name
    }


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user.
    
    Usage in endpoints:
        @router.get("/protected")
        def protected_route(current_user: User = Depends(get_current_user)):
            return {"user_id": current_user.id}
    
    Raises 401 if token is invalid or user doesn't exist.
    """
    token = credentials.credentials
    user_id = decode_access_token(token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user.status}"
        )
    
    return user


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get the current user's profile.
    
    Requires authentication (Bearer token in Authorization header).
    """
    return current_user
