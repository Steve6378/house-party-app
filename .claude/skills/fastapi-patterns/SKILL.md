# FastAPI Patterns for Yorru

## Context
Best practices for building the Yorru REST API with FastAPI + SQLAlchemy + Pydantic.

## Stack
- **Framework**: FastAPI 0.109+
- **ORM**: SQLAlchemy 2.0 (async support)
- **Validation**: Pydantic v2
- **Database**: PostgreSQL 15
- **Auth**: JWT (python-jose) + bcrypt (passlib)

---

## 1. Project Structure

```
v1/backend/
├── main.py                 # FastAPI app entry point
├── config.py               # Environment variables
├── requirements.txt        # Dependencies
│
├── models/                 # SQLAlchemy models
│   ├── user.py
│   ├── event.py
│   ├── ground_truth.py
│   └── ...
│
├── api/                    # API routers
│   ├── auth.py            # POST /api/auth/register, /login
│   ├── events.py          # CRUD /api/events
│   ├── ground_truth.py    # /api/events/{id}/ground-truth
│   └── chat.py            # WebSocket endpoints
│
├── auth/                   # Authentication logic
│   ├── email_auth.py      # Email/password + bcrypt
│   ├── jwt.py             # JWT tokens
│   └── google_oauth.py    # Google OAuth
│
├── services/              # Business logic
│   ├── embeddings.py      # OpenAI embedding generation
│   ├── ground_truth_query.py
│   ├── preference_extractor.py
│   └── suggestion_generator.py
│
└── utils/
    ├── db.py              # Database connection
    └── security.py        # Input sanitization
```

---

## 2. Main App Setup

