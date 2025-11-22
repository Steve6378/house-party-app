# 🚀 Yorru Deployment Checklist

**Last Updated:** 2025-11-21
**Current Phase:** EC2 Setup + Deployment Prep

---

## 📦 Phase 1: EC2 Backend Setup

### **Repository & Code**
- [x] Repository renamed to `yorru`
- [x] Code rebranded from Festivio to Yorru
- [x] Deployment files created (Procfile, railway.toml, runtime.txt)
- [x] All code pushed to GitHub
- [ ] Latest code pulled on EC2

### **Python Environment**
- [ ] Python 3.11 installed on EC2
- [ ] Virtual environment created (`~/yorru_env/`)
- [ ] Dependencies installed from `requirements.txt`
- [ ] Environment activated successfully

### **PostgreSQL Database**
- [ ] PostgreSQL 15+ installed on EC2
- [ ] Database user created (`yorru_admin` or custom)
- [ ] Database created (`yorru_db`)
- [ ] pgvector extension enabled
- [ ] uuid-ossp extension enabled
- [ ] Schema loaded (`schema.sql`)
- [ ] Seed data loaded (`seed_data_comprehensive.sql`)
- [ ] Database connection tested

### **Configuration**
- [ ] `.env` file created in `backend/`
- [ ] `DATABASE_URL` configured
- [ ] `OPENAI_API_KEY` added
- [ ] `JWT_SECRET_KEY` generated and added
- [ ] Environment variables verified

### **Backend Testing**
- [ ] API starts successfully (`python3 main.py`)
- [ ] Health check works (`/health` returns healthy)
- [ ] Root endpoint works (`/` returns Yorru API info)
- [ ] Database connection confirmed in health check
- [ ] Can create test user (`POST /api/auth/register`)
- [ ] Can login (`POST /api/auth/login`)
- [ ] JWT token works on protected routes

### **Production Setup (EC2)**
- [ ] Systemd service file created (`/etc/systemd/system/yorru.service`)
- [ ] Service enabled and started
- [ ] Service auto-starts on reboot
- [ ] Nginx installed
- [ ] Nginx config created (`/etc/nginx/sites-available/yorru`)
- [ ] Nginx config enabled (symlink to sites-enabled)
- [ ] Nginx reverse proxy working (port 80 → 8000)
- [ ] SSL certificate obtained (Certbot + Let's Encrypt)
- [ ] HTTPS working (`https://api.yorru.net`)
- [ ] Auto-renewal configured for SSL

---

## 🌐 Phase 2: DNS & Domain Setup

### **Cloudflare Configuration**
- [x] Domain purchased (`yorru.net`)
- [x] Cloudflare account created
- [x] Nameservers updated to Cloudflare
- [ ] DNS A record added (`api.yorru.net` → EC2 IP)
- [ ] DNS verified (propagation complete)
- [ ] SSL mode set to "Full" in Cloudflare

### **Subdomains Planned**
- [ ] `yorru.net` → Landing page
- [ ] `app.yorru.net` → Frontend (Next.js)
- [ ] `api.yorru.net` → Backend (FastAPI)
- [ ] `docs.yorru.net` → Documentation (optional)

---

## ☁️ Phase 3: Railway Deployment (Alternative/Production)

### **Railway Setup**
- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] Branch selected for deployment
- [ ] PostgreSQL database added
- [ ] `DATABASE_URL` auto-configured
- [ ] Environment variables set:
  - [ ] `OPENAI_API_KEY`
  - [ ] `JWT_SECRET_KEY`
  - [ ] `ENVIRONMENT=production`
  - [ ] `DEBUG=False`

### **Railway Deployment**
- [ ] First deployment successful
- [ ] Health check endpoint working
- [ ] Database migrations run
- [ ] Seed data loaded
- [ ] Embeddings generated
- [ ] Custom domain added (`api.yorru.net`)
- [ ] SSL configured (automatic on Railway)
- [ ] Auto-deploy from GitHub enabled

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
