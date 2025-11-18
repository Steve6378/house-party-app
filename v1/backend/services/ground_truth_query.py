"""
Ground Truth Query System

The core logic for answering guest questions from host-set facts.

Two-tier approach:
1. Keyword Matching (fast, exact) - Try first
2. Semantic Search (flexible, contextual) - Fallback

Decision logic for escalation:
- If no keyword match AND semantic similarity <0.8 → Escalate
- If question seems off-topic → Don't escalate (just say "I can't help with that")
"""

from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import re

from .embeddings import embed_text, cosine_similarity


class ResponseType(str, Enum):
    """Type of response the bot should give."""
    ANSWER = "answer"  # Bot found an answer
    ESCALATE = "escalate"  # Bot doesn't know, escalate to host
    OFF_TOPIC = "off_topic"  # Question is not event-related


@dataclass
class GroundTruthFact:
    """A single ground truth fact."""
    id: str
    key: str
    value: str
    category: str
    importance: str
    keywords: List[str]
    embedding: Optional[List[float]] = None  # May be None if not yet generated


@dataclass
class QueryResult:
    """Result of querying ground truth."""
    response_type: ResponseType
    answer: Optional[str] = None  # The answer text (if found)
    confidence: float = 0.0  # Confidence score (0.0 to 1.0)
    matched_fact: Optional[GroundTruthFact] = None  # Which fact was matched
    match_method: Optional[str] = None  # 'keyword' or 'semantic'


# ============================================
# TIER 1: KEYWORD MATCHING
# ============================================

def normalize_text(text: str) -> str:
    """
    Normalize text for matching.

    - Lowercase
    - Remove punctuation
    - Strip whitespace

    Example:
        >>> normalize_text("What's the address?")
        'whats the address'
    """
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
    text = text.strip()
    return text


def query_keyword_match(
    question: str,
    facts: List[GroundTruthFact]
) -> Optional[Tuple[GroundTruthFact, float]]:
    """
    Try to match question to a fact using keywords.

    Args:
        question: The user's question
        facts: List of ground truth facts

    Returns:
        (matched_fact, confidence) or None if no match

    Example:
        >>> facts = [
        ...     GroundTruthFact(id="1", key="address", value="123 Main St",
        ...                     keywords=["address", "location", "where"])
        ... ]
        >>> result = query_keyword_match("What's the address?", facts)
        >>> result[0].key
        'address'
        >>> result[1]  # Confidence
        1.0
    """
    normalized_question = normalize_text(question)
    question_words = set(normalized_question.split())

    best_match = None
    best_score = 0

    for fact in facts:
        if not fact.keywords:
            continue

        # Check how many keywords match
        fact_keywords = {normalize_text(kw) for kw in fact.keywords}
        matches = question_words.intersection(fact_keywords)

        if matches:
            # Score = ratio of keywords that matched
            score = len(matches) / len(fact_keywords)

            if score > best_score:
                best_score = score
                best_match = fact

    if best_match and best_score > 0:
        # Keyword match = high confidence
        return (best_match, 1.0)

    return None


# ============================================
# TIER 2: SEMANTIC SEARCH
# ============================================

def query_semantic_search(
    question: str,
    facts: List[GroundTruthFact],
    similarity_threshold: float = 0.75
) -> Optional[Tuple[GroundTruthFact, float]]:
    """
    Try to match question to a fact using semantic similarity.

    Args:
        question: The user's question
        facts: List of ground truth facts
        similarity_threshold: Minimum similarity to consider a match (default 0.75)

    Returns:
        (matched_fact, similarity_score) or None if no good match

    Example:
        >>> # Assuming facts have embeddings
        >>> result = query_semantic_search("Where can I leave my car?", facts)
        >>> result[0].key
        'parking'
        >>> result[1] > 0.8  # High similarity
        True
    """
    # Filter facts that have embeddings
    facts_with_embeddings = [f for f in facts if f.embedding is not None]

    if not facts_with_embeddings:
        return None

    # Embed the question
    question_embedding = embed_text(question)

    # Calculate similarities
    best_match = None
    best_similarity = 0

    for fact in facts_with_embeddings:
        similarity = cosine_similarity(question_embedding, fact.embedding)

        if similarity > best_similarity:
            best_similarity = similarity
            best_match = fact

    # Check if similarity is above threshold
    if best_match and best_similarity >= similarity_threshold:
        return (best_match, best_similarity)

    return None


