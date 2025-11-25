#!/usr/bin/env python3
"""Initialize the database by creating all tables."""

from utils.database import engine, Base
from models import (
    User, Group, Event, GroundTruthFact, GroundTruthChangeLog,
    Message, EscalatedQuestion, Suggestion, Todo, EventAttendance,
    GroupMembership, EventCoHost, GuestPreferences, GroupPreferences,
    Poll, PollVote, AuditLog
)
from models.event_document import EventDocument
from models.questionnaire import EventQuestionnaire

def init_database():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_database()
