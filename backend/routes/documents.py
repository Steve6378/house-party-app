# Yorru - Document Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import uuid
import os
import shutil

from models.event import Event
from models.event_document import EventDocument
from models.user import User
from schemas.document import DocumentResponse, DocumentUploadResponse
from utils.database import get_db
from routes.auth import get_current_user
from services.permissions import require_event_access
from services.pdf_extractor import extract_text_from_file

router = APIRouter(prefix="/events", tags=["documents"])

# Directory for storing uploaded files
UPLOAD_DIR = "uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Max file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024

# Allowed file types
ALLOWED_EXTENSIONS = {".pdf", ".txt"}


@router.post("/{event_id}/documents", response_model=DocumentUploadResponse)
async def upload_document(
    event_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a document to an event for AI context.

    **Authentication required.**

    Only hosts and co-hosts can upload documents.
    Supported formats: PDF, TXT
    Max file size: 10MB
    """
    # Verify event exists and user has permission
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    require_event_access(current_user, event, db, action="edit")

    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    # Generate unique filename
    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Extract text
    extracted_text = extract_text_from_file(file_path, file_ext)
    if not extracted_text:
        # Clean up file if extraction failed
        os.remove(file_path)
        raise HTTPException(
            status_code=500,
            detail="Failed to extract text from document"
        )

    # Save to database
    document = EventDocument(
        id=doc_id,
        event_id=event_id,
        uploaded_by=current_user.id,
        filename=file.filename,
        file_path=file_path,
        file_type=file_ext.replace(".", ""),
        file_size=file_size,
        extracted_text=extracted_text
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "id": document.id,
        "event_id": document.event_id,
        "filename": document.filename,
        "file_type": document.file_type,
        "file_size": document.file_size,
        "extracted_text_length": len(extracted_text),
        "message": "Document uploaded and processed successfully"
    }


@router.get("/{event_id}/documents", response_model=List[DocumentResponse])
async def get_event_documents(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all documents uploaded to an event.

    **Authentication required.**
    """
    # Verify event exists and user has access
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    require_event_access(current_user, event, db, action="view")

    # Get documents for this event
    documents = db.query(EventDocument).filter(
        EventDocument.event_id == event_id
    ).order_by(EventDocument.created_at.desc()).all()

    return documents


@router.delete("/{event_id}/documents/{document_id}")
async def delete_document(
    event_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a document from an event.

    **Authentication required.**

    Only hosts and co-hosts can delete documents.
    """
    # Verify event exists and user has permission
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    require_event_access(current_user, event, db, action="edit")

    # Get document
    document = db.query(EventDocument).filter(
        EventDocument.id == document_id,
        EventDocument.event_id == event_id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file from disk
    try:
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
    except Exception as e:
        print(f"Failed to delete file: {e}")

    # Delete from database
    db.delete(document)
    db.commit()

    return {"message": "Document deleted successfully"}
