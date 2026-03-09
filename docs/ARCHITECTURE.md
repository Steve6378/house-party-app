# Yorru Architecture

> Event planning app with AI-powered assistance, real-time chat, and face recognition.
> This document is for onboarding new projects that extend this architecture.

---

## 1. Directory Layout

```
.
├── backend/
│   ├── config.py                 # Pydantic Settings (env-based config)
│   ├── main.py                   # FastAPI app, middleware, router mounts
│   ├── init_db.py                # Database table creation
│   ├── models/
│   │   ├── base.py               # SQLAlchemy Base + TimestampMixin
│   │   ├── user.py               # User, GroupMembership
│   │   ├── event.py              # Event
│   │   ├── group.py              # Group
│   │   ├── message.py            # Message (event + group chat)
│   │   ├── attendance.py         # EventAttendance, EventCoHost, InviteLink
│   │   ├── event_document.py     # EventDocument (PDFs for RAG)
│   │   ├── event_photo.py        # EventPhoto (with face encodings)
│   │   ├── event_faq.py          # EventFAQ (auto-tracked Q&A)
│   │   ├── ground_truth.py       # GroundTruthFact, ChangeLog
│   │   ├── escalated_question.py # EscalatedQuestion
│   │   ├── poll.py               # Poll, PollVote
│   │   ├── todo.py               # Todo
│   │   ├── suggestion.py         # Suggestion
│   │   ├── preferences.py        # GuestPreferences, GroupPreferences
│   │   ├── questionnaire.py      # EventQuestionnaire
│   │   └── audit_log.py          # AuditLog
│   ├── routes/
│   │   ├── auth.py               # Auth (login, register, profile, photos)
│   │   ├── events.py             # Event CRUD + cover images
│   │   ├── ai.py                 # AI endpoints (RAG, host-assist, face search)
│   │   ├── chat.py               # WebSocket real-time chat
│   │   ├── photos.py             # Photo upload/download
│   │   ├── documents.py          # Document upload for RAG
│   │   ├── attendance.py         # RSVP, invites, cohosts
│   │   ├── groups.py             # Group CRUD + messaging
│   │   ├── messages.py           # REST message endpoints
│   │   ├── ground_truth.py       # Host-verified facts
│   │   └── questionnaire.py      # Event questionnaires
│   ├── schemas/                  # Pydantic request/response models
│   ├── services/
│   │   ├── auth.py               # JWT creation, password hashing
│   │   ├── event_rag.py          # RAG pipeline (LangChain)
│   │   ├── embeddings.py         # OpenAI embeddings wrapper
│   │   ├── pdf_extractor.py      # PDF/image text extraction
│   │   ├── face_recognition.py   # OpenCV face detection + matching
│   │   ├── google_maps.py        # Places API integration
│   │   ├── r2_storage.py         # Cloudflare R2 / local storage
│   │   ├── websocket_manager.py  # WebSocket connection manager
│   │   ├── permissions.py        # Role-based access control
│   │   ├── sanitize.py           # Input sanitization (bleach)
│   │   └── ground_truth_query.py # Ground truth retrieval
│   └── utils/
│       └── database.py           # SQLAlchemy engine + session
├── frontend/
│   ├── src/
│   │   ├── index.tsx             # Entry point
│   │   ├── App.full.tsx          # Active app (routes, splash, native init)
│   │   ├── pages/                # Page components (32 files, JSX/TSX mix)
│   │   ├── components/           # Shared components (8 files)
│   │   ├── stores/authStore.ts   # Zustand auth state
│   │   ├── utils/api.ts          # Axios client with CSRF + cookie auth
│   │   ├── config/api.ts         # API URL + env vars
│   │   ├── context/              # Legacy React Context (Auth, Events)
│   │   └── utils/                # Helpers (native, googleMaps, favorites)
│   ├── android/                  # Capacitor Android project
│   ├── capacitor.config.ts       # Mobile app config
│   ├── tailwind.config.js        # Custom theme (primary, secondary, accent, dark)
│   └── vite.config.ts            # Vite build config
├── database/
│   ├── schema.sql                # Full schema (PostgreSQL 15+)
│   ├── migrations/               # 13 incremental SQL migrations
│   └── seed_data.sql             # Test data
├── Dockerfile                    # Python 3.12-slim, uvicorn
├── Procfile                      # Railway/Heroku entrypoint
├── railway.json                  # Railway deployment config
└── vercel.json                   # Vercel frontend deployment
```

