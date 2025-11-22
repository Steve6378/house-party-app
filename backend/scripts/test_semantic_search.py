#!/usr/bin/env python3
# Yorru - Test Semantic Search
# Version: 0.0.1

import sys
sys.path.insert(0, '..')

from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os
from openai import OpenAI

# Load environment variables (look in parent directory from script location)
import pathlib
script_dir = pathlib.Path(__file__).parent.resolve()
env_path = script_dir.parent / '.env'
load_dotenv(env_path)

DATABASE_URL = os.getenv('DATABASE_URL')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Create engine and client
engine = create_engine(DATABASE_URL)
client = OpenAI(api_key=OPENAI_API_KEY)

def semantic_search(question: str, event_id: str, limit: int = 3):
    """Search ground truth using semantic similarity"""
    
    # Generate embedding for the question
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=question
    )
    query_embedding = response.data[0].embedding
    
    # Convert to PostgreSQL vector format
    embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
    
    # Search using cosine distance
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                key,
                value,
                (embedding <=> :query_embedding::vector) as distance
            FROM ground_truth_facts
            WHERE event_id = :event_id
              AND embedding IS NOT NULL
            ORDER BY distance ASC
            LIMIT :limit
        """), {
            "query_embedding": embedding_str,
            "event_id": event_id,
            "limit": limit
        })
        
        return result.fetchall()

def main():
    """Test semantic search with sample questions"""
    print("🔍 Testing Semantic Search\n")
    
    # Get first event
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, name FROM events ORDER BY date LIMIT 1"))
        event_id, event_name = result.fetchone()
    
    # Test questions
    questions = [
        "Where is the coffee meetup?",
        "How do I park my car?",
        "What should I wear?"
    ]
    
    for question in questions:
        print(f"Question: '{question}'")
        print(f"Event: {event_name}\n")
        
        results = semantic_search(question, event_id)
        
        for key, value, distance in results:
            print(f"  ✅ {key}: {value}")
            print(f"     Distance: {distance:.4f}\n")
        
        print("-" * 60 + "\n")

if __name__ == "__main__":
    main()
