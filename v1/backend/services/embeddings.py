"""
Embedding Generation Service

Handles OpenAI embedding generation for semantic search.
Uses text-embedding-3-small model (1536 dimensions).

Features:
- Single text embedding
- Batch embedding (efficient)
- Cosine similarity calculation
- Simple in-memory caching
"""

import os
from typing import List, Optional, Dict
import hashlib
from openai import OpenAI
import numpy as np

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Embedding model
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536

# Simple in-memory cache (in production, use Redis)
_embedding_cache: Dict[str, List[float]] = {}


def _cache_key(text: str) -> str:
    """Generate cache key from text (hash for memory efficiency)."""
    return hashlib.md5(text.encode()).hexdigest()


def embed_text(text: str, use_cache: bool = True) -> List[float]:
    """
    Generate embedding for a single text.

    Args:
        text: Text to embed
        use_cache: Whether to use cache (default True)

    Returns:
        List of floats (1536 dimensions)

    Example:
        >>> embedding = embed_text("What's the address?")
        >>> len(embedding)
        1536
    """
    if not text or not text.strip():
        raise ValueError("Text cannot be empty")

    # Check cache
    if use_cache:
        key = _cache_key(text)
        if key in _embedding_cache:
            return _embedding_cache[key]

    # Call OpenAI API
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text
    )

    embedding = response.data[0].embedding

    # Cache result
    if use_cache:
        key = _cache_key(text)
        _embedding_cache[key] = embedding

    return embedding


def batch_embed(texts: List[str], use_cache: bool = True) -> List[List[float]]:
    """
    Generate embeddings for multiple texts (more efficient than calling embed_text repeatedly).

    Args:
        texts: List of texts to embed
        use_cache: Whether to use cache

    Returns:
        List of embeddings (each is 1536 dimensions)

    Example:
        >>> texts = ["What's the address?", "Where can I park?"]
        >>> embeddings = batch_embed(texts)
        >>> len(embeddings)
        2
        >>> len(embeddings[0])
        1536
    """
    if not texts:
        return []

    # Filter out empty texts
    texts = [t.strip() for t in texts if t and t.strip()]

    if not texts:
        return []

    # Check cache for all texts
    if use_cache:
        uncached_texts = []
        uncached_indices = []
        results = [None] * len(texts)

        for i, text in enumerate(texts):
            key = _cache_key(text)
            if key in _embedding_cache:
                results[i] = _embedding_cache[key]
            else:
                uncached_texts.append(text)
                uncached_indices.append(i)

        # If all cached, return early
        if not uncached_texts:
            return results
    else:
        uncached_texts = texts
        uncached_indices = list(range(len(texts)))
        results = [None] * len(texts)

    # Call OpenAI API for uncached texts
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=uncached_texts
    )

    # Fill in results
    for i, embedding_data in enumerate(response.data):
        embedding = embedding_data.embedding
        result_index = uncached_indices[i]
        results[result_index] = embedding

        # Cache
        if use_cache:
            key = _cache_key(uncached_texts[i])
            _embedding_cache[key] = embedding

    return results


def cosine_similarity(embedding1: List[float], embedding2: List[float]) -> float:
    """
    Calculate cosine similarity between two embeddings.

    Args:
        embedding1: First embedding
        embedding2: Second embedding

    Returns:
        Float between -1 and 1 (higher = more similar)
        Typically 0.8+ is considered very similar

    Example:
        >>> emb1 = embed_text("What's the address?")
        >>> emb2 = embed_text("Where is the event?")
        >>> similarity = cosine_similarity(emb1, emb2)
        >>> similarity > 0.8  # These are very similar questions
        True
    """
    # Convert to numpy arrays
    vec1 = np.array(embedding1)
    vec2 = np.array(embedding2)

    # Calculate cosine similarity
    dot_product = np.dot(vec1, vec2)
    magnitude1 = np.linalg.norm(vec1)
    magnitude2 = np.linalg.norm(vec2)

    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0

    return float(dot_product / (magnitude1 * magnitude2))


def find_most_similar(
    query_embedding: List[float],
    candidate_embeddings: List[List[float]],
    top_k: int = 1
) -> List[tuple[int, float]]:
    """
    Find most similar embeddings to query.

    Args:
        query_embedding: The query embedding
        candidate_embeddings: List of candidate embeddings to compare against
        top_k: Number of top results to return

    Returns:
        List of (index, similarity_score) tuples, sorted by similarity (highest first)

    Example:
        >>> query = embed_text("Where can I park?")
        >>> candidates = batch_embed(["The address is 123 Main St", "Parking is on Oak St"])
        >>> results = find_most_similar(query, candidates, top_k=1)
        >>> results[0][0]  # Index of most similar
        1
        >>> results[0][1] > 0.8  # High similarity to parking fact
        True
    """
    if not candidate_embeddings:
        return []

    # Calculate similarities
    similarities = []
    for i, candidate_emb in enumerate(candidate_embeddings):
        sim = cosine_similarity(query_embedding, candidate_emb)
        similarities.append((i, sim))

    # Sort by similarity (highest first)
    similarities.sort(key=lambda x: x[1], reverse=True)

    # Return top_k
    return similarities[:top_k]


def clear_cache():
    """Clear the embedding cache (useful for testing)."""
    global _embedding_cache
    _embedding_cache = {}


def get_cache_size() -> int:
    """Get number of cached embeddings."""
    return len(_embedding_cache)


# ============================================
# Example Usage
# ============================================

if __name__ == "__main__":
    # Example 1: Single embedding
    print("Example 1: Single embedding")
    text = "What's the address of the party?"
    embedding = embed_text(text)
    print(f"Text: {text}")
    print(f"Embedding dimensions: {len(embedding)}")
    print(f"First 5 values: {embedding[:5]}")
    print()

    # Example 2: Batch embedding
    print("Example 2: Batch embedding")
    texts = [
        "What's the address?",
        "Where can I park?",
        "What time does it start?"
    ]
    embeddings = batch_embed(texts)
    print(f"Embedded {len(embeddings)} texts")
    print()

    # Example 3: Similarity
    print("Example 3: Similarity")
    question1 = "What's the address?"
    question2 = "Where is the event?"
    question3 = "What should I wear?"

    emb1 = embed_text(question1)
    emb2 = embed_text(question2)
    emb3 = embed_text(question3)

    sim_address = cosine_similarity(emb1, emb2)
    sim_different = cosine_similarity(emb1, emb3)

    print(f'Similarity between "{question1}" and "{question2}": {sim_address:.3f}')
    print(f'Similarity between "{question1}" and "{question3}": {sim_different:.3f}')
    print()

    # Example 4: Find most similar
    print("Example 4: Find most similar")
    query = "Where should I leave my car?"
    facts = [
        "The party is at 123 Main St in Los Angeles.",
        "Parking is available on Oak St or in the paid lot 2 blocks away.",
        "The event starts at 7 PM on Saturday."
    ]

    query_emb = embed_text(query)
    fact_embs = batch_embed(facts)

    results = find_most_similar(query_emb, fact_embs, top_k=2)

    print(f'Query: "{query}"')
    print("Top 2 most similar facts:")
    for idx, score in results:
        print(f'  {idx}: "{facts[idx]}" (similarity: {score:.3f})')
    print()

    # Example 5: Cache stats
    print("Example 5: Cache stats")
    print(f"Cached embeddings: {get_cache_size()}")