---

## 2. Backend (FastAPI)

### Route Endpoints

#### `routes/auth.py` — Authentication & User Profile
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register with email/password (rate limited: 3/min) |
| POST | `/api/auth/login` | Login, sets httpOnly cookies (rate limited: 5/min) |
| POST | `/api/auth/refresh` | Refresh access token via refresh cookie |
| POST | `/api/auth/logout` | Clear auth cookies |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/me` | Update current user profile |
| POST | `/api/auth/me/photo` | Upload profile photo |
| GET | `/api/auth/me/photo` | Get profile photo (cookie auth) |
| POST | `/api/auth/me/face-encoding` | Generate face encoding from profile photo |
| POST | `/api/auth/me/refresh-face-encoding` | Re-extract face encoding |
| DELETE | `/api/auth/me/face-recognition` | Disable face recognition |
| GET | `/api/auth/users/{id}/photo` | Get another user's photo |
| GET | `/api/auth/me/auto-locate` | Detect user location via IP |

#### `routes/events.py` — Event CRUD
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/events/` | Create event |
| GET | `/api/events/` | List user's events (hosted + attending) |
| GET | `/api/events/discover` | Discover public events nearby |
| GET | `/api/events/{id}` | Get event details |
| PUT | `/api/events/{id}` | Update event |
| DELETE | `/api/events/{id}` | Delete event |
| POST | `/api/events/{id}/archive` | Archive event |
| GET | `/api/events/discover/public` | Discover public events nearby |
| POST | `/api/events/{id}/join` | Join public event |
| POST | `/api/events/{id}/cover-image` | Upload cover image |
| GET | `/api/events/{id}/cover-image` | Get cover image (cookie auth) |
| POST | `/api/events/{id}/cover-image/generate` | AI-generate cover with DALL-E |
| DELETE | `/api/events/{id}/cover-image` | Delete cover image |

#### `routes/ai.py` — AI & RAG
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/host-assist` | Host AI assistant (function calling for updates) |
| POST | `/api/ai/guest-query` | Guest Q&A (RAG-powered) |
| POST | `/api/ai/general-query` | General ChatGPT-style conversation |
| POST | `/api/ai/generate-description` | AI-generate event description |
| POST | `/api/ai/find-my-photos` | Face recognition photo search |
| POST | `/api/ai/recommendation` | Place/vendor recommendations (Google Places) |
| POST | `/api/ai/broadcast` | Host broadcast to event chat |
| POST | `/api/ai/record-faq` | Record FAQ question |
| GET | `/api/ai/faq/{event_id}` | Get top FAQs for event |

#### `routes/chat.py` — Real-time Chat
| Method | Path | Description |
|--------|------|-------------|
| WS | `/api/events/{id}/ws` | WebSocket for event chat (cookie auth) |

#### `routes/photos.py` — Event Photos
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/events/{id}/photos` | Upload photo (AI metadata + face detection) |
| GET | `/api/events/{id}/photos` | List event photos |
| POST | `/api/events/{id}/photos/search` | Search photos (semantic + face recognition) |
| GET | `/api/events/photos/{id}/file` | Get photo file (cookie auth) |
| DELETE | `/api/events/photos/{id}` | Delete photo |

