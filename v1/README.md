# Yorru - v1

Event planning web app with AI assistance. Helps hosts manage house parties, big events, and recurring group gatherings.

**Status**: Foundation complete, ready for backend API development

---

## What's Built (So Far)

### ✅ Phase 1: Foundation (COMPLETE)

1. **Dev Docs** (`/dev/`)
   - `plan.md` - Complete architectural plan
   - `context.md` - Project context and file structure
   - `tasks.md` - Detailed task breakdown

2. **Database** (`/database/`)
   - `schema.sql` - Full PostgreSQL schema with pgvector
   - `seed_data.sql` - Mock data (Mahiru/Amane example)
   - `README.md` - Setup instructions

3. **Ground Truth Query System** (`/backend/services/`)
   - `embeddings.py` - OpenAI embedding generation + caching
   - `ground_truth_query.py` - Two-tier query system (keyword + semantic)
   - Unit tests (`/tests/unit/test_ground_truth_query.py`)

---

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+ with pgvector extension
- OpenAI API key

### 1. Database Setup

```bash
# Create database
createdb houseparty

# Enable pgvector
psql houseparty -c "CREATE EXTENSION vector;"

# Run schema
cd v1/database
psql houseparty < schema.sql

# Load mock data (optional)
psql houseparty < seed_data.sql
```

### 2. Backend Setup

```bash
cd v1/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add:
#   DATABASE_URL=postgresql://localhost:5432/houseparty
#   OPENAI_API_KEY=your_openai_key
```

### 3. Run Tests

```bash
cd v1/backend
pytest tests/unit/ -v
```

---

## Architecture Overview

### The Problem

Hosts are overwhelmed answering repetitive questions in group chats:
- "What's the address?" (asked 10 times)
- "Where can I park?"
- "What should I bring?"

### The Solution

**Three interaction modes:**

1. **Guest AI Assistant** (1-on-1 chat)
   - Guest asks question → AI answers from host-set "ground truth"
   - If AI doesn't know → "Escalate to Host" button

2. **Group Chat** (WhatsApp-like)
   - Everyone chats normally
   - AI observes and extracts preferences (dietary, budget, etc.)
   - Sends suggestions to host

3. **Host Interface** (Dashboard)
   - Edit ground truth (address, parking, etc.)
   - See guest preferences
   - Respond to escalated questions
   - Manage to-dos

### Ground Truth Query System (THE CORE)

**Two-tier approach:**

```python
# TIER 1: Keyword Matching (fast, exact)
Question: "What's the address?"
Keywords: ["address", "location", "where"]
→ MATCH → Answer: "123 Main St, LA"

# TIER 2: Semantic Search (flexible)
Question: "Where can I leave my car?"
Embedding similarity → "parking" fact
→ MATCH → Answer: "Street parking on Oak St"

# ESCALATION
Question: "Is there a gift registry?"
No keyword match, semantic similarity <0.8
→ ESCALATE to host
```

---

## File Structure

```
v1/
├── README.md (you are here)
├── dev/
│   ├── plan.md ← Read this for full architecture
│   ├── context.md
│   └── tasks.md ← Next steps
│
├── backend/
│   ├── requirements.txt
│   ├── services/
│   │   ├── embeddings.py ✅
│   │   └── ground_truth_query.py ✅
│   ├── models/ (TODO)
│   ├── api/ (TODO)
│   └── auth/ (TODO)
│
├── database/
│   ├── schema.sql ✅
│   ├── seed_data.sql ✅
│   └── README.md
│
├── tests/
│   └── unit/
│       └── test_ground_truth_query.py ✅
│
└── frontend/ (TODO)
```

---

## Next Steps

See `/dev/tasks.md` for full breakdown. Priority order:

### Phase 2: Backend API (Next)

1. Create SQLAlchemy models
2. Implement auth (Google OAuth + email/password)
3. Build API endpoints:
   - Events CRUD
   - Ground truth CRUD
   - WebSocket chat

### Phase 3: AI Logic

4. Guest DM handler (uses ground_truth_query.py)
5. Preference extraction from chat
6. Suggestion generation

### Phase 4: Frontend

7. Next.js app with React Query
8. Three views: Guest Assistant, Group Chat, Host Interface

---

## Testing the Ground Truth Query System

```bash
cd v1/backend

# Run example script
python -m services.ground_truth_query

# Run unit tests
pytest tests/unit/test_ground_truth_query.py -v

# Expected output:
# test_keyword_match_exact PASSED
# test_keyword_match_different_phrasing PASSED
# test_event_related_positive PASSED
# test_query_ground_truth_escalate PASSED
# ... (30+ tests)
```

---

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL + pgvector
- **Frontend**: Next.js + Tailwind + React Query
- **AI**: OpenAI (embeddings + GPT-4o-mini)
- **Auth**: Google OAuth + email/password (JWT)
- **Real-time**: WebSocket

---

## Key Design Decisions

### Why Mode 1 (Host/Comers) instead of Mode 2 (Small Group)?

- **Simpler**: Host sets ground truth, no consensus extraction needed
- **Scalable**: Works for 5 people or 500 people
- **Monetizable**: Can run ads, charge for premium features

Mode 2 (recurring friend groups with shared memory) deferred to v2.

### Why Two-Tier Query System?

- **Keyword matching** (Tier 1): Fast, exact, covers 80% of questions
- **Semantic search** (Tier 2): Handles creative phrasing, compound questions
- **Escalation logic**: Only escalate when relevant + low confidence

### Why Groups Are Optional?

- **Path A**: Create group → recurring events (preferences prefill)
- **Path B**: One-off event (no group, no memory)

Supports both "tight-knit friends" and "one-time big party" use cases.

---

## Contributing

1. Read `/dev/plan.md` for architecture
2. Check `/dev/tasks.md` for what needs doing
3. Write tests for new features
4. Follow PEP-8 for Python code

---

## License

(TBD - This is a class project)

---

## Questions?

See `/dev/context.md` for detailed context and integration points.
