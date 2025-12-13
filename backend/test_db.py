from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT COUNT(*) FROM events"))
    count = result.scalar()
    print(f"[OK] Database connected! Found {count} events.")
    
    result = conn.execute(text("SELECT name FROM events LIMIT 3"))
    events = result.fetchall()
    print(f"\nFirst 3 events:")
    for event in events:
        print(f"  - {event[0]}")
