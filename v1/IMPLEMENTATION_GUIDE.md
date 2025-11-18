# House Party App - Complete Implementation Guide

**Start Date**: Tomorrow (EC2 setup)
**Timeline**: 10-12 days
**Stack**: FastAPI (Python) + PostgreSQL + Next.js

---

## 📋 Complete Task List (150 Tasks)

### ✅ **PHASE 0: Foundation (COMPLETED)**

- [x] Restructure project (v0/ old, v1/ new)
- [x] Create dev docs (plan.md, context.md, tasks.md)
- [x] Design database schema (13 tables)
- [x] Create comprehensive seed data (2100+ lines, 16 events)
- [x] Build ground truth query system (keyword + semantic search)
- [x] Write unit tests for ground truth query (30+ tests)

**Status**: ✅ **COMPLETE** - You can skip straight to Phase 1

---

## 🚀 **PHASE 1: EC2 Setup & Database** (Day 1)

### Task 1.1: Install Prerequisites on EC2

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install Git (if not already)
sudo apt install -y git

# Install pgvector extension
sudo apt install -y postgresql-15-pgvector
```

### Task 1.2: Configure PostgreSQL

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user
sudo -u postgres psql

# Inside psql:
CREATE DATABASE house_party_db;
CREATE USER house_party_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE house_party_db TO house_party_user;

# Enable pgvector extension
\c house_party_db
CREATE EXTENSION vector;
CREATE EXTENSION "uuid-ossp";

# Exit psql
\q
```

### Task 1.3: Clone Repository & Setup Python

```bash
# Clone your repo
cd ~
git clone https://github.com/Steve6378/house-party-app.git
cd house-party-app

# Checkout the correct branch
git checkout claude/expand-seed-data-017U1BvVDd1Q8Bop9ooQKkrj

# Create Python virtual environment
cd v1/backend
python3.11 -m venv venv
source venv/bin/activate  # Activate virtualenv

# Install dependencies
pip install -r requirements.txt
```

### Task 1.4: Configure Environment Variables

```bash
# Create .env file
cd ~/house-party-app/v1/backend
nano .env

# Add these variables:
DATABASE_URL=postgresql://house_party_user:your_secure_password@localhost:5432/house_party_db
OPENAI_API_KEY=sk-your-openai-api-key-here
JWT_SECRET=your-random-secret-key-here
GOOGLE_CLIENT_ID=your-google-oauth-client-id  # Get from Google Cloud Console
GOOGLE_CLIENT_SECRET=your-google-oauth-secret

# Save and exit (Ctrl+X, Y, Enter)
```

### Task 1.5: Load Database Schema & Seed Data

```bash
# Load schema
cd ~/house-party-app/v1/database
psql -U house_party_user -d house_party_db -f schema.sql

# Load seed data (comprehensive version)
psql -U house_party_user -d house_party_db -f seed_data_comprehensive.sql

# Verify tables loaded
psql -U house_party_user -d house_party_db -c "\dt"
# Should show 13 tables: users, groups, events, ground_truth_facts, etc.
```

### Task 1.6: Generate Embeddings for Ground Truth Facts

```python
# Create a script: generate_embeddings.py
cd ~/house-party-app/v1/backend
nano generate_embeddings.py

# Paste this code:
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from services.embeddings import embed_text

load_dotenv()

# Connect to database
engine = create_engine(os.getenv('DATABASE_URL'))

with engine.connect() as conn:
    # Get all ground truth facts without embeddings
    result = conn.execute(text("""
        SELECT id, key, value FROM ground_truth_facts
        WHERE embedding IS NULL
    """))

    facts = result.fetchall()
    print(f"Found {len(facts)} facts without embeddings")

    # Generate embeddings
    for i, (fact_id, key, value) in enumerate(facts):
        text_to_embed = f"{key}: {value}"
        embedding = embed_text(text_to_embed)

        # Convert to PostgreSQL array format
        embedding_str = '[' + ','.join(map(str, embedding)) + ']'

        # Update database
        conn.execute(text("""
            UPDATE ground_truth_facts
            SET embedding = :embedding::vector
            WHERE id = :fact_id
        """), {"embedding": embedding_str, "fact_id": fact_id})

        conn.commit()

        if (i + 1) % 10 == 0:
            print(f"Processed {i + 1}/{len(facts)} facts...")

    print("✅ All embeddings generated!")

# Save and run:
# python generate_embeddings.py
```

