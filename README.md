# 🌙 Yorru - Night Event Planning with AI

[![Status](https://img.shields.io/badge/status-railway_deployed-brightgreen)]()
[![Phase](https://img.shields.io/badge/phase-backend_deployed-blue)]()
[![Stack](https://img.shields.io/badge/stack-FastAPI%20%7C%20PostgreSQL%20%7C%20Next.js-orange)]()

**Yorru** (夜 - "yoru" meaning night in Japanese) - AI-assisted event planning platform with three interaction modes: Guest AI Assistant (1-on-1), Group Chat (observer), and Host Interface (dashboard).

---

## 🚀 **Current Status: Backend Deployed on Railway ✅**

### ✅ **Phase 1: Repository & Deployment (DONE)**
- [x] Repository restructured (clean paths: backend/, database/, docs/)
- [x] Python 3.12, environment-based config
- [x] **Railway backend deployed** (FastAPI + Dockerfile)
- [x] **Railway database deployed** (PostgreSQL + pgvector-pg17)
- [x] **Database schema loaded** (production-ready)
- [x] **Environment variables configured**
- [x] **Dockerfile optimized** (layer caching for fast rebuilds)

### ⏳ **Phase 2: Frontend Development** (Next Up)
- [ ] Initialize Next.js 14 + TypeScript project
- [ ] Configure NextAuth.js (JWT integration)
- [ ] Build core pages (login, events, chat, dashboard)
- [ ] Integrate Socket.io for real-time chat
- [ ] Deploy to Vercel

### 🔜 **Phase 3-4: Features & Launch**
- [ ] WebSocket chat implementation (Socket.io)
- [ ] Photo storage (Cloudflare R2 / Firebase / MongoDB)
- [ ] Testing & polish
- [ ] Public launch

---

## 📂 **Project Structure**

```
yorru/
├── backend/                    # FastAPI backend (deployed on Railway)
│   ├── routes/                # API endpoints
│   ├── models/                # SQLAlchemy models
│   ├── services/              # Business logic, embeddings, ground truth
│   ├── config.py              # Environment-based config
│   ├── main.py                # FastAPI entry point
│   └── requirements.txt       # Python dependencies
│
├── database/                  # Database schema & migrations
│   ├── schema.sql             # PostgreSQL schema (13 tables)
│   ├── seed_data_comprehensive.sql  # Test data (dev only)
│   ├── migrations/            # Database migrations
│   └── README.md              # Database setup guide
│
├── docs/                      # Documentation
│   ├── deployment/
│   │   └── CHECKLIST.md       # Deployment progress tracker
│   ├── development/
│   │   ├── CONTEXT_HANDOFF.md # Context for session continuity
│   │   └── WHEN_YOU_RETURN.md # Quick start guide
│   └── PROGRESS_SUMMARY.md    # Overall progress
│
├── frontend/                  # Next.js app (to build)
│
├── .env.example               # Environment variables template
├── Dockerfile                 # Railway deployment (optimized)
├── railway.json               # Railway config
├── Procfile                   # Fallback start command
├── runtime.txt                # Python 3.12
└── README.md                  # This file
```

---

## 🎯 **Core Features**

### **Three Interaction Modes**

1. **Guest AI Assistant** (1-on-1 Chat)
   - Guests ask questions: "What's the address?"
   - Bot queries ground truth → answers or escalates
   - Commands: `/address`, `/parking`, `/time`

2. **Group Chat** (Real-time, Observer)
   - Everyone chats naturally
   - AI observes and extracts preferences (dietary, budget)
   - Rarely responds (only for polls or consensus)

3. **Host Interface** (Dashboard)
   - Manage ground truth facts
   - View guest preferences summary
   - Respond to escalated questions
   - Track to-dos and change log

### **Ground Truth Query System** ⭐

Two-tier approach for answering guest questions:

**Tier 1: Keyword Matching** (Fast, Exact)
```
Question: "What's the address?"
Keywords: ["address", "location", "where"]
→ Instant match! Answer: "123 Main St, LA"
```

**Tier 2: Semantic Search** (Flexible, Contextual)
```
Question: "Where can I leave my car?"
Embedding similarity search with pgvector
→ Matches "parking" fact: "Street parking on Oak St"
```

### **Groups vs One-Off Events**

- **Path A**: Create group → events within group (preferences persist)
- **Path B**: Create one-off event (no group, no memory)

---

## 🛠️ **Tech Stack**

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend** | FastAPI + Python 3.12 | Async, fast, great docs |
| **Database** | PostgreSQL + pgvector | Vector similarity search |
| **Hosting** | Railway (backend + DB) | Zero-config deployment |
| **ORM** | SQLAlchemy 2.0 | Python ORM with relationships |
| **Auth** | JWT + bcrypt | Token-based auth, password hashing |
| **Embeddings** | OpenAI text-embedding-3-small | 1536 dims, $0.02 per 100 facts |
| **Frontend** | Next.js 14 + TypeScript | SSR, built-in routing |
| **Frontend Host** | Vercel | Optimized for Next.js |
| **Styling** | Tailwind CSS | Fast, professional look |
| **Real-time** | Socket.io | Chat with auto-reconnection, rooms |

---

## 📖 **Documentation**

### **Start Here** (In Order)
1. **`/IMPLEMENTATION_GUIDE.md`** - Full guide with 150 tasks + code examples
2. **`/dev/plan.md`** - Architecture decisions (why we chose this approach)
3. **`/dev/context.md`** - Current state, file structure, decisions
4. **`/dev/tasks.md`** - Task breakdown (150 tasks)
5. **`/database/SEED_DATA_SUMMARY.md`** - Test data overview

### **Skills** (Auto-activated)
- **`/.claude/skills/python-rag-patterns/SKILL.md`** - pgvector queries, embeddings, ground truth
- **`/.claude/skills/fastapi-patterns/SKILL.md`** - SQLAlchemy, Pydantic, auth, CRUD

---

## 🚀 **Deployment**

### **Current Deployment (Railway)**

**Backend + Database are live on Railway!**

- **Backend:** Deployed with Dockerfile, auto-deploys from `main` branch
- **Database:** pgvector-pg17 on Railway (production schema loaded)
- **Environment:** Production mode (`DEBUG=False`)

**Next Step:** Verify health check and test API endpoints

### **Local Development Setup**

```bash
# Clone repository
git clone https://github.com/Steve6378/yorru.git
cd yorru

# Install dependencies
cd backend
python3.12 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp ../.env.example .env
# Edit .env with your values:
# - DATABASE_URL (local PostgreSQL or Railway)
# - OPENAI_API_KEY
# - JWT_SECRET_KEY

# Run backend locally
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### **Test API**

```bash
# Health check
curl http://localhost:8000/health

# API documentation (Swagger UI)
open http://localhost:8000/docs

# Register a user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!", "name": "Test User"}'
```

### **Database Setup (Local Development)**

If you want to run PostgreSQL locally:

```bash
# Install PostgreSQL + pgvector
# macOS: brew install postgresql pgvector
# Ubuntu: sudo apt install postgresql postgresql-contrib

# Create database
createdb yorru_dev
psql yorru_dev -c "CREATE EXTENSION vector;"

# Load schema
psql yorru_dev < database/schema.sql

# Load seed data (optional, for testing)
psql yorru_dev < database/seed_data_comprehensive.sql
```

---

## 📊 **What's Built (Statistics)**

### **Database**
- **13 tables**: users, groups, events, ground_truth_facts, messages, etc.
- **2,100+ lines** of seed data
- **16 events** spanning 6 months
- **100+ ground truth facts**
- **50+ chat messages**
- **14 users** (6 core + 8 peripheral)

### **Code**
- **2,000+ lines** of Python (ground truth query, embeddings, tests)
- **1,500+ lines** of SQL (schema + seed data)
- **1,000+ lines** of documentation
- **30+ unit tests** (all passing)

### **Documentation**
- **1,420 lines** of dev docs (plan, context, tasks)
- **1,176 lines** implementation guide
- **900+ lines** of skill documentation

**Total: ~9,000 lines of foundation work! ✅**

---

## 🎨 **Example Use Case (From Seed Data)**

### **Event: Thanksgiving Potluck**
- **Host**: Amane (main) + Mahiru (co-host)
- **Guests**: Jake (vegetarian), Nirali (vegan), Maya, Tanya
- **Budget**: $25/person
- **Type**: Tight-knit (6 people)

### **Ground Truth Facts**
- Address: "456 West 28th St, Apt 201, LA"
- Parking: "Guest parking code 2811"
- Food: "Potluck! Amane cooking turkey. Sign up in chat."
- Dietary: "Jake vegetarian, Nirali vegan"

### **Chat Messages**
```
Jake: "I can bring vegetarian lasagna! Just a reminder I'm vegetarian btw"
→ AI extracts: {dietary_restrictions: ["vegetarian"]}

Maya: "What's the budget? I'm tight on cash"
→ AI extracts: {budget_concern: true, budget_preference: low}

Tanya: "Can I bring my roommate?"
→ AI escalates: Question appears in Host Interface
```

### **Guest Questions**
```
Guest: "What's the address?"
→ Bot (keyword match): "456 West 28th St, Apt 201, LA"

Guest: "Where should I park?"
→ Bot (keyword match): "Guest parking code 2811"

Guest: "Is there a gift registry?"
→ Bot (no match): "I don't know. [Escalate to Host] button"
```

---

## 🎯 **Success Criteria**

- [x] User can create account and log in
- [x] Database schema supports all features
- [x] Ground truth query system works (keyword + semantic)
- [ ] User can create event
- [ ] Guest can ask questions and get answers
- [ ] AI escalates unknown questions
- [ ] Group chat extracts preferences
- [ ] Host can view dashboard
- [ ] UI looks professional

---

## 🤝 **Contributing**

This is a solo project for now, but patterns are documented for future contributors.

---

## 📝 **License**

MIT (or your choice)

---

## 🔥 **Next Steps**

**Tomorrow (Day 1)**: Follow `/IMPLEMENTATION_GUIDE.md` Phase 1

**Days 2-12**: Build backend API → WebSocket chat → Frontend

**Ready to go!** All foundation work is done. Just follow the guide step-by-step. 🚀

---

## 📬 **Contact**

[Your contact info]

---

Built with ❤️ using Claude Code
