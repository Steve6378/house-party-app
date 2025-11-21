"""
Unit Tests for Ground Truth Query System

Tests both keyword matching and semantic search logic.
"""

import pytest
from typing import List
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend'))

from services.ground_truth_query import (
    GroundTruthFact,
    QueryResult,
    ResponseType,
    query_keyword_match,
    query_semantic_search,
    query_ground_truth,
    is_event_related_question,
    normalize_text,
    format_answer
)


# ============================================
# FIXTURES
# ============================================

@pytest.fixture
def sample_facts() -> List[GroundTruthFact]:
    """Sample ground truth facts for testing."""
    return [
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
        GroundTruthFact(
            id="5",
            key="budget",
            value="$25 per person, covers food and drinks",
            category="finance",
            importance="high",
            keywords=["budget", "cost", "price", "money"]
        ),
    ]


# ============================================
# TEST: normalize_text
# ============================================

def test_normalize_text():
    """Test text normalization."""
    assert normalize_text("What's the address?") == "whats the address"
    assert normalize_text("  Where?!  ") == "where"
    assert normalize_text("HELLO WORLD") == "hello world"
    assert normalize_text("a-b_c.d") == "abcd"


# ============================================
# TEST: query_keyword_match
# ============================================

def test_keyword_match_exact(sample_facts):
    """Test exact keyword match."""
    result = query_keyword_match("What's the address?", sample_facts)

    assert result is not None
    fact, confidence = result
    assert fact.key == "address"
    assert confidence == 1.0


def test_keyword_match_different_phrasing(sample_facts):
    """Test keyword match with different phrasing."""
    result = query_keyword_match("Where is the event?", sample_facts)

    assert result is not None
    fact, confidence = result
    assert fact.key == "address"  # "where" matches address keywords


def test_keyword_match_parking(sample_facts):
    """Test parking-related keywords."""
    result = query_keyword_match("Where can I park my car?", sample_facts)

    assert result is not None
    fact, confidence = result
    assert fact.key == "parking"


def test_keyword_no_match(sample_facts):
    """Test question with no keyword match."""
    result = query_keyword_match("Is there a gift registry?", sample_facts)

    assert result is None


def test_keyword_match_empty_keywords():
    """Test with facts that have no keywords."""
    facts = [
        GroundTruthFact(
            id="1",
            key="test",
            value="Test value",
            category="misc",
            importance="low",
            keywords=[]  # No keywords
        )
    ]

    result = query_keyword_match("test", facts)
    assert result is None


# ============================================
# TEST: is_event_related_question
# ============================================

def test_event_related_positive():
    """Test questions that ARE event-related."""
    assert is_event_related_question("What's the address?") == True
    assert is_event_related_question("When does it start?") == True
    assert is_event_related_question("Where can I park?") == True
    assert is_event_related_question("What should I wear?") == True
    assert is_event_related_question("How much does it cost?") == True
    assert is_event_related_question("Can I bring a guest?") == True
    assert is_event_related_question("What time should I arrive?") == True


def test_event_related_negative():
    """Test questions that are NOT event-related."""
    assert is_event_related_question("Tell me a joke") == False
    assert is_event_related_question("What's the weather like?") == False
    assert is_event_related_question("How are you?") == False
    assert is_event_related_question("What's your favorite color?") == False


def test_event_related_edge_cases():
    """Test edge cases."""
    assert is_event_related_question("") == False
    assert is_event_related_question("   ") == False
    assert is_event_related_question("hello") == False


# ============================================
# TEST: query_ground_truth (keyword path)
# ============================================

def test_query_ground_truth_keyword_match(sample_facts):
    """Test full query with keyword match."""
    result = query_ground_truth("What's the address?", sample_facts)

    assert result.response_type == ResponseType.ANSWER
    assert result.answer == "123 Main St, Los Angeles, CA 90007"
    assert result.confidence == 1.0
    assert result.match_method == "keyword"
    assert result.matched_fact.key == "address"


def test_query_ground_truth_multiple_keywords(sample_facts):
    """Test question with multiple matching keywords."""
    result = query_ground_truth("What time does it start?", sample_facts)

    assert result.response_type == ResponseType.ANSWER
    assert "7:00 PM" in result.answer
    assert result.match_method == "keyword"


# ============================================
# TEST: query_ground_truth (escalation)
# ============================================

def test_query_ground_truth_escalate_event_related(sample_facts):
    """Test escalation for event-related question with no match."""
    result = query_ground_truth("Is there a gift registry?", sample_facts)

    assert result.response_type == ResponseType.ESCALATE
    assert "don't have that information" in result.answer.lower()


