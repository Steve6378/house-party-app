# TODO LIST: Event Planning App RAG System

## PROJECT CONTEXT
Building an AI-assisted event planning app for a final project. Timeline: ~1.5 weeks of actual work. Primary focus this week: **RAG system for venue/restaurant recommendations**.

**Core feature:** Group chat where AI moderates event planning, suggests venues/restaurants based on conversation context using semantic search over Yelp dataset (LA area).

**Must look sellable:** Professional UI, working auth, clickable elements. Performance/security can be basic for now.

---

## TECHNICAL STACK DECISIONS NEEDED
1. **Backend Framework:** FastAPI or Express.js? (Leaning toward what's simpler for RAG integration)
2. **Frontend:** Next.js (preferred) or React + separate backend
3. **Database:** PostgreSQL with pgvector extension (confirmed)
4. **Embeddings:** OpenAI text-embedding-3-small
5. **LLM:** OpenAI GPT for chat moderation
6. **RAG Framework:** LangChain or LlamaIndex (choose based on simplicity)

---

## PHASE 1: RAG FOUNDATION (THIS WEEK - PRIORITY)

### 1. Environment Setup
- [ ] Set up Python virtual environment
- [ ] Install required packages: `psycopg2`, `pgvector`, `openai`, `pandas`, `langchain` or `llamaindex`, `python-dotenv`
- [ ] Set up PostgreSQL locally with pgvector extension
- [ ] Create `.env` file for API keys (OpenAI, database credentials)

### 2. Yelp Data Ingestion
**Input:** Yelp Academic Dataset JSON files (user will provide after download)

**Tasks:**
- [ ] Load Yelp JSON data (likely `business.json`) into pandas DataFrame
- [ ] Filter for LA area businesses (check `city` field or lat/long bounding box)
- [ ] Filter for relevant categories: restaurants, cafes, parks, entertainment venues, bars
- [ ] Data cleaning: handle missing fields, remove closed businesses
- [ ] Create schema for venues table in PostgreSQL:
  ```sql
  CREATE TABLE venues (
    id VARCHAR PRIMARY KEY,
    name TEXT,
    categories TEXT[],
    address TEXT,
    city TEXT,
    latitude FLOAT,
    longitude FLOAT,
    rating FLOAT,
    review_count INT,
    price_range VARCHAR,
    hours JSONB,
    attributes JSONB,
    review_snippets TEXT,  -- sample reviews for context
    embedding vector(1536)  -- OpenAI embedding dimension
  );
  ```
- [ ] Write data insertion script

### 3. Embedding Generation
- [ ] For each venue, create text to embed:
  - Concatenate: name + categories + address + price_range + review_snippets
  - Keep it informative but concise (~200-500 tokens per venue)
- [ ] Batch process venues through OpenAI embeddings API (use batches of 100 to stay efficient)
- [ ] Store embeddings in `embedding` column as pgvector type
- [ ] Create vector similarity index: `CREATE INDEX ON venues USING ivfflat (embedding vector_cosine_ops);`

### 4. RAG Query Pipeline
**Core function needed:** `search_venues(query: str, filters: dict, top_k: int) -> List[dict]`

**Implementation steps:**
- [ ] Embed user query using same OpenAI model
- [ ] Perform vector similarity search in PostgreSQL:
  ```sql
  SELECT *, (embedding <=> query_embedding) as distance 
  FROM venues 
  WHERE [optional filters]
  ORDER BY distance 
  LIMIT top_k;
  ```
- [ ] Apply hard filters (budget, location distance, hours, group size capacity)
- [ ] Implement diversity ranking (don't return 5 identical cuisine types)
- [ ] Return formatted results with: name, address, rating, price, why_recommended

### 5. Testing & Validation
- [ ] Test queries:
  - "casual outdoor spot in Echo Park for 8 people"
  - "cheap eats near USC under $15 per person"
  - "nice date restaurant downtown LA"
  - "vegan-friendly brunch spot in Silver Lake"
- [ ] Verify results make sense semantically
- [ ] Check diversity in results
- [ ] Benchmark query speed (should be <500ms)

---

## PHASE 2: BACKEND API (NEXT PRIORITY)

### 6. API Endpoints Setup
Choose framework then implement:

**Core endpoints needed:**
- [ ] `POST /api/search/venues` - takes query params, returns venues
- [ ] `POST /api/auth/register` - SHA256 password hash + store
- [ ] `POST /api/auth/login` - verify hash, return JWT token
- [ ] `GET /api/events/{event_id}` - fetch event state
- [ ] `POST /api/events` - create new event
- [ ] `PATCH /api/events/{event_id}` - update event details
- [ ] `POST /api/messages` - send chat message
- [ ] `GET /api/messages/{event_id}` - fetch chat history

### 7. Event State Management
Database schema:
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  created_by UUID REFERENCES users(id),
  event_name TEXT,
  date_proposed DATE,
  date_confirmed BOOLEAN,
  time_proposed TIME,
  time_confirmed BOOLEAN,
  location TEXT,
  budget_per_person DECIMAL,
  food_plan TEXT,  -- "potluck", "restaurant", "catering"
  state JSONB,  -- flexible for other state
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES users(id),
  content TEXT,
  timestamp TIMESTAMP,
  ai_processed BOOLEAN DEFAULT FALSE
);
```

---

## PHASE 3: AI CHAT MODERATION (PARALLEL WITH PHASE 2)

### 8. Message Processing Pipeline
**Function:** `process_message(message: str, event_id: str, user_id: str) -> Optional[str]`

**Steps:**
- [ ] Lightweight filter: check if message likely needs AI response
  - Contains: question mark + event keywords
  - Broadcast language: "anyone", "everyone", "thoughts"
  - Not reply to another specific person
- [ ] If passes filter, call OpenAI:
  - Context: recent 10-15 messages + event state + user preferences
  - Prompt: "Should I respond? If yes, what should I say?"
  - Bias toward silence: "When uncertain, don't respond"
- [ ] If AI decides to respond:
  - Update event state if consensus detected
  - Return response message
  - Mark message as processed

### 9. Integration with Search
When AI suggests venues:
- [ ] Extract requirements from conversation (location, budget, vibe, group size)
- [ ] Call `search_venues()` with semantic query
- [ ] Format top 3-5 results into chat message
- [ ] Include brief explanations for each suggestion

---

## PHASE 4: FRONTEND (FINAL DAYS)

### 10. Basic UI Components
- [ ] Login/register page
- [ ] Event creation form
- [ ] Chat interface:
  - Message display with timestamps
  - Input field
  - Show AI responses differently (maybe colored background)
- [ ] Event summary sidebar (shows current state: date, time, location, etc.)
- [ ] Venue recommendation cards (when AI suggests places)

### 11. Styling
- [ ] Use Tailwind CSS or Material-UI for quick professional look
- [ ] Make it responsive (at least desktop + tablet)
- [ ] Add loading states for AI responses

---

## SUCCESS CRITERIA
- [ ] User can create account and log in
- [ ] User can create event and chat in group
- [ ] AI successfully detects when to respond (not too chatty, not too silent)
- [ ] Semantic venue search returns relevant results
- [ ] Results include variety (not all same type)
- [ ] UI looks clean and professional
- [ ] Demo-able: can show end-to-end event planning flow

---

## DEVELOPMENT NOTES
- **PEP-8 compliance required** for all Python code
- **Document everything:** function docstrings, inline comments for complex logic
- **Create DEVELOPMENT_LOG.md** as you complete major milestones
- **Create COMMUNICATIONS_LOG.md** for any decisions/changes that affect architecture
- **Use meaningful variable names** - no single letters except loop iterators
- **If math is involved, verify it thoroughly** - errors usually come from math, not code

---

## QUESTIONS TO RESOLVE
1. What does the Yelp dataset actually contain? (Check after download)
2. Do we need potluck/recipe RAG or just venues for now? (Probably defer)
3. Spotify/photo integration? (Definitely defer to post-MVP)
4. Deployment plan? (Local demo fine for now, can deploy later if time)
