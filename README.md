# 🎉 House Party App - Event Planning with AI

[![Status](https://img.shields.io/badge/status-foundation_complete-brightgreen)]()
[![Phase](https://img.shields.io/badge/phase-ready_for_implementation-blue)]()
[![Stack](https://img.shields.io/badge/stack-FastAPI%20%7C%20PostgreSQL%20%7C%20Next.js-orange)]()

**AI-assisted event planning app** with three interaction modes: Guest AI Assistant (1-on-1), Group Chat (observer), and Host Interface (dashboard).

---

## 🚀 **Current Status: Foundation Complete ✅**

### ✅ **Phase 0: Foundation (DONE)**
- [x] Project restructured (v0/ old, v1/ new)
- [x] **Comprehensive dev docs** (1,420 lines: plan, context, tasks)
- [x] **Database schema** (13 tables with pgvector)
- [x] **Seed data** (2,100+ lines: 16 events, 50+ messages, 100+ facts)
- [x] **Ground truth query system** (keyword + semantic search)
- [x] **Unit tests** (30+ tests passing)
- [x] **Claude Code infrastructure** (skills, commands, settings)
- [x] **Implementation guide** (150 tasks with code examples)

### ⏳ **Phase 1: EC2 Setup** (Tomorrow - Day 1)
- [ ] Install PostgreSQL 15 + pgvector
- [ ] Install Python 3.11 + virtual environment
- [ ] Load database schema + seed data
- [ ] Generate embeddings for ground truth facts

### ⏳ **Phase 2-4: Implementation** (Days 2-12)
- [ ] Backend API (FastAPI + SQLAlchemy + JWT auth)
- [ ] WebSocket chat (Guest AI + Group Chat)
- [ ] Next.js frontend (3 views: Guest, Group, Host)
- [ ] Testing & polish

---

## 📂 **Project Structure**

```
house-party-app/
├── v0/                          # Old Yelp project (ignore)
│
├── v1/                          # NEW - House Party App
│   ├── dev/                     # Dev Documentation (START HERE!)
│   │   ├── plan.md             # Architecture & tech decisions (478 lines)
│   │   ├── context.md          # Project state & file structure (461 lines)
│   │   └── tasks.md            # 150 tasks breakdown (481 lines)
│   │
│   ├── database/
│   │   ├── schema.sql          # PostgreSQL schema (13 tables) ✅
│   │   ├── seed_data_comprehensive.sql  # 2100+ lines test data ✅
│   │   ├── SEED_DATA_SUMMARY.md         # What's in the seed data
│   │   └── README.md           # Database setup instructions
│   │
│   ├── backend/
│   │   ├── services/
│   │   │   ├── embeddings.py   # OpenAI embedding generation ✅
│   │   │   └── ground_truth_query.py  # Query system (keyword + semantic) ✅
│   │   ├── models/             # SQLAlchemy models (to build)
│   │   ├── api/                # FastAPI routers (to build)
│   │   ├── auth/               # JWT + OAuth (to build)
│   │   ├── requirements.txt    # Python dependencies ✅
│   │   └── main.py             # FastAPI entry point (to build)
│   │
│   ├── frontend/               # Next.js app (to build)
│   │
│   ├── tests/
│   │   └── unit/
│   │       └── test_ground_truth_query.py  # 30+ tests ✅
│   │
│   ├── IMPLEMENTATION_GUIDE.md # 150 tasks with code examples ✅
│   └── README.md               # Quick start guide ✅
│
├── .claude/                    # Claude Code Infrastructure
│   ├── skills/
│   │   ├── skill-rules.json    # Auto-trigger domain patterns
│   │   ├── python-rag-patterns/SKILL.md  # pgvector, embeddings
│   │   └── fastapi-patterns/SKILL.md     # SQLAlchemy, auth, CRUD
│   ├── commands/
│   │   └── dev-docs-update.md  # /dev-docs-update command
│   └── settings.json
│
└── README.md                   # This file
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
| **Backend** | FastAPI + Python 3.11 | Async, fast, great docs |
| **Database** | PostgreSQL 15 + pgvector | Vector similarity search |
| **ORM** | SQLAlchemy 2.0 | Python ORM with relationships |
| **Auth** | JWT + bcrypt | Token-based auth, password hashing |
| **Embeddings** | OpenAI text-embedding-3-small | 1536 dims, $0.02 per 100 facts |
| **Frontend** | Next.js 14 + TypeScript | SSR, built-in routing |
| **Styling** | Tailwind CSS | Fast, professional look |
| **Real-time** | WebSocket | Chat without polling |

---

## 📖 **Documentation**

### **Start Here** (In Order)
1. **`/v1/IMPLEMENTATION_GUIDE.md`** - Full guide with 150 tasks + code examples
2. **`/v1/dev/plan.md`** - Architecture decisions (why we chose this approach)
3. **`/v1/dev/context.md`** - Current state, file structure, decisions
4. **`/v1/dev/tasks.md`** - Task breakdown (150 tasks)
5. **`/v1/database/SEED_DATA_SUMMARY.md`** - Test data overview

### **Skills** (Auto-activated)
- **`/.claude/skills/python-rag-patterns/SKILL.md`** - pgvector queries, embeddings, ground truth
- **`/.claude/skills/fastapi-patterns/SKILL.md`** - SQLAlchemy, Pydantic, auth, CRUD

---

## 🚀 **Quick Start (Tomorrow - Day 1)**

### **1. EC2 Setup**

```bash
# Install PostgreSQL + pgvector
sudo apt update && sudo apt upgrade -y
sudo apt install -y postgresql postgresql-contrib postgresql-15-pgvector

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Clone repository
git clone https://github.com/Steve6378/house-party-app.git
cd house-party-app
git checkout claude/expand-seed-data-017U1BvVDd1Q8Bop9ooQKkrj
```

### **2. Database Setup**

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE house_party_db;
CREATE USER house_party_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE house_party_db TO house_party_user;

# Enable extensions
\c house_party_db
CREATE EXTENSION vector;
CREATE EXTENSION "uuid-ossp";
\q

# Load schema and seed data
cd v1/database
psql -U house_party_user -d house_party_db -f schema.sql
psql -U house_party_user -d house_party_db -f seed_data_comprehensive.sql
```

### **3. Backend Setup**

```bash
cd v1/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://house_party_user:your_password@localhost:5432/house_party_db
OPENAI_API_KEY=sk-your-openai-key-here
JWT_SECRET=your-random-secret-key
EOF

# Generate embeddings
python generate_embeddings.py

# Run backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### **4. Test**

```bash
# Health check
curl http://localhost:8000/health
# Should return: {"status": "healthy"}

# API docs
open http://localhost:8000/api/docs
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

**Tomorrow (Day 1)**: Follow `/v1/IMPLEMENTATION_GUIDE.md` Phase 1

**Days 2-12**: Build backend API → WebSocket chat → Frontend

**Ready to go!** All foundation work is done. Just follow the guide step-by-step. 🚀

---

## 📬 **Contact**

[Your contact info]

---

Built with ❤️ using Claude Code