def test_query_ground_truth_escalate_no_facts():
    """Test escalation when no facts exist."""
    result = query_ground_truth("What's the address?", [])

    assert result.response_type == ResponseType.ESCALATE
    assert "don't have any information" in result.answer.lower()


# ============================================
# TEST: query_ground_truth (off-topic)
# ============================================

def test_query_ground_truth_off_topic(sample_facts):
    """Test off-topic question."""
    result = query_ground_truth("Tell me a joke", sample_facts)

    assert result.response_type == ResponseType.OFF_TOPIC
    assert "only answer questions about this event" in result.answer.lower()


def test_query_ground_truth_weather(sample_facts):
    """Test weather question (off-topic)."""
    result = query_ground_truth("What's the weather like?", sample_facts)

    assert result.response_type == ResponseType.OFF_TOPIC


# ============================================
# TEST: query_ground_truth (edge cases)
# ============================================

def test_query_ground_truth_empty_question(sample_facts):
    """Test with empty question."""
    result = query_ground_truth("", sample_facts)

    assert result.response_type == ResponseType.OFF_TOPIC
    assert "didn't understand" in result.answer.lower()


def test_query_ground_truth_whitespace_only(sample_facts):
    """Test with whitespace-only question."""
    result = query_ground_truth("   ", sample_facts)

    assert result.response_type == ResponseType.OFF_TOPIC


# ============================================
# TEST: format_answer
# ============================================

def test_format_answer_success(sample_facts):
    """Test formatting a successful answer."""
    result = query_ground_truth("What's the address?", sample_facts)
    formatted = format_answer(result)

    assert formatted["message"] == "123 Main St, Los Angeles, CA 90007"
    assert formatted["show_escalate_button"] == False
    assert formatted["confidence"] == 1.0
    assert formatted["source"] == "address"


def test_format_answer_escalate(sample_facts):
    """Test formatting an escalation."""
    result = query_ground_truth("Is there a gift registry?", sample_facts)
    formatted = format_answer(result)

    assert "don't have that information" in formatted["message"].lower()
    assert formatted["show_escalate_button"] == True


def test_format_answer_off_topic(sample_facts):
    """Test formatting an off-topic response."""
    result = query_ground_truth("Tell me a joke", sample_facts)
    formatted = format_answer(result)

    assert formatted["show_escalate_button"] == False
    assert formatted["confidence"] == 0.0


# ============================================
# TEST: Compound questions
# ============================================

def test_compound_question_time_and_place(sample_facts):
    """Test compound question asking about multiple things."""
    result = query_ground_truth("What time and where is it?", sample_facts)

    # Should match either time or address (both have matching keywords)
    assert result.response_type == ResponseType.ANSWER
    assert result.match_method == "keyword"
    # Could match either "time" or "address" depending on scoring
    assert result.matched_fact.key in ["time", "address"]


def test_question_about_cost(sample_facts):
    """Test questions about cost/budget."""
    questions = [
        "How much does it cost?",
        "What's the budget?",
        "How much money should I bring?"
    ]

    for question in questions:
        result = query_ground_truth(question, sample_facts)
        assert result.response_type == ResponseType.ANSWER
        assert "$25" in result.answer
        assert result.matched_fact.key == "budget"


# ============================================
# TEST: Case sensitivity
# ============================================

def test_case_insensitive():
    """Test that matching is case-insensitive."""
    facts = [
        GroundTruthFact(
            id="1",
            key="address",
            value="123 Main St",
            category="logistics",
            importance="critical",
            keywords=["ADDRESS", "Location", "WHERE"]  # Mixed case keywords
        )
    ]

    questions = [
        "what's the ADDRESS?",
        "WHAT'S THE ADDRESS?",
        "WhAt'S tHe AdDrEsS?"
    ]

    for question in questions:
        result = query_ground_truth(question, facts)
        assert result.response_type == ResponseType.ANSWER
        assert result.answer == "123 Main St"


# ============================================
# TEST: Importance levels
# ============================================

def test_facts_with_different_importance(sample_facts):
    """Test that all facts are queryable regardless of importance."""
    # Critical importance
    result = query_ground_truth("What's the address?", sample_facts)
    assert result.response_type == ResponseType.ANSWER

    # Medium importance
    result = query_ground_truth("What should I wear?", sample_facts)
    assert result.response_type == ResponseType.ANSWER


# ============================================
# TEST: Run all tests
# ============================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