# ============================================
# MAIN QUERY FUNCTION
# ============================================

def query_ground_truth(
    question: str,
    facts: List[GroundTruthFact],
    semantic_threshold: float = 0.75,
    escalation_threshold: float = 0.8
) -> QueryResult:
    """
    Main query function. Tries keyword match first, then semantic search.

    Args:
        question: The user's question
        facts: List of ground truth facts
        semantic_threshold: Minimum similarity for semantic match (default 0.75)
        escalation_threshold: Minimum confidence to answer without escalating (default 0.8)

    Returns:
        QueryResult with response type, answer, and confidence

    Logic:
        1. Try keyword match → if found, return with high confidence
        2. Try semantic search → if similarity >= semantic_threshold, return
        3. If semantic similarity between 0.6-0.8 → maybe escalate (low confidence)
        4. If semantic similarity <0.6 → check if question is event-related
           - If event-related → escalate
           - If off-topic → return "off_topic"

    Examples:
        >>> # Exact keyword match
        >>> result = query_ground_truth("What's the address?", facts)
        >>> result.response_type
        <ResponseType.ANSWER: 'answer'>
        >>> result.confidence
        1.0

        >>> # Semantic match
        >>> result = query_ground_truth("Where can I leave my car?", facts)
        >>> result.response_type
        <ResponseType.ANSWER: 'answer'>
        >>> result.confidence > 0.8
        True

        >>> # No match → escalate
        >>> result = query_ground_truth("Is there a gift registry?", facts)
        >>> result.response_type
        <ResponseType.ESCALATE: 'escalate'>

        >>> # Off-topic
        >>> result = query_ground_truth("What's the weather like?", facts)
        >>> result.response_type
        <ResponseType.OFF_TOPIC: 'off_topic'>
    """
    if not question or not question.strip():
        return QueryResult(
            response_type=ResponseType.OFF_TOPIC,
            answer="I didn't understand your question. Could you rephrase?"
        )

    if not facts:
        return QueryResult(
            response_type=ResponseType.ESCALATE,
            answer="I don't have any information about this event yet."
        )

    # TIER 1: Try keyword matching
    keyword_result = query_keyword_match(question, facts)
    if keyword_result:
        fact, confidence = keyword_result
        return QueryResult(
            response_type=ResponseType.ANSWER,
            answer=fact.value,
            confidence=confidence,
            matched_fact=fact,
            match_method="keyword"
        )

    # TIER 2: Try semantic search
    semantic_result = query_semantic_search(question, facts, semantic_threshold)
    if semantic_result:
        fact, similarity = semantic_result

        # If similarity is high enough, answer confidently
        if similarity >= escalation_threshold:
            return QueryResult(
                response_type=ResponseType.ANSWER,
                answer=fact.value,
                confidence=similarity,
                matched_fact=fact,
                match_method="semantic"
            )
        else:
            # Medium confidence → escalate to be safe
            return QueryResult(
                response_type=ResponseType.ESCALATE,
                answer=f"I found this, but I'm not completely sure: {fact.value}",
                confidence=similarity,
                matched_fact=fact,
                match_method="semantic"
            )

    # NO MATCH: Determine if escalate or off-topic
    if is_event_related_question(question):
        return QueryResult(
            response_type=ResponseType.ESCALATE,
            answer="I don't have that information. Would you like me to ask the host?"
        )
    else:
        return QueryResult(
            response_type=ResponseType.OFF_TOPIC,
            answer="I can only answer questions about this event. Please ask about things like the address, time, parking, etc."
        )


# ============================================
# HELPER FUNCTIONS
# ============================================

