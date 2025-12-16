# Red Team Testing Setup Guide

This document describes how to enable Claude Code to perform dynamic security testing on the Yorru application.

---

## Environment Configuration

### Required Domain Allowlist

Add these domains to Claude's egress allowlist:

```
yorru.net
www.yorru.net
yorru-production.up.railway.app
```

### Optional: Test Credentials

Provide a test account for authenticated endpoint testing:
```
Email: [test account email]
Password: [test account password]
Event ID: [a test event ID for probing]
```

Or allow Claude to register a throwaway account.

---

## Scope of Testing

### Allowed
- Registration / Login testing
- Brute force attempts (for rate limiting validation)
- Create/delete test events
- Upload/delete test files
- WebSocket connection testing
- API endpoint fuzzing
- CORS / Header testing
- Authentication bypass attempts
- Authorization / IDOR testing
- Input validation (XSS, SQLi patterns)

### Not Allowed
- DDoS or stress testing
- Heavy AI endpoint abuse (costs OpenAI tokens)
- Modification of real user data
- Destructive operations on production data

---

## Testing Checklist for Dynamic Analysis

### Infrastructure & Headers
- [ ] Check HTTPS enforcement
- [ ] Verify security headers (CSP, X-Frame-Options, HSTS, etc.)
- [ ] Test CORS configuration with malicious origins
- [ ] Check server version disclosure

### Authentication
- [ ] Test rate limiting on /api/auth/login
- [ ] Test rate limiting on /api/auth/register
- [ ] Verify JWT expiration
- [ ] Test token in URL logging risk
- [ ] Check for account enumeration
- [ ] Test password reset flow (if exists)

### Authorization
- [ ] Test IDOR on event endpoints (access other users' events)
- [ ] Test co-host permission boundaries
- [ ] Test private event access without invitation
- [ ] Test group-only event access without membership

### Input Validation
- [ ] XSS in chat messages
- [ ] XSS in event names/descriptions
- [ ] SQL injection patterns
- [ ] Path traversal in file endpoints
- [ ] Command injection in any shell-interacting endpoints

### File Upload
- [ ] Upload malicious file types
- [ ] Test file size limits
- [ ] Test path traversal in filenames
- [ ] Check content-type validation

### WebSocket
- [ ] Test authentication bypass
- [ ] Test room hopping (access other events' chats)
- [ ] Test message injection
- [ ] Test reconnection handling

### API Security
- [ ] Test all endpoints without auth
- [ ] Test parameter tampering
- [ ] Test HTTP method override
- [ ] Check error message information disclosure

### AI Endpoints
- [ ] Test prompt injection (limited - don't spam)
- [ ] Test context leakage
- [ ] Verify response doesn't expose system prompts

---

## How to Request a Red Team Session

1. Ensure domains are in allowlist
2. Provide test credentials (optional but helpful)
3. Start new Claude Code session
4. Reference this document and SECURITY_ASSESSMENT.md
5. Ask Claude to perform dynamic testing

Example prompt:
```
I've added yorru.net, www.yorru.net, and yorru-production.up.railway.app to your allowlist.

Test credentials:
- Email: test@yorru.net
- Password: TestPass123!
- Test Event ID: event-abc123

Please perform dynamic security testing on the live site.
Reference RED_TEAM_SETUP.md for scope and SECURITY_ASSESSMENT.md for known issues.
Focus on verifying if previous issues are fixed.
```

---

## Post-Testing

Claude should document:
1. All requests made (endpoint, method, payload)
2. All findings (new vulnerabilities discovered)
3. Verification of previously reported issues (fixed or still present)
4. Recommendations for remediation
