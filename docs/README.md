# Yorru Documentation

**Last Updated:** 2025-12-03

## Quick Links

| Document | Purpose |
|----------|---------|
| [SESSION_HANDOFF.md](SESSION_HANDOFF.md) | Current state, checklist, next steps |
| [PROGRESS_SUMMARY.md](PROGRESS_SUMMARY.md) | What's built, tech stack |
| [ANDROID_APP_GUIDE.md](ANDROID_APP_GUIDE.md) | Complete Android deployment guide |
| [BACKEND_TESTING_GUIDE.md](BACKEND_TESTING_GUIDE.md) | API testing instructions |

## Start Here

**For new sessions:** Read `SESSION_HANDOFF.md` first.

**To build Android APK:**
```bash
cd frontend
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

**To deploy:**
- Frontend auto-deploys to Vercel on push to main
- Backend auto-deploys to Railway on push to main

## Project Structure

```
yorru/
├── backend/           # FastAPI (Python 3.12)
├── frontend/          # React + Vite + Capacitor
│   └── android/       # Android project
├── database/          # SQL migrations
└── docs/              # Documentation
```
