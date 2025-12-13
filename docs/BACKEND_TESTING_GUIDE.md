# Backend Testing Guide - Complete Walkthrough

**Version:** 0.0.3
**Last Updated:** 2025-11-26
**Purpose:** Step-by-step guide to test your deployed Railway backend

---

## Prerequisites

- Backend deployed to Railway
- Database deployed to Railway
- You have the Railway DATABASE_PUBLIC_URL
- You have the Railway backend URL (e.g., `https://yorru-production.up.railway.app`)

---

## Part 1: Run Migrations (REQUIRED FIRST!)

### Step 1.1: Get Your Database URL

1. Go to Railway dashboard: https://railway.app
2. Click on your **pgvector database** service (NOT the backend)
3. Click "Variables" tab
4. Copy the `DATABASE_PUBLIC_URL` value
   - Should look like: `postgresql://postgres:PASSWORD@shinkansen.proxy.rlwy.net:12930/railway`

### Step 1.2: Run Migrations on Your Local Machine

Open terminal on your local computer (where you have the `yorru` repo):

```bash
# Navigate to your yorru directory
cd ~/yorru

# Run migrations (replace YOUR_DATABASE_URL with the actual URL)
psql "postgresql://postgres:PASSWORD@shinkansen.proxy.rlwy.net:12930/railway" \
  -f database/migrations/001_add_status_columns.sql

psql "postgresql://postgres:PASSWORD@shinkansen.proxy.rlwy.net:12930/railway" \
  -f database/migrations/002_fix_table_names_and_missing_columns.sql

psql "postgresql://postgres:PASSWORD@shinkansen.proxy.rlwy.net:12930/railway" \
  -f database/migrations/003_add_group_chat_support.sql

psql "postgresql://postgres:PASSWORD@shinkansen.proxy.rlwy.net:12930/railway" \
  -f database/migrations/004_add_image_url_support.sql

psql "postgresql://postgres:PASSWORD@shinkansen.proxy.rlwy.net:12930/railway" \
  -f database/migrations/005_migrate_event_attendance.sql

psql "postgresql://postgres:PASSWORD@shinkansen.proxy.rlwy.net:12930/railway" \
  -f database/migrations/006_add_document_tables.sql
```

**Or run all migrations at once:**
```bash
psql "postgresql://postgres:PASSWORD@shinkansen.proxy.rlwy.net:12930/railway" \
  -f database/run_all_migrations.sql
```

**Expected output for each:**
```
ALTER TABLE
ALTER TABLE
CREATE TABLE
...
```

**If you get errors:**
- `psql: command not found` → Install PostgreSQL client: `brew install postgresql` (Mac) or `sudo apt install postgresql-client` (Linux)
- `FATAL: password authentication failed` → Wrong DATABASE_URL, copy it again
- `column already exists` → Migration already ran, that's fine!

---

## Part 2: Access Swagger UI

### Step 2.1: Get Your Backend URL

1. Go to Railway dashboard
2. Click on your **yorru backend** service (FastAPI one)
3. Click "Settings" tab
4. Find the "Public Networking" section
5. Copy the domain (e.g., `yorru-production.up.railway.app`)

### Step 2.2: Open Swagger Docs

Open in browser:
```
https://YOUR-BACKEND-URL/docs
```

Example: `https://yorru-production.up.railway.app/docs`

**You should see:** Interactive API documentation with all endpoints listed

**If you see 404 or error:**
- Check Railway deployment logs (click "Deployments" tab)
- Make sure latest commit is deployed (green checkmark)
- Check build logs for Python errors

---

## Part 3: Test Authentication Flow

### Test 3.1: Register New User

**Endpoint:** `POST /api/auth/register`

1. Find "POST /api/auth/register" in Swagger
2. Click "Try it out"
3. Paste this JSON:

```json
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "name": "Test User",
  "phone": "555-1234"
}
```

4. Click "Execute"

**Expected Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "user-abc123-...",
  "email": "test@example.com",
  "name": "Test User"
}
```

**IMPORTANT:** Copy the `access_token` value! You'll need it for all authenticated requests.

**Common Errors:**
- `Email already registered` → Change email to `test2@example.com`
- `500 Internal Server Error` → Check Railway logs, likely migration not run
- `column users.profile_picture_url does not exist` → Run migration 002

---

### Test 3.2: Login

**Endpoint:** `POST /api/auth/login`

1. Find "POST /api/auth/login"
2. Click "Try it out"
3. Paste:

```json
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```

4. Click "Execute"

**Expected Response (200 OK):**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user_id": "user-abc123-...",
  "email": "test@example.com",
  "name": "Test User"
}
```

