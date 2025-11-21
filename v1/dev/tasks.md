# Yorru - Tasks

**Last Updated**: 2025-11-18

---

## ✅ COMPLETED

- [x] Restructure project (v0/ and v1/)
- [x] Create dev docs (plan.md, context.md, tasks.md)

---

## 🚧 IN PROGRESS

None

---

## 📋 TO DO

### Phase 1: Foundation (Days 1-2)

#### Database Schema
- [ ] Create `/v1/database/schema.sql`
  - [ ] `users` table
  - [ ] `groups` table
  - [ ] `group_members` table
  - [ ] `group_preferences` table (persistent prefs)
  - [ ] `events` table
  - [ ] `event_cohosts` table
  - [ ] `ground_truth_facts` table (with vector column)
  - [ ] `ground_truth_changes` table (audit log)
  - [ ] `guest_preferences` table (per-event)
  - [ ] `escalated_questions` table
  - [ ] `suggestions` table
  - [ ] `todos` table
  - [ ] `messages` table (group chat)
  - [ ] Add indexes (especially on `event_id`, `user_id`)
  - [ ] Add pgvector index on `ground_truth_facts.embedding`

#### Ground Truth Query System
- [ ] Create `/v1/backend/services/ground_truth_query.py`
  - [ ] `query_keyword_match()` - Tier 1 (keyword matching)
  - [ ] `query_semantic_search()` - Tier 2 (embedding similarity)
  - [ ] `query_ground_truth()` - Main function (tries Tier 1, falls back to Tier 2)
  - [ ] `should_escalate()` - Decision logic for when to escalate

- [ ] Create `/v1/backend/services/embeddings.py`
  - [ ] `embed_text()` - Call OpenAI embedding API
  - [ ] `batch_embed()` - Batch multiple texts for efficiency
  - [ ] `cosine_similarity()` - Calculate similarity between embeddings
  - [ ] Caching layer (avoid re-embedding same text)

#### Unit Tests
- [ ] Create `/v1/tests/unit/test_ground_truth_query.py`
  - [ ] Test keyword matching (exact matches)
  - [ ] Test keyword matching (partial matches)
  - [ ] Test semantic search (contextual questions)
  - [ ] Test compound questions ("what time and where?")
  - [ ] Test escalation logic (low confidence)
  - [ ] Test edge cases (empty ground truth, malformed input)

- [ ] Create `/v1/tests/unit/test_embeddings.py`
  - [ ] Test embedding generation
  - [ ] Test cosine similarity calculation
  - [ ] Test batch embedding
  - [ ] Test caching

#### Mock Data
- [ ] Create `/v1/database/seed_data.sql`
  - [ ] Mock users (Amane, Mahiru, Jake, Tanya, Nirali, Maya)
  - [ ] Mock group ("Friend Group 6")
  - [ ] Mock group preferences (dietary, budget)
  - [ ] Mock events (at least 3 events)
  - [ ] Mock ground truth facts (address, parking, time, etc.)
  - [ ] Mock guest preferences
  - [ ] Mock escalated questions (2-3 examples)
  - [ ] Mock suggestions (2-3 examples)
  - [ ] Mock chat messages (sample conversation)

---

### Phase 2: Backend API (Days 3-5)

#### Project Setup
- [ ] Create `/v1/backend/main.py` (FastAPI app entry point)
- [ ] Create `/v1/backend/requirements.txt` (all dependencies)
- [ ] Create `/v1/backend/.env.example`
- [ ] Create `/v1/backend/config.py` (load env vars, DB config)
- [ ] Set up Alembic for migrations
  - [ ] `alembic init migrations`
  - [ ] Configure `alembic.ini`
  - [ ] Create initial migration from schema.sql

#### Database Models (SQLAlchemy)
- [ ] Create `/v1/backend/models/user.py`
- [ ] Create `/v1/backend/models/group.py`
- [ ] Create `/v1/backend/models/event.py`
- [ ] Create `/v1/backend/models/ground_truth.py`
- [ ] Create `/v1/backend/models/message.py`
- [ ] Create `/v1/backend/models/preference.py`
- [ ] Create `/v1/backend/models/escalation.py`
- [ ] Create `/v1/backend/models/suggestion.py`
- [ ] Create `/v1/backend/models/todo.py`
- [ ] Create `/v1/backend/utils/db.py` (DB connection, session management)

#### Authentication
- [ ] Create `/v1/backend/auth/email_auth.py`
  - [ ] `hash_password()` (bcrypt)
  - [ ] `verify_password()`
  - [ ] `register_user()` endpoint logic
  - [ ] `login_user()` endpoint logic