#### `routes/documents.py` — RAG Documents
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/events/{id}/documents` | Upload PDF/image for RAG context |
| GET | `/api/events/{id}/documents` | List event documents |
| DELETE | `/api/events/documents/{id}` | Delete document |

#### `routes/attendance.py` — RSVPs & Invites
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/events/{id}/invite` | Invite user by email |
| GET | `/api/events/invitations` | Get user's pending invitations |
| PUT | `/api/events/{id}/attendance` | Update RSVP status |
| GET | `/api/events/{id}/attendees` | List attendees |
| POST | `/api/events/{id}/cohosts` | Add co-host |
| GET | `/api/events/{id}/cohosts` | List co-hosts |
| PUT | `/api/events/{id}/cohosts/{user_id}` | Update co-host permissions |
| DELETE | `/api/events/{id}/cohosts/{user_id}` | Remove co-host |
| POST | `/api/events/{id}/invite-link` | Create shareable invite link (16-char token) |
| GET | `/api/events/{id}/invite-links` | List active invite links |
| DELETE | `/api/events/{id}/invite-link/{token}` | Revoke invite link |
| GET | `/api/invite/{token}` | Get invite details (no auth) |
| POST | `/api/invite/{token}/accept` | Accept invite link |

#### `routes/groups.py` — Groups
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/groups/` | Create group |
| GET | `/api/groups/` | List user's groups |
| GET | `/api/groups/{id}` | Get group details |
| POST | `/api/groups/{id}/members` | Add member |
| PUT | `/api/groups/{id}` | Update group (admin only) |
| DELETE | `/api/groups/{id}` | Delete group (admin only) |
| DELETE | `/api/groups/{id}/members/{user_id}` | Remove member |
| POST | `/api/groups/{id}/invite-link` | Create group invite link |
| GET | `/api/groups/{id}/invite-links` | List group invite links |
| POST | `/api/groups/{id}/messages` | Send group message |
| GET | `/api/groups/{id}/messages` | Get group messages |

#### `routes/ground_truth.py` — Host-Verified Facts
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/events/{id}/facts` | Add/update factual info |
| GET | `/api/events/{id}/facts` | Get event facts |

#### `routes/messages.py` — REST Messages
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events/{id}/messages` | Get event messages |
| POST | `/api/events/{id}/messages` | Send message (REST fallback) |

#### `routes/questionnaire.py` — Event Questionnaires
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/events/{id}/questionnaire` | Submit questionnaire |
| GET | `/api/events/{id}/questionnaire` | Get questionnaire responses |

### Database Models

| Table | Key Columns | Relationships |
|-------|-------------|---------------|
| **users** | id, name, email, password_hash, google_id, profile_photo, face_encoding, status, email_verified, address, lat/lng | hosted_events, cohosts, group_memberships, messages_sent |
| **events** | id, name, event_type, main_host_id, date, time, address, description, visibility, cover_image_path, budget, capacity | host, group, cohosts, attendees, messages, photos, documents, facts |
| **groups** | id, name, description, is_private | members (GroupMembership), events |
| **group_memberships** | group_id, user_id, role | group, user |
| **messages** | id, event_id, group_id, sender_id, content, message_type | event, group, sender |
| **event_attendance** | id, event_id, user_id, rsvp_status, plus_ones | event, user |
| **event_cohost** | event_id, user_id, permissions | event, user |
| **invite_links** | id, token, link_type, target_id, created_by, expires_at, max_uses | creator |
| **event_documents** | id, event_id, filename, file_path, extracted_text | event |
| **event_photos** | id, event_id, filename, file_path, description, tags, face_encodings | event |
| **event_faq** | id, event_id, question, answer, frequency | event |
| **ground_truth_facts** | id, event_id, key, value, keywords, importance | event |
| **escalated_questions** | id, event_id, user_id, question, ai_response, resolved | event, user |
| **polls** | id, event_id, question, options (JSONB), closes_at | event, votes |
| **todos** | id, event_id, assigned_to, task, completed, due_date | event, assigned_user |
| **suggestions** | id, event_id, suggestion_type, content, reasoning, status | event |
| **audit_log** | id, user_id, event_id, action, details (JSONB), ip_address | user, event |

All models inherit `TimestampMixin` (created_at, updated_at).

### Middleware & Dependency Injection

