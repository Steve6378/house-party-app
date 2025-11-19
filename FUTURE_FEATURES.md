# Future Features & Design Notes

This document tracks feature ideas and design decisions to implement later.

---

## Event Type Smart Features
**Status:** Design phase - implement after frontend is done
**Priority:** Medium

### Current State
Event types are just stored labels (e.g., "tight_knit", "big_party", "birthday"). They don't affect functionality.

### Proposed Functionality

Event types should drive different UX, suggestions, and available features:

#### 1. Smart Suggestions & Defaults

**tight_knit** (small, intimate gatherings):
- Auto-suggest guest count: 5-15 people
- Default visibility: private
- Enable features: detailed food preferences, seating arrangements
- Budget suggestions: higher per-person (nicer food/drinks)
- Recommended: RSVP required

**big_party** (large gatherings):
- Auto-suggest guest count: 50-200+ people
- Enable features: open invites, +1s allowed, parking info
- Suggested: DJ/music polls, crowd management
- Budget: lower per-person (bulk buying)

**frat_party**:
- Enable: keg tracker, beer pong tournament signup
- Auto-suggest: cover charge, security volunteers
- Recommended: noise curfew time, cleanup crew

**professional** (networking events):
- Enable: LinkedIn integration, business card exchange
- Disable: party games, alcohol tracking
- Auto-suggest: name tags, agenda/schedule, presentation setup
- Recommended: professional dress code note

**birthday/wedding** (celebrations):
- Enable: gift registry integration, RSVP deadline enforcement
- Auto-suggest: photo album, cake/special meal notes
- Special dietary needs tracker
- Memory/guestbook feature

**study_session** (academic):
- Enable: quiet hours, topic list, material sharing
- Suggested: break schedule, snack rotation
- Focus mode features

**game_night**:
- Enable: game library, player count requirements
- Suggested: setup time, skill levels
- Tournament brackets for competitive games

#### 2. Filter & Discovery
- Users can filter events: "Show me all professional events near me"
- Personalized recommendations: "You usually enjoy tight_knit events"
- Group suggestions based on past event types

#### 3. Context-Aware UI
Show/hide sections based on event type:
- Wedding → Gift registry tab, plus-ones, dietary restrictions
- Study session → Topics list, materials needed, quiet hours
- Gaming → Game library, setup requirements, player matching
- Professional → Agenda, speaker bios, networking time blocks

#### 4. AI-Powered Recommendations
- "Based on your tight_knit dinner party, here are wine pairings..."
- "For big parties with 100+ guests, consider these playlist suggestions..."
- "Similar professional events in your area had these features..."
- Event type-specific checklists and planning guides

#### 5. Analytics & Insights
- "Your tight_knit events typically have 85% attendance vs 60% for big parties"
- "Professional events you host usually run 30 minutes over schedule"
- Learn patterns: what works for different event types
- Compare your events to similar types

### Implementation Notes
- Event type should be stored as-is (custom text) for flexibility
- Feature mappings can be frontend-driven initially
- Later: backend could provide "event type templates" API
- Consider allowing hosts to override auto-suggestions
- May want common event types as presets with custom option

### Technical Considerations
- Frontend will need event type → feature mapping logic
- Could use a configuration file for type definitions
- Should be extensible (easy to add new types)
- Consider A/B testing different suggestions

---

## Authentication & Security Enhancements
**Status:** Planned - implement after frontend
**Priority:** High

### 1. Email Verification
- Send verification email on registration
- Email service options: SendGrid, AWS SES, Mailgun, Resend
- Setup custom domain: donotreply@festivio.net
- Click-to-verify flow with token
- Mark users as email_verified in database

**Implementation:**
- Generate verification token (JWT or random UUID)
- Send email with link: `https://festivio.net/verify?token={token}`
- Verify endpoint validates token and marks user as verified
- Optional: Require verification before full access

### 2. Refresh Token System
**Current:** JWT tokens expire in 7 days (too short for mobile)
**Proposed:** Two-token system

- **Access tokens**: Short-lived (15min - 1hr) for API requests
- **Refresh tokens**: Long-lived (30-90 days) for getting new access tokens
- Store refresh tokens in database
- Track device info (iPhone, iPad, etc.)
- Allow "logout all devices" functionality
- Auto-rotation: new refresh token on each refresh

**Benefits:**
- Better security (stolen access token only works 15min)
- Better UX (user stays logged in 30+ days)
- Can revoke specific devices
- Detect suspicious activity

### 3. OAuth / Social Login
**Providers:** Google, Apple, Facebook

**Setup per provider:**
- Register with provider's developer console
- Get Client ID and Client Secret
- Set redirect URI: `https://festivio.net/auth/{provider}/callback`
- Use library: `authlib` or `python-social-auth`

