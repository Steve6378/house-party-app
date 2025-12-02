# Session Handoff - Yorru MVP Polish

**Date:** 2025-12-02
**Branch:** `claude/resolve-pr-conflicts-01JT3X23pVMvdVmwxfxZiZJP`
**Status:** Bug Fixes + Codebase Audit Complete
**Platform:** Yorru - AI-assisted night event planning

---

## Codebase Statistics

| Category | Lines of Code |
|----------|---------------|
| **Total** | ~22,200 LOC |
| Backend Python | ~9,700 LOC |
| Frontend TSX/JSX | ~8,900 LOC |
| Database SQL | ~1,750 LOC |
| Config/Utils | ~1,850 LOC |

**Largest Files:**
- HostInterfaceEnhanced.jsx (1,295 LOC)
- ai.py routes (903 LOC)
- CreateEventPage.jsx (833 LOC)
- events.py routes (808 LOC)

---

## Current Session Completed

### 1. **PR #21 Conflict Resolution**
- Merged event editing feature with conversation history support
- Kept intelligent query routing from main
- Added `conversation_history` parameter to RAG for follow-up questions

### 2. **SQL Syntax Fixes**
- Fixed `:embedding::vector` SQLAlchemy parsing issue
- Changed to `CAST(:embedding AS vector)` in all files:
  - `backend/routes/events.py`
  - `backend/routes/ground_truth.py`
  - `backend/scripts/generate_embeddings.py`
  - `backend/scripts/test_semantic_search.py`

### 3. **R2 Storage Bug Fix**
- Fixed double-read bug in local storage fallback
- Was trying to read `file_data.read()` twice (stream consumed)
- Now uses pre-extracted `data_bytes`

### 4. **Image Cropper for EditEventPage**
- EditEventPage was missing the cropper that CreateEventPage has
- Added ImageCropper with width slider (2:1 to 4:1)
- Added crop states and handlers

### 5. **Face Recognition Toggle Fix**
- Added `user_to_response()` helper function
- Fixed GET/PUT/POST endpoints to return `has_face_encoding` correctly
- Added `has_face_encoding` to frontend User interface

---

## Critical Issues Found (Codebase Audit)

### BLOCKING BUGS (Will crash at runtime)

| File | Line | Issue |
|------|------|-------|
| `chat.py` | 37 | **ImportError:** `verify_token` function doesn't exist in auth.py |
| `ai.py` | 137 | **AttributeError:** Uses `fact.content` but should be `fact.value` |
| `groups.py` | 540 | **NameError:** `sanitize_message_content()` is undefined |
| `ground_truth.py` | 137 | **AttributeError:** Uses `fact.content` but should be `fact.value` |

### SECURITY ISSUES

| File | Line | Issue |
|------|------|-------|
| `ground_truth_query.py` | 79-89 | **SQL INJECTION:** embedding_str formatted directly into SQL |
| `events.py` | 651 | **No Auth:** Cover image endpoint has no authentication |
| `photos.py` | 345-352 | **Path Traversal:** FileResponse with user-controlled path |
| `documents.py` | 23-24 | **Relative Path:** Upload dir depends on CWD |

### DATABASE ISSUES

| Issue | Impact |
|-------|--------|
| `audit_log.event_id` references `users(id)` instead of `events(id)` | FK constraint error |
| Migration 009 adds same columns as 001 | "Column already exists" error |
| `poll_votes` index created on wrong table (`polls`) | Index useless |
| `escalated_questions` missing columns expected by ORM | Write failures |

### FRONTEND ISSUES

| File | Issue |
|------|-------|
| `HostInterfaceEnhanced.jsx` | `fetchContacts()` and `fetchGroups()` are empty placeholders (lines 117-132) |
| `HostInterfaceEnhanced.jsx` | Document download/delete buttons have no handlers (lines 1010-1014) |
| Multiple pages | Auth token in URL query params is security risk |
| Multiple pages | Inconsistent auth pattern (Zustand vs React Context) |

---

## Database Migrations

```
001_add_status_columns.sql
002_fix_table_names_and_missing_columns.sql
003_add_group_chat_support.sql
004_add_image_url_support.sql
005_migrate_event_attendance.sql
006_add_document_tables.sql
007_add_photos_and_faqs.sql
008_add_user_profile_columns.sql
009_add_event_columns.sql          <- DUPLICATES COLS FROM 001
010_add_face_encodings_column.sql
```

**Warning:** Migration 009 will fail if run after 001 (duplicate columns)

---

## Environment Requirements

### Railway Backend
- **Volume Mount REQUIRED:** `/app/backend/uploads`
  - Without this, uploaded images disappear on redeploy
  - Add in Railway Dashboard > Backend Service > Settings > Volumes

### Environment Variables
- `OPENAI_API_KEY` - For AI features
- `GOOGLE_MAPS_API_KEY` - For location features
- `IPINFO_API_KEY` - For auto-locate (optional)
- `R2_*` - For Cloudflare R2 storage (optional, falls back to local)

---

## Recent Commits

```
813c5c5 Fix face recognition toggle and user response serialization
37efd2a Add image cropper to EditEventPage
bc08808 Fix SQL syntax errors and R2 storage bug
962ed75 Resolve PR #21 conflicts: event editing and AI conversation history
2e08cc7 Merge PR #21: Add event editing and conversation history support
```

---

## Quick Reference

**Repository:** https://github.com/Steve6378/yorru
**Frontend:** app.yorru.net (Vercel)
**Backend:** Railway (yorru-production.up.railway.app)
**Database:** Railway pgvector-pg17

**Tech Stack:**
- Backend: FastAPI (Python 3.12)
- Database: PostgreSQL + pgvector
- Frontend: React + Vite + TypeScript
- Real-time: Socket.io
- AI: OpenAI GPT-4o-mini + LangChain RAG
- Storage: Cloudflare R2 (with local fallback)
- Auth: JWT tokens

---

## Next Priority Fixes

1. **Fix blocking bugs** (chat.py, ai.py, groups.py, ground_truth.py)
2. **Add Railway volume mount** for image persistence
3. **Fix SQL injection** in ground_truth_query.py
4. **Fix migration 009** to conditionally add columns
5. **Implement fetchContacts/fetchGroups** in HostInterfaceEnhanced