---

### Test 3.3: Authorize Swagger with Token

**Before testing authenticated endpoints, you MUST authorize:**

1. Look at the top right of Swagger UI
2. Click the **"Authorize"** button (lock icon)
3. Paste your `access_token` in the "Value" field
4. Click "Authorize"
5. Click "Close"

**Now all authenticated endpoints will use your token automatically.**

---

### Test 3.4: Get Current User Profile

**Endpoint:** `GET /api/auth/me`

1. Find "GET /api/auth/me"
2. Click "Try it out"
3. Click "Execute"

**Expected Response (200 OK):**
```json
{
  "id": "user-abc123-...",
  "email": "test@example.com",
  "name": "Test User",
  "phone": "555-1234",
  "profile_picture_url": null,
  "status": "active",
  "email_verified": false,
  "created_at": "2025-11-23T..."
}
```

**Common Errors:**
- `401 Unauthorized` → Click Authorize button and add your token
- `Invalid or expired token` → Token expired (7 days), login again

---

### Test 3.5: Update Profile Picture (Image URL Support)

**Endpoint:** `PUT /api/auth/me`

1. Find "PUT /api/auth/me"
2. Click "Try it out"
3. Paste:

```json
{
  "profile_picture_url": "https://i.imgur.com/abc123.jpg"
}
```

4. Click "Execute"

**Expected Response (200 OK):**
```json
{
  "id": "user-abc123-...",
  "profile_picture_url": "https://i.imgur.com/abc123.jpg",
  ...
}
```

---

## Part 4: Test Group Management

### Test 4.1: Create a Group

**Endpoint:** `POST /api/groups`

1. Find "POST /api/groups"
2. Click "Try it out"
3. Paste:

```json
{
  "name": "Test Group",
  "description": "My test group for testing",
  "is_private": true
}
```

4. Click "Execute"

**Expected Response (201 Created):**
```json
{
  "id": "group-xyz789-...",
  "name": "Test Group",
  "description": "My test group for testing",
  "is_private": true,
  "created_at": "2025-11-23T...",
  "updated_at": "2025-11-23T...",
  "member_count": 1
}
```

**IMPORTANT:** Copy the `id` (group_id)! You'll need it.

**Notice:** `member_count` is 1 because you (the creator) are auto-added as admin.

---

### Test 4.2: List Your Groups

**Endpoint:** `GET /api/groups`

1. Find "GET /api/groups"
2. Click "Try it out"
3. Click "Execute"

**Expected Response (200 OK):**
```json
[
  {
    "id": "group-xyz789-...",
    "name": "Test Group",
    "description": "My test group for testing",
    "is_private": true,
    "created_at": "2025-11-23T...",
    "member_count": 1
  }
]
```

---

### Test 4.3: Get Group Details

**Endpoint:** `GET /api/groups/{group_id}`

1. Find "GET /api/groups/{group_id}"
2. Click "Try it out"
3. Paste your group_id in the `group_id` field
4. Click "Execute"

**Expected Response (200 OK):**
```json
{
  "id": "group-xyz789-...",
  "name": "Test Group",
  "description": "My test group for testing",
  "is_private": true,
  "created_at": "2025-11-23T...",
  "member_count": 1,
  "members": [
    {
      "user_id": "user-abc123-...",
      "role": "admin",
      "joined_at": "2025-11-23T..."
    }
  ]
}
```

**Notice:** You're listed as a member with role "admin".

---

## Part 5: Test Multi-Room Chat (NEW!)

### Test 5.1: Send Message to Group General Chat

**Endpoint:** `POST /api/groups/{group_id}/messages`

1. Find "POST /api/groups/{group_id}/messages"
2. Click "Try it out"
3. Paste your group_id
4. Paste this JSON:

```json
{
  "content": "Hello everyone in general chat!",
  "message_type": "user"
}
```

5. Click "Execute"

**Expected Response (201 Created):**
```json
{
  "id": "msg-abc123-...",
  "event_id": null,
  "group_id": "group-xyz789-...",
  "sender_id": "user-abc123-...",
  "message_type": "user",
  "content": "Hello everyone in general chat!",
  "is_edited": false,
  "is_deleted": false,
  "created_at": "2025-11-23T..."
}
```

**KEY POINT:** `group_id` is set, `event_id` is null - This is a group general chat message!

