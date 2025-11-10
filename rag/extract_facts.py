"""
Fact Extraction Pipeline
Extracts user and group facts from chat messages using OpenAI.
"""

import os
import json
import psycopg2
from psycopg2.extras import execute_values
from openai import OpenAI
from typing import List, Dict
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def get_db_connection():
    """Create database connection."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "house_party_db"),
        user=os.getenv("DB_USER", "house_party_user"),
        password=os.getenv("DB_PASSWORD")
    )


def extract_facts_from_message(client: OpenAI, message: Dict) -> Dict:
    """
    Use OpenAI to extract facts from a single message.

    Args:
        client: OpenAI client
        message: Dict with 'user', 'content', 'message_id'

    Returns:
        Dict with 'user_facts' and 'group_facts' lists
    """
    prompt = f"""
You are analyzing a group chat message to extract useful facts about users and the group.

Message from {message['user']}: "{message['content']}"

Extract facts in JSON format:
{{
  "user_facts": [
    {{"fact": "prefers Python over R", "confidence": 0.90}},
    {{"fact": "available on weekends", "confidence": 0.85}},
    {{"fact": "experienced with RAG systems", "confidence": 0.95}}
  ],
  "group_facts": [
    {{"fact": "working on Yelp dataset project", "confidence": 0.90}},
    {{"fact": "using PostgreSQL database", "confidence": 0.95}}
  ]
}}

Rules:
- User facts: preferences, skills, availability, work habits, constraints, personal info
- Group facts: project context, tools/tech used, deadlines, shared decisions, past events
- Extract ANY useful context that could help future interactions
- Be broad: technical skills, schedule, communication style, opinions, capabilities
- Only extract clear, verifiable facts (not speculation)
- Confidence should reflect certainty (0.0 to 1.0)
- Return empty arrays if no facts found

Return ONLY valid JSON, no markdown or explanation.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )

    try:
        result = json.loads(response.choices[0].message.content)
        return result
    except json.JSONDecodeError:
        print(f"Warning: Could not parse response for message: {message['content']}")
        return {"user_facts": [], "group_facts": []}


def generate_embeddings(client: OpenAI, texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a batch of texts.

    Args:
        client: OpenAI client
        texts: List of text strings

    Returns:
        List of embedding vectors
    """
    if not texts:
        return []

    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )

    return [item.embedding for item in response.data]


def store_user_facts(conn, user_id: str, facts: List[Dict], message_id: str, embeddings: List[List[float]]):
    """Store user facts in database."""
    if not facts:
        return

    values = [
        (user_id, fact['fact'], embeddings[i], fact['confidence'], message_id)
        for i, fact in enumerate(facts)
    ]

    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO user_facts (user_id, fact_text, fact_embedding, confidence, source_message_id)
            VALUES %s
            """,
            values,
            template="(%s, %s, %s::vector, %s, %s)"
        )
    conn.commit()


def store_group_facts(conn, group_id: str, facts: List[Dict], message_id: str, embeddings: List[List[float]]):
    """Store group facts in database."""
    if not facts:
        return

    values = [
        (group_id, fact['fact'], embeddings[i], fact['confidence'], message_id)
        for i, fact in enumerate(facts)
    ]

    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO group_facts (group_id, fact_text, fact_embedding, confidence, source_message_id)
            VALUES %s
            """,
            values,
            template="(%s, %s, %s::vector, %s, %s)"
        )
    conn.commit()


def process_messages(messages: List[Dict], group_id: str):
    """
    Main pipeline: extract facts from all messages.

    Args:
        messages: List of dicts with 'user', 'content', 'timestamp'
        group_id: UUID of the group
    """
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    conn = get_db_connection()

    stats = {
        'total_messages': len(messages),
        'user_facts_extracted': 0,
        'group_facts_extracted': 0,
        'messages_with_facts': 0
    }

    print("="*60)
    print("FACT EXTRACTION PIPELINE")
    print("="*60)
    print(f"Processing {len(messages)} messages...\n")

    for i, msg in enumerate(messages, 1):
        print(f"[{i}/{len(messages)}] Processing: {msg['user']}: {msg['content'][:50]}...")

        # Get or create user
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM users WHERE name = %s", (msg['user'],))
            result = cur.fetchone()
            if result:
                user_id = result[0]
            else:
                cur.execute(
                    "INSERT INTO users (name) VALUES (%s) RETURNING user_id",
                    (msg['user'],)
                )
                user_id = cur.fetchone()[0]
                conn.commit()

        # Store message
        message_embedding = generate_embeddings(client, [msg['content']])[0]
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO messages (group_id, user_id, content, message_embedding, created_at)
                VALUES (%s, %s, %s, %s::vector, %s)
                RETURNING message_id
                """,
                (group_id, user_id, msg['content'], message_embedding, msg.get('timestamp', datetime.now()))
            )
            message_id = cur.fetchone()[0]
            conn.commit()

        # Extract facts using OpenAI
        extracted = extract_facts_from_message(client, {
            'user': msg['user'],
            'content': msg['content'],
            'message_id': message_id
        })

        user_facts = extracted.get('user_facts', [])
        group_facts = extracted.get('group_facts', [])

        if user_facts or group_facts:
            stats['messages_with_facts'] += 1

        # Generate embeddings for facts
        if user_facts:
            fact_texts = [f"{msg['user']} {fact['fact']}" for fact in user_facts]
            fact_embeddings = generate_embeddings(client, fact_texts)
            store_user_facts(conn, user_id, user_facts, message_id, fact_embeddings)
            stats['user_facts_extracted'] += len(user_facts)
            print(f"  → Extracted {len(user_facts)} user facts")

        if group_facts:
            fact_texts = [fact['fact'] for fact in group_facts]
            fact_embeddings = generate_embeddings(client, fact_texts)
            store_group_facts(conn, group_id, group_facts, message_id, fact_embeddings)
            stats['group_facts_extracted'] += len(group_facts)
            print(f"  → Extracted {len(group_facts)} group facts")

    conn.close()

    print("\n" + "="*60)
    print("EXTRACTION COMPLETE")
    print("="*60)
    print(f"Total messages processed: {stats['total_messages']}")
    print(f"Messages with facts: {stats['messages_with_facts']}")
    print(f"User facts extracted: {stats['user_facts_extracted']}")
    print(f"Group facts extracted: {stats['group_facts_extracted']}")
    print("="*60)


if __name__ == "__main__":
    import sys

    # Accept filename as command-line argument
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        input_file = "mock_chat.json"

    if not os.path.exists(input_file):
        print(f"ERROR: {input_file} not found")
        print("\nUsage: python rag/extract_facts.py [chat_file.json]")
        print("Example: python rag/extract_facts.py real_chat.json")
        exit(1)

    print(f"Loading messages from: {input_file}")
    with open(input_file, 'r') as f:
        messages = json.load(f)

    # Use a test group ID (in real app, this would come from request)
    test_group_id = "00000000-0000-0000-0000-000000000001"

    # Ensure group exists
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO groups (group_id, group_name)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
            """,
            (test_group_id, "DSCI 560 Group")
        )
    conn.commit()
    conn.close()

    process_messages(messages, test_group_id)
