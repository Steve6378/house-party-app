# Yorru - Ground Truth Routes
# Version: 0.0.1

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from models.ground_truth import GroundTruthFact
from models.event import Event
from models.user import User
from schemas.ground_truth import GroundTruthQuery, GroundTruthAnswer, GroundTruthCreate, GroundTruthUpdate
from services.ground_truth_query import query_keyword_match, query_semantic_search
from services.embeddings import embed_text
from utils.database import get_db
from routes.auth import get_current_user
from services.permissions import require_event_access
from services.sanitize import sanitize_ground_truth_value

router = APIRouter(tags=["ground_truth"])


@router.post("/events/{event_id}/ask", response_model=GroundTruthAnswer)
def ask_question(
    event_id: str,
    query: GroundTruthQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ask a question about an event using AI-powered search.

    **Authentication required.**

    You must have access to the event to ask questions.

    The AI will:
    1. Try keyword matching first (fast, exact matches)
    2. Fall back to semantic search if no keyword match (slower, intelligent)

    Examples:
    - "Where is the party?" → Finds address
    - "Can I bring my dog?" → Searches for pet policy
    - "What should I wear?" → Finds dress code
    """
    # Check if event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission to view this event
    require_event_access(current_user, event, db, action="view")
    
    question = query.question
    
    # Step 1: Try keyword matching (fast)
    keyword_result = query_keyword_match(question, event_id, db)
    
    if keyword_result:
        return {
            "question": question,
            "answer": keyword_result["value"],
            "source": keyword_result["method"],
            "confidence": keyword_result["confidence"],
            "key": keyword_result["key"],
            "found": True
        }
    
    # Step 2: Fall back to semantic search (smart)
    semantic_results = query_semantic_search(question, event_id, db, limit=1)
    
    if semantic_results and len(semantic_results) > 0:
        best_match = semantic_results[0]
        
        # Only return if distance is reasonable (< 1.0 is pretty good)
        if best_match["distance"] < 1.0:
            return {
                "question": question,
                "answer": best_match["value"],
                "source": best_match["method"],
                "confidence": 1.0 - best_match["distance"],  # Convert distance to confidence
                "key": best_match["key"],
                "found": True
            }
    
    # No answer found
    return {
        "question": question,
        "answer": None,
        "source": None,
        "confidence": None,
        "key": None,
        "found": False
    }


@router.get("/events/{event_id}/facts")
def list_facts(
    event_id: str,
    importance: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all ground truth facts for an event.

    **Authentication required.**

    You must have access to the event to view its facts.

    Optionally filter by importance level.
    """
    # Check if event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission to view this event
    require_event_access(current_user, event, db, action="view")
    
    # Build query
    query = db.query(GroundTruthFact).filter(GroundTruthFact.event_id == event_id)
    
    # Filter by importance if specified
    if importance:
        query = query.filter(GroundTruthFact.importance == importance)
    
    facts = query.all()
    
    return {
        "event_id": event_id,
        "total": len(facts),
        "facts": [
            {
                "id": fact.id,
                "key": fact.key,
                "value": fact.value,
                "keywords": fact.keywords,
                "importance": fact.importance,
                "created_at": fact.created_at,
                "updated_at": fact.updated_at
            }
            for fact in facts
        ]
    }


@router.post("/events/{event_id}/facts", status_code=201)
def create_fact(
    event_id: str,
    fact_data: GroundTruthCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new ground truth fact for an event.

    **Authentication required.**

    Only the host and co-hosts with edit permissions can create facts.

    Automatically generates embeddings for semantic search.
    """
    # Check if event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission to edit facts
    require_event_access(current_user, event, db, action="edit_facts")

    # Sanitize input
    sanitized_key = sanitize_ground_truth_value(fact_data.key)
    sanitized_value = sanitize_ground_truth_value(fact_data.value)

    # Generate embedding for the fact
    text_to_embed = f"{sanitized_key}: {sanitized_value}"
    embedding = embed_text(text_to_embed)
    embedding_str = '[' + ','.join(map(str, embedding)) + ']'
    
    # Generate unique ID
    import uuid
    fact_id = f"gt-{event_id[:8]}-{sanitized_key[:20]}-{uuid.uuid4().hex[:8]}"

    # Create fact
    from sqlalchemy import text as sql_text
    db.execute(sql_text("""
        INSERT INTO ground_truth_facts
        (id, event_id, key, value, keywords, embedding, importance, created_at, updated_at)
        VALUES
        (:id, :event_id, :key, :value, :keywords, CAST(:embedding AS vector), :importance, NOW(), NOW())
    """), {
        "id": fact_id,
        "event_id": event_id,
        "key": sanitized_key,
        "value": sanitized_value,
        "keywords": fact_data.keywords,
        "embedding": embedding_str,
        "importance": fact_data.importance
    })
    db.commit()
    
    return {
        "message": "Ground truth fact created successfully",
        "fact_id": fact_id,
        "event_id": event_id
    }


@router.put("/events/{event_id}/facts/{fact_id}")
def update_fact(
    event_id: str,
    fact_id: str,
    updates: GroundTruthUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing ground truth fact.

    **Authentication required.**

    Only the host and co-hosts with edit permissions can update facts.

    If 'value' is changed, embeddings are regenerated automatically.
    """
    # Get event first to check permissions
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission to edit facts
    require_event_access(current_user, event, db, action="edit_facts")

    # Get fact
    fact = db.query(GroundTruthFact).filter(
        GroundTruthFact.id == fact_id,
        GroundTruthFact.event_id == event_id
    ).first()

    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")

    # Update fields
    if updates.value is not None:
        # Sanitize new value
        sanitized_value = sanitize_ground_truth_value(updates.value)
        fact.value = sanitized_value

        # Regenerate embedding if value changed
        text_to_embed = f"{fact.key}: {sanitized_value}"
        embedding = embed_text(text_to_embed)
        embedding_str = '[' + ','.join(map(str, embedding)) + ']'
        
        from sqlalchemy import text as sql_text
        db.execute(sql_text("""
            UPDATE ground_truth_facts 
            SET embedding = CAST(:embedding AS vector), updated_at = NOW()
            WHERE id = :id
        """), {
            "embedding": embedding_str,
            "id": fact_id
        })
    
    if updates.keywords is not None:
        fact.keywords = updates.keywords
    
    if updates.importance is not None:
        fact.importance = updates.importance
    
    db.commit()
    db.refresh(fact)
    
    return {
        "message": "Fact updated successfully",
        "fact_id": fact_id,
        "updated_at": fact.updated_at
    }


@router.delete("/events/{event_id}/facts/{fact_id}")
def delete_fact(
    event_id: str,
    fact_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a ground truth fact.

    **Authentication required.**

    Only the host and co-hosts with edit permissions can delete facts.

    This is a hard delete - the fact will be permanently removed.
    """
    # Get event first to check permissions
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user has permission to edit facts
    require_event_access(current_user, event, db, action="edit_facts")

    # Get fact
    fact = db.query(GroundTruthFact).filter(
        GroundTruthFact.id == fact_id,
        GroundTruthFact.event_id == event_id
    ).first()

    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")

    # Delete
    db.delete(fact)
    db.commit()
    
    return {
        "message": "Fact deleted successfully",
        "fact_id": fact_id
    }