**Common Errors:**
- `403 Forbidden` → Not a group member (shouldn't happen if you created it)
- `500 Internal Server Error` → Migration 003 not run! Go back to Part 1.
- `column messages.group_id does not exist` → Migration 003 NOT run!

---

### Test 5.2: Get Group General Chat Messages

**Endpoint:** `GET /api/groups/{group_id}/messages`

1. Find "GET /api/groups/{group_id}/messages"
2. Click "Try it out"
3. Paste your group_id
4. Click "Execute"

**Expected Response (200 OK):**
```json
{
  "total": 1,
  "messages": [
    {
      "id": "msg-abc123-...",
      "event_id": null,
      "group_id": "group-xyz789-...",
      "sender_id": "user-abc123-...",
      "content": "Hello everyone in general chat!",
      ...
    }
  ],
  "skip": 0,
  "limit": 50
}
```

---

## Part 6: Test Events in Groups

### Test 6.1: Create Event in Group

**Endpoint:** `POST /api/events`

1. Find "POST /api/events"
2. Click "Try it out"
3. Paste (use YOUR group_id):

```json
{
  "name": "Test Party",
  "event_type": "tight_knit",
  "date": "2025-12-25",
  "time": "19:00:00",
  "address": "123 Test Street",
  "cover_image_url": "https://i.imgur.com/party.jpg",
  "group_id": "group-xyz789-...",
  "budget_per_person": 25.50,
  "expected_guests": 20,
  "visibility": "private"
}
```

4. Click "Execute"

**Expected Response (201 Created):**
```json
{
  "id": "event-abc123-...",
  "name": "Test Party",
  "event_type": "tight_knit",
  "date": "2025-12-25",
  "time": "19:00:00",
  "address": "123 Test Street",
  "cover_image_url": "https://i.imgur.com/party.jpg",
  "main_host_id": "user-abc123-...",
  "group_id": "group-xyz789-...",
  "status": "active",
  "visibility": "private",
  ...
}
```

**IMPORTANT:** Copy the event `id`! You'll need it.

**Notice:**
- `main_host_id` is automatically set to YOU (the logged-in user)
- `group_id` links this event to your group

---

### Test 6.2: Send Message to Event Chat

**Endpoint:** `POST /api/events/{event_id}/messages`

1. Find "POST /api/events/{event_id}/messages"
2. Click "Try it out"
3. Paste your event_id
4. Paste:

```json
{
  "content": "Hey, what should I bring to the party?",
  "message_type": "user"
}
```

5. Click "Execute"

**Expected Response (201 Created):**
```json
{
  "id": "msg-def456-...",
  "event_id": "event-abc123-...",
  "group_id": null,
  "sender_id": "user-abc123-...",
  "content": "Hey, what should I bring to the party?",
  ...
}
```

**KEY POINT:** `event_id` is set, `group_id` is null - This is an event-specific message!

---

### Test 6.3: Get Event Chat Messages

**Endpoint:** `GET /api/events/{event_id}/messages`

1. Find "GET /api/events/{event_id}/messages"
2. Click "Try it out"
3. Paste your event_id
4. Click "Execute"

**Expected Response (200 OK):**
```json
{
  "total": 1,
  "messages": [
    {
      "id": "msg-def456-...",
      "event_id": "event-abc123-...",
      "group_id": null,
      "content": "Hey, what should I bring to the party?",
      ...
    }
  ],
  "skip": 0,
  "limit": 50
}
```

---

### Test 6.4: Verify Chat Separation (CRITICAL TEST!)

**This verifies that group chat and event chat are SEPARATE.**

**Step 1:** Get group general chat
```
GET /api/groups/{group_id}/messages
```

**Should return:** Only the "Hello everyone in general chat!" message

**Step 2:** Get event chat
```
GET /api/events/{event_id}/messages
```

**Should return:** Only the "Hey, what should I bring to the party?" message

**SUCCESS CRITERIA:**
- Group chat has 1 message (general chat message)
- Event chat has 1 message (event message)
- They are DIFFERENT messages
- No overlap!

**If you see the same messages in both:**
- Migration 003 didn't work properly
- Check database: `psql "YOUR_DB_URL" -c "SELECT event_id, group_id FROM messages;"`
- One should have `event_id` set, one should have `group_id` set

---

## Part 7: Verify Multi-Room Architecture

### Conceptual Check

You now have:
```
Test Group
├─ General Chat (1 message)
│  └─ "Hello everyone in general chat!"
│
└─ Events:
   └─ Test Party (1 message)
      └─ "Hey, what should I bring to the party?"
```

**This is the Discord/Slack-like multi-room model!**

Each chat is independent:
- Social/casual stuff → General chat
- Event logistics → Event chat
- AI can answer questions in event chat using ground truth
- No confusion!

---

## Part 8: Test Additional Features

### Test 8.1: Add Member to Group

**First, create a second user:**

1. **Logout** (click Authorize button → click "Logout")
2. Register new user: `POST /api/auth/register` with `test2@example.com`
3. Copy the new `access_token` and `user_id`
4. **Logout again**
5. **Login back as first user** (Authorize with original token)

**Now add the second user to your group:**

**Endpoint:** `POST /api/groups/{group_id}/members`

```json
{
  "user_id": "user-def456-...",  // Second user's ID
  "role": "member"
}
```

**Expected Response (201 Created):**
```json
{
  "user_id": "user-def456-...",
  "role": "member",
  "joined_at": "2025-11-23T..."
}
```

---

### Test 8.2: Second User Can See Group Chat

1. **Logout** (click Authorize → Logout)
2. **Login as second user** (Authorize with second user's token)
3. `GET /api/groups/{group_id}/messages`

**Expected:** Second user can now see the group general chat messages!

---

### Test 8.3: Update Event with Image

**Endpoint:** `PUT /api/events/{event_id}`

```json
{
  "cover_image_url": "https://i.imgur.com/updated.jpg"
}
```

**Expected Response (200 OK):**
```json
{
  "id": "event-abc123-...",
  "cover_image_url": "https://i.imgur.com/updated.jpg",
  ...
}
```

---

## Part 9: Common Issues & Solutions

### Issue 1: "column does not exist" errors

**Symptom:** `column messages.group_id does not exist`

**Fix:** Run migration 003:
```bash
psql "YOUR_DB_URL" -f database/migrations/003_add_group_chat_support.sql
```

---

### Issue 2: "401 Unauthorized" on all endpoints

**Symptom:** Every request returns 401

**Fix:**
1. Click "Authorize" button in Swagger
2. Paste your token (from login/register response)
3. Make sure token isn't expired (7 days)

---

### Issue 3: "500 Internal Server Error"

**Symptom:** Server crashes on requests

**Fix:**
1. Check Railway deployment logs
2. Look for Python errors
3. Common causes:
   - Migrations not run
   - Missing environment variables
   - Database connection issues

---

### Issue 4: Empty response or no data

**Symptom:** Endpoints work but return empty lists

**Fix:** You need to create data first:
1. Register user
2. Create group
3. Send messages
4. Create events

---

## Part 10: Full Test Checklist

Copy this checklist and check off as you test:

```
Migrations Run:
  [ ] Migration 001 - status columns
  [ ] Migration 002 - table fixes
  [ ] Migration 003 - group chat support
  [ ] Migration 004 - image URL support
  [ ] Migration 005 - event attendance PK change
  [ ] Migration 006 - document tables

Authentication:
  [ ] Can register new user
  [ ] Can login
  [ ] Can get current user profile
  [ ] Can update profile picture URL

Groups:
  [ ] Can create group
  [ ] Can list my groups
  [ ] Can get group details
  [ ] Can add member to group
  [ ] Can remove member from group

Multi-Room Chat:
  [ ] Can send message to group general chat
  [ ] Can get group general chat messages
  [ ] Can create event in group
  [ ] Can send message to event chat
  [ ] Can get event chat messages
  [ ] Group chat and event chat are SEPARATE

Events:
  [ ] Can create event (with/without group)
  [ ] Can list events
  [ ] Can get event details
  [ ] Can update event
  [ ] Can add cover image URL

Permissions:
  [ ] Non-members can't see group chat
  [ ] Non-members can't see private events
  [ ] Can only edit own messages
  [ ] Can only delete own messages
```

---

## Part 11: Next Steps

Once all tests pass:

1. **Load seed data** (optional, for testing with realistic data):
   ```bash
   psql "YOUR_DB_URL" -f database/seed_data_comprehensive.sql
   ```

2. **Build frontend** with REST polling

3. **Add WebSocket** for real-time chat (later)

---

## Quick Reference: Important URLs

**Railway Dashboard:** https://railway.app

**Swagger UI:** `https://YOUR-BACKEND-URL/docs`

**Health Check:** `https://YOUR-BACKEND-URL/health`

---

**Testing Complete!**

If all tests pass, your backend is ready for frontend development!
