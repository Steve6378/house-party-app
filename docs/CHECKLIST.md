# Yorru Deployment Checklist

**Last Updated:** 2025-12-03
**Branch:** `claude/resolve-pr-conflicts-01JT3X23pVMvdVmwxfxZiZJP`

---

## Pending Tasks

### 1. Build Android APK
**Where:** Your local machine (needs Android Studio + SDK)

```bash
git pull origin claude/resolve-pr-conflicts-01JT3X23pVMvdVmwxfxZiZJP
cd frontend
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

**Output:** `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

- [ ] Pull latest code
- [ ] Build frontend
- [ ] Sync Capacitor
- [ ] Generate debug APK
- [ ] Test on Android device

---

### 2. Railway Volume Mount
**Where:** Railway Dashboard

1. Go to Railway Dashboard → Backend Service
2. Click "Volumes" tab
3. Click "Add Volume"
4. Configure:
   - **Name:** `uploads`
   - **Mount Path:** `/app/backend/uploads`
   - **Size:** 1GB
5. Click "Deploy"

- [ ] Add volume in Railway
- [ ] Verify volume mounted after redeploy
- [ ] Test image upload persistence

---

### 3. Run Database Migration
**Where:** Railway or local terminal with DB access

```bash
psql "$DATABASE_PUBLIC_URL" -f database/migrations/011_fix_audit_log_and_poll_votes.sql
```

This fixes:
- audit_log foreign key (was referencing users instead of events)
- poll_votes index (was on wrong table)

- [ ] Run migration 011
- [ ] Verify no errors

---

### 4. Merge to Main
**Where:** GitHub

- [ ] Review all changes on branch
- [ ] Create PR to main
- [ ] Merge PR
- [ ] Verify Vercel auto-deploys frontend
- [ ] Verify Railway auto-deploys backend

---

## Completed This Session

- [x] Capacitor Android project setup
- [x] Native plugins installed (camera, GPS, share, haptics, etc.)
- [x] Native features integrated into React app
- [x] All critical bugs from audit fixed
- [x] Groups API client implemented
- [x] Optional auth for cover images
- [x] Path traversal protection
- [x] SQL injection fix
- [x] Documentation updated

---

## Future Tasks (Not Blocking)

- [ ] Add custom app icon (replace default Capacitor icon)
- [ ] Add splash screen image
- [ ] Set up Firebase for push notifications
- [ ] iOS build (same Capacitor project works)
- [ ] Google Play Store submission
- [ ] Code splitting for smaller bundle size