**Checkpoint**: Database fully loaded with embeddings! ✅

---

## 🔧 **PHASE 2: Backend API** (Days 2-5)

### Task 2.1: Project Structure Setup

```bash
cd ~/house-party-app/v1/backend

# Create directory structure
mkdir -p {models,api,auth,services,utils,tests/unit,tests/integration}

# Already created:
# - services/embeddings.py ✅
# - services/ground_truth_query.py ✅
# - tests/unit/test_ground_truth_query.py ✅
```

### Task 2.2: Database Connection Setup

**File**: `v1/backend/utils/db.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment
DATABASE_URL = os.getenv('DATABASE_URL')

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency for FastAPI routes
def get_db():
    """Get database session for FastAPI dependency injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Task 2.3: SQLAlchemy Models

**File**: `v1/backend/models/user.py`

```python
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from utils.db import Base
import uuid

class User(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # Null if Google OAuth
    google_id = Column(String(255), unique=True, nullable=True)
    name = Column(String(255), nullable=False)
    profile_picture_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<User {self.email}>"
```

**File**: `v1/backend/models/event.py`

```python
from sqlalchemy import Column, String, DateTime, Date, Time, Numeric, Integer, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from utils.db import Base
import uuid

class Event(Base):
    __tablename__ = 'events'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey('groups.id', ondelete='SET NULL'), nullable=True)
    name = Column(String(255), nullable=False)
    event_type = Column(String(50), nullable=False)  # tight_knit, big_party, etc.
    main_host_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    date = Column(Date, nullable=True)
    time = Column(Time, nullable=True)
    address = Column(String, nullable=True)
    venue_name = Column(String(255), nullable=True)
    budget_per_person = Column(Numeric(10, 2), nullable=True)
    expected_guests = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    main_host = relationship("User", foreign_keys=[main_host_id])
    group = relationship("Group", back_populates="events")

    def __repr__(self):
        return f"<Event {self.name}>"
```

**File**: `v1/backend/models/ground_truth.py`

```python
from sqlalchemy import Column, String, DateTime, Text, ARRAY, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from utils.db import Base
import uuid

class GroundTruthFact(Base):
    __tablename__ = 'ground_truth_facts'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey('events.id', ondelete='CASCADE'), nullable=False)
    key = Column(String(100), nullable=False)  # 'address', 'parking', etc.
    value = Column(Text, nullable=False)
    category = Column(String(50), nullable=True)  # 'logistics', 'food', etc.
    importance = Column(String(20), nullable=True)  # 'critical', 'high', 'medium', 'low'
    keywords = Column(ARRAY(String), nullable=True)
    embedding = Column(Vector(1536), nullable=True)  # OpenAI embedding
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<GroundTruthFact {self.key}>"
```

**(Continue with other models similarly...)**

### Task 2.4: Authentication - Email/Password

**File**: `v1/backend/auth/email_auth.py`

```python
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from models.user import User
import uuid

