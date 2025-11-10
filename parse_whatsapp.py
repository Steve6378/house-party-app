"""
Parse WhatsApp chat export to JSON format for RAG ingestion.

Handles:
- Multi-line messages
- Image/media omitted entries
- @ mentions
- Various timestamp formats
"""

import re
import json
from datetime import datetime
from typing import List, Dict


def parse_whatsapp_chat(txt_file: str, output_json: str = "chat_export.json") -> List[Dict]:
    """
    Parse WhatsApp .txt export into JSON format.

    Args:
        txt_file: Path to .txt chat export
        output_json: Output JSON file path

    Returns:
        List of message dicts
    """
    # Regex for WhatsApp message format: [date, time] name: message
    # Matches: [9/7/25, 7:14:01 PM] name: message
    message_pattern = re.compile(r'^\[(\d{1,2}/\d{1,2}/\d{2,4}),\s*(\d{1,2}:\d{2}:\d{2}\s*[AP]M)\]\s*([^:]+):\s*(.*)$')

    messages = []
    current_message = None

    print(f"Parsing {txt_file}...")

    # Try multiple encodings to handle emojis and special characters
    encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
    file_content = None

    for encoding in encodings:
        try:
            with open(txt_file, 'r', encoding=encoding, errors='replace') as f:
                file_content = f.readlines()
            print(f"Successfully opened file with {encoding} encoding")
            break
        except (UnicodeDecodeError, UnicodeError):
            continue

    if file_content is None:
        print("ERROR: Could not decode file with any encoding")
        return []

    for line_num, line in enumerate(file_content, 1):
        line = line.rstrip('\n')

        # Try to match a new message
        match = message_pattern.match(line)

        if match:
            # Save previous message if exists
            if current_message and current_message['content'].strip():
                # Skip "image omitted" and similar system messages
                if not should_skip_message(current_message['content']):
                    messages.append(current_message)

            # Start new message
            date_str = match.group(1)
            time_str = match.group(2)
            user = match.group(3).strip()
            content = match.group(4).strip()

            # Parse timestamp
            timestamp = parse_timestamp(date_str, time_str)

            current_message = {
                'user': user,
                'content': content,
                'timestamp': timestamp
            }

        else:
            # Continuation of previous message (multi-line)
            if current_message and line.strip():
                current_message['content'] += ' ' + line.strip()

    # Don't forget last message
    if current_message and current_message['content'].strip():
        if not should_skip_message(current_message['content']):
            messages.append(current_message)

    # Clean up @ mentions
    for msg in messages:
        msg['content'] = clean_message(msg['content'])

    # Save to JSON
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(messages, f, indent=2)

    print(f"\nParsed {len(messages)} messages")
    print(f"Saved to {output_json}")

    # Show stats
    users = {}
    for msg in messages:
        users[msg['user']] = users.get(msg['user'], 0) + 1

    print("\nMessages per user:")
    for user, count in sorted(users.items(), key=lambda x: x[1], reverse=True):
        print(f"  {user}: {count}")

    return messages


def parse_timestamp(date_str: str, time_str: str) -> str:
    """
    Parse WhatsApp timestamp to ISO format.

    Args:
        date_str: e.g., "9/7/25" or "9/7/2025"
        time_str: e.g., "7:14:01 PM"

    Returns:
        ISO format timestamp: "2025-09-07T19:14:01"
    """
    # Handle 2-digit or 4-digit year
    date_parts = date_str.split('/')
    month, day, year = date_parts

    if len(year) == 2:
        year = '20' + year  # Assume 2000s

    # Parse time with AM/PM
    time_obj = datetime.strptime(time_str, '%I:%M:%S %p')

    # Combine into full timestamp
    dt = datetime(
        year=int(year),
        month=int(month),
        day=int(day),
        hour=time_obj.hour,
        minute=time_obj.minute,
        second=time_obj.second
    )

    return dt.isoformat()


def should_skip_message(content: str) -> bool:
    """
    Check if message should be skipped (system messages, media omitted, etc.).

    Args:
        content: Message content

    Returns:
        True if should skip
    """
    skip_patterns = [
        'image omitted',
        'video omitted',
        'audio omitted',
        'sticker omitted',
        'document omitted',
        'GIF omitted',
        'Contact card omitted',
        'deleted this message',
        'Messages and calls are end-to-end encrypted',
        'changed the subject',
        'changed this group',
        'added you',
        'left',
        'removed',
        'created group'
    ]

    content_lower = content.lower()
    return any(pattern.lower() in content_lower for pattern in skip_patterns)


def clean_message(content: str) -> str:
    """
    Clean up message content (remove @ mentions artifacts, etc.).

    Args:
        content: Original message content

    Returns:
        Cleaned content
    """
    # Remove @ mentions but keep the name
    # "@name" → "name"
    content = re.sub(r'@(\w+)', r'\1', content)

    # Remove extra whitespace
    content = re.sub(r'\s+', ' ', content)

    return content.strip()


def preview_sample(messages: List[Dict], num_samples: int = 5):
    """Print sample messages for verification."""
    print("\n" + "="*80)
    print(f"SAMPLE MESSAGES (first {num_samples})")
    print("="*80)

    for i, msg in enumerate(messages[:num_samples], 1):
        print(f"\n[{i}] {msg['user']} at {msg['timestamp']}")
        print(f"    {msg['content'][:100]}{'...' if len(msg['content']) > 100 else ''}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python parse_whatsapp.py <chat_export.txt> [output.json]")
        print("\nExample:")
        print("  python parse_whatsapp.py whatsapp_chat.txt chat_export.json")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "chat_export.json"

    messages = parse_whatsapp_chat(input_file, output_file)

    # Show preview
    preview_sample(messages, num_samples=5)

    print("\n" + "="*80)
    print(f"Ready to use with: python rag/extract_facts.py")
    print(f"(Update extract_facts.py to load '{output_file}' instead of 'mock_chat.json')")
    print("="*80)
