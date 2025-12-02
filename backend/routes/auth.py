# Yorru - Auth Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import uuid
import os
import io

from models.user import User
from models.attendance import EventAttendance
from schemas.auth import UserRegister, UserLogin, Token, UserResponse, UserUpdate
from services.auth import hash_password, verify_password, create_access_token, decode_access_token
from services.sanitize import sanitize_text
from services.r2_storage import r2_storage
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

    # Link any pending invitations for this email
    # Find attendance records with PENDING_EMAIL: prefix in rsvp_notes
    pending_invites = db.query(EventAttendance).filter(
        EventAttendance.user_id == None,
        EventAttendance.rsvp_notes.like(f"%PENDING_EMAIL:{user_data.email}%")
    ).all()

    for invite in pending_invites:
        # Link the invitation to the new user
        invite.user_id = new_user.id
        invite.rsvp_notes = None  # Clear the pending email marker

    if pending_invites:
        db.commit()

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


@router.put("/me", response_model=UserResponse)
def update_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the current user's profile.

    Requires authentication (Bearer token in Authorization header).
    """
    # Update fields if provided
    if user_data.name is not None:
        current_user.name = sanitize_text(user_data.name, allow_basic_formatting=False)
    if user_data.phone is not None:
        current_user.phone = sanitize_text(user_data.phone, allow_basic_formatting=False)
    if user_data.age is not None:
        current_user.age = user_data.age
    if user_data.bio is not None:
        current_user.bio = sanitize_text(user_data.bio, allow_basic_formatting=False)
    if user_data.address is not None:
        current_user.address = sanitize_text(user_data.address, allow_basic_formatting=False)
    if user_data.latitude is not None:
        current_user.latitude = user_data.latitude
    if user_data.longitude is not None:
        current_user.longitude = user_data.longitude

    db.commit()
    db.refresh(current_user)

    return current_user


# Max file size: 5MB for profile photos
MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


@router.post("/me/photo", response_model=UserResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a profile photo for the current user.

    Requires authentication (Bearer token in Authorization header).
    Max file size: 5MB. Allowed types: JPG, PNG, GIF, WebP.
    """
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Check file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > MAX_PROFILE_PHOTO_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_PROFILE_PHOTO_SIZE / 1024 / 1024}MB"
        )

    # Read file contents
    file_contents = await file.read()

    # Extract face encoding for face recognition
    face_encoding_json = None
    try:
        from services.face_recognition import is_available, get_face_encoding, encoding_to_json
        import json
        if is_available():
            encoding = get_face_encoding(file_contents)
            if encoding:
                face_encoding_json = json.dumps(encoding)
    except Exception as e:
        print(f"Error extracting face encoding: {e}")

    # Determine content type
    content_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp"
    }.get(file_ext, "image/jpeg")

    # Delete old profile photo if exists
    if current_user.profile_photo:
        try:
            r2_storage.delete_file(current_user.profile_photo)
        except Exception as e:
            print(f"Failed to delete old profile photo: {e}")

    # Upload to R2 or local storage
    try:
        upload_result = r2_storage.upload_file(
            file_data=io.BytesIO(file_contents),
            event_id=f"profiles/{current_user.id}",
            file_ext=file_ext,
            content_type=content_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

    # Update user's profile photo and face encoding
    current_user.profile_photo = upload_result['file_path']
    if face_encoding_json:
        current_user.face_encoding = face_encoding_json
    db.commit()
    db.refresh(current_user)

    return current_user


@router.get("/me/photo")
async def get_profile_photo(
    token: Optional[str] = Query(None, description="JWT token for img tag authentication"),
    db: Session = Depends(get_db)
):
    """
    Get the current user's profile photo.

    Supports token as query parameter for use in img tags.
    """
    # Validate token from query parameter
    if not token:
        raise HTTPException(status_code=401, detail="Token required")

    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    current_user = db.query(User).filter(User.id == user_id).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="User not found")

    if not current_user.profile_photo:
        raise HTTPException(status_code=404, detail="No profile photo set")

    # Get file from R2 or local storage
    file_data = r2_storage.get_file(current_user.profile_photo)

    if not file_data:
        raise HTTPException(status_code=404, detail="Profile photo not found")

    # Determine content type from file path
    file_ext = os.path.splitext(current_user.profile_photo)[1].lower()
    content_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp"
    }.get(file_ext, "image/jpeg")

    return Response(
        content=file_data,
        media_type=content_type,
        headers={"Content-Disposition": 'inline; filename="profile.jpg"'}
    )


