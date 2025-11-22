#!/usr/bin/env python3
"""
Import synthetic chat messages from GitHub into yorru_dev database

Usage:
    python3 import_synthetic_chat.py
"""

import json
import requests
from datetime import datetime
from uuid import uuid4

# User name to UUID mapping (from seed data)
USER_MAP = {
    'Amane': '11111111-1111-1111-1111-111111111111',
    'Mahiru': '22222222-2222-2222-2222-222222222222',
    'Jake': '33333333-3333-3333-3333-333333333333',
    'Tanya': '44444444-4444-4444-4444-444444444444',
    'Nirali': '55555555-5555-5555-5555-555555555555',
    'Maya': '66666666-6666-6666-6666-666666666666',
}

# Event ID mapping based on timeframes
# Assign messages to different events based on date ranges
EVENT_MAP = [
    ('2024-05-01', '2024-05-05', 'event001-0001-0001-0001-000000000001'),  # Coffee Study Session
    ('2024-05-06', '2024-05-10', 'event002-0002-0002-0002-000000000002'),  # Movie Night
    ('2024-05-11', '2024-05-15', 'event003-0003-0003-0003-000000000003'),  # Thanksgiving
    ('2024-05-16', '2024-05-20', 'event004-0004-0004-0004-000000000004'),  # Maya's Birthday
    ('2024-05-21', '2024-05-31', 'event005-0005-0005-0005-000000000005'),  # Frat Party
]

def get_event_id_for_timestamp(timestamp_str):
    """Determine which event a message belongs to based on timestamp"""
    msg_date = datetime.fromisoformat(timestamp_str).date()

    for start, end, event_id in EVENT_MAP:
        if datetime.fromisoformat(start).date() <= msg_date <= datetime.fromisoformat(end).date():
            return event_id

    # Default to first event if out of range
    return EVENT_MAP[0][2]

def escape_sql_string(s):
    """Escape single quotes for SQL"""
    return s.replace("'", "''")

def main():
    # Fetch the JSON file from GitHub
    url = 'https://raw.githubusercontent.com/Steve6378/yorru/claude/house-party-app-011CUr8tqsUczbJkyzjdwrKc/synthetic_chat.json'

    print(f"Fetching messages from GitHub...")
    response = requests.get(url)
    response.raise_for_status()

    messages = json.loads(response.text)
    print(f"Found {len(messages)} messages")

    # Filter out system messages and unknown users
    valid_messages = [
        msg for msg in messages
        if msg.get('user') in USER_MAP
    ]

    print(f"Valid messages (excluding system): {len(valid_messages)}")

    # Generate SQL INSERT statements
    sql_file = 'synthetic_chat_import.sql'

    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write("-- Synthetic Chat Messages Import\n")
        f.write(f"-- Generated: {datetime.now().isoformat()}\n")
        f.write(f"-- Total messages: {len(valid_messages)}\n\n")

        # Group messages into batches for better performance
        batch_size = 100
        for i in range(0, len(valid_messages), batch_size):
            batch = valid_messages[i:i+batch_size]

            f.write(f"-- Batch {i//batch_size + 1}\n")
            f.write("INSERT INTO messages (id, event_id, user_id, content, message_type, ai_processed, created_at) VALUES\n")

            values = []
            for msg in batch:
                msg_id = str(uuid4())
                event_id = get_event_id_for_timestamp(msg['timestamp'])
                user_id = USER_MAP[msg['user']]
                content = escape_sql_string(msg['content'])
                timestamp = msg['timestamp']

                values.append(
                    f"('{msg_id}', '{event_id}', '{user_id}', '{content}', 'user', TRUE, '{timestamp}')"
                )

            f.write(',\n'.join(values))
            f.write(';\n\n')

    print(f"\n✅ SQL file created: {sql_file}")
    print(f"\nTo import into database:")
    print(f"psql -U yorru_dev -d yorru_dev -h localhost -f {sql_file}")

    # Print statistics
    print(f"\nStatistics:")
    print(f"  Total messages: {len(valid_messages)}")
    print(f"  Messages by user:")
    user_counts = {}
    for msg in valid_messages:
        user = msg['user']
        user_counts[user] = user_counts.get(user, 0) + 1

    for user, count in sorted(user_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"    {user}: {count}")

    print(f"\n  Messages by event:")
    event_counts = {}
    for msg in valid_messages:
        event_id = get_event_id_for_timestamp(msg['timestamp'])
        event_counts[event_id] = event_counts.get(event_id, 0) + 1

    for event_id, count in event_counts.items():
        print(f"    {event_id}: {count}")

if __name__ == '__main__':
    main()
