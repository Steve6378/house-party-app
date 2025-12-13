#!/usr/bin/env python3
"""
Migration script to add face recognition columns to the database.

Run this script to add:
- face_encoding column to users table (for profile photo face data)
- face_encodings column to event_photos table (for event photo face data)

Usage:
    cd backend
    source venv/bin/activate
    python scripts/add_face_recognition_columns.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from utils.database import engine


def add_face_recognition_columns():
    """Add face recognition columns to users and event_photos tables."""

    with engine.connect() as conn:
        # Add face_encoding column to users table
        try:
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS face_encoding TEXT
            """))
            print("[OK] Added face_encoding column to users table")
        except Exception as e:
            print(f"Note: face_encoding column may already exist: {e}")

        # Add face_encodings column to event_photos table
        try:
            conn.execute(text("""
                ALTER TABLE event_photos
                ADD COLUMN IF NOT EXISTS face_encodings TEXT
            """))
            print("[OK] Added face_encodings column to event_photos table")
        except Exception as e:
            print(f"Note: face_encodings column may already exist: {e}")

        conn.commit()
        print("\n[OK] Face recognition columns migration complete!")
        print("\nTo enable face recognition:")
        print("1. Install face_recognition: pip install face_recognition")
        print("2. Restart the backend server")
        print("3. Users can use #photos to find photos containing their face")


if __name__ == "__main__":
    print("Adding face recognition columns...")
    add_face_recognition_columns()
