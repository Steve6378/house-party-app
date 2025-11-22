# 🚀 Yorru Deployment Checklist

**Last Updated:** 2025-11-22
**Current Phase:** Railway Deployment (Backend + Database)

---

## 📦 Phase 1: Repository Restructure ✅

### **Repository & Code**
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

## ☁️ Phase 2: Railway Deployment ✅ (Mostly Complete)

### **Railway Setup**
- [x] Railway account created
- [x] GitHub repository connected
- [x] Branch deployed: `main`
- [x] pgvector-pg17 database deployed
- [x] Backend service deployed (FastAPI)
- [x] Environment variables configured:
  - [x] `DATABASE_URL` → `${{pgvector.DATABASE_PRIVATE_URL}}`
  - [x] `OPENAI_API_KEY`
  - [x] `JWT_SECRET_KEY`
  - [x] `ENVIRONMENT=production`
  - [x] `DEBUG=False`

### **Railway Deployment**
- [x] Dockerfile created (optimized with layer caching)
- [x] railway.json configured (DOCKERFILE builder, health check)
- [x] Database schema loaded into pgvector database
- [ ] **Health check verification** (pending user confirmation)
- [ ] **Test API endpoints** (pending)
- [ ] Auto-deploy from GitHub enabled (likely already enabled)

### **Cost Optimization**
- [x] Dockerfile optimized for fast rebuilds (requirements.txt cached)
- [x] Using DATABASE_PRIVATE_URL (internal network, no egress)
- [x] Free tier ($5/month credit) should cover development

---

## 🌐 Phase 3: DNS & Domain Setup

### **Cloudflare Configuration**
- [x] Domain purchased (`yorru.net`)
- [x] Cloudflare account created
- [x] Nameservers updated to Cloudflare
- [ ] DNS records configured:
  - [ ] `yorru.net` → Landing page (future)
  - [ ] `app.yorru.net` → Frontend (Vercel, future)
  - [ ] `api.yorru.net` → Railway backend (optional custom domain)

---

## 🎨 Phase 4: Frontend Development (Next Up)

### **Vercel + Next.js Setup**
- [ ] Next.js 14 project initialized (`frontend/`)
- [ ] TypeScript configured
- [ ] Tailwind CSS installed
- [ ] NextAuth.js configured
- [ ] Credentials provider (email/password)
- [ ] JWT integration with Railway backend
- [ ] Protected routes setup

### **Core Pages**
- [ ] Login page (`/login`)
- [ ] Register page (`/register`)
- [ ] Dashboard (`/dashboard`)
- [ ] Event list (`/events`)
- [ ] Event detail (`/events/[id]`)
- [ ] Event creation (`/events/create`)
- [ ] Chat interface (`/events/[id]/chat`)
- [ ] Host dashboard (`/host/[id]`)

### **Vercel Deployment**
- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Auto-deploy from `main` configured
- [ ] Environment variables set (API URL, NextAuth secret)
- [ ] Custom domain configured (`app.yorru.net`)

---

## 🔌 Phase 5: Real-time Features (WebSocket)

### **Socket.io Implementation**
- [ ] `python-socketio` installed on backend
- [ ] `socket.io-client` installed on frontend
- [ ] WebSocket endpoint created (`/ws/events/{id}`)
- [ ] Room management (join event room)
- [ ] Broadcasting to event participants
- [ ] Guest AI assistant integration
- [ ] Group chat functionality
- [ ] Auto-reconnection handling
- [ ] Frontend WebSocket hook created

---

## 📸 Phase 6: Photo Storage (Future)

### **Storage Solution (TBD)**
- [ ] Decision: Cloudflare R2 vs Firebase vs MongoDB
- [ ] Bucket/storage created
- [ ] Upload endpoint (`POST /api/events/{id}/photos`)
- [ ] Photo metadata in PostgreSQL
- [ ] Image optimization
- [ ] Frontend upload UI

---

## 🧪 Phase 7: Testing & Polish

### **API Testing**
- [ ] Health check verified
- [ ] User registration tested
- [ ] Login tested
- [ ] Event CRUD tested
- [ ] Ground truth Q&A tested
- [ ] WebSocket chat tested
- [ ] Permission system verified

### **Frontend Testing**
- [ ] User flows tested
- [ ] Mobile responsiveness
- [ ] Cross-browser testing
- [ ] Performance (Lighthouse score)

---

## 🚀 Phase 8: Launch

### **Pre-launch**
- [ ] Documentation complete
- [ ] Security audit (CORS, rate limiting, input validation)
- [ ] Monitoring setup (error tracking, logging)
- [ ] Database backups configured

### **Launch**
- [ ] Soft launch to beta testers
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Public launch

---

## 📊 Current Progress Summary

**Completed:** Repository restructure, Railway backend + database deployment
**Current Status:** Waiting for health check verification
**Next Immediate:** Test Railway deployment, then start Next.js frontend

### **Recently Completed (This Session):**
- ✅ Repository restructured (clean paths, docs/ folder)
- ✅ Dockerfile created with layer caching optimization
- ✅ Railway backend deployed
- ✅ Railway pgvector database deployed
- ✅ Database schema loaded (production, no seed data)
- ✅ Environment variables configured
- ✅ DATABASE_URL fixed to use private URL

