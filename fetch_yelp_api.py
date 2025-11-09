"""
Fetch LA area venues from Yelp Fusion API.

This script queries the Yelp Fusion API to get real LA area businesses
for event planning (restaurants, bars, cafes, entertainment venues, etc.).

API Documentation: https://www.yelp.com/developers/documentation/v3/business_search

Rate Limits:
    - 500 calls per day (free tier)
    - 50 results per call
    - 1000 max results per search query (20 pages)

Strategy:
    - Search multiple LA neighborhoods
    - Search multiple categories
    - Deduplicate results
    - Save incrementally to avoid losing progress
"""

import json
import time
import requests
from pathlib import Path
from typing import List, Dict, Set
from datetime import datetime


# Yelp Fusion API endpoint
YELP_API_URL = "https://api.yelp.com/v3/businesses/search"

# LA neighborhoods to search (covers different areas)
LA_LOCATIONS = [
    "Downtown Los Angeles, CA",
    "Hollywood, CA",
    "Santa Monica, CA",
    "Venice, CA",
    "West Hollywood, CA",
    "Beverly Hills, CA",
    "Culver City, CA",
    "Pasadena, CA",
    "Glendale, CA",
    "Burbank, CA",
    "Silver Lake, Los Angeles, CA",
    "Echo Park, Los Angeles, CA",
    "Koreatown, Los Angeles, CA",
    "Long Beach, CA",
    "Manhattan Beach, CA",
    "Hermosa Beach, CA",
    "Westwood, Los Angeles, CA",
    "Studio City, CA",
    "Sherman Oaks, CA",
    "Northridge, CA",
]

# Categories for event planning
YELP_CATEGORIES = [
    "restaurants",
    "bars",
    "cafes",
    "nightlife",
    "coffee",
    "breweries",
    "wine_bars",
    "parks",
    "museums",
    "theaters",
    "musicvenues",
    "eventservices",
]


