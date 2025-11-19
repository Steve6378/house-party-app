# Festivio - FastAPI Backend
# Version: 0.0.1

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from utils.database import get_db
from config import settings
from routes import events_router, ground_truth_router, auth_router, messages_router, message_router

app = FastAPI(
    title="Festivio API",
    version="0.0.1",
    description="AI-assisted event planning platform"
)

# Register routers
app.include_router(auth_router, prefix="/api")
app.include_router(events_router, prefix="/api")
app.include_router(ground_truth_router, prefix="/api")
app.include_router(messages_router, prefix="/api")  # Event messages: /api/events/{id}/messages
app.include_router(message_router, prefix="/api")  # Message operations: /api/messages/{id}

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """API root endpoint"""
    return {
        "name": "Festivio API",
        "version": "0.0.1",
        "status": "running"
    }

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint - verifies database connection"""
    try:
        # Check database connection
        result = db.execute(text("SELECT COUNT(*) FROM events"))
        event_count = result.scalar()

        # Check embeddings
        result = db.execute(text("SELECT COUNT(*) FROM ground_truth_facts WHERE embedding IS NOT NULL"))
        embedding_count = result.scalar()

        return {
            "status": "healthy",
            "database": "connected",
            "events": event_count,
            "embeddings": embedding_count
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