- [ ] Create `/v1/backend/auth/google_oauth.py`
  - [ ] OAuth flow setup (authlib)
  - [ ] `/auth/google` redirect endpoint
  - [ ] `/auth/google/callback` endpoint
  - [ ] Create user if doesn't exist

- [ ] Create `/v1/backend/auth/jwt.py`
  - [ ] `create_access_token()` (JWT)
  - [ ] `verify_token()` (JWT)
  - [ ] `get_current_user()` dependency (FastAPI)

#### API Endpoints - Events
- [ ] Create `/v1/backend/api/events.py`
  - [ ] `POST /api/events` - Create event
    - [ ] Validate input (Pydantic model)
    - [ ] If group_id provided, prefill preferences
    - [ ] Generate to-do list based on event_type
    - [ ] Return event object
  - [ ] `GET /api/events/{event_id}` - Get event details
  - [ ] `PATCH /api/events/{event_id}` - Update event
  - [ ] `DELETE /api/events/{event_id}` - Delete event (main host only)
  - [ ] `GET /api/events` - List user's events

#### API Endpoints - Groups
- [ ] Create `/v1/backend/api/groups.py`
  - [ ] `POST /api/groups` - Create group
  - [ ] `GET /api/groups/{group_id}` - Get group details
  - [ ] `POST /api/groups/{group_id}/members` - Add member
  - [ ] `DELETE /api/groups/{group_id}/members/{user_id}` - Remove member
  - [ ] `POST /api/groups/{group_id}/preferences` - Set member preferences
  - [ ] `GET /api/groups` - List user's groups

#### API Endpoints - Ground Truth
- [ ] Create `/v1/backend/api/ground_truth.py`
  - [ ] `POST /api/events/{event_id}/ground-truth` - Add/edit fact
    - [ ] Generate embedding
    - [ ] Store in DB
    - [ ] Log change in audit table
  - [ ] `GET /api/events/{event_id}/ground-truth` - List all facts
  - [ ] `DELETE /api/events/{event_id}/ground-truth/{fact_id}` - Delete fact
  - [ ] `GET /api/events/{event_id}/ground-truth/changes` - Get change log

#### API Endpoints - Preferences
- [ ] Create `/v1/backend/api/preferences.py`
  - [ ] `GET /api/events/{event_id}/preferences` - Get all guest preferences
  - [ ] `GET /api/events/{event_id}/preferences/summary` - Get summarized view for host

#### API Endpoints - Escalations
- [ ] Create `/v1/backend/api/escalations.py`
  - [ ] `POST /api/events/{event_id}/escalations` - Create escalation
  - [ ] `GET /api/events/{event_id}/escalations` - List escalations (host only)
  - [ ] `PATCH /api/events/{event_id}/escalations/{escalation_id}` - Resolve (add answer)

#### WebSocket Chat
- [ ] Create `/v1/backend/api/chat.py`
  - [ ] `WebSocket /ws/events/{event_id}/assistant` - Guest AI assistant chat
    - [ ] Receive guest question
    - [ ] Query ground truth
    - [ ] Return answer OR escalation prompt
  - [ ] `WebSocket /ws/events/{event_id}/group` - Group chat
    - [ ] Broadcast messages to all connected clients
    - [ ] Store messages in DB
    - [ ] Extract preferences asynchronously
  - [ ] Connection management (track connected users)

#### Security & Utilities
- [ ] Create `/v1/backend/utils/security.py`
  - [ ] Input sanitization (strip HTML, prevent XSS)
  - [ ] SQL injection protection (use SQLAlchemy params - should be automatic)
  - [ ] Rate limiting setup (slowapi)
    - [ ] 10 questions/min per user (AI assistant)
    - [ ] 100 API requests/min per IP

---

### Phase 3: AI Logic (Days 5-7)

#### AI Assistant
- [ ] Create `/v1/backend/services/ai_assistant.py`
  - [ ] `handle_guest_question()` - Main logic
    - [ ] Query ground truth
    - [ ] If found, format response
    - [ ] If not found, check if relevant (should escalate?)
    - [ ] Return response object
  - [ ] `format_bot_response()` - Format answer nicely
  - [ ] `is_question_relevant()` - Determine if off-topic

#### Preference Extraction
- [ ] Create `/v1/backend/services/preference_extractor.py`
  - [ ] `extract_preferences()` - Call GPT to extract from message
    - [ ] Dietary restrictions
    - [ ] Budget preferences
    - [ ] Venue preferences
    - [ ] Return structured data + confidence score
  - [ ] `batch_extract()` - Process multiple messages at once
  - [ ] `store_preference()` - Save to DB if confidence >0.7

#### Suggestion Generation
- [ ] Create `/v1/backend/services/suggestion_generator.py`
  - [ ] `detect_suggestion()` - Find "we should..." patterns
  - [ ] `aggregate_suggestions()` - Group similar suggestions
  - [ ] `create_suggestion()` - Store in DB with evidence

