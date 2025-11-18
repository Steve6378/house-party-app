# House Party App - Implementation Plan

**Last Updated**: 2025-11-18
**Status**: Planning Complete, Ready for Implementation
**Timeline**: ~1.5 weeks

---

## Executive Summary

Building a web app for event planning with AI assistance. The app supports both **one-off parties** and **recurring group events**, with three distinct interaction modes:

1. **Guest AI Assistant** - 1-on-1 chat where guests ask questions
2. **Group Chat** - Real-time group conversation (AI observes and extracts preferences)
3. **Host Interface** - Dashboard for hosts to manage event, view preferences, respond to escalations

**Key Innovation**: Ground truth system that combines keyword matching + semantic search to answer guest questions accurately.

---

## Architecture Decision: Mode 1 (Host/Comers) vs Mode 2 (Small Group)

### Mode 1: Host/Comers ✅ **SELECTED**
- **Use Case**: House parties, big events, one-time gatherings
- **Characteristics**:
  - Main host + optional co-hosts
  - Many guests (comers)
  - Host sets ground truth
  - Simple FAQ-style Q&A
- **Why**: Monetizable, scalable, matches majority use case

### Mode 2: Small Group (Deferred)
- **Use Case**: Recurring friend group events
- **Characteristics**:
  - No single host, consensus-based
  - Same people across multiple events
  - Complex preference tracking
- **Why Deferred**: More complex, smaller market, can add later

### Mode 1.5: Groups with Events (Selected Extension)
- **Hybrid Approach**: Groups are **optional**
- **Path A**: Create group → events within group (prefills preferences)
- **Path B**: Create one-off event (no group, no memory)

---

## Three Interaction Modes

### 1. Guest AI Assistant (1-on-1 Chat)

**Purpose**: Answer guest questions without bothering the host

**Flow**:
```
Guest: "What's the address?"
  ↓
Bot: [Queries ground truth]
  ↓
  - If found → Answer: "123 Main St, LA"
  - If not found → "I don't know. [Escalate to Host] button"
  ↓
Guest clicks escalate → Question appears in Host Interface
```

**Commands** (like Slack slash commands):
- `/address` - Quick address lookup
- `/parking` - Parking info
- `/time` - Event time
- `/budget` - Budget per person

**Technical**:
- WebSocket connection for real-time responses
- Query system tries keyword match first, then semantic search
- Escalation creates entry in `escalated_questions` table

### 2. Group Chat (Real-time, AI Observes)

**Purpose**: Let people chat naturally, AI extracts useful info

**What AI Does**:
- **Observes messages** for preferences (dietary, budget, venue)
- **Extracts structured data**:
  - "I'm vegetarian btw" → `{dietary_restrictions: ["vegetarian"]}`
  - "Can we keep it under $50?" → `{budget_preference: 50}`
- **Rarely responds** (only for commands or polls)
- **Sends suggestions to Host Interface**:
  - "3 people mentioned photo booth" → Suggestion to add to ground truth

**Bot Commands** (group chat only):
- `/poll "Pizza or Thai?"` - Create a poll
- `/vote 1` - Vote in a poll

