# Yorru - Photo Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
import uuid
import os
import shutil
import base64
import io
import tempfile
from openai import OpenAI

from models.event import Event
from models.event_photo import EventPhoto
from models.message import Message
from models.user import User
from schemas.photo import PhotoResponse, PhotoUploadResponse, PhotoSearchRequest, PhotoSearchResponse
from utils.database import get_db
from routes.auth import get_current_user
from services.permissions import require_event_access
from services.r2_storage import r2_storage
from config import settings

router = APIRouter(prefix="/events", tags=["photos"])

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)

# Directory for storing uploaded photos (local fallback)
UPLOAD_DIR = "uploads/photos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Max file size: 20MB for photos
MAX_FILE_SIZE = 20 * 1024 * 1024

# Allowed image types
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

# Magic bytes for image file validation
IMAGE_MAGIC_BYTES = {
    ".jpg": [b'\xff\xd8\xff'],
    ".jpeg": [b'\xff\xd8\xff'],
    ".png": [b'\x89PNG\r\n\x1a\n'],
    ".gif": [b'GIF87a', b'GIF89a'],
    ".webp": [b'RIFF'],  # WebP starts with RIFF, then has WEBP at offset 8
}


def validate_image_content(file_content: bytes, file_ext: str) -> bool:
    """
    Validate that file content matches the expected image type based on magic bytes.

    This prevents uploading malicious files (like PHP) with image extensions.

    Args:
        file_content: Raw file bytes
        file_ext: File extension (lowercase, with dot)

    Returns:
        True if content matches expected image type, False otherwise
    """
    if file_ext not in IMAGE_MAGIC_BYTES:
        return False

    valid_signatures = IMAGE_MAGIC_BYTES[file_ext]

    for signature in valid_signatures:
        if file_content.startswith(signature):
            # Additional check for WebP - must have WEBP at offset 8
            if file_ext == ".webp":
                if len(file_content) >= 12 and file_content[8:12] == b'WEBP':
                    return True
            else:
                return True

    return False


def generate_photo_description(image_data: bytes, file_ext: str) -> dict:
    """
    Use OpenAI Vision API to generate a description and tags for a photo.
    Returns dict with 'description' and 'tags'.

    Args:
        image_data: Raw bytes of the image
        file_ext: File extension (e.g., '.jpg', '.png')
    """
    try:
        # Encode to base64
        base64_image = base64.b64encode(image_data).decode('utf-8')

        # Determine media type
        media_type = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp"
        }.get(file_ext.lower(), "image/jpeg")

        # Call OpenAI Vision API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """Analyze this event photo and provide:
1. A detailed description (2-3 sentences) of what's happening in the photo
2. Tags for categorization (comma-separated, e.g., "food, people, outdoor, celebration")

