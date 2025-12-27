# Yorru - FastAPI Backend
# Version: 0.0.1
# Yorru (夜 - "yoru" meaning night in Japanese) - Night Event Planning Platform

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from utils.database import get_db
from config import settings

# Rate limiter instance - use IP address as key
limiter = Limiter(key_func=get_remote_address)
from routes import events_router, ground_truth_router, auth_router, messages_router, message_router, groups_router
from routes.ai import router as ai_router
from routes.attendance import router as attendance_router, invite_router
from routes.chat import router as chat_router
from routes.documents import router as documents_router
from routes.questionnaire import router as questionnaire_router
from routes.photos import router as photos_router

# Disable OpenAPI/docs in production to prevent information disclosure
if settings.ENVIRONMENT == "production":
    app = FastAPI(
        title="Yorru API",
        version="0.0.1",
        description="Yorru - AI-assisted night event planning platform",
        docs_url=None,      # Disable /docs
        redoc_url=None,     # Disable /redoc
        openapi_url=None    # Disable /openapi.json
    )
else:
    app = FastAPI(
        title="Yorru API",
        version="0.0.1",
        description="Yorru - AI-assisted night event planning platform"
    )

# Rate limiter setup
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    # Enable XSS filter in browsers
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Control referrer information
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Restrict browser features
    response.headers["Permissions-Policy"] = "geolocation=(self), microphone=(), camera=()"
    # HSTS - only in production
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


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