**User flow:**
1. Click "Sign in with Google"
2. Redirect to Google
3. User authenticates
4. Google redirects back with code
5. Exchange code for user info
6. Create/login user, return JWT

**Benefits:**
- Faster signup (no password to remember)
- Email automatically verified
- Better conversion rates

### 4. Password Reset / Forgot Password
- "Forgot password" link on login
- Send reset email with token
- Token expires in 1 hour
- User sets new password
- Invalidate all existing tokens (force re-login on all devices)

### 5. Rate Limiting
**Multi-layer approach:**

**Layer 1: Per-IP**
- 100 requests/minute per IP
- Prevents DDoS

**Layer 2: Per-User**
- Logged in: 1000 requests/hour
- Anonymous: 100 requests/hour

**Layer 3: Per-Endpoint**
- Login: 5 attempts per 15 minutes
- Register: 3 per hour per IP
- Normal API: 100 per minute

**Challenges:**
- Shared IPs (offices, universities) - don't ban everyone
- VPNs/proxies - attackers can switch IPs
- NAT - multiple users share one IP

**Solution:**
- Use Redis for fast counters
- Return HTTP 429 with `retry_after` header
- Consider CloudFlare for DDoS protection
- Tool: `slowapi` for FastAPI

### 6. JWT Token Expiration for Mobile
**Current:** 7 days
**Mobile standard:** 30-90 days or longer

**Options:**
- Change to 30/60 days in config
- Implement refresh tokens (recommended)
- Never expire (bad for security)

**Mobile-specific considerations:**
- Auto-logout on app deletion
- Pre-saved login after reinstall: Generally discouraged for security

### 7. Device Tracking & Session Management
**Current:** Stateless JWT (no device tracking)
**Proposed:** Store active sessions in database

- Track: device type, IP, location, last active
- Show user: "Active devices" list
- Allow: "Logout this device" or "Logout all devices"
- Detect suspicious: login from new country → email alert

---

## Permission & Access Control
**Status:** Critical - needs implementation soon
**Priority:** High

### Event Permissions
**Current issue:** Any logged-in user can view any event if they know the ID

**Fix needed:**
```python
def get_event(event_id, current_user):
    event = get_event_by_id(event_id)

    # Check visibility permissions
    if event.visibility == "private":
        # Only host and invited guests
        if not user_is_invited(current_user.id, event_id):
            raise 403 Forbidden

    elif event.visibility == "group_only":
        # Must be in the group
        if not user_in_group(current_user.id, event.group_id):
            raise 403 Forbidden

    # Public events - anyone can view
    return event
```

