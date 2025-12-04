# Yorru - FastAPI Backend
# Version: 0.0.1
# Yorru (夜 - "yoru" meaning night in Japanese) - Night Event Planning Platform

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from utils.database import get_db
from config import settings
from routes import events_router, ground_truth_router, auth_router, messages_router, message_router, groups_router
from routes.ai import router as ai_router
from routes.attendance import router as attendance_router, invite_router
from routes.chat import router as chat_router
from routes.documents import router as documents_router
from routes.questionnaire import router as questionnaire_router
from routes.photos import router as photos_router

app = FastAPI(
    title="Yorru API",
    version="0.0.1",
    description="Yorru - AI-assisted night event planning platform"
)

# CORS middleware for frontend - MUST be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://yorru.net",
        "https://www.yorru.net",
        "https://yorru-production.up.railway.app",
        # Capacitor mobile origins
        "capacitor://localhost",  # iOS
        "http://localhost",       # Android WebView
        "https://localhost",      # Android WebView (HTTPS)
    ],
    allow_origin_regex=r"https?://localhost(:\d+)?",  # Match any localhost with any port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
# IMPORTANT: Register more specific routes before generic ones to avoid path conflicts
app.include_router(auth_router, prefix="/api")
app.include_router(attendance_router, prefix="/api")  # Attendance/invitations: /api/events/{id}/invite, /api/events/invitations
app.include_router(events_router, prefix="/api")  # Must be after attendance_router to avoid /events/invitations being matched as /{event_id}
app.include_router(ground_truth_router, prefix="/api")
app.include_router(messages_router, prefix="/api")  # Event messages: /api/events/{id}/messages
app.include_router(message_router, prefix="/api")  # Message operations: /api/messages/{id}
app.include_router(ai_router, prefix="/api")  # AI endpoints: /api/ai/guest-query, /api/ai/host-assist
app.include_router(chat_router, prefix="/api")  # Chat with WebSocket: /api/events/{id}/ws, /api/events/{id}/messages
app.include_router(documents_router, prefix="/api")  # Documents: /api/events/{id}/documents
app.include_router(questionnaire_router, prefix="/api")  # Questionnaire: /api/events/{id}/questionnaire
app.include_router(photos_router, prefix="/api")  # Photos: /api/events/{id}/photos
app.include_router(groups_router, prefix="/api")  # Group management: /api/groups
app.include_router(invite_router, prefix="/api")  # Public invite links: /api/invite/{token}

@app.get("/")
def root():
    """API root endpoint"""
    return {
        "name": "Yorru API",
        "version": "0.0.1",
        "status": "running",
        "tagline": "Night Event Planning"
    }

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint - verifies database connection"""
    try:
        # Check database connection
        result = db.execute(text("SELECT COUNT(*) FROM events"))
        event_count = result.scalar()

        # Check embeddings (optional - may not exist if pgvector not installed)
        embedding_count = None
        try:
            result = db.execute(text("SELECT COUNT(*) FROM ground_truth_facts WHERE embedding IS NOT NULL"))
            embedding_count = result.scalar()
        except:
            # Embedding column doesn't exist - this is OK
            pass

        return {
            "status": "healthy",
            "database": "connected",
            "events": event_count,
            "embeddings": embedding_count if embedding_count is not None else "not_available"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

@app.get("/api/test-semantic-search")
def test_semantic_search(question: str, db: Session = Depends(get_db)):
    """Test semantic search with a question"""
    from services.ground_truth_query import query_semantic_search

    # Use first event as default
    result = db.execute(text("SELECT id FROM events LIMIT 1"))
    event_id = result.scalar()

    if not event_id:
        return {"error": "No events found in database"}

    # Perform semantic search
    search_result = query_semantic_search(question, event_id, db)

    return {
        "question": question,
        "event_id": event_id,
        "result": search_result
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