def fetch_yelp_businesses(api_key: str, location: str, categories: str = None,
                         limit: int = 50, offset: int = 0) -> Dict:
    """
    Fetch businesses from Yelp Fusion API.

    Args:
        api_key: Yelp API key
        location: Location string (e.g., "Santa Monica, CA")
        categories: Comma-separated category aliases
        limit: Number of results per page (max 50)
        offset: Offset for pagination

    Returns:
        API response dictionary
    """
    headers = {"Authorization": f"Bearer {api_key}"}
    params = {
        "location": location,
        "limit": limit,
        "offset": offset,
    }

    if categories:
        params["categories"] = categories

    try:
        response = requests.get(YELP_API_URL, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
        return None


def collect_la_venues(api_key: str, output_file: str = "la_venues_yelp.json",
                     max_calls: int = 450) -> None:
    """
    Collect LA venues from Yelp API with smart pagination.

    Args:
        api_key: Yelp API key
        output_file: Output JSON file
        max_calls: Maximum API calls to make (default 450 to stay under 500/day limit)
    """
    all_venues = {}  # Use dict to auto-deduplicate by business_id
    call_count = 0
    stats = {
        'total_calls': 0,
        'total_fetched': 0,
        'unique_venues': 0,
        'locations_searched': 0,
        'categories_searched': 0,
    }

    print("="*60)
    print("YELP FUSION API - LA VENUE COLLECTION")
    print("="*60)
    print(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Max API calls: {max_calls}")
    print(f"Estimated venues (if all unique): {max_calls * 50:,}")
    print()

    # Strategy 1: Search by location (broader)
    print("Strategy 1: Searching by location...")
    for location in LA_LOCATIONS:
        if call_count >= max_calls:
            print(f"\nReached max API calls ({max_calls})")
            break

        print(f"\nSearching: {location}")
        stats['locations_searched'] += 1

        # Paginate through results (max 1000 per location = 20 pages)
        for offset in range(0, 1000, 50):
            if call_count >= max_calls:
                break

            result = fetch_yelp_businesses(api_key, location, offset=offset)
            call_count += 1
            stats['total_calls'] += 1

            if not result or 'businesses' not in result:
                print(f"  No results at offset {offset}")
                break

            businesses = result['businesses']
            if not businesses:
                print(f"  Reached end at offset {offset}")
                break

            # Add to collection (dict auto-deduplicates)
            for business in businesses:
                business_id = business.get('id')
                if business_id:
                    all_venues[business_id] = business
                    stats['total_fetched'] += 1

            print(f"  Offset {offset}: fetched {len(businesses)}, unique total: {len(all_venues):,}")

            # Rate limiting: small delay between requests
            time.sleep(0.1)

            # Save progress every 50 calls
            if call_count % 50 == 0:
                save_progress(all_venues, f"{output_file}.progress")
                print(f"\n  [Progress saved: {len(all_venues):,} unique venues, {call_count} calls]")

    # Strategy 2: Search by category (if calls remaining)
    if call_count < max_calls:
        print("\n\nStrategy 2: Searching by category...")
        for category in YELP_CATEGORIES:
            if call_count >= max_calls:
                break

            print(f"\nCategory: {category} in Los Angeles, CA")
            stats['categories_searched'] += 1

            for offset in range(0, 500, 50):  # Smaller pagination for categories
                if call_count >= max_calls:
                    break

                result = fetch_yelp_businesses(api_key, "Los Angeles, CA",
                                              categories=category, offset=offset)
                call_count += 1
                stats['total_calls'] += 1

                if not result or 'businesses' not in result:
                    break

                businesses = result['businesses']
                if not businesses:
                    break

                for business in businesses:
                    business_id = business.get('id')
                    if business_id:
                        all_venues[business_id] = business
                        stats['total_fetched'] += 1

                print(f"  Offset {offset}: fetched {len(businesses)}, unique total: {len(all_venues):,}")
                time.sleep(0.1)

                if call_count % 50 == 0:
                    save_progress(all_venues, f"{output_file}.progress")
                    print(f"\n  [Progress saved: {len(all_venues):,} unique venues, {call_count} calls]")

    # Final save
    stats['unique_venues'] = len(all_venues)
    venues_list = list(all_venues.values())

    # Sort by rating and review count
    venues_list.sort(key=lambda x: (x.get('rating', 0), x.get('review_count', 0)),
                    reverse=True)

    print("\n" + "="*60)
    print("COLLECTION COMPLETE")
    print("="*60)
    print(f"Total API calls made: {stats['total_calls']}")
    print(f"Total businesses fetched: {stats['total_fetched']:,}")
    print(f"Unique venues collected: {stats['unique_venues']:,}")
    print(f"Locations searched: {stats['locations_searched']}")
    print(f"Categories searched: {stats['categories_searched']}")
    print(f"Deduplication rate: {((stats['total_fetched'] - stats['unique_venues']) / stats['total_fetched'] * 100):.1f}%")

    # Save final results
    print(f"\nSaving to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(venues_list, f, indent=2)

    # Save stats
    stats_file = "yelp_api_stats.txt"
    with open(stats_file, 'w') as f:
        f.write("="*60 + "\n")
        f.write("YELP API COLLECTION STATISTICS\n")
        f.write("="*60 + "\n\n")
        f.write(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"Total API calls made: {stats['total_calls']}\n")
        f.write(f"Total businesses fetched: {stats['total_fetched']:,}\n")
        f.write(f"Unique venues collected: {stats['unique_venues']:,}\n")
        f.write(f"Locations searched: {stats['locations_searched']}\n")
        f.write(f"Categories searched: {stats['categories_searched']}\n\n")
        f.write(f"API calls remaining today: ~{500 - stats['total_calls']}\n")

    print(f"Stats saved to {stats_file}")
    print(f"\nAPI calls remaining today: ~{500 - stats['total_calls']}")


def save_progress(venues_dict: Dict, filename: str) -> None:
    """Save progress to file."""
    venues_list = list(venues_dict.values())
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(venues_list, f, indent=2)


if __name__ == "__main__":
    # API key from environment variable or hardcoded (use .env in production)
    import os

    api_key = os.getenv("YELP_API_KEY")

    if not api_key:
        print("ERROR: YELP_API_KEY not found")
        print("\nSet it in your environment:")
        print("  export YELP_API_KEY='your_api_key_here'")
        print("\nOr edit this file and add it directly (line 253)")
        # Uncomment and add your key here for quick testing:
        # api_key = "YOUR_API_KEY_HERE"
    else:
        collect_la_venues(api_key, max_calls=450)
