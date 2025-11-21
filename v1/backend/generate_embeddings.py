from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os
from openai import OpenAI

load_dotenv()

# Setup
DATABASE_URL = os.getenv('DATABASE_URL')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

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
    with engine.connect() as conn:
        # Get all facts without embeddings
        result = conn.execute(text("""
            SELECT id, key, value
            FROM ground_truth_facts
            WHERE embedding IS NULL
        """))

        facts = result.fetchall()
        total = len(facts)

        print(f"Found {total} facts to embed...")

        for i, (fact_id, key, value) in enumerate(facts, 1):
            # Combine key and value for embedding
            text_to_embed = f"{key}: {value}"

            # Generate embedding
            embedding = generate_embedding(text_to_embed)

            # Update database
            conn.execute(text("""
                UPDATE ground_truth_facts
                SET embedding = :embedding
                WHERE id = :id
            """), {"embedding": embedding, "id": fact_id})

            conn.commit()

            print(f"✅ [{i}/{total}] Embedded: {key[:50]}...")

        print(f"\n🎉 Done! Generated {total} embeddings.")

        # Verify
        result = conn.execute(text("""
            SELECT COUNT(*)
            FROM ground_truth_facts
            WHERE embedding IS NOT NULL
        """))
        count = result.scalar()
        print(f"✅ Total facts with embeddings: {count}")

if __name__ == "__main__":
    main()
