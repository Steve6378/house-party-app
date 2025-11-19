#!/usr/bin/env python3
# Festivio - Generate Embeddings for Ground Truth Facts
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

def generate_embedding(text: str) -> list[float]:
    """Generate embedding using OpenAI API"""
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

def main():
    """Generate embeddings for all ground truth facts"""
    with engine.connect() as conn:
        # Find all facts without embeddings
        result = conn.execute(text("""
            SELECT id, key, value 
            FROM ground_truth_facts 
            WHERE embedding IS NULL
        """))
        
        facts = result.fetchall()
        total = len(facts)
        
        if total == 0:
            print("✅ All facts already have embeddings!")
            return
        
        print(f"Found {total} facts to embed...")
        
        for i, (fact_id, key, value) in enumerate(facts, 1):
            # Create text to embed (key + value)
            text_to_embed = f"{key}: {value}"
            
            # Generate embedding
            embedding = generate_embedding(text_to_embed)
            
            # Convert to PostgreSQL format
            embedding_str = '[' + ','.join(map(str, embedding)) + ']'
            
            # Update database
            conn.execute(text("""
                UPDATE ground_truth_facts 
                SET embedding = :embedding::vector
                WHERE id = :id
            """), {"embedding": embedding_str, "id": fact_id})
            
            conn.commit()
            
            # Show progress
            truncated_key = key[:50] + '...' if len(key) > 50 else key
            print(f"✅ [{i}/{total}] Embedded: {truncated_key}")
        
        print(f"\n🎉 Done! Generated {total} embeddings.")

if __name__ == "__main__":
    main()