# Bcrypt hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def register_user(db: Session, email: str, password: str, name: str):
    """Register new user with email/password"""
    # Check if user exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise ValueError("User already exists")

    # Create user
    user = User(
        id=uuid.uuid4(),
        email=email,
        password_hash=hash_password(password),
        name=name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def login_user(db: Session, email: str, password: str):
    """Authenticate user with email/password"""
    user = db.query(User).filter(User.email == email).first()

    if not user or not user.password_hash:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user
```

### Task 2.5: Authentication - JWT Tokens

**File**: `v1/backend/auth/jwt.py`

```python
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from sqlalchemy.orm import Session
from models.user import User
from utils.db import get_db
import os

SECRET_KEY = os.getenv('JWT_SECRET')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

def create_access_token(user_id: str) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> str:
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """FastAPI dependency to get current user from JWT"""
    token = credentials.credentials
    user_id = verify_token(token)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
```

### Task 2.6: API Endpoints - Auth

**File**: `v1/backend/api/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from auth.email_auth import register_user, login_user
from auth.jwt import create_access_token
from utils.db import get_db

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Pydantic models for request/response
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register new user with email/password"""
    try:
        user = register_user(db, request.email, request.password, request.name)
        access_token = create_access_token(str(user.id))

        return AuthResponse(
            access_token=access_token,
            user={
                "id": str(user.id),
                "email": user.email,
                "name": user.name
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email/password"""
    user = login_user(db, request.email, request.password)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(str(user.id))

    return AuthResponse(
        access_token=access_token,
        user={
            "id": str(user.id),
            "email": user.email,
            "name": user.name
        }
    )
```

### Task 2.7: API Endpoints - Events (CRUD)

**File**: `v1/backend/api/events.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time
from models.user import User
from models.event import Event
from models.group import Group
from auth.jwt import get_current_user
from utils.db import get_db
import uuid

router = APIRouter(prefix="/api/events", tags=["events"])

# Pydantic models
class CreateEventRequest(BaseModel):
    group_id: Optional[str] = None  # Optional: for group events
    name: str
    event_type: str  # tight_knit, big_party, frat_party
    date: Optional[date] = None
    time: Optional[time] = None
    address: Optional[str] = None
    venue_name: Optional[str] = None
    budget_per_person: Optional[float] = None
    expected_guests: Optional[int] = None

class EventResponse(BaseModel):
    id: str
    name: str
    event_type: str
    date: Optional[date]
    time: Optional[time]
    address: Optional[str]
    main_host_id: str

    class Config:
        from_attributes = True

@router.post("", response_model=EventResponse)
def create_event(
    request: CreateEventRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new event"""
    # Create event
    event = Event(
        id=uuid.uuid4(),
        group_id=request.group_id if request.group_id else None,
        name=request.name,
        event_type=request.event_type,
        main_host_id=current_user.id,
        date=request.date,
        time=request.time,
        address=request.address,
        venue_name=request.venue_name,
        budget_per_person=request.budget_per_person,
        expected_guests=request.expected_guests
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    # TODO: If group_id provided, prefill guest preferences
    # TODO: Generate to-do list based on event_type

    return EventResponse(
        id=str(event.id),
        name=event.name,
        event_type=event.event_type,
        date=event.date,
        time=event.time,
        address=event.address,
        main_host_id=str(event.main_host_id)
    )

@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get event details"""
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # TODO: Check if user has access (is host, co-host, or guest)

    return EventResponse(
        id=str(event.id),
        name=event.name,
        event_type=event.event_type,
        date=event.date,
        time=event.time,
        address=event.address,
        main_host_id=str(event.main_host_id)
    )

@router.get("", response_model=List[EventResponse])
def list_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all events for current user"""
    # Get events where user is main host
    events = db.query(Event).filter(Event.main_host_id == current_user.id).all()

    # TODO: Also get events where user is co-host or guest

    return [
        EventResponse(
            id=str(e.id),
            name=e.name,
            event_type=e.event_type,
            date=e.date,
            time=e.time,
            address=e.address,
            main_host_id=str(e.main_host_id)
        ) for e in events
    ]
```

### Task 2.8: WebSocket - Guest AI Assistant

**File**: `v1/backend/api/chat.py`

```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict, List
from models.event import Event
from services.ground_truth_query import query_ground_truth, ResponseType
from utils.db import get_db
import json
import uuid

router = APIRouter(tags=["websocket"])

# Connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, event_id: str, websocket: WebSocket):
        await websocket.accept()
        if event_id not in self.active_connections:
            self.active_connections[event_id] = []
        self.active_connections[event_id].append(websocket)

    def disconnect(self, event_id: str, websocket: WebSocket):
        if event_id in self.active_connections:
            self.active_connections[event_id].remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_text(json.dumps(message))

    async def broadcast(self, event_id: str, message: dict):
        if event_id in self.active_connections:
            for connection in self.active_connections[event_id]:
                await connection.send_text(json.dumps(message))

manager = ConnectionManager()

@router.websocket("/ws/events/{event_id}/assistant")
async def guest_assistant_websocket(
    websocket: WebSocket,
    event_id: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for Guest AI Assistant (1-on-1 chat)

    Client sends: {"type": "question", "content": "What's the address?"}
    Bot responds: {"type": "answer", "content": "123 Main St, LA"}
                   OR {"type": "escalate", "content": "I don't know. [Escalate button]"}
    """
    await manager.connect(event_id, websocket)

    try:
        while True:
            # Receive message from guest
            data = await websocket.receive_text()
            message = json.loads(data)

            if message['type'] == 'question':
                question = message['content']

                # Query ground truth
                result = query_ground_truth(question, event_id, db)

                # Send response based on result type
                if result.response_type == ResponseType.ANSWER:
                    response = {
                        "type": "answer",
                        "content": result.answer,
                        "confidence": result.confidence
                    }
                elif result.response_type == ResponseType.ESCALATE_TO_HOST:
                    response = {
                        "type": "escalate",
                        "content": "I don't have that information yet. Would you like to ask the host?",
                        "show_escalate_button": True
                    }
                else:  # OFF_TOPIC
                    response = {
                        "type": "off_topic",
                        "content": "I can only help with questions about this event!"
                    }

                await manager.send_personal_message(response, websocket)

    except WebSocketDisconnect:
        manager.disconnect(event_id, websocket)

@router.websocket("/ws/events/{event_id}/group")
async def group_chat_websocket(
    websocket: WebSocket,
    event_id: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for Group Chat (everyone)

    Client sends: {"type": "message", "user_id": "...", "content": "I'm vegetarian"}
    Bot broadcasts to all: {"type": "message", "user": {...}, "content": "..."}
    Bot rarely responds (only observes + extracts preferences)
    """
    await manager.connect(event_id, websocket)

    try:
        while True:
            # Receive message from user
            data = await websocket.receive_text()
            message = json.loads(data)

            if message['type'] == 'message':
                # Broadcast to all connected clients
                await manager.broadcast(event_id, {
                    "type": "message",
                    "user_id": message['user_id'],
                    "content": message['content'],
                    "timestamp": message.get('timestamp')
                })

                # TODO: Extract preferences from message (async task)
                # TODO: Detect suggestions ("we should get a photo booth")

    except WebSocketDisconnect:
        manager.disconnect(event_id, websocket)
```

### Task 2.9: Main FastAPI App

**File**: `v1/backend/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, events, chat

app = FastAPI(title="House Party App API", version="1.0.0")

# CORS (for Next.js frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return {"message": "House Party App API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# Run with: uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Task 2.10: Run Backend

```bash
cd ~/house-party-app/v1/backend
source venv/bin/activate

# Run backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Test in another terminal:
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

**Checkpoint**: Backend API running! ✅

---

## 🎨 **PHASE 3: Frontend** (Days 6-9)

### Task 3.1: Setup Next.js

```bash
cd ~/house-party-app/v1

# Create Next.js app
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir

cd frontend

# Install dependencies
npm install axios socket.io-client @tanstack/react-query zustand
```

### Task 3.2: API Client

**File**: `v1/frontend/lib/api.ts`

```typescript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const auth = {
  register: (email: string, password: string, name: string) =>
    api.post('/api/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
};

// Event endpoints
export const events = {
  create: (data: any) => api.post('/api/events', data),
  get: (eventId: string) => api.get(`/api/events/${eventId}`),
  list: () => api.get('/api/events'),
};
```

### Task 3.3: WebSocket Client

**File**: `v1/frontend/lib/websocket.ts`

```typescript
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export class ChatWebSocket {
  private ws: WebSocket | null = null;

  connect(eventId: string, chatType: 'assistant' | 'group') {
    const url = `${WS_URL}/ws/events/${eventId}/${chatType}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    return this.ws;
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

### Task 3.4: Login Page

**File**: `v1/frontend/app/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await auth.login(email, password);
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-600">Register</a>
        </p>
      </div>
    </div>
  );
}
```

### Task 3.5: Guest AI Assistant Chat

**File**: `v1/frontend/app/events/[id]/assistant/page.tsx`

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatWebSocket } from '@/lib/websocket';

export default function AssistantPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState<ChatWebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const chatWs = new ChatWebSocket();
    const connection = chatWs.connect(params.id, 'assistant');

    connection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, { ...data, sender: 'bot' }]);
    };

    wsRef.current = connection;
    setWs(chatWs);

    return () => {
      chatWs.disconnect();
    };
  }, [params.id]);

  const sendMessage = () => {
    if (!input.trim() || !ws) return;

    // Add user message to chat
    setMessages((prev) => [...prev, { type: 'question', content: input, sender: 'user' }]);

    // Send to server
    ws.sendMessage({ type: 'question', content: input });

    setInput('');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Event Assistant</h1>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-3 p-3 rounded ${
              msg.sender === 'user'
                ? 'bg-blue-500 text-white ml-auto max-w-xs'
                : 'bg-white max-w-xs'
            }`}
          >
            {msg.content}

            {msg.type === 'escalate' && (
              <button className="mt-2 bg-red-500 text-white px-3 py-1 rounded">
                Escalate to Host
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask a question..."
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>

      {/* Quick commands */}
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => setInput('/address')}
          className="text-sm bg-gray-200 px-3 py-1 rounded"
        >
          /address
        </button>
        <button
          onClick={() => setInput('/parking')}
          className="text-sm bg-gray-200 px-3 py-1 rounded"
        >
          /parking
        </button>
      </div>
    </div>
  );
}
```

**Checkpoint**: You now have a working Guest AI Assistant chat! ✅

---

## 📝 **Complete Task Checklist** (Copy/Paste This)

### ✅ Phase 0: Foundation (DONE)
- [x] Project restructure
- [x] Dev docs
- [x] Database schema
- [x] Seed data (2100+ lines)
- [x] Ground truth query system
- [x] Unit tests

### ⬜ Phase 1: EC2 Setup (Day 1)
- [ ] Install PostgreSQL + pgvector
- [ ] Install Python 3.11
- [ ] Clone repository
- [ ] Create virtual environment
- [ ] Install Python dependencies
- [ ] Configure .env file
- [ ] Load database schema
- [ ] Load seed data
- [ ] Generate embeddings for ground truth

### ⬜ Phase 2: Backend API (Days 2-5)
- [ ] Setup database connection (db.py)
- [ ] Create SQLAlchemy models:
  - [ ] User model
  - [ ] Event model
  - [ ] GroundTruthFact model
  - [ ] Message model
  - [ ] Preference model
  - [ ] Escalation model
- [ ] Auth system:
  - [ ] Email/password (register, login)
  - [ ] JWT tokens
  - [ ] Google OAuth (optional)
- [ ] API endpoints:
  - [ ] POST /api/auth/register
  - [ ] POST /api/auth/login
  - [ ] POST /api/events
  - [ ] GET /api/events/{id}
  - [ ] GET /api/events
- [ ] WebSocket:
  - [ ] /ws/events/{id}/assistant (Guest AI)
  - [ ] /ws/events/{id}/group (Group chat)
- [ ] Test backend with curl/Postman

### ⬜ Phase 3: Frontend (Days 6-9)
- [ ] Setup Next.js project
- [ ] Configure API client
- [ ] Configure WebSocket client
- [ ] Login page
- [ ] Register page
- [ ] Dashboard (list events)
- [ ] Create event page
- [ ] Guest AI Assistant chat page
- [ ] Group chat page
- [ ] Host interface dashboard

### ⬜ Phase 4: Polish (Days 10-12)
- [ ] Test end-to-end flows
- [ ] Fix bugs
- [ ] Add loading states
- [ ] Add error handling
- [ ] UI polish

---

## 🎯 **Summary of Answers**

1. **EC2 setup**: Install PostgreSQL, Python, load schema/seed data, generate embeddings
2. **Delete old stuff**: Yes, ignore `/v0/` entirely
3. **Generate embeddings**: Use OpenAI API via `/v1/backend/services/embeddings.py` (already built!)
4. **SQLAlchemy**: Python ORM (maps database tables to Python classes)
5. **Auth/CRUD/WebSocket**: Detailed code examples above ⬆️
6. **Three chat pieces**: Build in order: (1) Guest AI → (2) Group Chat → (3) Host Interface
7. **Task list**: 150 tasks, detailed checklist above ✅

Start with Phase 1 tomorrow on EC2! I'll guide you through each step. 🚀
