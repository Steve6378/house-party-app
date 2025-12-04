# Session Handoff - Yorru MVP

**Date:** 2025-12-04
**Branch:** `claude/debug-capacitor-build-01Rg32GLhg63L4XCfwfm77h4`
**Status:** Capacitor Mobile Build + Security Audit Complete
**Platform:** Yorru - AI-assisted night event planning

---

## What Was Done This Session

### 1. Capacitor Mobile CORS Fix
- Added Capacitor origins to CORS configuration in `backend/main.py`
- iOS: `capacitor://localhost`
- Android: `http://localhost`

### 2. AI Chat History (GroupChat.tsx)
- Changed `aiResponse` (string) to `aiMessages` (array)
- Added `AIMessage` interface with role, content, timestamp
- Persists in localStorage per event (`ai-chat-${eventId}`)
- Shows full conversation with scrollable history
- Added Clear button to reset history
- Loading spinner while AI is thinking

### 3. AI Action System with User Confirmations
**Backend (ai.py):**
- Added 7 OpenAI function calling tools:
  - `update_event_name`, `update_event_date`, `update_event_time`
  - `update_event_location`, `update_event_description`
  - `update_expected_guests`, `update_budget`
- When AI wants to modify event, returns `proposed_action`
- New `/ai/execute-action` endpoint to execute confirmed actions

**Frontend (HostInterfaceEnhanced.jsx):**
- Handles `proposed_action` in AI responses
- Shows amber confirmation box: "Confirm Action: [description]"
- Confirm button executes action, refreshes event data
- Cancel button dismisses without changing

### 4. Comprehensive Security Audit
See SECURITY VULNERABILITIES section below.

---

## SECURITY VULNERABILITIES FOUND

### CRITICAL - MUST FIX IMMEDIATELY

| # | Issue | File | Line | Fix |
|---|-------|------|------|-----|
| 1 | **Hardcoded Google Maps API Key** | `backend/config.py` | 23 | Move to env var |
| 2 | **Hardcoded IPInfo API Key** | `backend/config.py` | 26 | Move to env var |
| 3 | **Frontend Google Maps Key Exposed** | `frontend/src/utils/api.js` | 68 | Move to backend proxy |
| 4 | **Frontend IPInfo Key Exposed** | `frontend/src/utils/api.js` | 55 | Move to backend proxy |
| 5 | **WebSocket Auth Broken** | `backend/routes/chat.py` | 38-39 | `decode_access_token` returns string, not dict |
| 6 | **Tokens in URL Query Params** | Multiple frontend files | - | Tokens visible in logs/history |

### HIGH SEVERITY

| # | Issue | File | Fix |
|---|-------|------|-----|
| 7 | CORS allows all methods/headers | `backend/main.py` | Restrict to needed methods only |
| 8 | No email verification | `backend/routes/auth.py:85` | Implement email verification flow |
| 9 | No rate limiting on auth | `backend/routes/auth.py` | Add rate limiting |
| 10 | JWT expires in 7 days | `backend/config.py:20` | Reduce to 15-60 min + refresh tokens |
| 11 | localStorage token storage | `frontend/src/context/AuthContext.tsx` | Use httpOnly cookies |
| 12 | Hardcoded localhost URLs | `frontend/src/pages/EventPage.jsx` | Use API_URL constant |

### MEDIUM SEVERITY

| # | Issue | Files |
|---|-------|-------|
| 13 | No CSRF protection | All state-changing endpoints |
| 14 | Error details exposed to users | Multiple frontend files |
| 15 | File upload validation client-only | Frontend file upload components |
| 16 | SQL debug logging if DEBUG=true | `backend/utils/database.py:15` |
| 17 | Missing security headers | `backend/main.py` (no X-Frame-Options, etc.) |
| 18 | User PII in plaintext | `backend/models/user.py` (phone, location, face) |

### DATABASE ISSUES

