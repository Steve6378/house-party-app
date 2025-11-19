# Festivio - Code Reference

**Version:** 0.0.1
**Last Updated:** 2025-11-18

This doc explains what each file does and how to use it. No theory, just practical stuff.

---

## 📁 Project Structure

```
v1/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Settings/env vars
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Secrets (DATABASE_URL, API keys)
│   ├── utils/
│   │   └── database.py            # Database connection
│   ├── services/
│   │   ├── embeddings.py          # OpenAI embedding functions
│   │   └── ground_truth_query.py  # Query ground truth facts
│   └── scripts/
│       ├── generate_embeddings.py # One-time: generate all embeddings
│       ├── test_db.py             # Test database connection
│       └── test_semantic_search.py # Test vector search
├── database/
│   ├── schema.sql                 # Database structure (13 tables)
│   └── seed_data_comprehensive.sql # Test data (16 events, 126 facts)
└── docs/
    └── CODE_REFERENCE.md          # This file
```

---

## 🔧 Backend Files

### `main.py` - FastAPI App

**What it does:** Runs the web server with API endpoints.

**How to run:**
```bash
cd v1/backend
source venv/bin/activate
python main.py
```

**Endpoints available:**
- `GET /` - Returns "Festivio API v0.0.1"
- `GET /health` - Checks database connection, returns event/embedding counts
- `GET /api/test-semantic-search?question=Where+is+it` - Test vector search

**Access:** http://localhost:8000

**Stop server:** Ctrl+C

---

### `config.py` - Settings

**What it does:** Loads environment variables from `.env` file.

**How to use:**
```python
from config import settings

# Access settings:
settings.DATABASE_URL       # "postgresql://festivio_admin:..."
settings.OPENAI_API_KEY     # "sk-..."
settings.JWT_SECRET_KEY     # Your random secret
settings.DEBUG              # True/False
```

**Don't edit this file.** Edit `.env` instead.

---

### `utils/database.py` - Database Connection

**What it does:** Connects to PostgreSQL, provides database sessions.

**Key functions:**

#### `get_db()` - Get database session
```python
from utils.database import get_db
from sqlalchemy.orm import Session

# In FastAPI endpoint:
def my_endpoint(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM events"))
    return result.fetchall()
```

**When to use:** Every API endpoint that needs database access.

**Don't call this directly.** Use FastAPI's `Depends(get_db)`.

---

### `services/embeddings.py` - Generate Embeddings

**What it does:** Converts text to 1536-number vectors using OpenAI.

**Key functions:**

#### `embed_text(text: str) -> list[float]`
```python
from services.embeddings import embed_text

# Convert text to vector
embedding = embed_text("Where is the party?")
# Returns: [-0.102, -0.027, 0.055, ...] (1536 numbers)
```

**When to use:**
- Adding new ground truth facts
- Processing user questions for search

**Cost:** ~$0.02 per 1M tokens (very cheap)

---

### `services/ground_truth_query.py` - Query Facts

**What it does:** Search ground truth facts using keywords OR semantic similarity.

**Key functions:**

#### `query_keyword_match(question, event_id, db) -> dict`
```python
# Fast keyword matching
result = query_keyword_match("Where is it?", "event001-...", db)
# Returns: {"key": "address", "value": "123 Main St", "confidence": 1.0}
```

#### `query_semantic_search(question, event_id, db) -> dict`
```python
# Slower but smarter - uses embeddings
result = query_semantic_search("What should I wear?", "event001-...", db)
# Returns: {"key": "dress_code", "value": "Casual", "distance": 0.64}
```

**When to use:**
- Try keyword match first (fast)
- Fall back to semantic search if no match (smart but slower)

---

## 🗄️ Database Files

### `schema.sql` - Database Structure

**What it does:** Creates all 13 tables.

