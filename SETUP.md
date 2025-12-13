# Yorru - Local Setup Guide

This guide explains how to run the Yorru project locally for development and testing.

## Prerequisites

Install these before starting:

| Software | Version | Download |
|----------|---------|----------|
| Python | 3.12+ | https://python.org/downloads |
| Node.js | 18+ | https://nodejs.org |
| PostgreSQL | 15+ | https://postgresql.org/download |

**Note:** PostgreSQL must include the `pgvector` extension for AI-powered semantic search.

---

## 1. Database Setup

### Create the database

```bash
# Create a new PostgreSQL database
createdb yorru_dev

# Enable the pgvector extension (required for semantic search)
psql yorru_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Load the database schema
psql yorru_dev < database/schema.sql

# (Optional) Load sample test data
psql yorru_dev < database/seed_data_comprehensive.sql
```

### Verify database setup

```bash
psql yorru_dev -c "\dt"
```

You should see tables like `users`, `events`, `messages`, `ground_truth_facts`, etc.

---

## 2. Backend Setup (FastAPI)

### Navigate to backend folder

```bash
cd backend
```

### Create and activate virtual environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### Install Python dependencies

```bash
pip install -r requirements.txt
```

### Configure environment variables

```bash
# Copy the example config
cp ../.env.example .env

# Edit .env with your actual values
```

**Required `.env` values:**

```env
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost/yorru_dev
OPENAI_API_KEY=sk-your-openai-api-key
JWT_SECRET_KEY=generate-a-random-secret-here
ENVIRONMENT=development
DEBUG=True
```

**To generate a JWT secret:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Start the backend server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Verify backend is running

Open in browser: http://localhost:8000/docs

You should see the Swagger API documentation.

---

## 3. Frontend Setup (React + Vite)

### Open a new terminal and navigate to frontend

```bash
cd frontend
```

### Install Node dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

### Access the app

Open in browser: http://localhost:5173

---

## Quick Start Summary

Once everything is set up, you only need these commands to start the app:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## Verification Checklist

| Component | URL | Expected Result |
|-----------|-----|-----------------|
| Backend API | http://localhost:8000/health | `{"status": "healthy"}` |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Frontend | http://localhost:5173 | Login page |

---

## Troubleshooting

### "pgvector extension not found"
```bash
# Install pgvector (varies by OS)
# macOS with Homebrew:
brew install pgvector

# Ubuntu/Debian:
sudo apt install postgresql-15-pgvector

# Then enable it:
psql yorru_dev -c "CREATE EXTENSION vector;"
```

### "Module not found" in backend
```bash
# Make sure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend can't connect to backend
- Ensure backend is running on port 8000
- Check for CORS errors in browser console
- The frontend expects the API at `http://localhost:8000`

### Database connection refused
- Verify PostgreSQL is running: `pg_isready`
- Check your DATABASE_URL in `.env` matches your PostgreSQL credentials

---

## Project Structure

```
yorru/
├── backend/          # FastAPI Python backend
│   ├── routes/       # API endpoints
│   ├── models/       # Database models
│   ├── services/     # Business logic
│   └── main.py       # Entry point
│
├── frontend/         # React + Vite frontend
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── components/
│   │   └── stores/   # State management
│   └── package.json
│
└── database/         # SQL schema and migrations
    ├── schema.sql
    └── seed_data_comprehensive.sql
```

---

## Tech Stack

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL, pgvector
- **Frontend:** React 18, Vite, Tailwind CSS, Zustand
- **AI:** OpenAI GPT + Embeddings
- **Mobile:** Capacitor (Android/iOS)

---

## Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend lint
cd frontend
npm run lint
```