```python
# v1/backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, events, ground_truth, chat

app = FastAPI(
    title="Yorru API",
    version="1.0.0",
    docs_url="/api/docs",  # Swagger UI
    redoc_url="/api/redoc"
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(ground_truth.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return {"message": "Yorru API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 3. Database Connection

```python
# v1/backend/utils/db.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True  # Verify connections before use
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# FastAPI dependency
def get_db():
    """Get database session (dependency injection)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## 4. SQLAlchemy Models

```python
# v1/backend/models/event.py
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
    event_type = Column(String(50), nullable=False)
    main_host_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    date = Column(Date, nullable=True)
    time = Column(Time, nullable=True)
    address = Column(String, nullable=True)
    budget_per_person = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    main_host = relationship("User", foreign_keys=[main_host_id])
    ground_truth_facts = relationship("GroundTruthFact", back_populates="event")

    def to_dict(self):
        """Convert to dictionary for JSON response"""
        return {
            "id": str(self.id),
            "name": self.name,
            "event_type": self.event_type,
            "main_host_id": str(self.main_host_id),
            "date": self.date.isoformat() if self.date else None,
            "time": self.time.isoformat() if self.time else None,
            "address": self.address,
            "budget_per_person": float(self.budget_per_person) if self.budget_per_person else None
        }
```

---

## 5. Pydantic Schemas (Request/Response)

```python
# v1/backend/api/events.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, time

class CreateEventRequest(BaseModel):
    """Request body for creating event"""
    group_id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=255)
    event_type: str = Field(..., regex="^(tight_knit|big_party|frat_party|formal)$")
    date: Optional[date] = None
    time: Optional[time] = None
    address: Optional[str] = None
    venue_name: Optional[str] = None
    budget_per_person: Optional[float] = Field(None, ge=0)

class EventResponse(BaseModel):
    """Response schema for event"""
    id: str
    name: str
    event_type: str
    main_host_id: str
    date: Optional[date]
    time: Optional[time]
    address: Optional[str]

    class Config:
        from_attributes = True  # Pydantic v2 (was orm_mode in v1)
```

---

## 6. API Endpoints (CRUD)

```python
# v1/backend/api/events.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from models.user import User
from models.event import Event
from auth.jwt import get_current_user
from utils.db import get_db
import uuid

router = APIRouter(prefix="/api/events", tags=["events"])

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    request: CreateEventRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create new event

    - Requires authentication (JWT token)
    - User becomes main host
    - If group_id provided, prefills guest preferences
    """
    event = Event(
        id=uuid.uuid4(),
        group_id=request.group_id if request.group_id else None,
        name=request.name,
        event_type=request.event_type,
        main_host_id=current_user.id,
        date=request.date,
        time=request.time,
        address=request.address,
        budget_per_person=request.budget_per_person
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return EventResponse(**event.to_dict())

@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get event by ID"""
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # TODO: Check if user has access (host, co-host, or guest)

    return EventResponse(**event.to_dict())

@router.get("", response_model=List[EventResponse])
def list_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all events for current user"""
    events = db.query(Event).filter(
        Event.main_host_id == current_user.id
    ).all()

    return [EventResponse(**e.to_dict()) for e in events]

@router.patch("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: str,
    request: CreateEventRequest,  # Reuse same schema
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update event (main host only)"""
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.main_host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only main host can edit")

    # Update fields
    event.name = request.name
    event.date = request.date
    event.time = request.time
    event.address = request.address

    db.commit()
    db.refresh(event)

    return EventResponse(**event.to_dict())

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete event (main host only)"""
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.main_host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only main host can delete")

    db.delete(event)
    db.commit()

    return  # 204 No Content
```

---

## 7. Authentication Patterns

### JWT Token Creation
```python
# v1/backend/auth/jwt.py
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

SECRET_KEY = os.getenv('JWT_SECRET')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def create_access_token(user_id: str) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

### Get Current User Dependency
```python
# v1/backend/auth/jwt.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from models.user import User

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency to get current user from JWT token

    Usage in endpoints:
        current_user: User = Depends(get_current_user)
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
```

---

## 8. Error Handling

```python
from fastapi import HTTPException, status

# Standard error responses
def not_found(resource: str):
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} not found"
    )

def forbidden(message: str = "Access denied"):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=message
    )

def bad_request(message: str):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=message
    )

# Usage:
if not event:
    not_found("Event")

if event.main_host_id != current_user.id:
    forbidden("Only main host can edit event")
```

---

## 9. Input Validation & Security

```python
# v1/backend/utils/security.py
import re
from fastapi import HTTPException

def sanitize_text(text: str, max_length: int = 1000) -> str:
    """Remove HTML/script tags, limit length"""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)

    # Limit length
    if len(text) > max_length:
        raise HTTPException(status_code=400, detail=f"Text too long (max {max_length})")

    return text.strip()

def validate_uuid(uuid_str: str) -> bool:
    """Check if string is valid UUID"""
    try:
        uuid.UUID(uuid_str)
        return True
    except ValueError:
        return False
```

---

## 10. Testing Patterns

### Unit Test for Endpoint
```python
# v1/tests/integration/test_api_events.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_event():
    """Test POST /api/events"""
    # Register and login
    register_response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "test123",
        "name": "Test User"
    })
    token = register_response.json()["access_token"]

    # Create event
    response = client.post(
        "/api/events",
        json={
            "name": "Test Event",
            "event_type": "tight_knit",
            "date": "2025-12-01",
            "time": "19:00",
            "address": "123 Test St"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Event"
    assert data["event_type"] == "tight_knit"
```

---

## Common Patterns

### Pagination
```python
@router.get("", response_model=List[EventResponse])
def list_events(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List events with pagination"""
    events = db.query(Event).filter(
        Event.main_host_id == current_user.id
    ).offset(skip).limit(limit).all()

    return [EventResponse(**e.to_dict()) for e in events]
```

### Filtering
```python
@router.get("", response_model=List[EventResponse])
def list_events(
    event_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List events with optional filter"""
    query = db.query(Event).filter(Event.main_host_id == current_user.id)

    if event_type:
        query = query.filter(Event.event_type == event_type)

    events = query.all()
    return [EventResponse(**e.to_dict()) for e in events]
```

---

## References
- **FastAPI docs**: https://fastapi.tiangolo.com/
- **SQLAlchemy 2.0**: https://docs.sqlalchemy.org/en/20/
- **Pydantic v2**: https://docs.pydantic.dev/2.0/
