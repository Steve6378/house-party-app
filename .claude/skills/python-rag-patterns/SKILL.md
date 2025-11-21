# Python RAG Patterns for Yorru

## Context
This skill provides domain-specific patterns for the ground truth query system that uses pgvector for semantic search.

## Stack
- **Database**: PostgreSQL 15 + pgvector extension
- **Embeddings**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Backend**: Python 3.11 + FastAPI
- **Query Strategy**: Two-tier (keyword matching → semantic search fallback)

---

## 1. pgvector Query Patterns

### Cosine Distance Search
```python
# CORRECT: Use <=> operator for cosine distance (lower = more similar)
SELECT key, value, (embedding <=> query_embedding) as distance
FROM ground_truth_facts
WHERE event_id = 'event-uuid'
ORDER BY distance ASC
LIMIT 5;
```

**Key Points**:
- `<=>` is cosine distance (0 = identical, 2 = opposite)
- Always `ORDER BY distance ASC` (smaller = more similar)
- Use `embedding::vector` when inserting
- Index: `CREATE INDEX ON ground_truth_facts USING ivfflat (embedding vector_cosine_ops)`

### Embedding Storage Format
```python
# Convert numpy array to PostgreSQL vector format
embedding_str = '[' + ','.join(map(str, embedding_array)) + ']'

# Insert with proper casting
conn.execute(
    "UPDATE ground_truth_facts SET embedding = :emb::vector WHERE id = :id",
    {"emb": embedding_str, "id": fact_id}
)
```

---

## 2. Ground Truth Query Strategy

### Two-Tier Approach
```python
def query_ground_truth(question: str, event_id: str, db: Session):
    """
    Tier 1: Keyword matching (fast, exact)
    Tier 2: Semantic search (flexible, contextual)
    """

    # TIER 1: Try keyword matching first
    result = query_keyword_match(question, event_id, db)
    if result:
        return result  # Fast path!

    # TIER 2: Fall back to semantic search
    result = query_semantic_search(question, event_id, db)
    return result
```

### Keyword Matching Logic
```python
def query_keyword_match(question: str, event_id: str, db: Session):
    """Match question against fact keywords"""
    question_lower = question.lower()

    facts = db.query(GroundTruthFact).filter(
        GroundTruthFact.event_id == event_id
    ).all()

    for fact in facts:
        if any(keyword in question_lower for keyword in fact.keywords):
            return QueryResult(
                response_type=ResponseType.ANSWER,
                answer=fact.value,
                confidence=1.0  # Exact match
            )

    return None
```

### Semantic Search Logic
```python
def query_semantic_search(question: str, event_id: str, db: Session):
    """Use embeddings for contextual search"""
    # Generate query embedding
    query_embedding = embed_text(question)
    embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'

    # Find most similar fact
    result = db.execute(text("""
        SELECT key, value, (embedding <=> :query::vector) as distance
        FROM ground_truth_facts
        WHERE event_id = :event_id
        ORDER BY distance ASC
        LIMIT 1
    """), {"query": embedding_str, "event_id": event_id})

    fact = result.fetchone()

    # Threshold: 0.5 distance = ~0.75 cosine similarity
    if fact and fact.distance < 0.5:
        return QueryResult(
            response_type=ResponseType.ANSWER,
            answer=fact.value,
            confidence=1.0 - (fact.distance / 2.0)
        )

    return None  # Escalate to host
```

---

## 3. OpenAI Embedding Patterns

### Batch Embedding (Efficient)
```python
def batch_embed(texts: List[str], batch_size: int = 100) -> List[List[float]]:
    """Process multiple texts efficiently"""
    embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]

        response = openai.embeddings.create(
            model="text-embedding-3-small",
            input=batch
        )

        embeddings.extend([item.embedding for item in response.data])

    return embeddings
```

