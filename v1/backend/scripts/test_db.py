#!/usr/bin/env python3
# Festivio - Test Database Connection
# Version: 0.0.1

import sys
sys.path.insert(0, '..')

from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv('../.env')

DATABASE_URL = os.getenv('DATABASE_URL')

def main():
    """Test database connection"""
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            # Get event count
            result = conn.execute(text("SELECT COUNT(*) FROM events"))
            event_count = result.scalar()
            
            print(f"✅ Database connected! Found {event_count} events.")
            
            # Get first 3 event names
            result = conn.execute(text("SELECT name FROM events ORDER BY date LIMIT 3"))
            events = result.fetchall()
            
            print("\nFirst 3 events:")
            for event in events:
                print(f"  - {event[0]}")
                
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