@router.post("/me/refresh-face-encoding")
async def refresh_face_encoding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Re-extract face encoding from existing profile photo.

    Use this if your profile photo was uploaded before face recognition
    was enabled, or if you want to update your face encoding.
    """
    if not current_user.profile_photo:
        raise HTTPException(
            status_code=400,
            detail="No profile photo found. Please upload a profile photo first."
        )

    # Get the profile photo from storage
    try:
        file_data = r2_storage.get_file(current_user.profile_photo)
        if not file_data:
            raise HTTPException(status_code=404, detail="Profile photo file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve profile photo: {str(e)}")

    # Extract face encoding
    try:
        from services.face_recognition import is_available, get_face_encoding
        import json

        if not is_available():
            raise HTTPException(
                status_code=500,
                detail="Face recognition service is not available"
            )

        encoding = get_face_encoding(file_data)
        if not encoding:
            raise HTTPException(
                status_code=400,
                detail="No face detected in your profile photo. Please upload a photo with a clear, visible face."
            )

        # Save the face encoding
        current_user.face_encoding = json.dumps(encoding)
        db.commit()
        db.refresh(current_user)

        return {
            "message": "Face encoding updated successfully! You can now use the #photos feature to find photos of yourself.",
            "has_face_encoding": True
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error extracting face encoding: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract face encoding: {str(e)}"
        )


@router.delete("/me/face-recognition")
async def disable_face_recognition(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disable face recognition by clearing the face encoding.

    This removes your face encoding from the system. You will no longer
    be able to use the #photos feature to find photos of yourself.
    """
    if not current_user.face_encoding:
        raise HTTPException(
            status_code=400,
            detail="Face recognition is not enabled for your account."
        )

    # Clear the face encoding
    current_user.face_encoding = None
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Face recognition has been disabled. Your face encoding has been removed.",
        "has_face_encoding": False
    }


@router.get("/users/{user_id}/photo")
async def get_user_photo_by_id(
    user_id: str,
    token: Optional[str] = Query(None, description="JWT token for img tag authentication"),
    db: Session = Depends(get_db)
):
    """
    Get a user's profile photo by their user ID.

    Supports token as query parameter for use in img tags.
    Requires authentication to view other users' photos.
    """
    # Validate token from query parameter
    if not token:
        raise HTTPException(status_code=401, detail="Token required")

    requesting_user_id = decode_access_token(token)
    if not requesting_user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Get the user whose photo is being requested
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not target_user.profile_photo:
        raise HTTPException(status_code=404, detail="No profile photo set")

    # Get file from R2 or local storage
    file_data = r2_storage.get_file(target_user.profile_photo)

    if not file_data:
        raise HTTPException(status_code=404, detail="Profile photo not found")

    # Determine content type from file path
    file_ext = os.path.splitext(target_user.profile_photo)[1].lower()
    content_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp"
    }.get(file_ext, "image/jpeg")

    return Response(
        content=file_data,
        media_type=content_type,
        headers={"Content-Disposition": 'inline; filename="profile.jpg"'}
    )


@router.get("/me/auto-locate")
async def auto_locate(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Auto-detect user's location using their IP address via IPinfo API.

    Returns the detected location (city, region, country, coordinates).
    """
    import httpx
    from config import settings

    # Get client IP - check X-Forwarded-For first (for proxies like Railway/Vercel)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # X-Forwarded-For can be comma-separated, first one is the original client
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host

    # Skip internal/private IPs
    private_prefixes = ["127.", "localhost", "::1", "10.", "192.168.", "172.16.", "100.64."]
    is_private = any(client_ip.startswith(p) for p in private_prefixes)

    if is_private:
        # Try to get public IP
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get("https://api.ipify.org?format=json", timeout=5)
                if resp.status_code == 200:
                    client_ip = resp.json().get("ip")
                    is_private = False
        except:
            pass

    if is_private:
        return {
            "detected": False,
            "message": "Could not detect location from private IP. Please enter your address manually."
        }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://ipinfo.io/{client_ip}?token={settings.IPINFO_API_KEY}",
                timeout=10
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to detect location. Please enter your address manually."
                )

            data = response.json()

            # Parse location data
            loc = data.get("loc", "")
            lat, lng = None, None
            if loc and "," in loc:
                parts = loc.split(",")
                lat = float(parts[0])
                lng = float(parts[1])

            city = data.get("city", "")
            region = data.get("region", "")
            country = data.get("country", "")

            # Build address string
            address_parts = [p for p in [city, region, country] if p]
            address = ", ".join(address_parts)

            return {
                "detected": True,
                "address": address,
                "city": city,
                "region": region,
                "country": country,
                "latitude": lat,
                "longitude": lng,
                "ip": client_ip
            }

    except HTTPException:
        raise
    except Exception as e:
        print(f"IPinfo error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to detect location. Please enter your address manually."
        )