Format your response as:
DESCRIPTION: [your description]
TAGS: [comma-separated tags]"""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{base64_image}",
                                "detail": "low"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300
        )

        # Parse response
        content = response.choices[0].message.content
        description = ""
        tags = ""

        for line in content.split("\n"):
            if line.startswith("DESCRIPTION:"):
                description = line.replace("DESCRIPTION:", "").strip()
            elif line.startswith("TAGS:"):
                tags = line.replace("TAGS:", "").strip()

        return {"description": description, "tags": tags}

    except Exception as e:
        print(f"Error generating photo description: {e}")
        return {"description": "Event photo", "tags": "photo"}


def generate_embedding(text: str) -> list:
    """Generate embedding for text using OpenAI."""
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None


def extract_face_encodings(image_data: bytes) -> str | None:
    """
    Extract face encodings from an image for face recognition.
    Returns JSON string of face encodings or None.
    """
    try:
        from services.face_recognition import is_available, get_all_face_encodings, encoding_to_json
        import json

        if not is_available():
            return None

        encodings = get_all_face_encodings(image_data)
        if encodings:
            return json.dumps(encodings)
        return None
    except Exception as e:
        print(f"Error extracting face encodings: {e}")
        return None


@router.post("/{event_id}/photos", response_model=PhotoUploadResponse)
async def upload_photo(
    event_id: str,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a photo to an event.

    **Authentication required.**

    Anyone with event access can upload photos.
    Photos are automatically analyzed by AI to generate descriptions and tags for search.
    Uses Cloudflare R2 for storage if configured, otherwise falls back to local storage.
    """
    # Verify event exists and user has access
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    require_event_access(current_user, event, db, action="view")

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

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    # Read file contents
    file_contents = await file.read()

    # Validate file content matches the claimed file type (magic byte check)
    # This prevents uploading malicious files (like PHP/scripts) with image extensions
    if not validate_image_content(file_contents, file_ext):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file content. File does not appear to be a valid {file_ext} image."
        )

    # Skip AI processing for fast upload - use defaults
    # AI processing can be done async/background later if needed
    description = caption or "Event photo"
    tags = "photo"

    # Extract face encodings for face recognition search
    face_encodings_json = extract_face_encodings(file_contents)
    if face_encodings_json:
        print(f"Extracted face encodings from photo upload")

    # Determine content type
    content_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp"
    }.get(file_ext, "image/jpeg")

    # Upload to R2 or local storage
    try:
        upload_result = r2_storage.upload_file(
            file_data=io.BytesIO(file_contents),
            event_id=event_id,
            file_ext=file_ext,
            content_type=content_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

    # Save to database
    photo = EventPhoto(
        id=upload_result['file_id'],
        event_id=event_id,
        uploaded_by=current_user.id,
        filename=file.filename,
        file_path=upload_result['file_path'],  # R2 key or local path
        file_type=file_ext.replace(".", ""),
        file_size=file_size,
        description=description,
        tags=tags,
        caption=caption,
        face_encodings=face_encodings_json  # Face data for recognition
    )

    db.add(photo)
    db.commit()
    db.refresh(photo)

    return {
        "id": photo.id,
        "event_id": photo.event_id,
        "filename": photo.filename,
        "file_type": photo.file_type,
        "file_size": photo.file_size,
        "description": description,
        "tags": tags,
        "message": "Photo uploaded and analyzed successfully"
    }


@router.get("/{event_id}/photos", response_model=List[PhotoResponse])
async def get_event_photos(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all photos for an event.

    **Authentication required.**
    """
    # Verify event exists and user has access
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    require_event_access(current_user, event, db, action="view")

    # Get photos for this event (exclude PENDING photos)
    photos = db.query(EventPhoto).filter(
        EventPhoto.event_id == event_id,
        ~EventPhoto.tags.contains("PENDING")  # Exclude pending invitations
    ).order_by(EventPhoto.created_at.desc()).all()

    # Add uploader names and profile photos
    result = []
    for photo in photos:
        uploader = db.query(User).filter(User.id == photo.uploaded_by).first()
        result.append({
            "id": photo.id,
            "event_id": photo.event_id,
            "uploaded_by": photo.uploaded_by,
            "uploaded_by_name": uploader.name if uploader else None,
            "uploaded_by_profile_photo": f"/api/auth/users/{uploader.id}/photo" if uploader and uploader.profile_photo else None,
            "filename": photo.filename,
            "file_path": f"/api/photos/{photo.id}",  # Return API endpoint instead of local path
            "file_type": photo.file_type,
            "file_size": photo.file_size,
            "description": photo.description,
            "tags": photo.tags,
            "caption": photo.caption,
            "created_at": photo.created_at
        })

    return result


@router.get("/photos/{photo_id}/file")
async def get_photo_file(
    photo_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the actual photo file.

    **Authentication required via httpOnly cookie or Authorization header.**

    Fetches from R2 or local storage based on configuration.
    """
    # Get photo
    photo = db.query(EventPhoto).filter(EventPhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Verify user has access to the event
    event = db.query(Event).filter(Event.id == photo.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    require_event_access(current_user, event, db, action="view")

    # Get file from R2 or local storage
    file_data = r2_storage.get_file(photo.file_path)

    if not file_data:
        # Fallback: check if it's a local path that exists
        # Security: validate path is within uploads directory to prevent traversal
        if os.path.exists(photo.file_path):
            real_path = os.path.realpath(photo.file_path)
            uploads_dir = os.path.realpath("uploads")
            if not real_path.startswith(uploads_dir):
                raise HTTPException(status_code=403, detail="Invalid file path")
            return FileResponse(
                real_path,
                media_type=f"image/{photo.file_type}",
                filename=photo.filename
            )
        raise HTTPException(status_code=404, detail="Photo file not found")

    # Return file bytes
    return Response(
        content=file_data,
        media_type=f"image/{photo.file_type}",
        headers={"Content-Disposition": f'inline; filename="{photo.filename}"'}
    )


@router.delete("/{event_id}/photos/{photo_id}")
async def delete_photo(
    event_id: str,
    photo_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a photo from an event.

    **Authentication required.**

    Only the uploader or event host can delete photos.
    Deletes from R2 or local storage based on configuration.
    """
    # Verify event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get photo
    photo = db.query(EventPhoto).filter(
        EventPhoto.id == photo_id,
        EventPhoto.event_id == event_id
    ).first()

    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Check permission: uploader or host
    is_uploader = photo.uploaded_by == current_user.id
    is_host = event.main_host_id == current_user.id

    if not is_uploader and not is_host:
        raise HTTPException(status_code=403, detail="Only uploader or host can delete photos")

    # Delete file from R2 or local storage
    try:
        r2_storage.delete_file(photo.file_path)
    except Exception as e:
        print(f"Failed to delete file: {e}")

    # Delete from database
    db.delete(photo)
    db.commit()

    return {"message": "Photo deleted successfully"}