**Tables created:**
- `users` - User accounts
- `groups` - Friend groups
- `events` - Parties/events
- `ground_truth_facts` - Host-set info (address, parking, etc.) with embeddings
- `messages` - Chat messages
- `escalated_questions` - Questions bot couldn't answer
- `suggestions` - AI-generated suggestions
- `todos` - Task lists
- And 5 more...

**How to load:**
```bash
psql -U festivio_admin -d house_party_db -h localhost < v1/database/schema.sql
```

**When to use:** First-time setup or after wiping database.

---

### `seed_data_comprehensive.sql` - Test Data

**What it does:** Inserts realistic test data.

**What you get:**
- 14 users (Friend Group 6 + others)
- 16 events (Nov 2025 → May 2026)
- 126 ground truth facts
- 50+ chat messages
- Relationship arc (Amane + Mahiru's story)

**How to load:**
```bash
psql -U festivio_admin -d house_party_db -h localhost < v1/database/seed_data_comprehensive.sql
```

**When to use:** After loading schema, for testing/development.

---

## 🚀 Scripts

### `generate_embeddings.py` - Generate All Embeddings

**What it does:** Takes all ground truth facts, converts them to vectors, saves to database.

**How to run:**
```bash
cd v1/backend
source venv/bin/activate
python generate_embeddings.py
```

**What happens:**
1. Finds all facts where `embedding IS NULL`
2. For each fact, calls OpenAI API
3. Saves 1536-number vector to database
4. Prints progress: `✅ [1/126] Embedded: address...`

**When to use:**
- First-time setup (after loading seed data)
- After adding new facts manually

**Cost:** ~$0.03 for 126 facts
**Time:** ~2-3 minutes

---

### `test_db.py` - Test Database Connection

**What it does:** Verifies database connection works.

**How to run:**
```bash
python test_db.py
```

**Expected output:**
```
✅ Database connected! Found 16 events.

First 3 events:
  - Coffee Study Session
  - Movie Night: Studio Ghibli Marathon
  - Thanksgiving Potluck Dinner
```

**When to use:** After setting up `.env` file, to verify DATABASE_URL is correct.

---

### `test_semantic_search.py` - Test Vector Search

**What it does:** Tests semantic search with sample questions.

**How to run:**
```bash
python test_semantic_search.py
```

**What it tests:**
- "Where is the coffee meetup?" → Finds address
- "How do I park my car?" → Finds parking info
- "What should I wear?" → Finds dress code

**Expected output:**
```
🔍 Testing Semantic Search

Question: 'Where is the coffee meetup?'
Event: Coffee Study Session

  ✅ address: 123 Trousdale Parkway...
     Distance: 0.6064
```

**When to use:** After generating embeddings, to verify semantic search works.

---

## 🔐 `.env` File

**What it does:** Stores secrets and configuration.

**Required variables:**
```bash
DATABASE_URL=postgresql://festivio_admin:PASSWORD@localhost:5432/house_party_db
OPENAI_API_KEY=sk-your-key-here
JWT_SECRET_KEY=random-64-char-string
ENVIRONMENT=development
DEBUG=True
```

**How to create:**
```bash
cd v1/backend
nano .env
# Paste the above, replace PASSWORD and API keys
```

**NEVER commit this file to git!** It contains secrets.

---

## 📊 Key Database Columns

### `ground_truth_facts` table
```sql
id               TEXT              -- Unique ID (e.g., 'gt-e001-address')
event_id         TEXT              -- Which event this belongs to
key              VARCHAR(255)      -- Type (e.g., 'address', 'parking')
value            TEXT              -- Actual info (e.g., '123 Main St')
keywords         TEXT[]            -- For keyword matching ['address', 'location']
embedding        vector(1536)      -- OpenAI embedding for semantic search
importance       VARCHAR(50)       -- 'critical', 'high', 'medium', 'low'
created_at       TIMESTAMP         -- When added
```

### `events` table
```sql
id               TEXT              -- Unique ID
name             VARCHAR(255)      -- Event name
event_type       VARCHAR(50)       -- 'tight_knit', 'big_party', 'frat_party'
main_host_id     TEXT              -- User ID of main host
date             DATE              -- Event date
time             TIME              -- Event time
address          TEXT              -- Venue address
budget_per_person DECIMAL(10,2)    -- Cost per person
expected_guests  INTEGER           -- Expected attendee count
```

---

## 🛠️ Common Tasks

### Add a new ground truth fact
```python
from sqlalchemy import text
from services.embeddings import embed_text

# Generate embedding
embedding = embed_text("parking: Free street parking available")
embedding_str = '[' + ','.join(map(str, embedding)) + ']'

# Insert into database
db.execute(text("""
    INSERT INTO ground_truth_facts (id, event_id, key, value, embedding)
    VALUES (:id, :event_id, :key, :value, :embedding::vector)
"""), {
    "id": "gt-e001-parking",
    "event_id": "event001-0001-0001-0001-000000000001",
    "key": "parking",
    "value": "Free street parking available",
    "embedding": embedding_str
})
db.commit()
```

### Query semantic search in code
```python
from openai import OpenAI
from config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

# Generate question embedding
response = client.embeddings.create(
    model="text-embedding-3-small",
    input="Where can I park?"
)
query_embedding = response.data[0].embedding
embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'

# Search
query = f"""
    SELECT key, value, (embedding <=> '{embedding_str}'::vector) as distance
    FROM ground_truth_facts
    WHERE event_id = 'event001-0001-0001-0001-000000000001'
    ORDER BY distance ASC
    LIMIT 3
"""
result = db.execute(text(query))
facts = result.fetchall()

for key, value, distance in facts:
    print(f"{key}: {value} (distance: {distance:.4f})")
```

### Reset database
```bash
# Drop everything
psql -U festivio_admin -d house_party_db -h localhost \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Recreate vector extension (as superuser!)
sudo -u postgres psql -d house_party_db -c "CREATE EXTENSION vector;"

# Reload schema
psql -U festivio_admin -d house_party_db -h localhost < v1/database/schema.sql

# Reload seed data
psql -U festivio_admin -d house_party_db -h localhost < v1/database/seed_data_comprehensive.sql

# Regenerate embeddings
python generate_embeddings.py
```

---

## 🐛 Troubleshooting

### "permission denied to create extension"
**Problem:** Regular users can't create PostgreSQL extensions.

**Fix:**
```bash
sudo -u postgres psql -d house_party_db -c "CREATE EXTENSION vector;"
```

### "operator does not exist: vector <=> numeric[]"
**Problem:** Query embedding not cast to vector type.

**Fix:** Add `::vector` cast:
```python
# Wrong:
f"(embedding <=> '{embedding_str}')"

# Right:
f"(embedding <=> '{embedding_str}'::vector)"
```

### "relation 'ground_truth_facts' does not exist"
**Problem:** Vector extension wasn't created before loading schema.

**Fix:** Create extension first, then reload schema:
```bash
sudo -u postgres psql -d house_party_db -c "CREATE EXTENSION vector;"
psql -U festivio_admin -d house_party_db -h localhost < v1/database/schema.sql
```

### "null value in column 'id' violates not-null constraint"
**Problem:** Table missing auto-ID sequence.

**Fix:** Schema already has sequences. Just reload schema.sql.

---

## 📝 Notes

- **PostgreSQL port:** 5432 (default, don't change unless you know why)
- **Embedding model:** `text-embedding-3-small` (1536 dimensions, $0.02/1M tokens)
- **Vector distance:** Lower = more similar (0.0 = identical, 2.0 = opposite)
- **ID format:** TEXT instead of UUID (e.g., `'event001-...'` not random UUIDs)
- **Sequences:** Auto-generate IDs for guest_preferences, suggestions, todos, messages

---

## 🎯 Next Steps

See `IMPLEMENTATION_GUIDE.md` for building out the full API (auth, CRUD endpoints, WebSocket chat, etc.).

For setup instructions, see `SETUP_GUIDE.md`.