#### Command Parser
- [ ] Create `/v1/backend/services/command_parser.py`
  - [ ] `parse_command()` - Detect `/address`, `/parking`, etc.
  - [ ] `execute_command()` - Route to appropriate handler
  - [ ] Commands:
    - [ ] `/address` - Quick address lookup
    - [ ] `/parking` - Parking info
    - [ ] `/time` - Event time
    - [ ] `/budget` - Budget per person
    - [ ] `/poll "question"` - Create poll (group chat only)
    - [ ] `/vote <number>` - Vote in poll (group chat only)

---

### Phase 4: Frontend (Days 8-10)

#### Project Setup
- [ ] Initialize Next.js app
  - [ ] `npx create-next-app@latest v1/frontend`
  - [ ] Configure TypeScript
  - [ ] Configure Tailwind CSS
  - [ ] Set up app directory structure

- [ ] Set up API client
  - [ ] Create `/v1/frontend/lib/api.ts` (axios wrapper)
  - [ ] Create `/v1/frontend/lib/websocket.ts` (WebSocket helper)
  - [ ] Configure React Query

- [ ] Set up NextAuth.js
  - [ ] Configure Google OAuth provider
  - [ ] Configure credentials provider (email/password)
  - [ ] Create auth pages

#### Authentication UI
- [ ] Create `/v1/frontend/app/login/page.tsx`
  - [ ] Email/password form
  - [ ] "Sign in with Google" button
  - [ ] Link to register page

- [ ] Create `/v1/frontend/app/register/page.tsx`
  - [ ] Email/password registration form
  - [ ] Validation (email format, password strength)
  - [ ] Link to login page

#### Dashboard
- [ ] Create `/v1/frontend/app/dashboard/page.tsx`
  - [ ] List user's events (cards or table)
  - [ ] "Create Event" button
  - [ ] "Create Group" button (optional)
  - [ ] Quick stats (upcoming events, pending escalations)

#### Group Management
- [ ] Create `/v1/frontend/app/groups/create/page.tsx`
  - [ ] Group name input
  - [ ] Add members (search by email)
  - [ ] Submit → redirect to group detail

- [ ] Create `/v1/frontend/app/groups/[id]/page.tsx`
  - [ ] Show group members
  - [ ] Preferences form (each member fills their own)
  - [ ] List events in this group
  - [ ] "Create Event in Group" button

#### Event Creation
- [ ] Create `/v1/frontend/app/events/create/page.tsx`
  - [ ] Part 1: Event Basics
    - [ ] Name
    - [ ] Date & time
    - [ ] Address/venue
    - [ ] Budget per person
    - [ ] Event type (dropdown: tight_knit, big_party, frat_party)
    - [ ] Group selection (optional)
  - [ ] Part 2: Host Preferences
    - [ ] Reminders (yes/no)
    - [ ] Email notifications (yes/no)
    - [ ] Auto-generate to-dos (yes/no)
    - [ ] Track guest preferences (yes/no)
  - [ ] Submit → create event → redirect to event detail

#### Guest AI Assistant
- [ ] Create `/v1/frontend/app/events/[id]/assistant/page.tsx`
  - [ ] Chat UI (messages list + input)
  - [ ] WebSocket connection
  - [ ] Send message → display in chat
  - [ ] Receive bot response → display with bot avatar
  - [ ] Show "Escalate to Host" button when appropriate
  - [ ] Command suggestions (`/address`, `/parking`, etc.)

- [ ] Create `/v1/frontend/components/Chat.tsx`
  - [ ] Reusable chat component
  - [ ] Message bubbles (user vs bot)
  - [ ] Typing indicator
  - [ ] Auto-scroll to bottom

#### Group Chat
- [ ] Create `/v1/frontend/app/events/[id]/chat/page.tsx`
  - [ ] Reuse `Chat.tsx` component
  - [ ] WebSocket connection
  - [ ] Show all participants
  - [ ] Bot rarely responds (mostly silent observer)
  - [ ] Command input (`/poll`, `/vote`)

#### Host Interface
- [ ] Create `/v1/frontend/app/events/[id]/host/page.tsx`
  - [ ] Multi-tab layout:
    - [ ] Overview tab
    - [ ] Ground Truth tab
    - [ ] Preferences tab
    - [ ] Escalations tab
    - [ ] To-Dos tab
    - [ ] Change Log tab

- [ ] Create `/v1/frontend/components/GroundTruthEditor.tsx`
  - [ ] Table of existing facts
  - [ ] Add new fact form
  - [ ] Edit inline
  - [ ] Delete with confirmation
  - [ ] Shows importance level
  - [ ] Optimistic updates (React Query)

