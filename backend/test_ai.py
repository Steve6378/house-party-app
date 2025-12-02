#!/usr/bin/env python
"""
Test script for AI functionality - tests intent detection and OpenAI API
"""

import os
import sys
import json
import re

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import settings
import openai

# Configure OpenAI
openai.api_key = settings.OPENAI_API_KEY

def test_openai_connection():
    """Test if OpenAI API is working"""
    print("\n=== TEST 1: OpenAI Connection ===")
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": "Say 'OpenAI is working!' and nothing else."}
            ],
            temperature=0,
            max_tokens=20
        )
        result = response.choices[0].message.content
        print(f"✅ OpenAI Response: {result}")
        return True
    except Exception as e:
        print(f"❌ OpenAI Error: {e}")
        return False


def test_intent_detection(question: str):
    """Test the intent detection for host-assist"""
    print(f"\n=== TEST: Intent Detection for '{question}' ===")

    event_info = "Test Event on 2025-12-10 at TBD at Los Angeles"

    try:
        detection_response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """Analyze user intent and extract as JSON. CRITICAL: When in doubt, use "vendor" intent for ANY request mentioning "nearby", "find", "recommend", "suggest", or asking about places/activities.

1. For event changes: {"intent": "change", "changes": {"field": "value"}, "summary": "description"}
   Fields: time, date, address, name, expected_guests, budget_per_person

2. For photo searches: {"intent": "photo_search", "search_terms": ["keyword1", "keyword2"]}

3. For vendor/place/activity recommendations: {"intent": "vendor", "vendor_type": "TYPE", "query": "preference"}
   ALWAYS use "vendor" intent for:
   - ANY "nearby X" phrases (nearby games, nearby food, nearby anything)
   - ANY "find X" or "recommend X" phrases
   - ANY request for places, activities, things to do, entertainment
   - ANY food/restaurant/venue requests

   Types: restaurant, entertainment, bowling, arcade, sports, bar, cafe, venue, catering, bakery, florist, hotel, parking, activities

4. For questions about THIS event only: {"intent": "question"}
   ONLY use for: event time, date, location, dress code, specific event details

Examples:
"nearby games" -> {"intent": "vendor", "vendor_type": "entertainment", "query": "games"}
"things to do nearby" -> {"intent": "vendor", "vendor_type": "entertainment", "query": "activities"}
"find bowling" -> {"intent": "vendor", "vendor_type": "bowling", "query": ""}
"recommend pizza" -> {"intent": "vendor", "vendor_type": "restaurant", "query": "pizza"}
"What time is the event?" -> {"intent": "question"}"""
                },
                {
                    "role": "user",
                    "content": f"Event: {event_info}\nRequest: {question}"
                }
            ],
            temperature=0,
            max_tokens=200
        )

        result = detection_response.choices[0].message.content
        print(f"Raw response: {result}")

        # Parse JSON
        json_match = re.search(r'\{.*\}', result, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group())
            print(f"✅ Parsed intent: {json.dumps(parsed, indent=2)}")
            return parsed
        else:
            print("❌ No JSON found in response")
            return None

    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def test_guest_vendor_intent(question: str):
    """Test the vendor intent detection for guest-query"""
    print(f"\n=== TEST: Guest Vendor Intent for '{question}' ===")

    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """Analyze if this question is asking for nearby place/vendor recommendations.

Return JSON:
- If asking for restaurants, food, catering, venues, bakeries, florists, etc:
  {"is_vendor_query": true, "vendor_type": "restaurant|food|catering|hall|venue|bakery|florist|bar|hotel|parking", "query": "specific cuisine or preference if mentioned"}

- If asking about event details, schedules, dress code, general questions:
  {"is_vendor_query": false}

Examples:
"recommend nearby Italian food" -> {"is_vendor_query": true, "vendor_type": "restaurant", "query": "Italian"}
"find me a good Thai restaurant" -> {"is_vendor_query": true, "vendor_type": "restaurant", "query": "Thai"}
"where can I get a cake nearby?" -> {"is_vendor_query": true, "vendor_type": "bakery", "query": "cake"}
"suggest catering options" -> {"is_vendor_query": true, "vendor_type": "catering", "query": ""}
"what time does the event start?" -> {"is_vendor_query": false}
"what should I wear?" -> {"is_vendor_query": false}"""
                },
                {"role": "user", "content": question}
            ],
            temperature=0,
            max_tokens=100
        )

        result = response.choices[0].message.content
        print(f"Raw response: {result}")

        json_match = re.search(r'\{.*\}', result, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group())
            print(f"✅ Parsed: {json.dumps(parsed, indent=2)}")
            return parsed
        else:
            print("❌ No JSON found")
            return None

    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def test_google_places_api():
    """Test Google Places API - Try both legacy and new APIs"""
    import httpx

    # Test with Los Angeles coordinates
    lat, lng = 34.0522, -118.2437

    # First try the legacy Nearby Search API
    print("\n=== TEST: Google Places API (Legacy - Nearby Search) ===")
    try:
        response = httpx.get(
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
            params={
                "location": f"{lat},{lng}",
                "radius": 5000,
                "type": "restaurant",
                "keyword": "Italian",
                "key": settings.GOOGLE_MAPS_API_KEY
            }
        )

        data = response.json()

        if data.get("status") == "OK":
            results = data.get("results", [])[:5]
            print(f"✅ Legacy API works! Found {len(data.get('results', []))} restaurants. Top 5:")
            for r in results:
                print(f"   - {r['name']} ({r.get('rating', 'N/A')} stars)")
                print(f"     📍 {r.get('vicinity', 'N/A')}")
            return "legacy"
        else:
            print(f"❌ Legacy API Error: {data.get('status')} - {data.get('error_message', 'Unknown')}")
    except Exception as e:
        print(f"❌ Legacy API Error: {e}")

    # Try the new Nearby Search API (New)
    print("\n=== TEST: Google Places API (New - Nearby Search) ===")
    try:
        response = httpx.post(
            "https://places.googleapis.com/v1/places:searchNearby",
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": settings.GOOGLE_MAPS_API_KEY,
                "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount"
            },
            json={
                "includedTypes": ["restaurant"],
                "maxResultCount": 10,
                "rankPreference": "POPULARITY",
                "locationRestriction": {
                    "circle": {
                        "center": {
                            "latitude": lat,
                            "longitude": lng
                        },
                        "radius": 5000.0
                    }
                }
            }
        )

        data = response.json()

        if "places" in data:
            places = data.get("places", [])
            print(f"✅ Nearby Search API works! Found {len(places)} restaurants. Results:")
            for p in places:
                name = p.get("displayName", {}).get("text", "Unknown")
                rating = p.get("rating", "N/A")
                address = p.get("formattedAddress", "N/A")
                print(f"   - {name} ({rating} stars)")
                print(f"     📍 {address}")
            return "new"
        else:
            print(f"❌ Nearby Search API Error: {json.dumps(data, indent=2)}")
    except Exception as e:
        print(f"❌ Nearby Search API Error: {e}")

    return None