**Middleware (in `main.py`):**
1. **CORS** — Explicit origins, methods, headers. Credentials enabled for cookies.
2. **Security Headers** — X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy.
3. **CSRF Protection** — Double-submit cookie pattern. Validates `X-CSRF-Token` header against `csrf_token` cookie on POST/PUT/DELETE. Exempt: login, register, refresh, invite.
4. **Rate Limiting** — slowapi with IP-based keys on auth endpoints.

**Dependency Injection:**
- `get_db` — SQLAlchemy session (yields session, auto-closes)
- `get_current_user` — Reads `access_token` cookie → falls back to `Authorization` header → validates JWT → returns User
- `get_optional_user` — Same but returns None instead of 403
- Role-based checks in `services/permissions.py` (is_host, is_cohost, is_attendee)

### Auth Flow

```
Register/Login
    │
    ├─► Backend validates credentials
    ├─► Creates JWT access token (15 min) + refresh token (7 days)
    ├─► Sets httpOnly cookies: access_token, refresh_token, csrf_token
    └─► Returns user info as JSON

API Requests
    │
    ├─► Browser sends cookies automatically (withCredentials: true)
    ├─► CSRF middleware checks X-CSRF-Token header on mutations
    └─► get_current_user reads access_token cookie → validates JWT

Token Refresh (on 401)
    │
    ├─► Frontend interceptor catches 401
    ├─► Calls POST /api/auth/refresh (refresh_token cookie sent automatically)
    ├─► New access_token cookie set
    └─► Original request retried

Logout
    │
    ├─► POST /api/auth/logout
    └─► Clears all auth cookies
```

---

## 3. Frontend (React)

### Component Tree

```
App.full.tsx (BrowserRouter, SplashScreen, native init)
├── LoginPage.jsx
├── RegisterPage.jsx
├── InvitePage.jsx (public, no auth)
└── ProtectedRoute (auth guard via Zustand)
    ├── DashboardPage.jsx (event list, user menu)
    ├── CreateEventPage.jsx (address autocomplete, AI descriptions)
    ├── EditEventPage.jsx
    ├── EventPage.jsx (event details)
    ├── HostInterfaceEnhanced.jsx (AI assistant, photo management, analytics)
    ├── GuestInterfaceEnhanced.jsx (AI Q&A, photo gallery, face search)
    ├── GroupChatWorking.jsx (real-time messaging, photo sharing)
    ├── GroupsPage.jsx
    ├── CalendarPage.jsx (react-big-calendar)
    ├── ProfilePage.jsx (photo crop + upload)
    ├── SettingsPage.jsx
    ├── SearchPage.jsx
    └── FavoritesPage.jsx
```

**Shared Components:** Header, Sidebar, Layout, ProtectedRoute, AddressAutocomplete, ImageCropper, SplashScreen, SubscriptionModal

**Legacy pages** (`.tsx`, unused): Dashboard, Login, Register, Chat, GuestInterface, HostInterface, GroupChat — being replaced by `.jsx` "Enhanced" versions.

### State Management

**Zustand** (v5) with persist middleware:

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;        // { id, email, name, phone, age, bio, profile_photo, has_face_encoding }
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}
// Persisted to localStorage under key "auth-storage"
// Auth tokens are in httpOnly cookies, NOT in this store
```

No Redux. Local component state (useState) for forms and UI. Legacy React Context exists but is unused by active pages.

### API Communication

**Axios** with interceptors (`utils/api.ts`):

```typescript
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,  // Sends cookies
});