def is_event_related_question(question: str) -> bool:
    """
    Determine if a question is event-related or off-topic.

    Event-related keywords: where, when, what, who, how, time, address, parking,
                            food, dress, bring, cost, budget, etc.

    Off-topic examples: "What's the weather?", "Tell me a joke"

    Args:
        question: The user's question

    Returns:
        True if question seems event-related, False otherwise

    Example:
        >>> is_event_related_question("What time does it start?")
        True
        >>> is_event_related_question("What's the weather like?")
        False
        >>> is_event_related_question("Tell me a joke")
        False
    """
    event_keywords = {
        # Question words
        "where", "when", "what", "who", "how", "which",

        # Event logistics
        "time", "address", "location", "place", "venue",
        "parking", "park", "directions", "getting there",

        # Event details
        "food", "drink", "menu", "eat",
        "dress", "wear", "attire",
        "bring", "need", "should",
        "cost", "budget", "price", "fee", "pay",

        # Event participation
        "invite", "guest", "rsvp", "attending",
        "plus one", "+1",

        # Time-related
        "start", "end", "duration", "long",

        # Misc
        "gift", "registry", "theme", "music", "playlist"
    }

    normalized = normalize_text(question)
    words = set(normalized.split())

    # Check if any event keyword is in the question
    return bool(words.intersection(event_keywords))


def format_answer(result: QueryResult) -> Dict[str, Any]:
    """
    Format QueryResult for API response.

    Args:
        result: QueryResult from query_ground_truth

    Returns:
        Dictionary suitable for JSON response

    Example:
        >>> result = query_ground_truth("What's the address?", facts)
        >>> formatted = format_answer(result)
        >>> formatted["message"]
        '123 Main St, Los Angeles, CA'
        >>> formatted["show_escalate_button"]
        False
    """
    if result.response_type == ResponseType.ANSWER:
        return {
            "message": result.answer,
            "show_escalate_button": False,
            "confidence": result.confidence,
            "source": result.matched_fact.key if result.matched_fact else None
        }

    elif result.response_type == ResponseType.ESCALATE:
        return {
            "message": result.answer,
            "show_escalate_button": True,
            "confidence": result.confidence
        }

    else:  # OFF_TOPIC
        return {
            "message": result.answer,
            "show_escalate_button": False,
            "confidence": 0.0
        }


# ============================================
# EXAMPLE USAGE
# ============================================

if __name__ == "__main__":
    # Example ground truth facts (without embeddings for now)
    facts = [
        GroundTruthFact(
            id="1",
            key="address",
            value="123 Main St, Los Angeles, CA 90007",
            category="logistics",
            importance="critical",
            keywords=["address", "location", "where"]
        ),
        GroundTruthFact(
            id="2",
            key="parking",
            value="Street parking on Oak St, or paid lot 2 blocks away on Pine St",
            category="logistics",
            importance="high",
            keywords=["parking", "park", "car"]
        ),
        GroundTruthFact(
            id="3",
            key="time",
            value="The event starts at 7:00 PM on Saturday, November 23rd",
            category="logistics",
            importance="critical",
            keywords=["time", "when", "start"]
        ),
        GroundTruthFact(
            id="4",
            key="dress_code",
            value="Smart casual. No need to dress up too much!",
            category="attire",
            importance="medium",
            keywords=["dress", "wear", "attire"]
        ),
    ]

    # Example 1: Keyword match
    print("Example 1: Keyword match")
    result = query_ground_truth("What's the address?", facts)
    print(f"Question: What's the address?")
    print(f"Response type: {result.response_type}")
    print(f"Answer: {result.answer}")
    print(f"Confidence: {result.confidence}")
    print(f"Match method: {result.match_method}")
    print()

    # Example 2: Different phrasing (still keyword match)
    print("Example 2: Different phrasing")
    result = query_ground_truth("Where is the event?", facts)
    print(f"Question: Where is the event?")
    print(f"Response type: {result.response_type}")
    print(f"Answer: {result.answer}")
    print()

    # Example 3: Escalation (no match)
    print("Example 3: Escalation")
    result = query_ground_truth("Is there a gift registry?", facts)
    print(f"Question: Is there a gift registry?")
    print(f"Response type: {result.response_type}")
    print(f"Answer: {result.answer}")
    print(f"Show escalate button: {result.response_type == ResponseType.ESCALATE}")
    print()

    # Example 4: Off-topic
    print("Example 4: Off-topic")
    result = query_ground_truth("Tell me a joke", facts)
    print(f"Question: Tell me a joke")
    print(f"Response type: {result.response_type}")
    print(f"Answer: {result.answer}")
    print()

    # Example 5: Formatted response
    print("Example 5: Formatted API response")
    result = query_ground_truth("What's the parking situation?", facts)
    formatted = format_answer(result)
    print(f"Question: What's the parking situation?")
    print(f"API Response: {formatted}")
