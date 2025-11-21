# Yorru - Context & Key Files

**Last Updated**: 2025-11-18

---

## Project Overview

Building a web app for event planning with AI assistance. Main users are college students at USC hosting parties and events.

**Key Insight**: Hosts need help managing guest questions and preferences without constant back-and-forth in group chats.

---

## What We're Building

**NOT** a Discord bot - this is a standalone web app.

**Three interaction modes**:
1. Guest AI Assistant (1-on-1 chat in-app)
2. Group Chat (WhatsApp-like, built into app)
3. Host Interface (dashboard for hosts)

**Bot commands** (like Slack slash commands): `/address`, `/parking`, `/poll`, etc. - just text parsing, not actual Discord integration.

---

## Current Project State

### What Exists

```
/v0/
  ├── PROJECT_TODO.md (old Yelp venue recommendation plan - OUTDATED)
  └── README.md (placeholder)

/v1/
  ├── dev/
  │   ├── plan.md ✅ (THIS IS THE SOURCE OF TRUTH)
  │   ├── context.md ✅ (YOU ARE HERE)
  │   └── tasks.md (NEXT)
  ├── backend/ (empty, to be created)
  ├── frontend/ (empty, to be created)
  ├── database/ (empty, to be created)
  └── tests/ (empty, to be created)
```

### What Doesn't Exist Yet

- Database schema
- Any backend code
- Any frontend code
- Tests
- Mock data

**Status**: Fresh start, ready to build from scratch.

---

## Key Architectural Decisions

### 1. Mode 1 (Host/Comers) vs Mode 2 (Small Group)

**Decision**: Mode 1 (host sets ground truth) ✅

**Why**: Simpler, more scalable, monetizable

**What this means**:
- Host has final authority
- No consensus extraction needed (that's Mode 2's problem)
- Guests ask questions → bot answers from ground truth OR escalates to host

**Deferred**: Mode 2 (recurring friend groups with shared memory) to v2

---

### 2. Groups Are Optional (Mode 1.5)

**Decision**: Support both one-off events AND groups with recurring events ✅

**How it works**:
- **Path A**: Create group → fill in member preferences → create events within group (preferences prefill)
- **Path B**: Create standalone event (no group, no memory)

**Example (Path A)**:
```
1. Create "USC Roommates" group
2. Add Jake (vegetarian), Maya ($30 budget), Nirali (vegan)
3. Create "Thanksgiving Dinner" event in group
   → Jake's dietary restriction auto-appears in guest preferences
   → Host knows to plan vegetarian options
4. Create "New Year's Party" event in same group
   → Same preferences prefill again
```

**Example (Path B)**:
```
1. Create "Sanjana's Big Frat Party" (no group)
2. Fill everything from scratch
3. Event ends, no memory saved
```

---

### 3. Ground Truth Query System

**Problem**: Answer both exact questions ("what's the address?") AND contextual questions ("where should I park if I'm coming from downtown?")

**Solution**: Two-tier system

**Tier 1 - Keyword Matching**:
- Fast, exact matches
- `"what's the address?"` → keyword "address" → return value

**Tier 2 - Semantic Search**:
- Slower, flexible
- Embed ground truth facts
- Use cosine similarity to find best match
- `"where can I leave my car?"` → semantically similar to "parking" fact

**Implementation**:
- Try Tier 1 first (cheap, fast)
- Fall back to Tier 2 if no keyword match
- If Tier 2 confidence <0.8 → escalate to host

---

### 4. Multi-Host Permissions

**Decision**: Co-hosts have same permissions as main host ✅

**Why**: Simplicity. If you trust someone to co-host, trust them to edit ground truth.

**Edge case mitigation**: Change log shows who edited what, when. Main host can revert if needed.