// Request interceptor: adds X-CSRF-Token header on mutations
// Response interceptor: auto-refresh on 401, retry failed request
```

**API modules:** `authAPI`, `eventsAPI`, `aiAPI`, `photosAPI`, `documentsAPI`, `attendanceAPI`, `inviteAPI`, `groupsAPI`, `messagesAPI`, `groundTruthAPI`

**Real-time:** Socket.io client for group chat. WebSocket native for event chat.

**Styling:** Tailwind CSS with custom theme (dark-900 background, primary/secondary/accent gradients). Icons via lucide-react.

**Mobile:** Capacitor for Android/iOS (camera, geolocation, haptics, share, network detection).

---

## 4. AI/ML Pipeline

### RAG Setup

| Component | Choice |
|-----------|--------|
| **Vector Store** | DocArrayInMemorySearch (LangChain) |
| **Embedding Model** | OpenAI `text-embedding-3-small` (1536 dims) |
| **Chunking** | RecursiveCharacterTextSplitter, 1000 tokens, 200 overlap |
| **Retrieval** | Similarity search on combined event context |
| **LLM** | GPT-4o-mini (fast, cost-effective) |

### Context Sources for RAG

1. **Event Info** — date, time, location, budget, guest count, description
2. **Chat History** — Last 30 messages (reversed chronologically)
3. **Uploaded Documents** — Extracted text from PDFs/images
4. **Ground Truth Facts** — Host-verified factual information
5. **Host Questionnaire** — Preferences and responses

### Document Processing Pipeline

```
Upload (PDF/Image/TXT)
    │
    ├─► Validate file type + size (10MB max)
    ├─► Store file locally (uploads/documents/)
    └─► Extract text:
        ├─► PDF: pypdf → pdfplumber fallback → GPT-4 Vision (scanned)
        ├─► Image: GPT-4o-mini Vision API (OCR)
        └─► Text: Read directly
            └─► Store extracted_text in event_documents table
                └─► Available as RAG context for queries
```

### Photo Processing Pipeline

```
Upload (JPG/PNG/GIF/WEBP)
    │
    ├─► Validate magic bytes (prevents fake extensions)
    ├─► Store in R2 or local filesystem
    ├─► GPT-4o-mini Vision: generate description + tags
    ├─► OpenCV Haar Cascade: detect faces
    │   └─► Extract face encodings (96-float histogram + gradient)
    │       └─► Store as JSON in event_photos.face_encodings
    └─► Save metadata to database
```

### Query Routing (Intelligent)

The AI system uses LLM-powered routing to determine:
- Whether RAG retrieval is needed (skips for greetings, acknowledgments)
- Which context sources to load (event info, docs, chat, facts)
- Whether to respond directly or search documents

### OpenAI Endpoints Used

| Endpoint | Model | Purpose |
|----------|-------|---------|
| Chat Completions | gpt-4o-mini | All AI features (Q&A, host-assist, descriptions) |
| Chat Completions (Vision) | gpt-4o-mini | Photo descriptions, scanned PDF OCR |
| Embeddings | text-embedding-3-small | Document chunking for RAG |
| Images (DALL-E) | dall-e-3 | AI-generated event cover images |

### Face Recognition

- **Detection:** OpenCV Haar Cascade classifier
- **Encoding:** 96-float vector (histogram + gradient features)
- **Matching:** Cosine similarity with 0.5 tolerance
- **Storage:** JSON in `event_photos.face_encodings` column

---

## 5. Infrastructure

### Deployment

| Component | Platform | Config |
|-----------|----------|--------|
| **Backend** | Railway | `Dockerfile` (Python 3.12-slim + uvicorn) |
| **Frontend** | Vercel | `vercel.json` (Vite build → SPA) |
| **Database** | PostgreSQL 15+ | Railway managed instance |
| **Storage** | Cloudflare R2 | S3-compatible, local fallback |
| **Mobile** | Capacitor | Android APK (net.yorru.app) |

### Database

- **Engine:** PostgreSQL 15+ with `uuid-ossp` and `vector` extensions
- **ORM:** SQLAlchemy 2.0 with connection pooling (10 base + 20 overflow, pre-ping)
- **Migrations:** 13 incremental SQL files in `database/migrations/`
- **Schema:** Full DDL in `database/schema.sql`

### Storage

- **Primary:** Cloudflare R2 (S3-compatible API via boto3)
- **Fallback:** Local `uploads/` directory
- **Paths:** `photos/{event_id}/{uuid}.{ext}`, `documents/{uuid}.{ext}`
- **Access:** Signed URLs (1hr) or direct file serving with cookie auth

### Environment Variables

```bash
# Required
DATABASE_URL              # PostgreSQL connection string
OPENAI_API_KEY            # OpenAI API (GPT + embeddings)
JWT_SECRET_KEY            # JWT signing secret