### **Next Up:**
- ⏭️ Verify Railway health check passes
- ⏭️ Test API endpoints (register, login, events)
- ⏭️ Initialize Next.js frontend
- ⏭️ Configure NextAuth.js

---

## 🎯 Quick Reference

**Repository:** https://github.com/Steve6378/yorru
**Branch:** `main`
**Domain:** yorru.net
**Backend:** Railway (yorru-production.up.railway.app)
**Database:** Railway pgvector-pg17
**Frontend (planned):** Vercel
**WebSocket (planned):** Socket.io

**Tech Stack:**
- Backend: FastAPI (Python 3.12) on Railway
- Database: PostgreSQL + pgvector on Railway
- Frontend: Next.js 14 + TypeScript on Vercel (future)
- Real-time: Socket.io (future)
- Auth: NextAuth.js + JWT

---

**Last Session:** Railway deployment completed, health check pending verification
**Next Session:** Verify deployment, start frontend development

---

## 🎨 Phase 4: Frontend Development

### **Landing Page (`yorru.net`)**
- [ ] Simple HTML/CSS landing page created
- [ ] "Coming Soon" message
- [ ] Yorru branding (夜 logo/theme)
- [ ] Deployed to Cloudflare Pages/Vercel
- [ ] DNS pointing to landing page

### **Next.js Setup**
- [ ] Next.js 14 project initialized (`v1/frontend/`)
- [ ] TypeScript configured
- [ ] Tailwind CSS installed
- [ ] Shadcn/ui components added
- [ ] Zustand state management setup
- [ ] TanStack Query setup

### **Authentication**
- [ ] NextAuth.js installed
- [ ] Credentials provider configured (email/password)
- [ ] Google OAuth provider configured
- [ ] Login page created (`/login`)
- [ ] Register page created (`/register`)
- [ ] JWT token integration with backend
- [ ] Protected routes setup

### **Core Pages**
- [ ] Dashboard (`/dashboard`)
- [ ] Event list (`/events`)
- [ ] Event detail (`/events/[id]`)
- [ ] Event creation (`/events/create`)
- [ ] Chat interface (`/events/[id]/chat`)
- [ ] Host dashboard (`/host/[id]`)

---

## 🔌 Phase 5: Real-time Features

### **WebSocket Implementation**
- [ ] Backend WebSocket routes created (`routes/chat.py`)
- [ ] Connection manager implemented
- [ ] Guest AI assistant endpoint (`/ws/events/{id}/assistant`)
- [ ] Group chat endpoint (`/ws/events/{id}/group`)
- [ ] Authentication for WebSocket connections
- [ ] Frontend WebSocket hook created
- [ ] Real-time chat working

---

## 📸 Phase 6: Photo Storage

### **Cloudflare R2 Setup**
- [ ] R2 bucket created (`yorru-photos`)
- [ ] API credentials generated
- [ ] Custom domain configured (`photos.yorru.net`)
- [ ] Backend upload endpoint (`POST /api/events/{id}/photos`)
- [ ] Photo metadata stored in PostgreSQL
- [ ] Frontend upload UI created
- [ ] Image optimization configured

---

## 🧪 Phase 7: Testing & Polish

### **API Testing**
- [ ] All authentication endpoints tested
- [ ] All event CRUD endpoints tested
- [ ] Message endpoints tested
- [ ] Ground truth Q&A tested
- [ ] Permission system verified
- [ ] Error handling tested

### **Frontend Testing**
- [ ] User registration flow tested
- [ ] Login/logout tested
- [ ] Event creation tested
- [ ] Chat functionality tested
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

### **Performance**
- [ ] API response times optimized
- [ ] Database queries optimized (indexes)
- [ ] Frontend bundle size optimized
- [ ] Images optimized (CDN)
- [ ] Lighthouse score > 90

---

## 🚀 Phase 8: Launch Preparation

### **Documentation**
- [ ] API documentation complete (`/docs`)
- [ ] User guide created
- [ ] Developer documentation updated
- [ ] README updated with deployment info

### **Security**
- [ ] Environment variables secured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation verified
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified

### **Monitoring**
- [ ] Error tracking setup (Sentry?)
- [ ] Logging configured
- [ ] Uptime monitoring (UptimeRobot?)
- [ ] Database backups configured

### **Launch**
- [ ] Soft launch to friends/beta testers
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Public launch announcement
- [ ] Social media presence created

---

## 📊 Current Progress Summary

**Completed:** ~25 / ~120 tasks
**Progress:** ~21%

### **Recently Completed:**
- ✅ Full rebranding to Yorru
- ✅ Deployment files created
- ✅ Code pushed to GitHub
- ✅ Repository ruleset issues resolved

### **Currently Working On:**
- 🔄 EC2 environment setup
- 🔄 Python virtual environment
- 🔄 PostgreSQL database configuration

### **Next Up:**
- ⏭️ Load database schema and seed data
- ⏭️ Test backend API on EC2
- ⏭️ Configure Nginx reverse proxy

---

## 🎯 Quick Reference

**Repository:** https://github.com/Steve6378/yorru
**Branch:** `claude/expand-seed-data-continued-01BcWwGkQ9yE8QcHMyAy7UU9`
**Domain:** yorru.net
**API Endpoint (planned):** api.yorru.net
**Tech Stack:** FastAPI + PostgreSQL + Next.js + Cloudflare

---

**Last Session:** EC2 setup in progress
**Next Session:** Complete EC2 backend deployment
