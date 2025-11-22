# 🎯 YORRU - QUICK START GUIDE

**Version:** 0.0.2
**Last Updated:** 2025-11-22
**Status:** Backend + Database deployed on Railway
**Brand:** Yorru (夜 - "yoru" meaning night in Japanese)

---

## ✅ WHAT'S BEEN COMPLETED

### 1. **Repository Restructure**
- Removed v0/v1 nesting, clean structure now (backend/, database/, docs/)
- Created organized docs/ folder (deployment/, development/)
- Updated Python to 3.12
- Environment-based configuration (.env, .env.staging, .env.example)

### 2. **Railway Deployment**
- Backend deployed (FastAPI with Dockerfile)
- pgvector-pg17 database deployed
- Database schema loaded (production-ready, no seed data)
- Environment variables configured
- Dockerfile optimized with layer caching

### 3. **Current Status**
- Health check pending verification
- Ready to test API endpoints
- Next phase: Build Next.js frontend

---

## 📋 IMMEDIATE NEXT STEPS

### **STEP 1: Verify Railway Deployment**

1. Go to Railway dashboard
2. Check yorru service deployment status
3. Look at deployment logs for any errors
4. Verify health check is passing (green checkmark)

### **STEP 2: Test the Live API**

**Get the Railway URL from the dashboard**, then test:

```bash
# Health check
curl https://yorru-production.up.railway.app/health

# Expected response:
# {"status":"healthy","database":"connected"}
```

**If health check fails:**
- Check Railway logs for errors
- Verify DATABASE_URL is set to `${{pgvector.DATABASE_PRIVATE_URL}}`
- Verify all environment variables are set

---

### **STEP 3: Test API Endpoints**

Visit the Swagger docs at your Railway URL:
```
https://yorru-production.up.railway.app/docs
```

**Test these endpoints:**

1. **Register a user** (POST `/api/auth/register`)
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePass123!",
     "name": "Test User"
   }
   ```

2. **Login** (POST `/api/auth/login`)
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePass123!"
   }
   ```
   Copy the `access_token` from the response.

3. **Get current user** (GET `/api/auth/me`)
   - Click the 🔓 lock icon, paste your token, click "Authorize"
   - Execute the endpoint

4. **Create an event** (POST `/api/events`)
   ```json
   {
     "name": "Test Party",
     "event_type": "tight_knit",
     "date": "2025-12-25",
     "visibility": "private"
   }
   ```

---

### **STEP 4: Local Development (Optional)**

If you want to run the backend locally:

```bash
# Clone repo
git clone https://github.com/Steve6378/yorru.git
cd yorru

# Set up backend
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cp ../.env.example .env
# Edit .env with your values

# Run locally
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🧪 TESTING GUIDE

### **Test 1: Health Check** (No auth required)

**Endpoint:** `GET /health`

1. Go to http://localhost:8000/docs
2. Click on `GET /health`
3. Click "Try it out"
4. Click "Execute"

**Expected response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "events": 16,
  "embeddings": 126
}
```

✅ **Pass:** Database is connected  
❌ **Fail:** Check migrations were run

---

### **Test 2: List Events** (No auth required)

**Endpoint:** `GET /api/events`

1. Click on `GET /api/events`
2. Click "Try it out"
3. Set parameters:
   - skip: 0
   - limit: 10
   - status: active
4. Click "Execute"

**Expected response:**
```json
{
  "total": 16,
  "events": [
    {
      "id": "event001-...",
      "name": "Coffee Study Session",
      "event_type": "tight_knit",
      "date": "2025-11-23",
      "status": "active",
      ...
    }
  ],
  "skip": 0,
  "limit": 10
}
```

✅ **Pass:** You see list of events  
❌ **Fail:** `column events.status does not exist` → Migrations not run

---

### **Test 3: Register New User** (Creates account)

**Endpoint:** `POST /api/auth/register`

⚠️ **WARNING:** This WILL create a user in the database!

1. Click on `POST /api/auth/register`
2. Click "Try it out"
3. Enter JSON body:
```json
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "name": "Test User",
  "phone": "555-1234"
}
```
4. Click "Execute"

**Expected response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "user-abc123...",
  "email": "test@example.com",
  "name": "Test User"
}
```

**Copy the `access_token` value!** You'll need it for next tests.

✅ **Pass:** You get a token  
❌ **Fail:** `Email already registered` → User already exists, try different email

---

### **Test 4: Login** (Get token for existing user)

**Endpoint:** `POST /api/auth/login`

1. Click on `POST /api/auth/login`
2. Click "Try it out"
3. Enter JSON body:
```json
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```
4. Click "Execute"

**Expected response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "user-abc123...",
  "email": "test@example.com",
  "name": "Test User"
}
```

