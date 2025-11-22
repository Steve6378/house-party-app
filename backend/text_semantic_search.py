from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os
from openai import OpenAI

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

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
    
    # Convert list to PostgreSQL vector literal
    embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
    
    # Search using cosine distance (embed the vector literal directly)
    with engine.connect() as conn:
        query = f"""
            SELECT 
                key,
                value,
                (embedding <=> '{embedding_str}'::vector) as distance
            FROM ground_truth_facts
            WHERE event_id = :event_id
            ORDER BY distance ASC
            LIMIT :limit
        """
        
        result = conn.execute(text(query), {
            "event_id": event_id,
            "limit": limit
        })
        
        return result.fetchall()

# Test queries
print("🔍 Testing Semantic Search\n")

# Test 1: Find address for Event 1
print("Question: 'Where is the coffee meetup?'")
print("Event: Coffee Study Session\n")
results = semantic_search("Where is the coffee meetup?", "event001-0001-0001-0001-000000000001")
for key, value, distance in results:
    print(f"  ✅ {key}: {value}")
    print(f"     Distance: {distance:.4f}\n")

print("-" * 60 + "\n")

# Test 2: Find parking for Event 7
print("Question: 'How do I park my car?'")
print("Event: New Year's Eve Bash\n")
results = semantic_search("How do I park my car?", "event007-0007-0007-0007-000000000007")
for key, value, distance in results:
    print(f"  ✅ {key}: {value}")
    print(f"     Distance: {distance:.4f}\n")

print("-" * 60 + "\n")

# Test 3: Find dress code
print("Question: 'What should I wear?'")
print("Event: USC Spring Gala\n")
results = semantic_search("What should I wear?", "event015-0015-0015-0015-000000000015")
for key, value, distance in results:
    print(f"  ✅ {key}: {value}")
    print(f"     Distance: {distance:.4f}\n")