**Technical**:
- WebSocket for real-time chat
- OpenAI API to extract preferences from messages
- Batched processing (don't call API for every message)

### 3. Host Interface (Dashboard)

**Purpose**: Centralized control for hosts

**Features**:
- **Ground Truth Editor**: Add/edit FAQs (address, parking, etc.)
- **Guest Preferences Summary**: Dietary restrictions, budget concerns
- **Escalated Questions**: Questions bot couldn't answer
- **Suggestions**: AI-generated ideas ("3 guests suggested photo booth")
- **To-Do List**: Prefilled based on event type (tight_knit, big_party, frat_party)
- **Change Log**: Transparency - see who changed what (important for multi-host)

**Technical**:
- Next.js dashboard
- React Query for data fetching
- Optimistic updates for ground truth edits

---

## Ground Truth System (Core Innovation)

**Problem**: How do we answer questions like "What's the address?" AND "Where should I park if I'm coming from downtown?"

**Solution**: Two-tier query system

### Tier 1: Keyword Matching (Fast, Exact)

```python
ground_truth = {
  "address": {
    "value": "123 Main St, Los Angeles, CA",
    "keywords": ["address", "location", "where"],
    "importance": "critical"
  },
  "parking": {
    "value": "Street parking on Oak St, or paid lot 2 blocks away",
    "keywords": ["parking", "where to park", "car"],
    "importance": "medium"
  }
}

# Query: "what's the address?"
# Match: "address" in keywords → Return value
```

### Tier 2: Semantic Search (Flexible, Contextual)

```python
# Store facts as natural language sentences
facts = [
  "The party is at 123 Main St in Los Angeles.",
  "There is street parking on Oak St or a paid lot 2 blocks away.",
  "The event starts at 7 PM on Saturday, November 23rd."
]

# Embed all facts using OpenAI
fact_embeddings = [embed(fact) for fact in facts]

# Query: "where can I leave my car?"
query_embedding = embed("where can I leave my car?")

# Find most similar fact
best_match = cosine_similarity(query_embedding, fact_embeddings)
# Returns: "There is street parking on Oak St..."
```

**Benefits**:
- Simple questions → instant keyword match
- Complex/compound questions → semantic search understands intent
- No need for perfect keyword coverage

---

## Group vs One-Off Events

### Creating a Group (Optional)

**Use Case**: Recurring hangouts with same people

**Flow**:
1. Host creates group: "USC Roommates"
2. Adds members: Jake, Maya, Nirali
3. Members fill in **persistent preferences**:
   - Jake: vegetarian, $50 budget max
   - Maya: no dietary restrictions, $30 budget max
   - Nirali: vegan, $40 budget max

**What Persists**:
- Dietary restrictions
- Budget preferences
- Venue preferences (indoor/outdoor, location area)
- Member list

### Creating an Event

**Path A: Event within Group**
```
Host creates "Thanksgiving Dinner" in "USC Roommates" group
  ↓
System prefills:
  - Guest list: Jake, Maya, Nirali
  - Dietary notes: Jake (vegetarian), Nirali (vegan)
  - Budget guidance: Keep under $40 (lowest common denominator)
  ↓
Host changes what's different:
  - Date: November 23rd
  - Time: 7 PM
  - Address: Host's apartment (or new venue)
```

**Path B: One-Off Event**
```
Host creates "Sanjana's Big Frat Party" (no group)
  ↓
System provides:
  - Empty guest list
  - No prefilled preferences
  - To-do list based on event type (frat_party)
  ↓
Host fills everything from scratch
```

**What Changes Per Event**:
- Date and time (always different)
- Address (might change)
- Event-specific details (theme, dress code)

---

## Event Types and Prefilled To-Dos

Different event types get different to-do templates:

### Tight-Knit (Small, Intimate)
```
□ Set date and time
□ Send invites (no +1s)
□ Plan menu (check dietary restrictions)
□ Prepare playlist
□ Buy groceries
□ Clean apartment
```

### Big Party (Large, Casual)
```
□ Set date and time
□ Book venue or confirm apartment
□ Coordinate with vendors (catering, DJ)
□ Get school/frat approval if needed
□ Plan parking logistics
□ Set up photo album collection
□ Send invites
□ Create event group chat
```

### Frat Party (USC-specific)
```
□ Get frat house approval
□ Coordinate with school if needed
□ Book DJ or sound system
□ Plan drink/food logistics
□ Assign door duty / guest list
□ Set up Venmo for entry fee if applicable
□ Notify neighbors
□ Plan cleanup crew
```

Host can edit, add, or remove items.

---

## Multi-Host Permissions

**Main Host**:
- Created the event
- Can delete event
- Can remove co-hosts

**Co-Hosts**:
- **Same permissions as main host** for editing:
  - Edit ground truth
  - Respond to escalated questions
  - Mark to-dos complete
  - View guest preferences
- **Cannot**:
  - Delete event
  - Remove main host

**Veto Power**: No explicit veto, but **change log provides transparency**

**Example**:
```
Change Log:
- 3:00 PM: Jake (co-host) changed address from "456 Oak St" to "123 Main St"
- 3:05 PM: Maya (main host) changed address from "123 Main St" to "789 Pine St"
```

If co-host makes a mistake, main host can see it and revert.

---

## Guest Preference Extraction

**How AI Extracts Preferences from Group Chat**:

```python
# Message: "I'm vegetarian btw"
extract_preference(message) → {
  "user_id": "jake_id",
  "dietary_restrictions": ["vegetarian"],
  "confidence": 0.95
}

# Message: "Can we keep it under $50?"
extract_preference(message) → {
  "user_id": "maya_id",
  "budget_preference": 50,
  "confidence": 0.85
}

# Message: "I'd prefer somewhere with outdoor seating"
extract_preference(message) → {
  "user_id": "nirali_id",
  "venue_preferences": {"outdoor": true},
  "confidence": 0.75
}
```

**What Appears in Host Interface**:
```
Guest Preferences Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dietary Restrictions:
  - Jake: Vegetarian
  - Nirali: Vegan
  - Maya: None specified

Budget Concerns:
  - Maya: Requested under $50
  - [2 other guests] no preference stated

Venue Preferences:
  - Nirali: Prefers outdoor seating
```

---

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15 + pgvector extension
- **Auth**:
  - Google OAuth (`authlib`)
  - Email/password (bcrypt + JWT)
- **Real-Time**: WebSocket (FastAPI built-in)
- **Embeddings**: OpenAI `text-embedding-3-small`
- **LLM**: OpenAI GPT-4o-mini (for preference extraction)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Real-Time**: Native WebSocket API
- **State**: React Query (TanStack Query v5)
- **Auth**: NextAuth.js

### Database Schema (Summary)
```
users
groups
group_members
group_preferences (persistent across events)
events
event_cohosts
ground_truth_facts (with embeddings)
ground_truth_changes (audit log)
guest_preferences (per-event)
escalated_questions
suggestions
todos
messages (group chat)
```

Full schema in `/v1/database/schema.sql`

---

## Implementation Phases

### Phase 1: Foundation (Days 1-2)
- Database schema + migrations
- Ground truth query system (keyword + semantic)
- Unit tests for ground truth

### Phase 2: Backend API (Days 3-5)
- Auth (Google OAuth + email/password)
- Event CRUD endpoints
- Ground truth endpoints
- WebSocket setup for chat

### Phase 3: AI Assistant (Days 5-7)
- Guest DM handler
- Escalation logic
- Group chat observer
- Preference extraction

### Phase 4: Frontend (Days 8-10)
- Auth UI (login/register)
- Create event form
- Guest AI Assistant chat UI
- Group chat UI
- Host Interface dashboard

### Phase 5: Polish & Testing (Days 11-12)
- Integration tests
- E2E testing
- Bug fixes
- UI polish

---

## Success Criteria

✅ **Core Functionality**:
- User can create account (Google or email)
- User can create event (one-off or within group)
- Host can set ground truth (address, parking, etc.)
- Guest can ask AI questions and get correct answers
- AI can escalate when it doesn't know
- Host sees escalated questions in dashboard
- Group chat extracts preferences automatically
- Co-hosts can edit ground truth

✅ **Quality**:
- Ground truth query accuracy >90% on test questions
- WebSocket latency <200ms for chat messages
- UI is responsive and professional-looking
- No critical security vulnerabilities (SQL injection, XSS)

✅ **Demo-able**:
- Can show complete flow: create event → chat with bot → host responds
- Can demonstrate group prefilling

---

## Non-Goals (Out of Scope for v1)

❌ Venue recommendations (Yelp integration) - defer to v2
❌ Recipe/potluck RAG - defer to v2
❌ Spotify playlist integration - defer to v2
❌ Photo album auto-collection - defer to v2
❌ Payment processing (Venmo integration) - defer to v2
❌ Mobile app - web only for v1
❌ Mode 2 (small group consensus) - defer to v2

---

## Risk Mitigation

**Risk**: Ground truth queries are inaccurate
**Mitigation**: Build comprehensive test suite, use both keyword + semantic

**Risk**: AI extracts wrong preferences
**Mitigation**: Show confidence scores, allow host to correct

**Risk**: WebSocket doesn't scale
**Mitigation**: Start simple, can add Redis pub/sub later if needed

**Risk**: Running out of time
**Mitigation**: Prioritize core flow, cut polish features if needed

---

## Next Steps

1. Review and approve this plan
2. Create database schema (`/v1/database/schema.sql`)
3. Build ground truth query system first (most critical)
4. Follow implementation phases sequentially

**Blockers**: None, ready to start building.
