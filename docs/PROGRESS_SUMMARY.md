# Yorru Progress Summary

**Last Updated:** 2025-12-03
**Status:** MVP Complete + Android App Ready
**Branch:** `claude/resolve-pr-conflicts-01JT3X23pVMvdVmwxfxZiZJP`

---

## Current State

| Component | Status | Notes |
|-----------|--------|-------|
| Backend (FastAPI) | Live | Railway |
| Database (pgvector) | Live | Railway |
| Frontend (React+Vite) | Live | Vercel |
| Android App | Ready | Capacitor, needs APK build |
| iOS App | Not started | Same Capacitor setup works |

---

## What's Built

### Backend (~9,700 LOC)
- FastAPI with JWT auth
- PostgreSQL + pgvector for semantic search
- OpenAI GPT-4o-mini integration
- LangChain RAG for event Q&A
- Face recognition with face_recognition lib
- Cloudflare R2 storage (with local fallback)
- Socket.io real-time chat

### Frontend (~8,900 LOC)
- React + Vite + TypeScript
- Zustand state management
- Sonner toast notifications
- Image cropping (react-easy-crop)
- Dark theme UI

### Android App (Capacitor)
- Native camera/gallery picker
- GPS location
- Native share sheet
- Network status monitoring
- Haptic feedback
- Status bar theming

---

## Recent Work (Dec 2025)

### Bug Fixes
- SQL syntax errors (CAST vs :: for pgvector)
- R2 storage double-read bug
- Face recognition toggle not updating UI
- SQL injection in ground_truth_query.py
- Path traversal in photos.py
- Missing auth on cover images
- Empty fetchContacts/fetchGroups placeholders

### Features Added
- Capacitor Android setup
- Native camera integration
- Share button for events
- Network status toasts
- Groups API client
- Document delete handler

---

## Pending Tasks

See `docs/SESSION_HANDOFF.md` for full checklist.

**Quick summary:**
1. Build APK on local machine
2. Add Railway volume for uploads
3. Run migration 011
4. Merge to main

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, Python 3.12 |
| Database | PostgreSQL + pgvector |
| Frontend | React, Vite, TypeScript |
| Mobile | Capacitor |
| Real-time | Socket.io |
| AI | OpenAI GPT-4o-mini, LangChain |
| Storage | Cloudflare R2 |
| Auth | JWT |
| Hosting | Railway (backend), Vercel (frontend) |

---

## Codebase Stats

| Category | Lines |
|----------|-------|
| Total | ~22,200 |
| Backend Python | ~9,700 |
| Frontend TSX/JSX | ~8,900 |
| Database SQL | ~1,750 |
| Config/Utils | ~1,850 |

---

## URLs

- **Frontend:** app.yorru.net
- **Backend:** yorru-production.up.railway.app
- **Repository:** github.com/Steve6378/yorru