if __name__ == "__main__":
    print("=" * 60)
    print("AI FUNCTIONALITY TEST")
    print("=" * 60)

    # Test 1: OpenAI connection
    if not test_openai_connection():
        print("\n❌ OpenAI is not working! Check API key.")
        sys.exit(1)

    # Test 2: Host intent detection for vendor queries
    vendor_questions = [
        "recommend nearby Italian food",
        "find me a good Thai restaurant",
        "suggest restaurants for my party",
        "I need catering options",
        "nearby games",  # This was failing before!
        "find bowling near me",
        "things to do nearby",
        "recommend pizza places",
    ]

    print("\n" + "=" * 60)
    print("HOST INTENT DETECTION TESTS")
    print("=" * 60)

    for q in vendor_questions:
        result = test_intent_detection(q)
        if result and result.get("intent") == "vendor":
            print(f"   ✅ Correctly identified as VENDOR query")
        else:
            print(f"   ❌ WRONG! Should be vendor, got: {result}")

    # Test 3: Guest vendor intent detection
    print("\n" + "=" * 60)
    print("GUEST VENDOR INTENT TESTS")
    print("=" * 60)

    for q in vendor_questions:
        result = test_guest_vendor_intent(q)
        if result and result.get("is_vendor_query"):
            print(f"   ✅ Correctly identified as vendor query")
        else:
            print(f"   ❌ WRONG! Should be vendor, got: {result}")

    # Test 4: Google Places API
    print("\n" + "=" * 60)
    print("GOOGLE PLACES API TEST")
    print("=" * 60)
    test_google_places_api()

    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
