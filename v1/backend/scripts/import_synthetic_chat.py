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

# Event ID mapping based on actual synthetic chat event files
# Maps date ranges to event IDs in yorru_dev database
# Note: synthetic chat has event_00 through event_15 (16 events)
# These map to event001 through event016 in the database
EVENT_MAP = [
    ('2024-05-01', '2024-05-01', 'event001-0001-0001-0001-000000000001'),  # event_00: Group Creation
    ('2024-05-03', '2024-05-03', 'event002-0002-0002-0002-000000000002'),  # event_01: Coffee Study
    ('2024-05-09', '2024-05-11', 'event003-0003-0003-0003-000000000003'),  # event_02: Brunch
    ('2024-05-15', '2024-05-18', 'event004-0004-0004-0004-000000000004'),  # event_03: Beach Day
    ('2024-05-24', '2024-05-25', 'event005-0005-0005-0005-000000000005'),  # event_04: Thai Restaurant
    ('2024-06-01', '2024-06-02', 'event006-0006-0006-0006-000000000006'),  # event_05: Runyon Canyon
    ('2024-06-10', '2024-06-14', 'event007-0007-0007-0007-000000000007'),  # event_06: Game Night
    ('2024-06-20', '2024-07-28', 'event008-0008-0008-0008-000000000008'),  # event_07: K-Pop Concert
    ('2024-08-08', '2024-08-11', 'event009-0009-0009-0009-000000000009'),  # event_08: Farmers Market
    ('2024-08-22', '2024-08-24', 'event010-0010-0010-0010-000000000010'),  # event_09: Escape Room
    ('2024-09-03', '2024-09-06', 'event011-0011-0011-0011-000000000011'),  # event_10: Outdoor Movie
    ('2024-09-18', '2024-09-21', 'event012-0012-0012-0012-000000000012'),  # event_11: Potluck Dinner
    ('2024-10-03', '2024-10-05', 'event013-0013-0013-0013-000000000013'),  # event_12: Malibu Trip
    ('2024-10-15', '2024-10-19', 'event014-0014-0014-0014-000000000014'),  # event_13: Underground Concert
    ('2024-10-28', '2024-11-02', 'event015-0015-0015-0015-000000000015'),  # event_14: Piano Recital
    ('2024-11-12', '2024-11-16', 'event016-0016-0016-0016-000000000016'),  # event_15: Mahiru Birthday
]

def get_event_id_for_timestamp(timestamp_str):
    """Determine which event a message belongs to based on timestamp

    Messages within event date ranges are assigned to that event.
    Messages between events are assigned to the most recent previous event.
    Messages before all events go to event 1, after all events go to event 16.
    """
    msg_date = datetime.fromisoformat(timestamp_str).date()

    # Check if message falls within an event's date range
    for start, end, event_id in EVENT_MAP:
        if datetime.fromisoformat(start).date() <= msg_date <= datetime.fromisoformat(end).date():
            return event_id

    # For messages between events, assign to the most recent previous event
    previous_event_id = EVENT_MAP[0][2]  # Default to first event
    for start, end, event_id in EVENT_MAP:
        event_end = datetime.fromisoformat(end).date()
        if msg_date > event_end:
            previous_event_id = event_id
        else:
            break

    return previous_event_id

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