- [ ] Create `/v1/frontend/components/PreferencesSummary.tsx`
  - [ ] Grouped by category (dietary, budget, venue)
  - [ ] Show confidence scores
  - [ ] Link to original chat message
  - [ ] Allow host to correct/override

- [ ] Create `/v1/frontend/components/EscalationsList.tsx`
  - [ ] List of questions
  - [ ] Mark as resolved
  - [ ] Add answer (sends to guest)
  - [ ] Filter (resolved vs unresolved)

- [ ] Create `/v1/frontend/components/TodoList.tsx`
  - [ ] Checkboxes for each item
  - [ ] Add custom item
  - [ ] Assign to co-host
  - [ ] Delete item

- [ ] Create `/v1/frontend/components/ChangeLog.tsx`
  - [ ] Timeline view
  - [ ] Show who changed what, when
  - [ ] Diff view (old value vs new value)
  - [ ] Revert button (for main host)

#### Shared Components
- [ ] Create `/v1/frontend/components/Button.tsx`
- [ ] Create `/v1/frontend/components/Input.tsx`
- [ ] Create `/v1/frontend/components/Select.tsx`
- [ ] Create `/v1/frontend/components/Modal.tsx`
- [ ] Create `/v1/frontend/components/Spinner.tsx`
- [ ] Create `/v1/frontend/components/Toast.tsx` (notifications)

---

### Phase 5: Testing & Polish (Days 11-12)

#### Integration Tests
- [ ] Create `/v1/tests/integration/test_api_events.py`
  - [ ] Test create event
  - [ ] Test create event with group (prefilling)
  - [ ] Test create one-off event
  - [ ] Test update event
  - [ ] Test delete event

- [ ] Create `/v1/tests/integration/test_api_groups.py`
  - [ ] Test create group
  - [ ] Test add members
  - [ ] Test set preferences

- [ ] Create `/v1/tests/integration/test_api_ground_truth.py`
  - [ ] Test add fact
  - [ ] Test query fact (keyword)
  - [ ] Test query fact (semantic)
  - [ ] Test delete fact
  - [ ] Test change log

- [ ] Create `/v1/tests/integration/test_auth.py`
  - [ ] Test register
  - [ ] Test login
  - [ ] Test Google OAuth flow (mock)

#### E2E Tests
- [ ] Create `/v1/tests/e2e/test_full_flow.py`
  - [ ] Register user
  - [ ] Create group
  - [ ] Add members + preferences
  - [ ] Create event in group
  - [ ] Verify preferences prefilled
  - [ ] Add ground truth fact
  - [ ] Guest asks question → receives answer
  - [ ] Guest asks unknown question → escalates
  - [ ] Host sees escalation → answers
  - [ ] Guest receives answer

#### Bug Fixes
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test responsive design (mobile, tablet)
- [ ] Fix any layout issues
- [ ] Fix any WebSocket connection issues
- [ ] Fix any authentication issues

#### UI Polish
- [ ] Loading states for all async operations
- [ ] Error handling (toast notifications)
- [ ] Empty states ("No events yet - create one!")
- [ ] Confirm dialogs for destructive actions (delete event, etc.)
- [ ] Keyboard shortcuts (Ctrl+Enter to send message, etc.)
- [ ] Accessibility (ARIA labels, keyboard navigation)

#### Documentation
- [ ] Create `/v1/README.md` (how to run the app)
- [ ] Create `/v1/backend/README.md` (backend setup)
- [ ] Create `/v1/frontend/README.md` (frontend setup)
- [ ] Create `/v1/docs/API.md` (API documentation)
- [ ] Add docstrings to all Python functions
- [ ] Add JSDoc comments to TypeScript functions

#### Deployment Prep (Optional)
- [ ] Dockerfiles (backend + frontend)
- [ ] docker-compose.yml
- [ ] Environment variable docs
- [ ] Database migration docs

---

## 📊 Progress Tracking

**Total Tasks**: ~150
**Completed**: 2
**In Progress**: 0
**Remaining**: ~148

**Estimated Time**: 10-12 days of focused work

---

## 🔥 Critical Path (Must Complete)

These tasks MUST be done for a working demo:

1. ✅ Dev docs
2. Database schema
3. Ground truth query system + tests
4. Basic backend API (events, ground truth, auth)
5. WebSocket chat (guest assistant)
6. Frontend (login, create event, AI assistant, host interface)

**Nice-to-haves** (can skip if running out of time):
- Groups functionality
- Preference extraction from group chat
- Polls/voting in group chat
- Change log UI
- E2E tests
- Deployment setup

---

## 🎯 Next Action

Start with database schema (`/v1/database/schema.sql`).

Once schema is done, build ground truth query system + tests.

Then proceed with backend API.
