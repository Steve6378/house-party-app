# Festivio - Ground Truth Query Service
# Version: 0.0.1

from sqlalchemy.orm import Session
from sqlalchemy import text
from services.embeddings import embed_text

def query_keyword_match(question: str, event_id: str, db: Session) -> dict:
    """
    Fast keyword matching for ground truth facts.

    Args:
        question: User's question (e.g., "Where is it?")
        event_id: Event ID to search within
        db: Database session

    Returns:
        Dict with key, value, and confidence (1.0 for exact matches)

    Example:
        result = query_keyword_match("Where is the party?", "event001-...", db)
        # Returns: {"key": "address", "value": "123 Main St", "confidence": 1.0}
    """
    # Normalize question to lowercase
    question_lower = question.lower()

    # Search for facts where keywords match
    query = text("""
        SELECT key, value
        FROM ground_truth_facts
        WHERE event_id = :event_id
          AND EXISTS (
              SELECT 1
              FROM unnest(keywords) AS keyword
              WHERE :question ILIKE '%' || keyword || '%'
          )
        LIMIT 1
    """)

    result = db.execute(query, {"event_id": event_id, "question": question_lower})
    row = result.fetchone()

    if row:
        return {
            "key": row[0],
            "value": row[1],
            "confidence": 1.0,
            "method": "keyword_match"
        }

    return None


def query_semantic_search(question: str, event_id: str, db: Session, limit: int = 3) -> list[dict]:
    """
    Semantic search using vector similarity (slower but smarter).

    Args:
        question: User's question (e.g., "What should I wear?")
        event_id: Event ID to search within
        db: Database session
        limit: Number of results to return

    Returns:
        List of dicts with key, value, and distance (lower = more similar)

    Example:
        results = query_semantic_search("What should I wear?", "event001-...", db)
        # Returns: [{"key": "dress_code", "value": "Casual", "distance": 0.64}]
    """
    # Generate embedding for the question
    query_embedding = embed_text(question)

    # Convert to PostgreSQL vector format
    embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'

    # Search using cosine distance
    # Note: embedding_str is formatted directly to avoid SQLAlchemy parameter issues with ::vector cast
    query = text(f"""
        SELECT
            key,
            value,
            (embedding <=> '{embedding_str}'::vector) as distance
        FROM ground_truth_facts
        WHERE event_id = :event_id
          AND embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT :limit
    """)

    result = db.execute(query, {
        "event_id": event_id,
        "limit": limit
    })

    rows = result.fetchall()

    return [
        {
            "key": row[0],
            "value": row[1],
            "distance": float(row[2]),
            "method": "semantic_search"
        }
        for row in rows
    ]
