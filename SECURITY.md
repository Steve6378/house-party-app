# Yorru Security Model

**Version:** 0.0.1
**Last Updated:** November 2025

This document outlines the security and permission model implemented in the Yorru backend.

---

## Authentication

**All API endpoints require authentication via JWT tokens.**

- Tokens are issued on login/registration
- Tokens expire in 7 days (configurable)
- Tokens must be sent in Authorization header: `Bearer <token>`

---

## Permission System

### Event Visibility Levels

Events have three visibility settings that determine who can access them:

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

**Group Member (group_memberships table)**
- Can view group-only events
- Role: `admin` or `member`

---

## Endpoint Security Matrix

### Authentication Endpoints
| Endpoint | Auth Required | Permission Check |
|----------|---------------|------------------|
| POST /api/auth/register | No | - |
| POST /api/auth/login | No | - |
| GET /api/auth/me | Yes | Own profile |

### Event Endpoints
| Endpoint | Auth Required | Permission Check |
|----------|---------------|------------------|
| GET /api/events | Yes | Returns only accessible events |
| GET /api/events/{id} | Yes | Must have view access (based on visibility) |
| POST /api/events | Yes | Auto-sets user as host |
| PUT /api/events/{id} | Yes | Host or co-host with `edit_all` |
| DELETE /api/events/{id} | Yes | Host only |
| POST /api/events/{id}/archive | Yes | Host or co-host with `edit_all` |

**View Access Rules:**
- Private: Host, co-hosts, or invited attendees
- Group-only: Group members, host, co-hosts, or invited attendees
- Public: Any logged-in user

### Message Endpoints
| Endpoint | Auth Required | Permission Check |
|----------|---------------|------------------|
| POST /api/events/{id}/messages | Yes | Must have view access to event |
| GET /api/events/{id}/messages | Yes | Must have view access to event |
| GET /api/messages/{id} | Yes | Must have view access to parent event |
| PUT /api/messages/{id} | Yes | Sender only |
| DELETE /api/messages/{id} | Yes | Sender only |

### Ground Truth Endpoints
| Endpoint | Auth Required | Permission Check |
|----------|---------------|------------------|
| POST /api/events/{id}/ask | Yes | Must have view access to event |
| GET /api/events/{id}/facts | Yes | Must have view access to event |
| POST /api/events/{id}/facts | Yes | Host or co-host with `edit_facts`/`edit_all` |
| PUT /api/events/{id}/facts/{fact_id} | Yes | Host or co-host with `edit_facts`/`edit_all` |
| DELETE /api/events/{id}/facts/{fact_id} | Yes | Host or co-host with `edit_facts`/`edit_all` |

---

## Input Sanitization

All user input is sanitized using the Bleach library to prevent XSS attacks.

**Sanitization Rules:**
- Event names/addresses: **All HTML tags stripped**
- Messages: **Basic formatting allowed** (b, i, u, em, strong tags)
- Ground truth facts: **All HTML tags stripped**
- User names: **All HTML tags stripped**

**Implementation:** `services/sanitize.py`

---

## Security Services

### services/permissions.py
Centralized permission checking logic:
- `can_view_event()` - Check if user can view event
- `can_edit_event()` - Check if user can edit event
- `can_delete_event()` - Check if user can delete event
- `can_edit_ground_truth()` - Check if user can edit facts
- `require_event_access()` - Raise 403 if no access
- `get_user_events()` - Get all events user can access

### services/sanitize.py
Input sanitization utilities:
- `sanitize_event_name()` - Strip all HTML
- `sanitize_event_address()` - Strip all HTML
- `sanitize_message_content()` - Allow basic formatting
- `sanitize_ground_truth_value()` - Strip all HTML

### services/auth.py
Authentication utilities:
- `hash_password()` - Bcrypt password hashing
- `verify_password()` - Verify password against hash
- `create_access_token()` - Generate JWT token
- `decode_access_token()` - Validate JWT token

---

## Security Decisions

### ✅ Implemented

1. **JWT Authentication** - Stateless token-based auth
2. **Bcrypt Password Hashing** - Industry-standard, slow by design
3. **Permission Checks** - Comprehensive event/message/fact access control
4. **Input Sanitization** - Bleach library prevents XSS
5. **Role-Based Access** - Host, Co-Host, Attendee hierarchy
6. **Visibility Settings** - Private, Group-only, Public events

### ⚠️ Not Implemented Yet (See FUTURE_FEATURES.md)

1. **Rate Limiting** - Would require Redis
2. **CORS Restrictions** - Currently allows all origins (development only)
3. **Email Verification** - Accounts created without email verification
4. **Refresh Tokens** - Single JWT with 7-day expiry
5. **Device Tracking** - No multi-device session management
6. **OAuth/Social Login** - No Google/Apple/Facebook login yet

---

## Common Security Questions

**Q: Can any user view any event if they know the ID?**
A: No. Permission checks verify visibility settings and membership before allowing access.

**Q: Can users create events as other users?**
A: No. `main_host_id` is auto-set to the logged-in user's ID.

**Q: Can co-hosts delete events?**
A: No. Only the main host can delete events.

**Q: Can attendees edit ground truth facts?**
A: No. Only host and co-hosts with `edit_facts` or `edit_all` permissions.

**Q: Are passwords stored in plain text?**
A: No. Passwords are hashed using bcrypt before storage.

**Q: Can users inject HTML/JavaScript into event names or messages?**
A: No. All input is sanitized using Bleach to strip HTML tags.

---

## Testing Security

### Test Scenarios

1. **Unauthorized Access**
   - Try to view private event without invitation → 403 Forbidden
   - Try to edit event as non-host → 403 Forbidden
   - Try to delete message as non-sender → 403 Forbidden

2. **XSS Prevention**
   - Create event with name: `<script>alert('XSS')</script>`
   - Verify HTML tags are stripped from database

3. **Password Security**
   - Register with password "password123"
   - Verify password is hashed (not plain text) in database

4. **Token Expiration**
   - Login and get token
   - Wait 7 days
   - Try to use token → 401 Unauthorized

---

## Reporting Security Issues

If you discover a security vulnerability, please email: [security@yorru.net]

**Do not** create public GitHub issues for security vulnerabilities.

---

## Changelog

**v0.0.1** (November 2025)
- Initial security implementation
- JWT authentication
- Permission system for events/messages/facts
- Input sanitization with Bleach
- Bcrypt password hashing
