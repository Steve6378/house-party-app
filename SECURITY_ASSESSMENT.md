# Yorru Security Assessment Report

**Date:** December 15, 2025
**Scope:** Full-stack security audit of Yorru event planning platform
**Methodology:** Static code analysis + infrastructure review

---

## Executive Summary

This assessment identified **23 security vulnerabilities** across the Yorru application:
- **4 Critical** - Immediate remediation required
- **7 High** - Remediate within 1-2 weeks
- **8 Medium** - Remediate within 1 month
- **4 Low** - Address as resources permit

---

## Critical Findings

### 1. Hardcoded API Keys in Source Code
**Severity:** CRITICAL
**Location:** `backend/config.py:23-26`

```python
GOOGLE_MAPS_API_KEY: str = "AIzaSyArl429AzBBxRq75I44ql0B7U56Gx0dMCo"
IPINFO_API_KEY: str = "66e8a1256f48d9"
```

**Risk:** These keys are committed to version control and exposed in the source code. Attackers can:
- Abuse your Google Maps quota (billing impact)
- Track users via IPInfo API
- Keys visible in public GitHub repo

**Remediation:**
1. Immediately rotate both API keys
2. Move to environment variables (already configured for other secrets)
3. Add to `.gitignore` and use `.env.example` for templates

---

### 2. No Rate Limiting on Authentication Endpoints
**Severity:** CRITICAL
**Location:** `backend/routes/auth.py` (all auth endpoints)

`slowapi` is listed in `requirements.txt` but **not implemented anywhere** in the codebase.

**Risk:**
- Credential stuffing attacks
- Brute force password attempts
- Account enumeration
- Denial of service