# Auth
JWT_ALGORITHM             # HS256
JWT_EXPIRATION_MINUTES    # 15 (access token)
REFRESH_TOKEN_EXPIRATION_DAYS  # 7

# Google
GOOGLE_MAPS_API_KEY       # Places API for recommendations
IPINFO_API_KEY            # IP-based geolocation

# Storage (optional — falls back to local)
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL

# Cookie
COOKIE_DOMAIN             # None = current domain
COOKIE_SECURE             # True in production
COOKIE_SAMESITE           # lax
CSRF_SECRET_KEY           # Falls back to JWT_SECRET_KEY

# App
ENVIRONMENT               # development | staging | production
DEBUG                     # False (must explicitly enable)

# Frontend
VITE_API_URL              # Backend URL
VITE_SOCKET_URL           # WebSocket URL
VITE_GOOGLE_MAPS_API_KEY  # Client-side Maps API
```

---

## 6. Patterns and Conventions

### File Naming

| Layer | Convention | Example |
|-------|-----------|---------|
| Backend models | Singular snake_case | `event_photo.py` |
| Backend routes | Plural snake_case | `photos.py`, `events.py` |
| Backend services | Snake_case (descriptive) | `event_rag.py`, `face_recognition.py` |
| Frontend pages | PascalCase + "Page" suffix | `DashboardPage.jsx`, `ProfilePage.jsx` |
| Frontend components | PascalCase | `ProtectedRoute.tsx`, `ImageCropper.jsx` |
| Frontend stores | camelCase | `authStore.ts` |

### Error Handling

- **Backend:** `HTTPException` with generic messages in production. `detail=str(e)` for debugging (M6 — pending fix to remove in prod).
- **Frontend:** Axios interceptor catches 401 → auto-refresh. All API calls wrapped in try/catch with `toast.error()` for user feedback.
- **Validation:** Pydantic schemas with `max_length` constraints. Magic byte validation on file uploads.

### Security Patterns

- httpOnly cookies for auth (no localStorage tokens)
- CSRF double-submit cookie pattern
- Rate limiting on auth endpoints (slowapi)
- Input sanitization (bleach)
- Security headers middleware
- Content-type validation on uploads (magic bytes)
- Role-based permissions (host/cohost/attendee)

### Shared Utilities

| File | Purpose |
|------|---------|
| `services/permissions.py` | Role checking (is_host, is_cohost, is_attendee) |
| `services/sanitize.py` | bleach-based HTML/text sanitization |
| `services/r2_storage.py` | Storage abstraction (R2 + local fallback) |
| `utils/database.py` | SQLAlchemy engine, session factory, get_db dependency |
| `frontend/src/utils/api.ts` | Axios client with all API modules |
| `frontend/src/utils/native.ts` | Capacitor native feature wrappers |
| `frontend/src/utils/googleMaps.js` | Maps API loader + helpers |

### Key Architectural Decisions

1. **In-memory vector store** — DocArrayInMemorySearch instead of pgvector/Pinecone. Simple, no infra, works because event context is small. Trade-off: rebuilt per query.
2. **Cookie auth over localStorage** — httpOnly cookies prevent XSS token theft. CSRF protection required as trade-off.
3. **OpenCV over dlib** — Lighter dependency, no C++ compilation needed. Less accurate face recognition but good enough for social photos.
4. **Dual storage** — R2 primary with local fallback makes development easy while production uses CDN.
5. **Mixed JSX/TSX** — Gradual TypeScript migration. New pages in JSX (counterintuitively), with TypeScript for utils/stores.
6. **GPT-4o-mini for everything** — Cost-effective ($0.15/1M input). Good enough for all AI features. No model switching complexity.