**Apply to:**
- GET /api/events/{id}
- GET /api/events (filter to user's events only)
- GET /api/events/{id}/messages
- All event-related endpoints

### Group Permissions
**Current issue:** Ground truth endpoints have ZERO auth - anyone can add/delete

**Fix needed:**
- Protect all POST/PUT/DELETE on ground truth
- Add group membership check
- Add admin/moderator roles
- Only group admins can modify ground truth data

### Message Permissions
**Current status:** Basic sender-only checks
**Need to add:** Event membership verification before sending/viewing messages

---

## Input Sanitization & XSS Prevention
**Status:** Needed for production
**Priority:** Medium

### XSS (Cross-Site Scripting) Attack Example
User submits: `<script>alert('hacked!')</script>`
If displayed without escaping → JavaScript runs in victim's browser

### Solutions

**1. Frontend (React handles this automatically)**
```jsx
<h1>{event.name}</h1>  // React auto-escapes HTML
```

**2. Backend validation**
```python
import bleach

def sanitize(text: str) -> str:
    # Remove ALL HTML tags
    return bleach.clean(text, tags=[], strip=True)

# Or allow some tags
return bleach.clean(text, tags=['b', 'i', 'u'], strip=True)
```

**3. Content Security Policy headers**
```python
response.headers["Content-Security-Policy"] = "default-src 'self'"
```

**For Festivio:**
- Event names, addresses: Strip all HTML
- User messages: Allow basic formatting? Or strip all?
- SQL injection: Already protected (SQLAlchemy uses parameterized queries ✓)

---

## CORS Configuration
**Status:** Currently allows all origins (insecure for production)
**Priority:** High before production

**Current (in main.py):**
```python
allow_origins=["*"]  # ← BAD for production!
```

**Production:**
```python
allow_origins=[
    "https://festivio.net",
    "https://www.festivio.net",
    "http://localhost:3000"  # Development only
]
```

**What CORS does:**
- Backend: `https://api.festivio.net`
- Frontend: `https://festivio.net`
- Browser blocks cross-origin requests for security
- CORS middleware tells browser: "It's okay, I trust festivio.net"

**Security:**
- Only whitelist YOUR domains
- `allow_origins=["*"]` allows ANY website to call your API
- Attackers could make requests from malicious sites

---

## Seed Data / Fixtures
**Status:** Not implemented
**Priority:** Low (nice to have for testing)

**Purpose:** Sample data for testing without manually creating everything

**Example:**
```python
# db/seeds.py
def seed_database():
    # Create test users
    users = [
        User(id="user-1", email="alice@test.com", name="Alice", ...),
        User(id="user-2", email="bob@test.com", name="Bob", ...),
    ]

    # Create test events
    events = [
        Event(id="event-1", name="Alice's Birthday", event_type="birthday", ...),
        Event(id="event-2", name="Company BBQ", event_type="professional", ...),
    ]

    # Create test messages
    messages = [
        Message(id="msg-1", event_id="event-1", sender_id="user-2", content="Happy birthday!", ...),
    ]

    db.add_all(users + events + messages)
    db.commit()
```

**Run once:** `python db/seeds.py`

**Benefits:**
- Quick testing without Swagger UI
- Consistent test environment
- Demo data for frontend developers
- Can reset database to known state

---

## Missing Endpoints (Future Implementation)
**Status:** Planned for later
**Priority:** Medium-Low

### ✅ Completed
- Events (CRUD with auth)
- Messages/Chat (just completed!)
- Authentication (register, login, get user)
- Ground truth (unprotected - needs fixing)

### ❌ Still Needed

**1. Todos**
- POST /api/events/{id}/todos - Create todo
- GET /api/events/{id}/todos - List todos
- PUT /api/todos/{id} - Update todo
- DELETE /api/todos/{id} - Delete todo
- PUT /api/todos/{id}/complete - Mark complete
- Assign to users, set deadlines

**2. Polls**
- POST /api/events/{id}/polls - Create poll
- GET /api/events/{id}/polls - List polls
- POST /api/polls/{id}/vote - Submit vote
- GET /api/polls/{id}/results - View results
- Support multiple choice, ranking, etc.

**3. Groups**
- POST /api/groups - Create group
- GET /api/groups - List user's groups
- PUT /api/groups/{id} - Update group
- DELETE /api/groups/{id} - Delete group
- POST /api/groups/{id}/members - Add member
- DELETE /api/groups/{id}/members/{user_id} - Remove member
- GET /api/groups/{id}/events - List group events

**4. RSVP / Event Attendance**
- POST /api/events/{id}/rsvp - RSVP to event
- GET /api/events/{id}/attendees - List attendees
- PUT /api/events/{id}/rsvp - Update RSVP (yes/no/maybe)
- DELETE /api/events/{id}/rsvp - Remove RSVP
- Track: plus_ones, dietary restrictions, notes

**5. File Uploads**
- POST /api/events/{id}/photos - Upload event photos
- POST /api/users/me/avatar - Upload profile picture
- Use S3 or similar for storage
- Image processing: thumbnails, compression

**6. User Profile**
- GET /api/users/{id} - View profile
- PUT /api/users/me - Update profile
- DELETE /api/users/me - Delete account
- PUT /api/users/me/password - Change password

**7. Notifications**
- GET /api/notifications - List notifications
- PUT /api/notifications/{id}/read - Mark as read
- WebSocket for real-time notifications
- Types: event invite, new message, RSVP update, etc.

---

## WebSocket for Real-time Features
**Status:** Future enhancement
**Priority:** Low (nice to have)

**Use cases:**
- Real-time chat (messages appear instantly)
- Live polls (results update as people vote)
- Typing indicators
- Online/offline status
- Event updates (host changes time → all attendees see it)

**Implementation:**
- FastAPI supports WebSockets natively
- Use library: `python-socketio` or native FastAPI WebSocket
- Alternative: Server-Sent Events (SSE) for one-way updates

---

## Account Management
**Status:** Missing basic features
**Priority:** Medium

**Missing endpoints:**
- DELETE /api/users/me - Delete account
- PUT /api/users/me/password - Change password
- GET /api/users/me/sessions - View active sessions
- DELETE /api/users/me/sessions/{id} - Logout specific device

---

## Other Future Features

### Analytics Dashboard
- Event attendance trends
- Popular event types
- User engagement metrics
- Budget tracking across events

### AI Features (Beyond Semantic Search)
- Smart event suggestions based on past events
- Auto-generate shopping lists from event type
- Budget optimization
- Guest compatibility matching

### Integrations
- Calendar sync (Google Calendar, iCal)
- Payment processing (Stripe for event fees)
- Maps integration for event locations
- Music streaming (Spotify playlist creation)

---