**No approval workflow** (that's annoying and slow).

---

### 5. Auth Strategy

**Decision**: Google OAuth OR email/password ✅

**Why**:
- Google OAuth: Easiest for users (one-click login)
- Email/password: Backup for users without Google accounts

**Not using**: Discord auth (we're not integrating with Discord at all)

---

## File Structure (Planned)

```
/v1/
├── dev/
│   ├── plan.md ← Architectural decisions, tech stack
│   ├── context.md ← YOU ARE HERE
│   └── tasks.md ← Detailed to-do list
│
├── backend/
│   ├── main.py ← FastAPI app entry point
│   ├── requirements.txt ← Python dependencies
│   ├── .env.example ← Environment variable template
│   ├── config.py ← Configuration (DB URL, API keys, etc.)
│   │
│   ├── auth/
│   │   ├── google_oauth.py ← Google OAuth flow
│   │   ├── email_auth.py ← Email/password auth
│   │   └── jwt.py ← JWT token generation/validation
│   │
│   ├── models/
│   │   ├── user.py ← SQLAlchemy models
│   │   ├── event.py
│   │   ├── ground_truth.py
│   │   ├── message.py
│   │   └── ... (other models)
│   │
│   ├── api/
│   │   ├── events.py ← Event CRUD endpoints
│   │   ├── ground_truth.py ← Ground truth query/edit endpoints
│   │   ├── chat.py ← WebSocket chat handlers
│   │   ├── preferences.py ← Guest preference endpoints
│   │   └── escalations.py ← Escalated questions endpoints
│   │
│   ├── services/
│   │   ├── ground_truth_query.py ← THE CORE LOGIC
│   │   ├── preference_extractor.py ← Extract prefs from chat
│   │   ├── embeddings.py ← OpenAI embedding calls
│   │   └── ai_assistant.py ← Bot response logic
│   │
│   └── utils/
│       ├── db.py ← Database connection
│       └── security.py ← Input sanitization, rate limiting
│
├── frontend/
│   ├── app/ (Next.js 14 App Router)
│   │   ├── login/ ← Login/register page
│   │   ├── dashboard/ ← Event list
│   │   ├── events/
│   │   │   ├── [id]/
│   │   │   │   ├── chat/ ← Group chat view
│   │   │   │   ├── assistant/ ← Guest AI assistant
│   │   │   │   └── host/ ← Host interface
│   │   │   └── create/ ← Create event form
│   │   └── groups/
│   │       ├── [id]/ ← Group detail
│   │       └── create/ ← Create group form
│   │
│   ├── components/
│   │   ├── Chat.tsx ← Reusable chat component
│   │   ├── GroundTruthEditor.tsx
│   │   ├── PreferencesSummary.tsx
│   │   └── ... (other components)
│   │
│   └── lib/
│       ├── api.ts ← API client functions
│       └── websocket.ts ← WebSocket connection logic
│
├── database/
│   ├── schema.sql ← Full database schema
│   ├── migrations/ ← Alembic migrations
│   └── seed_data.sql ← Mock data for testing
│
└── tests/
    ├── unit/
    │   ├── test_ground_truth_query.py ← CRITICAL TESTS
    │   ├── test_preference_extraction.py
    │   └── test_embeddings.py
    │
    ├── integration/
    │   ├── test_api_events.py
    │   ├── test_api_chat.py
    │   └── test_auth.py
    │
    └── e2e/
        └── test_full_flow.py ← Create event → chat → escalate → host responds
```

---

## Key Files to Build (Priority Order)

### Phase 1: Foundation
1. `/v1/database/schema.sql` ← Define all tables
2. `/v1/backend/services/ground_truth_query.py` ← Core query logic
3. `/v1/tests/unit/test_ground_truth_query.py` ← Test the query system

**Why this order**: Ground truth query is the most critical piece. If this doesn't work, nothing else matters.

### Phase 2: Backend API
4. `/v1/backend/models/*.py` ← SQLAlchemy ORM models
5. `/v1/backend/api/events.py` ← Event CRUD
6. `/v1/backend/api/ground_truth.py` ← Ground truth endpoints
7. `/v1/backend/auth/*.py` ← Google OAuth + email/password
8. `/v1/backend/api/chat.py` ← WebSocket chat

### Phase 3: AI Logic
9. `/v1/backend/services/ai_assistant.py` ← Bot response logic
10. `/v1/backend/services/preference_extractor.py` ← Extract preferences from chat

### Phase 4: Frontend
11. `/v1/frontend/app/login/` ← Auth UI
12. `/v1/frontend/app/events/create/` ← Create event form
13. `/v1/frontend/app/events/[id]/assistant/` ← Guest AI chat UI
14. `/v1/frontend/app/events/[id]/chat/` ← Group chat UI
15. `/v1/frontend/app/events/[id]/host/` ← Host interface dashboard

---

## Integration Points

### Backend ↔ Database
- **ORM**: SQLAlchemy (async support via `asyncpg`)
- **Migrations**: Alembic
- **Connection Pool**: Configured in `config.py`

### Backend ↔ Frontend
- **REST API**: FastAPI auto-generates OpenAPI docs at `/docs`
- **WebSocket**: Native FastAPI WebSocket support
- **CORS**: Configured to allow Next.js dev server (localhost:3000)

### Backend ↔ OpenAI
- **Embeddings**: `text-embedding-3-small` via `openai` Python library
- **LLM**: GPT-4o-mini for preference extraction
- **Rate Limiting**: Batch requests where possible
- **Error Handling**: Retry logic for transient failures

### Frontend ↔ Backend
- **Auth**: JWT tokens in HTTP-only cookies
- **API Calls**: React Query for caching/optimistic updates
- **WebSocket**: Native WebSocket API, auto-reconnect on disconnect

---

## External Dependencies

### Backend Python Packages
```
fastapi
uvicorn[standard]
sqlalchemy[asyncio]
asyncpg  # PostgreSQL async driver
alembic  # Migrations
python-jose[cryptography]  # JWT
passlib[bcrypt]  # Password hashing
python-multipart  # Form data
authlib  # Google OAuth
openai  # Embeddings + GPT
pgvector  # Vector similarity
pydantic  # Data validation
slowapi  # Rate limiting
python-dotenv  # Environment variables
pytest  # Testing
httpx  # Async HTTP client for tests
```

### Frontend npm Packages
```
next
react
react-dom
typescript
tailwindcss
@tanstack/react-query
next-auth  # Google OAuth
axios  # API client
zod  # Form validation
```

### Database
```
PostgreSQL 15+
pgvector extension
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/houseparty

# Auth
JWT_SECRET=<random-secret>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

# OpenAI
OPENAI_API_KEY=<from OpenAI>

# App
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
ENVIRONMENT=development  # or production
```

---

## Development Workflow

### Setting Up

1. **Database**:
   ```bash
   createdb houseparty
   psql houseparty -c "CREATE EXTENSION vector;"
   cd v1/database
   psql houseparty < schema.sql
   ```

2. **Backend**:
   ```bash
   cd v1/backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env  # Fill in real values
   uvicorn main:app --reload
   ```

3. **Frontend**:
   ```bash
   cd v1/frontend
   npm install
   npm run dev
   ```

### Running Tests

```bash
cd v1/backend
pytest tests/unit/
pytest tests/integration/
pytest tests/e2e/
```

---

## Mock Data (Mahiru/Amane Example)

Using the synthetic chat data mentioned in conversation:
- **Group**: "Friend Group 6" (Amane, Mahiru, Jake, Tanya, Nirali, Maya)
- **Events**: 16 events over 6 months
- **Relationship arc**: Amane and Mahiru dating (slow-burn reveal)
- **Use case**: Test group preferences persistence across multiple events

Will generate SQL seed data based on this scenario in `database/seed_data.sql`.

---

## Common Patterns

### Adding a New Ground Truth Field

1. Host adds in UI: `{key: "dress_code", value: "Casual", keywords: ["dress", "attire", "wear"]}`
2. Frontend POSTs to `/api/ground-truth`
3. Backend:
   - Validates input (Pydantic model)
   - Generates embedding for semantic search
   - Stores in `ground_truth_facts` table
   - Adds entry to `ground_truth_changes` (audit log)
4. Frontend updates optimistically (React Query)

### Guest Asks Question

1. Guest types in AI Assistant chat: "What should I wear?"
2. Frontend sends via WebSocket to backend
3. Backend:
   - Tries keyword match first (no match for "wear")
   - Falls back to semantic search
   - Finds "dress_code" fact (semantically similar)
   - Returns: "Casual"
4. Frontend displays bot response in chat

### Escalation Flow

1. Guest asks: "Is there a gift registry?"
2. Backend:
   - No keyword match
   - No semantic match with confidence >0.8
   - Returns: "I don't know. [Escalate] button"
3. Guest clicks Escalate
4. Frontend POSTs to `/api/escalations`
5. Backend creates entry in `escalated_questions` table
6. Host sees in Host Interface dashboard
7. Host answers in dashboard
8. Backend sends WebSocket message to guest with answer

---

## Next Steps

1. Create `tasks.md` with granular to-do list
2. Build database schema
3. Implement ground truth query system + tests
4. Build backend API
5. Build frontend

**Ready to code!**