**Remediation:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")  # 5 attempts per minute
def login(...):
```

---

### 3. JWT Tokens Passed in URL Query Parameters
**Severity:** CRITICAL
**Location:** Multiple endpoints

- `backend/routes/auth.py:368-382` - `/api/auth/me/photo?token=...`
- `backend/routes/photos.py:306-321` - `/api/events/photos/{id}/file?token=...`
- `backend/routes/events.py:680` - `/api/events/{id}/cover-image?token=...`
- `backend/routes/chat.py:26` - WebSocket `?token=...`

**Risk:**
- Tokens logged in server access logs
- Tokens stored in browser history
- Tokens leaked via Referer headers
- Tokens visible in network monitoring tools

**Remediation:**
1. Use `Authorization: Bearer <token>` header for HTTP requests
2. For WebSocket, use first message for auth or subprotocol
3. For `<img>` tags, use signed URLs with short expiration or proxy endpoint

---

### 4. localStorage Token Storage (XSS Vulnerable)
**Severity:** CRITICAL
**Location:** `frontend/src/stores/authStore.ts:35-37`

```typescript
persist(
  (set) => ({...}),
  { name: 'auth-storage' }  // Stores in localStorage
)
```

**Risk:** Any XSS vulnerability allows token theft and full account takeover.

**Remediation:**
1. Use httpOnly cookies for token storage
2. Implement CSRF protection for state-changing requests
3. Set `SameSite=Strict` on cookies

---

## High Severity Findings

### 5. Excessive JWT Expiration (7 Days)
**Severity:** HIGH
**Location:** `backend/config.py:20`

```python
JWT_EXPIRATION_MINUTES: int = 60 * 24 * 7  # 7 days
```

**Risk:** Stolen tokens remain valid for a week.

**Remediation:**
- Access tokens: 15-60 minutes
- Implement refresh token rotation
- Add token revocation capability

---

### 6. Overly Permissive CORS Configuration
**Severity:** HIGH
**Location:** `backend/main.py:41-42`

```python
allow_methods=["*"],
allow_headers=["*"],
```

**Risk:**
- Allows any HTTP method including dangerous ones (PUT, DELETE, PATCH)
- Allows any header which could enable attacks

**Remediation:**
```python
allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
allow_headers=["Authorization", "Content-Type", "Accept"],
```

---

### 7. WebSocket Authentication via URL Parameter
**Severity:** HIGH
**Location:** `backend/routes/chat.py:26`

```python
@router.websocket("/{event_id}/ws")
async def websocket_endpoint(
    token: str = Query(...),  # Token in URL
```

**Risk:** Same as #3 - tokens in URLs are logged and leaked.

**Remediation:**
```python
# Authenticate via first message after connection
data = await websocket.receive_json()
token = data.get("token")
```

---

### 8. No CSRF Protection
**Severity:** HIGH
**Location:** Entire backend

No CSRF tokens or double-submit cookie pattern implemented.

**Risk:** Attackers can perform actions on behalf of logged-in users.

**Remediation:**
1. Implement CSRF tokens for all state-changing operations
2. Or switch to httpOnly cookies with `SameSite=Strict`

---

### 9. Chat Messages Not Sanitized
**Severity:** HIGH
**Location:** `backend/routes/chat.py:79-92`

```python
data = await websocket.receive_text()
# ... directly stored without sanitization
content=content  # Raw content stored
```

**Risk:** Stored XSS in chat messages displayed to other users.

**Remediation:**
```python
from services.sanitize import sanitize_text
content = sanitize_text(content, allow_basic_formatting=True)
```

---

### 10. Missing Security Headers
**Severity:** HIGH
**Location:** Backend response headers

Live testing of `yorru.net` shows missing security headers:
- No `Content-Security-Policy`
- No `X-Frame-Options`
- No `X-Content-Type-Options`
- No `Strict-Transport-Security`
- No `Referrer-Policy`

**Remediation:**
Add security middleware:
```python
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response
```

---

### 11. Email Verification Not Implemented
**Severity:** HIGH
**Location:** `backend/routes/auth.py:85`

```python
email_verified=False  # TODO: Add email verification flow
```

**Risk:**
- Account squatting
- Fake accounts
- No password recovery path

---

## Medium Severity Findings

### 12. Account Status Exposed in Error Messages
**Severity:** MEDIUM
**Location:** `backend/routes/auth.py:148`

```python
detail=f"Account is {user.status}"  # Exposes account status
```

**Risk:** Information disclosure about account state.

---

### 13. SQL Injection Risk in FAQ Search
**Severity:** MEDIUM
**Location:** `backend/routes/ai.py:768`

```python
EventFAQ.question.ilike(f"%{normalized_question}%")
```

While SQLAlchemy provides some protection, this pattern can be problematic.

**Remediation:** Use parameterized patterns or full-text search.

---

### 14. Prompt Injection in AI Endpoints
**Severity:** MEDIUM
**Location:** `backend/routes/ai.py` (multiple endpoints)

User input is directly embedded into prompts without sanitization:
```python
event_context = f"""
Event Details:
- Name: {event.name}
...
User Request: {request.task}  # User-controlled
"""
```

**Risk:** Users could manipulate AI responses or extract system prompts.

**Remediation:**
- Use structured prompts with clear boundaries
- Validate and sanitize user input before embedding
- Use OpenAI's system vs user message separation

---

### 15. Path Traversal Check May Be Bypassed
**Severity:** MEDIUM
**Location:** `backend/routes/photos.py:347-351`

```python
real_path = os.path.realpath(photo.file_path)
uploads_dir = os.path.realpath("uploads")
if not real_path.startswith(uploads_dir):
    raise HTTPException(status_code=403, detail="Invalid file path")
```

**Risk:** The check happens after the file is accessed from `photo.file_path` which comes from DB. If an attacker can control DB values, traversal is possible.

---

### 16. Invite Tokens Are Short (8 chars)
**Severity:** MEDIUM
**Location:** `backend/routes/attendance.py:457`

```python
def generate_token(length: int = 8) -> str:
    return secrets.token_urlsafe(length)[:length]
```

**Risk:** Only ~48 bits of entropy. Could be brute-forced.

**Remediation:** Use at least 16 characters for public invite tokens.

---

### 17. Error Details Exposed in Production
**Severity:** MEDIUM
**Location:** Multiple exception handlers

```python
except Exception as e:
    print(f"Error: {e}")  # Logged but also returned to client
    raise HTTPException(status_code=500, detail=str(e))
```

**Risk:** Stack traces and internal errors exposed to attackers.

---

### 18. No Input Length Validation
**Severity:** MEDIUM
**Location:** Various schema definitions

Chat messages, event descriptions, and other fields lack maximum length validation.

**Risk:** Denial of service via extremely large payloads.

---

### 19. OpenAI API Key Exposure Risk
**Severity:** MEDIUM
**Location:** Frontend environment variable handling

If `VITE_OPENAI_API_KEY` is used in frontend, the key is exposed in browser.

---

## Low Severity Findings

### 20. Debug Mode Configuration
**Severity:** LOW
**Location:** `backend/config.py:37`

```python
DEBUG: bool = True  # Default is True
```

Should default to `False` for safety.

---

### 21. Unvalidated Redirect in OAuth (Future)
**Severity:** LOW
**Location:** OAuth infrastructure exists but not fully implemented.

When implemented, ensure redirect URLs are validated against allowlist.

---

### 22. Database Connection String Logging
**Severity:** LOW

Ensure DATABASE_URL is never logged even in debug mode.

---

### 23. Face Encoding Data Privacy
**Severity:** LOW
**Location:** User face encodings stored in database

Consider privacy implications and data retention policies for biometric data.

---

## Summary of Required Actions

### Immediate (24-48 hours)
1. Rotate and externalize API keys
2. Implement rate limiting on auth endpoints
3. Move JWT tokens from URL to headers

### Short-term (1-2 weeks)
4. Implement httpOnly cookie auth
5. Add CSRF protection
6. Sanitize chat messages
7. Add security headers
8. Reduce JWT expiration
9. Fix CORS configuration

### Medium-term (1 month)
10. Implement email verification
11. Harden AI prompt injection
12. Add input length validation
13. Improve invite token entropy
14. Review error handling

---

## Positive Security Observations

The codebase does include several good security practices:
- Bcrypt password hashing with SHA256 pre-hash
- Input sanitization via Bleach library (used in some places)
- Role-based access control (RBAC) implementation
- Permission checks on data access
- Soft-delete for audit trails
- File extension validation on uploads
- Event visibility enforcement (private/group/public)

---

## Testing Recommendations

1. **Penetration Test:** After fixes, conduct authorized pentest
2. **Dependency Scanning:** Run `pip-audit` and `npm audit` regularly
3. **SAST/DAST:** Integrate security scanning into CI/CD
4. **Bug Bounty:** Consider a program once baseline security is established

---

*Report generated by Claude Code security assessment*