✅ **Pass:** You get a token  
❌ **Fail:** `Invalid email or password` → Check credentials

---

### **Test 5: Get Current User** (Requires auth)

**Endpoint:** `GET /api/auth/me`

1. Click on `GET /api/auth/me`
2. Click "Try it out"
3. **IMPORTANT:** Click the 🔓 lock icon at the top right
4. Paste your token (from Test 3 or 4)
5. Click "Authorize"
6. Click "Execute"

**Expected response (200 OK):**
```json
{
  "id": "user-abc123...",
  "email": "test@example.com",
  "name": "Test User",
  "phone": "555-1234",
  "status": "active",
  "email_verified": false,
  "created_at": "2025-11-19T..."
}
```

✅ **Pass:** You see your user profile  
❌ **Fail:** `401 Unauthorized` → Token is invalid or expired

---

### **Test 6: Create Event** (Requires auth)

**Endpoint:** `POST /api/events`

⚠️ **WARNING:** This WILL create an event in the database!

1. Make sure you're authorized (see Test 5 step 3-5)
2. Click on `POST /api/events`
3. Click "Try it out"
4. Enter JSON body:
```json
{
  "name": "My Test Party",
  "event_type": "tight_knit",
  "date": "2025-12-15",
  "time": "19:00:00",
  "address": "123 Test Street",
  "visibility": "private"
}
```
5. Click "Execute"

**Expected response (201 Created):**
```json
{
  "id": "event-xyz789...",
  "name": "My Test Party",
  "event_type": "tight_knit",
  "date": "2025-12-15",
  "time": "19:00:00",
  "main_host_id": "user-abc123...",  // ← Your user ID!
  "status": "active",
  ...
}
```

**Notice:** `main_host_id` is automatically set to YOUR user ID!

✅ **Pass:** Event created, you're the host  
❌ **Fail:** `401 Unauthorized` → Not logged in

---

### **Test 7: AI Question (No auth required)**

**Endpoint:** `POST /api/events/{event_id}/ask`

1. Click on `POST /api/events/{event_id}/ask`
2. Click "Try it out"
3. Enter event_id: `event001-0001-0001-0001-000000000001`
4. Enter JSON body:
```json
{
  "question": "Where is the party?"
}
```
5. Click "Execute"

**Expected response (200 OK):**
```json
{
  "question": "Where is the party?",
  "answer": "123 Trousdale Parkway, Leavey Library...",
  "source": "semantic_search",
  "confidence": 0.85,
  "key": "address",
  "found": true
}
```

✅ **Pass:** AI found the answer  
❌ **Fail:** `found: false` → Question doesn't match any facts

---

### **Test 8: Update Event** (Requires auth + permission)

**Endpoint:** `PUT /api/events/{event_id}`

Test with the event YOU created (from Test 6):

1. Make sure you're authorized
2. Click on `PUT /api/events/{event_id}`
3. Click "Try it out"
4. Enter your event_id from Test 6
5. Enter JSON body:
```json
{
  "name": "My Updated Party Name"
}
```
6. Click "Execute"

**Expected response (200 OK):**
```json
{
  "id": "event-xyz789...",
  "name": "My Updated Party Name",  // ← Changed!
  ...
}
```

**Now try to update someone else's event:**
- event_id: `event001-0001-0001-0001-000000000001`

**Expected response (403 Forbidden):**
```json
{
  "detail": "Only the host can update this event"
}
```

✅ **Pass:** You can update your events, but not others'  
❌ **Fail:** You can update any event → Permission check broken

---

### **Test 9: Delete Event** (Requires auth + permission)

**Endpoint:** `DELETE /api/events/{event_id}`

⚠️ **WARNING:** This soft-deletes the event!

1. Use YOUR event from Test 6
2. Click on `DELETE /api/events/{event_id}`
3. Click "Try it out"
4. Enter your event_id
5. Click "Execute"

**Expected response (200 OK):**
```json
{
  "message": "Event deleted successfully",
  "event_id": "event-xyz789...",
  "deleted_at": "2025-11-19T..."
}
```

✅ **Pass:** Event soft-deleted  
❌ **Fail:** `403 Forbidden` → Permission check working correctly

---

## 🔍 TESTING WITH CURL (Alternative)

If you prefer command-line testing:

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "curl@example.com",
    "password": "TestPass123!",
    "name": "Curl User"
  }'

# Save the token from response
TOKEN="eyJhbGci..."
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "curl@example.com",
    "password": "TestPass123!"
  }'
