# Festivio - OpenAI Embeddings Service
# Version: 0.0.1

from openai import OpenAI
from config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def embed_text(text: str) -> list[float]:
    """
    Generate embedding vector for text using OpenAI API.

    Args:
        text: Text to embed (e.g., "parking: Free street parking available")

    Returns:
        List of 1536 floats representing the embedding vector

    Cost: ~$0.02 per 1M tokens (very cheap)
    Model: text-embedding-3-small (1536 dimensions)
    """
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding
