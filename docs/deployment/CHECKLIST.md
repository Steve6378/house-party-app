# Yorru Deployment Checklist

**Last Updated:** 2025-12-02
**Current Phase:** MVP Bug Fixes & Polish

---

## Phase 1: Repository Restructure

- [x] Repository renamed to `yorru`
- [x] Code rebranded from Festivio to Yorru
- [x] Repository restructured (removed v0/v1 nesting)
- [x] Moved to backend/ and database/ at root
- [x] Created docs/ folder (deployment/, development/)
- [x] Deployment files created (Dockerfile, railway.json, Procfile)
- [x] Python updated to 3.12
- [x] Environment-based config (.env, .env.staging, .env.example)
- [x] All code pushed to GitHub (`main` branch)

---

## Phase 2: Railway Deployment

- [x] Railway account created
- [x] GitHub repository connected
- [x] Branch deployed: `main`
- [x] pgvector-pg17 database deployed
- [x] Backend service deployed (FastAPI)
- [x] Environment variables configured
- [x] Dockerfile created (optimized with layer caching)
- [x] railway.json configured (DOCKERFILE builder, health check)
- [x] Database schema loaded into pgvector database
- [x] Health check verification passed
- [x] API endpoints tested
- [x] Auto-deploy from GitHub enabled

---

## Phase 3: DNS & Domain Setup

- [x] Domain purchased (`yorru.net`)
- [x] Cloudflare account created
- [x] Nameservers updated to Cloudflare
- [x] `app.yorru.net` → Frontend (Vercel)
- [ ] `api.yorru.net` → Railway backend (optional custom domain)

---

## Phase 4: Frontend Development

- [x] React + Vite project setup (`frontend/`)
- [x] TypeScript configured
- [x] Tailwind CSS installed
- [x] JWT authentication with Zustand store
- [x] Protected routes setup
- [x] Vercel deployment configured
- [x] Environment variables set (VITE_API_URL, etc.)
- [x] Custom domain configured (`app.yorru.net`)

### Core Pages
- [x] Login page (`/login`)
- [x] Register page (`/register`)
- [x] Dashboard (`/dashboard`)
- [x] Event list (in dashboard)
- [x] Event detail (`/event/:id`)
- [x] Event creation (`/create-event`)
- [x] Guest interface (`/event/:id/guest`)
- [x] Host interface (`/event/:id/host`)
- [x] Profile page (`/profile`)
- [x] Calendar page (`/calendar`)
- [x] Discover page (`/discover`)

---

## Phase 5: Real-time Features (WebSocket)

- [x] `python-socketio` installed on backend
- [x] `socket.io-client` installed on frontend
- [x] WebSocket endpoint created
- [x] Room management (join event room)
- [x] Broadcasting to event participants
- [x] Group chat functionality
- [x] Auto-reconnection handling
- [x] Frontend WebSocket hook created

---

## Phase 6: Photo Storage

- [x] Cloudflare R2 storage configured
- [x] Local fallback storage working
- [x] Upload endpoint (`POST /api/events/{id}/photos`)
- [x] Photo metadata in PostgreSQL
- [x] Frontend upload UI
- [x] Face recognition for photo search (OpenCV)
- [x] Profile photo upload with cropping
- [x] Event cover image upload with aspect ratio selection

---

## Phase 7: AI Features

- [x] OpenAI API integration
- [x] RAG system (LangChain) for event Q&A
- [x] Guest AI assistant (#general mode)
- [x] Host AI assistant (event planning help)
- [x] AI-generated event descriptions
- [x] AI-generated cover images (DALL-E)
- [x] FAQ auto-tracking from guest questions
- [x] Face recognition photo search (#photos mode)
- [x] Greeting detection (no yapping on "hi")

---

## Phase 8: Database Migrations

Current migrations:
- [x] 001_add_status_columns.sql
- [x] 002_fix_table_names_and_missing_columns.sql
- [x] 003_add_group_chat_support.sql
- [x] 004_add_image_url_support.sql
- [x] 005_migrate_event_attendance.sql
- [x] 006_add_document_tables.sql
- [x] 007_add_photos_and_faqs.sql
- [x] 008_add_user_profile_columns.sql
- [x] 009_add_event_columns.sql
- [x] 010_add_face_encodings_column.sql

---

## Phase 9: PR #16 Integration Fixes

- [x] Fix numpy/opencv version conflict (downgrade opencv to 4.9.0.80)
- [x] Add boto3 dependency for R2 storage
- [x] Create migration 008 for user profile columns
- [x] Create migration 009 for event columns
- [x] Create migration 010 for face_encodings
- [x] Fix topics JSON parsing (field_validator)
- [x] Fix calendar page (use eventsAPI, fix field names)
- [x] Fix document date display (created_at not uploaded_at)
- [x] Fix cover image URL handling (prepend API_URL)
- [x] Fix navigation links (legacy /host/:id paths)
- [x] Add face recognition disable functionality
- [x] Add confirmation modals for face recognition

---

## Phase 10: MVP Polish (Current)

- [x] Fix AI greeting issue (responds naturally to "hi")
- [x] Add profile photo cropper (Discord-like)
- [x] Add event cover image cropper with aspect ratios
- [ ] Address autocomplete (needs VITE_GOOGLE_MAPS_API_KEY in Vercel) - KEY SET
- [ ] Test address autocomplete in production

---

## Outstanding Items

### Environment Variables Needed (Vercel)
- [x] VITE_API_URL
- [x] VITE_GOOGLE_MAPS_API_KEY
- [ ] VITE_OPENAI_API_KEY (optional, for client-side features)

### Nice to Have (Post-MVP)
- [ ] Email verification flow
- [ ] Password reset
- [ ] Push notifications
- [ ] Event reminders
- [ ] Payment integration (Stripe)
- [ ] Social login (Google, Apple)

---

## Quick Reference

**Repository:** https://github.com/Steve6378/yorru
**Branch:** `main`
**Domain:** yorru.net
**Frontend:** app.yorru.net (Vercel)
**Backend:** Railway (yorru-production.up.railway.app)
**Database:** Railway pgvector-pg17

**Tech Stack:**
- Backend: FastAPI (Python 3.12) on Railway
- Database: PostgreSQL + pgvector on Railway
- Frontend: React + Vite + TypeScript on Vercel
- Real-time: Socket.io
- AI: OpenAI GPT-4o-mini + LangChain RAG
- Storage: Cloudflare R2 (with local fallback)
- Auth: JWT tokens