```

### Get Profile
```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Create Event
```bash
curl -X POST http://localhost:8000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Curl Test Party",
    "event_type": "tight_knit",
    "date": "2025-12-20"
  }'
```

### List Events
```bash
curl http://localhost:8000/api/events
```

### Ask AI
```bash
curl -X POST http://localhost:8000/api/events/event001-0001-0001-0001-000000000001/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What should I wear?"}'
```

---

## 🧹 CLEANUP TEST DATA

After testing, clean up test data:

```sql
-- Connect to database
psql -U festivio_admin -d house_party_db -h localhost

-- Delete test users
DELETE FROM users WHERE email LIKE '%@example.com' OR email LIKE 'test%';

-- Delete test events (soft-deleted ones)
DELETE FROM events WHERE name LIKE 'Test%' OR name LIKE 'Curl%';

-- Or just soft-delete test events
UPDATE events SET status = 'deleted', deleted_at = NOW()
WHERE name LIKE 'Test%' OR name LIKE 'Curl%';
```

---

## 🛠️ OPTIONAL: SET UP TEST DATABASE

If you want a separate database for testing:

```bash
# Create test database
sudo -u postgres psql
CREATE DATABASE house_party_test;
GRANT ALL PRIVILEGES ON DATABASE house_party_test TO festivio_admin;
\q

# Create vector extension (as superuser)
sudo -u postgres psql -d house_party_test -c "CREATE EXTENSION vector;"

# Load schema
psql -U festivio_admin -d house_party_test -h localhost \
  -f database/schema.sql

# Load seed data
psql -U festivio_admin -d house_party_test -h localhost \
  -f database/seed_data_comprehensive.sql

# Run migrations
psql -U festivio_admin -d house_party_test -h localhost \
  -f database/migrations/001_add_status_columns.sql

psql -U festivio_admin -d house_party_test -h localhost \
  -f database/migrations/002_fix_table_names_and_missing_columns.sql

# Generate embeddings
cd ~/yorru/backend
python3 scripts/generate_embeddings.py
```

**Switch databases:**
```bash
# Edit .env file
nano ~/yorru/backend/.env

# Change DATABASE_URL to:
DATABASE_URL=postgresql://festivio_admin:PASSWORD@localhost:5432/house_party_test

# Restart server
python3 main.py
```

---

## ✅ CHECKLIST

Before moving to next phase:

- [ ] Migrations ran successfully
- [ ] Server starts without errors
- [ ] Health check returns `healthy`
- [ ] Can list events
- [ ] Can register new user
- [ ] Can login and get token
- [ ] Token works for /auth/me
- [ ] Can create event (auto-sets host)
- [ ] AI semantic search works
- [ ] Can update own event
- [ ] Cannot update others' events
- [ ] Can delete own event

---

## 🚀 WHAT'S NEXT

Once all tests pass, you can:

1. **Build more endpoints** (Messages, Todos, Polls)
2. **Add WebSocket** for realtime chat
3. **Start frontend** (Next.js + React)
4. **Add email verification** for new users
5. **Add Google OAuth** as alternative login

---

## 🆘 TROUBLESHOOTING

### "column events.status does not exist"
→ Run migration 001

### "relation 'event_attendance' does not exist"
→ Run migration 002

### "401 Unauthorized" on protected routes
→ Make sure you clicked the 🔓 lock and pasted your token

### "403 Only the host can update"
→ Working as intended! You can only modify events you created

### "Invalid or expired token"
→ Token expired (7 days). Login again to get new token

### Server won't start
→ Check if venv is activated: `which python3` should show `/home/ubuntu/festivio_env/bin/python3`

---

## 📊 API ENDPOINTS SUMMARY

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Database health check |
| GET | `/api/events` | No | List events |
| GET | `/api/events/{id}` | No | Get event details |
| POST | `/api/events` | **Yes** | Create event (host auto-set) |
| PUT | `/api/events/{id}` | **Yes** | Update event (host only) |
| DELETE | `/api/events/{id}` | **Yes** | Delete event (host only) |
| POST | `/api/events/{id}/archive` | **Yes** | Archive event (host only) |
| GET | `/api/events/{id}/facts` | No | List ground truth facts |
| POST | `/api/events/{id}/ask` | No | AI question answering |
| POST | `/api/events/{id}/facts` | No* | Create fact (TODO: add auth) |
| POST | `/api/auth/register` | No | Create new user |
| POST | `/api/auth/login` | No | Login, get JWT token |
| GET | `/api/auth/me` | **Yes** | Get current user profile |

*TODO: Ground truth endpoints should require auth (host only)

---

**Good luck testing! 🎉**

When you're done, let me know if you want to:
- Build more endpoints
- Fix any bugs you found
- Start the frontend
- Add more features

