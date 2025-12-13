# Yorru Security Model

**Version:** 0.0.2
**Last Updated:** December 2025
**Audit Date:** 2025-12-04

This document outlines the security model and known vulnerabilities in the Yorru backend.

---

## SECURITY AUDIT RESULTS (2025-12-04)

### Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Backend Security | 2 | 4 | 6 | 4 | 16 |
| Frontend Security | 3 | 5 | 4 | 2 | 14 |
| Database/Models | 5 | 7 | 5 | - | 17 |
| **TOTAL** | **10** | **16** | **15** | **6** | **47** |

---

## CRITICAL VULNERABILITIES

### 1. Hardcoded API Keys (MUST FIX)
**Files:**
- `backend/config.py:23` - Google Maps API Key
- `backend/config.py:26` - IPInfo API Key
- `frontend/src/utils/api.js:55` - IPInfo Token
- `frontend/src/utils/api.js:68` - Google Maps API Key

**Risk:** API keys visible in source code, can be abused
**Fix:** Move to environment variables, create backend proxy for frontend calls

### 2. WebSocket Authentication Broken
**File:** `backend/routes/chat.py:38-39`
```python
payload = decode_access_token(token)  # Returns string, not dict
user_id = payload.get("sub")          # AttributeError!
```
**Risk:** All WebSocket connections fail silently
**Fix:** Change to `user_id = decode_access_token(token)`

### 3. JWT Tokens in URL Query Parameters
**Files:** Multiple frontend components
**Risk:** Tokens exposed in browser history, server logs, referrer headers
**Fix:** Use Authorization header instead

---

## HIGH SEVERITY VULNERABILITIES

### 4. No Rate Limiting
**File:** `backend/routes/auth.py`
- Login endpoint allows unlimited attempts
- Register endpoint allows unlimited accounts
**Fix:** Implement rate limiting with `slowapi` or similar

### 5. Long JWT Expiration
**File:** `backend/config.py:20`
- JWT_EXPIRATION_MINUTES = 7 days
**Fix:** Reduce to 15-60 minutes, implement refresh tokens

### 6. CORS Too Permissive
**File:** `backend/main.py:39-40`
```python
allow_methods=["*"],
allow_headers=["*"],
```
**Fix:** Restrict to only needed methods and headers

### 7. localStorage Token Storage
**File:** `frontend/src/context/AuthContext.tsx`
**Risk:** XSS can steal tokens
**Fix:** Use httpOnly cookies with SameSite and Secure flags

### 8. No Email Verification
**File:** `backend/routes/auth.py:85`
**Risk:** Fake accounts, unverified emails
**Fix:** Implement email verification flow

---

## MEDIUM SEVERITY VULNERABILITIES

### 9. No CSRF Protection
All state-changing endpoints lack CSRF tokens

### 10. Missing Security Headers
**File:** `backend/main.py`
Missing: X-Frame-Options, X-Content-Type-Options, CSP, HSTS

### 11. SQL Debug Logging
**File:** `backend/utils/database.py:15`
If DEBUG=True, all SQL queries are logged

### 12. Sensitive PII in Plaintext
**File:** `backend/models/user.py`
- Phone number (line 55)
- Address (line 62)
- Latitude/Longitude (lines 63-64)
- Face encoding (line 59)

### 13. Client-Only File Validation
Frontend validates file types but server should also validate

### 14. Error Details Exposed
Multiple frontend files expose server error details to users

---

## DATABASE VULNERABILITIES

### 15. CASCADE DELETE Loses Audit Trail
**Files:** `backend/models/user.py`, `event.py`
- Deleting user cascades to messages, todos, audit logs
**Fix:** Use SET NULL for audit-relevant data

### 16. Missing Unique Constraints in ORM
**Files:** `backend/models/preferences.py`, `ground_truth.py`
- Schema has constraints, ORM doesn't enforce

### 17. Missing Foreign Key Constraints
**Files:** `backend/models/escalated_question.py`, `suggestion.py`, `todo.py`
- Relationships without proper FK enforcement

### 18. Dangerous Migration
**File:** `database/migrations/005_migrate_event_attendance.sql`
- Drops primary key without error handling

### 19. N+1 Query Vulnerabilities
**File:** `backend/models/user.py`
- Many eager-loaded relationships

---

## Authentication

**All API endpoints require authentication via JWT tokens.**

- Tokens are issued on login/registration
- Tokens expire in 7 days (should be reduced)
- Tokens must be sent in Authorization header: `Bearer <token>`

---

## Permission System

### Event Visibility Levels

1. **Private** - Only host, co-hosts, and invited attendees
2. **Group-only** - Only group members (and host/co-hosts/attendees)
3. **Public** - Any logged-in user

### Role Hierarchy

**Host (main_host_id)**
- Full control over the event
- Can edit, delete, archive event
- Can manage co-hosts and attendees
- Can edit ground truth facts

**Co-Host (event_cohosts table)**
- Permission levels:
  - `edit_all` - Can edit event details + ground truth facts
  - `edit_facts` - Can only edit ground truth facts
  - `view_only` - Can view event (same as attendee)

**Attendee (event_attendance table)**
- Can view event details
- Can send/view messages
- Can view ground truth facts
- Can ask AI questions

---

## Input Sanitization

All user input is sanitized using the Bleach library to prevent XSS attacks.

**Sanitization Rules:**
- Event names/addresses: All HTML tags stripped
- Messages: Basic formatting allowed (b, i, u, em, strong)
- Ground truth facts: All HTML tags stripped
- User names: All HTML tags stripped

---

## Security Services

### services/permissions.py
- `can_view_event()` - Check if user can view event
- `can_edit_event()` - Check if user can edit event
- `can_delete_event()` - Check if user can delete event
- `can_edit_ground_truth()` - Check if user can edit facts
- `require_event_access()` - Raise 403 if no access

### services/sanitize.py
- `sanitize_event_name()` - Strip all HTML
- `sanitize_message_content()` - Allow basic formatting
- `sanitize_ground_truth_value()` - Strip all HTML

### services/auth.py
- `hash_password()` - Bcrypt password hashing
- `verify_password()` - Verify password against hash
- `create_access_token()` - Generate JWT token
- `decode_access_token()` - Validate JWT token

---

## Implemented Security

1. JWT Authentication - Stateless token-based auth
2. Bcrypt Password Hashing - Industry-standard
3. Permission Checks - Event/message/fact access control
4. Input Sanitization - Bleach library prevents XSS
5. Role-Based Access - Host, Co-Host, Attendee hierarchy
6. Visibility Settings - Private, Group-only, Public

---

## NOT Implemented (Required)

1. Rate Limiting - Prevents brute force
2. CSRF Protection - Prevents cross-site attacks
3. Email Verification - Validates user emails
4. Refresh Tokens - Shorter-lived access tokens
5. Security Headers - X-Frame-Options, CSP, etc.
6. API Key Management - Keys should be in env vars
7. Audit Logging - Track security-relevant operations

---

## Reporting Security Issues

If you discover a security vulnerability, please email: [fwoxieee@yorru.net]

**Do not** create public GitHub issues for security vulnerabilities.

---

## Changelog

**v0.0.2** (December 2025)
- Comprehensive security audit conducted
- 47 vulnerabilities identified
- Documentation updated with findings

**v0.0.1** (November 2025)
- Initial security implementation
- JWT authentication
- Permission system for events/messages/facts
- Input sanitization with Bleach
- Bcrypt password hashing