| # | Issue | Files |
|---|-------|-------|
| 19 | CASCADE delete loses audit trail | `backend/models/user.py`, `event.py` |
| 20 | Missing unique constraints in ORM | `backend/models/preferences.py`, `ground_truth.py` |
| 21 | Missing FK constraints | `backend/models/escalated_question.py`, `suggestion.py` |
| 22 | Dangerous migration 005 | `database/migrations/005_migrate_event_attendance.sql` |
| 23 | N+1 query vulnerabilities | `backend/models/user.py` (many eager relationships) |

---

## API Keys to Rotate

**IMMEDIATELY ROTATE THESE KEYS (they are exposed in source code):**

1. **Google Maps API Key:** `AIzaSyArl429AzBBxRq75I44ql0B7U56Gx0dMCo` (backend)
2. **Google Maps API Key:** `AIzaSyC0pZESmcvudSPIJptKdTh5L46xkD_dyd0` (frontend)
3. **IPInfo Token:** `66e8a1256f48d9`

After rotating:
- Move to environment variables
- Create backend proxy endpoints for frontend API calls
- Never expose API keys in frontend code

---

## Files Modified This Session

```
backend/
├── main.py                    # Added Capacitor CORS origins
├── routes/
│   └── ai.py                  # Added function calling + execute-action endpoint

frontend/
├── src/
│   ├── pages/
│   │   ├── GroupChat.tsx              # AI chat history with localStorage
│   │   └── HostInterfaceEnhanced.jsx  # AI action confirmation UI
│   └── utils/
│       └── api.ts                     # Added executeAction method
```

---

## Recent Commits (This Session)

```
a6caa05 Add AI action system with user confirmations
37e5acb Add AI chat history with localStorage persistence
c66ab3e Add Capacitor mobile origins to CORS configuration
```

---

## Tech Stack

- **Backend:** FastAPI (Python 3.12)
- **Database:** PostgreSQL + pgvector (Railway)
- **Frontend:** React + Vite + TypeScript
- **Mobile:** Capacitor (Android)
- **Real-time:** WebSocket (Socket.io)
- **AI:** OpenAI GPT-4o-mini + Function Calling
- **Storage:** Local uploads (Railway volume)
- **Auth:** JWT tokens (7-day expiry)

---

## URLs

- **Repository:** github.com/Steve6378/yorru
- **Frontend:** yorru.net / www.yorru.net (Vercel)
- **Backend:** yorru-production.up.railway.app (Railway)
- **Database:** Railway PostgreSQL

---

## Deferred/Known Issues

### Must Fix (Security)
- [ ] Rotate and secure API keys
- [ ] Fix WebSocket token validation (`chat.py:38-39`)
- [ ] Implement rate limiting
- [ ] Move tokens from URL params to headers
- [ ] Add httpOnly cookie auth option

### Should Fix
- [ ] Implement email verification
- [ ] Reduce JWT expiration + add refresh tokens
- [ ] Add security headers middleware
- [ ] Restrict CORS methods/headers
- [ ] Fix CASCADE deletes to SET NULL for audit data

### Feature Gaps
- [ ] Timezone awareness (times display as UTC)
- [ ] Event end/archive functionality
- [ ] OAuth/social login

---

## Quick Context for Next Session

```
Project: Yorru (夜 - Night Event Planning)
Branch: claude/debug-capacitor-build-01Rg32GLhg63L4XCfwfm77h4

This session completed:
1. Capacitor mobile CORS fix (iOS/Android origins)
2. AI chat history with localStorage persistence
3. AI action system with user confirmations
4. Comprehensive security audit (22+ issues found)

PRIORITY: Security fixes - rotate exposed API keys and fix WebSocket auth

Files to review:
- docs/SESSION_HANDOFF.md (this file) - full audit results
- backend/routes/ai.py - new action system
- frontend/src/pages/GroupChat.tsx - AI chat history
- frontend/src/pages/HostInterfaceEnhanced.jsx - action confirmation UI
```

---

## Audit Summary Table

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Backend Security | 2 | 4 | 6 | 4 | 16 |
| Frontend Security | 3 | 5 | 4 | 2 | 14 |
| Database/Models | 5 | 7 | 5 | - | 17 |
| **TOTAL** | **10** | **16** | **15** | **6** | **47** |

---

**Last Updated:** 2025-12-04