### Cost Optimization
- Model: `text-embedding-3-small` (cheapest, 1536 dims)
- Cost: ~$0.02 per 1M tokens (~$0.02 per 100 facts)
- Cache embeddings (don't re-embed same text)

### Text Preparation
```python
def prepare_fact_text(fact: GroundTruthFact) -> str:
    """Format fact for embedding"""
    # Combine key + value for better context
    return f"{fact.key}: {fact.value}"

# Examples:
# "address: 123 Main Street, Los Angeles, CA 90007"
# "parking: Street parking on Oak St or paid lot 2 blocks away"
```

---

## 4. Escalation Logic

### When to Escalate
```python
def should_escalate(question: str, event_id: str, db: Session) -> bool:
    """Determine if question should be escalated to host"""

    # 1. Check if event-related (not off-topic)
    if not is_event_related(question):
        return False  # Off-topic, just say "can't help"

    # 2. Check if we have answer
    result = query_ground_truth(question, event_id, db)
    if result:
        return False  # We have answer!

    # 3. Escalate (event-related but no answer)
    return True
```

### Event-Related Detection
```python
EVENT_KEYWORDS = [
    "when", "where", "time", "date", "address", "location",
    "parking", "budget", "cost", "price", "food", "drink",
    "dress", "attire", "bring", "rsvp", "guest"
]

def is_event_related(question: str) -> bool:
    """Check if question is about the event"""
    question_lower = question.lower()
    return any(keyword in question_lower for keyword in EVENT_KEYWORDS)
```

---

## 5. Common Patterns

### Ground Truth Fact Structure
```python
class GroundTruthFact(Base):
    __tablename__ = 'ground_truth_facts'

    id = Column(UUID, primary_key=True)
    event_id = Column(UUID, ForeignKey('events.id'))
    key = Column(String(100))  # 'address', 'parking', 'budget'
    value = Column(Text)  # The actual answer
    category = Column(String(50))  # 'logistics', 'food', 'attire'
    importance = Column(String(20))  # 'critical', 'high', 'medium', 'low'
    keywords = Column(ARRAY(String))  # ['address', 'location', 'where']
    embedding = Column(Vector(1536))  # OpenAI embedding
```

### Importance Levels
- **critical**: Address, date, time, dietary restrictions
- **high**: Parking, budget, RSVP deadline
- **medium**: Dress code, what to bring
- **low**: Music preferences, photo policy

### Confidence Thresholds
- **1.0**: Exact keyword match
- **0.8+**: High confidence semantic match (answer directly)
- **0.5-0.8**: Medium confidence (answer with caveat)
- **<0.5**: Low confidence (escalate to host)

---

## 6. Testing Patterns

### Unit Test Structure
```python
def test_keyword_matching():
    """Test that keyword matching works for common questions"""
    fact = GroundTruthFact(
        key="address",
        value="123 Main St, LA",
        keywords=["address", "location", "where"]
    )

    # Should match
    assert query_keyword_match("What's the address?", ...) == fact.value
    assert query_keyword_match("Where is it?", ...) == fact.value

    # Should NOT match
    assert query_keyword_match("When is it?", ...) is None
```

### Integration Test with Real DB
```python
def test_semantic_search_with_embeddings(db):
    """Test semantic search with real embeddings"""
    # Load seed data
    load_seed_data(db)

    # Generate embeddings
    generate_embeddings(db)

    # Query with different phrasing
    result = query_ground_truth("Where can I leave my car?", event_id, db)
    assert "parking" in result.answer.lower()
```

---

## 7. Performance Optimization

### Embedding Cache
```python
# Cache embeddings to avoid redundant API calls
_embedding_cache = {}

def embed_text_cached(text: str) -> List[float]:
    """Cache embeddings by text hash"""
    text_hash = hashlib.md5(text.encode()).hexdigest()

    if text_hash not in _embedding_cache:
        _embedding_cache[text_hash] = embed_text(text)

    return _embedding_cache[text_hash]
```

### Database Indexing
```sql
-- Create ivfflat index for fast vector search
CREATE INDEX ground_truth_embedding_idx
ON ground_truth_facts
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Analyze for query planning
ANALYZE ground_truth_facts;
```

### Query Performance Targets
- Keyword matching: <10ms
- Semantic search: <100ms (including embedding generation)
- Overall query: <150ms

---

## References

- **pgvector docs**: https://github.com/pgvector/pgvector
- **OpenAI embeddings**: https://platform.openai.com/docs/guides/embeddings
- **Our implementation**: `/v1/backend/services/ground_truth_query.py`
- **Tests**: `/v1/tests/unit/test_ground_truth_query.py`
