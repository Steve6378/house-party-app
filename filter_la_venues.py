"""
Filter Yelp business data for LA area venues relevant to event planning.

This script processes the Yelp Academic Dataset business.json file and extracts
only businesses in the Los Angeles area that are relevant for event planning
(restaurants, cafes, bars, entertainment venues, parks, etc.).

Output:
    - la_venues.json: Filtered venues in JSON format
    - la_venues.csv: Filtered venues in CSV format for easy review
    - filter_stats.txt: Statistics about the filtering process
"""

import json
import csv
from pathlib import Path
from typing import Dict, List, Set


# LA County city names (major cities and neighborhoods)
LA_CITIES = {
    'los angeles', 'la', 'santa monica', 'pasadena', 'glendale', 'burbank',
    'long beach', 'inglewood', 'culver city', 'beverly hills', 'west hollywood',
    'hollywood', 'echo park', 'silver lake', 'downtown', 'venice', 'marina del rey',
    'manhattan beach', 'hermosa beach', 'redondo beach', 'torrance', 'el segundo',
    'hawthorne', 'compton', 'norwalk', 'downey', 'south gate', 'bell', 'maywood',
    'huntington park', 'lynwood', 'paramount', 'lakewood', 'cerritos', 'artesia',
    'bellflower', 'pico rivera', 'montebello', 'monterey park', 'alhambra',
    'san gabriel', 'arcadia', 'monrovia', 'duarte', 'azusa', 'covina',
    'west covina', 'pomona', 'claremont', 'la verne', 'san dimas', 'glendora',
    'whittier', 'la mirada', 'santa fe springs', 'la habra heights',
    'malibu', 'calabasas', 'agoura hills', 'westlake village', 'thousand oaks',
    'el monte', 'rosemead', 'temple city', 'san marino', 'south pasadena',
    'eagle rock', 'highland park', 'atwater village', 'los feliz', 'koreatown',
    'westwood', 'brentwood', 'pacific palisades', 'encino', 'sherman oaks',
    'van nuys', 'north hollywood', 'studio city', 'valley village', 'toluca lake',
    'universal city', 'woodland hills', 'canoga park', 'reseda', 'northridge',
    'granada hills', 'porter ranch', 'chatsworth', 'sylmar', 'pacoima',
    'san fernando', 'sunland', 'tujunga', 'la crescenta', 'montrose'
}

# LA County approximate bounding box (latitude, longitude)
LA_LAT_MIN, LA_LAT_MAX = 33.7, 34.8
LA_LON_MIN, LA_LON_MAX = -118.7, -117.6

# Relevant categories for event planning venues
RELEVANT_CATEGORIES = {
    # Food & Dining
    'restaurants', 'food', 'cafes', 'coffee', 'tea', 'bars', 'nightlife',
    'breakfast', 'brunch', 'dinner', 'lunch', 'american', 'italian', 'mexican',
    'chinese', 'japanese', 'korean', 'thai', 'vietnamese', 'indian', 'mediterranean',
    'pizza', 'burgers', 'sandwiches', 'salad', 'vegan', 'vegetarian',
    'bakeries', 'desserts', 'ice cream', 'juice', 'smoothies',

    # Entertainment & Activities
    'arts', 'entertainment', 'venues', 'event spaces', 'music venues',
    'theaters', 'cinemas', 'museums', 'galleries', 'parks', 'recreation',
    'bowling', 'arcades', 'karaoke', 'comedy clubs', 'lounges',
    'wine bars', 'breweries', 'wineries', 'distilleries',

    # Outdoor & Nature
    'hiking', 'beaches', 'gardens', 'botanical gardens', 'lakes',
    'picnic', 'outdoor', 'nature'
}


def is_la_area(business: Dict) -> bool:
    """
    Check if business is in LA area using city name and/or coordinates.

    Args:
        business: Business data dictionary

    Returns:
        True if business is in LA area, False otherwise
    """
    city = business.get('city', '').lower().strip()
    lat = business.get('latitude')
    lon = business.get('longitude')

    # Check city name first
    if city in LA_CITIES:
        return True

    # Check if city contains 'los angeles' or 'la'
    if 'los angeles' in city or city.startswith('la '):
        return True

    # Fallback to coordinates if available
    if lat and lon:
        if LA_LAT_MIN <= lat <= LA_LAT_MAX and LA_LON_MIN <= lon <= LA_LON_MAX:
            return True

    return False


def is_relevant_category(business: Dict) -> bool:
    """
    Check if business has relevant categories for event planning.

    Args:
        business: Business data dictionary

    Returns:
        True if business has relevant categories, False otherwise
    """
    categories = business.get('categories', '')

    if not categories:
        return False

    categories_lower = categories.lower()

    # Check if any relevant category is mentioned
    for category in RELEVANT_CATEGORIES:
        if category in categories_lower:
            return True

    return False


def filter_venues(input_file: str, output_json: str = "la_venues.json",
                  output_csv: str = "la_venues.csv") -> None:
    """
    Filter Yelp business data for LA area venues.

    Args:
        input_file: Path to yelp_academic_dataset_business.json
        output_json: Path to output JSON file
        output_csv: Path to output CSV file
    """
    print(f"Processing {input_file}...")
    print(f"This may take a few minutes for a 113MB file...\n")

    filtered_venues = []
    stats = {
        'total_processed': 0,
        'la_area_count': 0,
        'relevant_category_count': 0,
        'final_count': 0,
        'open_count': 0,
        'closed_count': 0
    }

    # Process file line by line (memory efficient)
    with open(input_file, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            try:
                business = json.loads(line)
                stats['total_processed'] += 1

                # Progress indicator every 10k lines
                if line_num % 10000 == 0:
                    print(f"Processed {line_num:,} businesses, found {stats['final_count']:,} LA venues so far...")

                # Filter for LA area
                if not is_la_area(business):
                    continue
                stats['la_area_count'] += 1

                # Filter for relevant categories
                if not is_relevant_category(business):
                    continue
                stats['relevant_category_count'] += 1

                # Track open vs closed
                if business.get('is_open', 0) == 1:
                    stats['open_count'] += 1
                else:
                    stats['closed_count'] += 1

                # Keep this venue
                filtered_venues.append(business)
                stats['final_count'] += 1

            except json.JSONDecodeError as e:
                print(f"Warning: Could not parse line {line_num}: {e}")
                continue

    print(f"\n✓ Finished processing {stats['total_processed']:,} businesses\n")

    # Sort by rating and review count (popular places first)
    filtered_venues.sort(key=lambda x: (x.get('stars', 0), x.get('review_count', 0)),
                         reverse=True)

    # Save as JSON
    print(f"Saving {len(filtered_venues):,} venues to {output_json}...")
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(filtered_venues, f, indent=2)

    # Save as CSV for easy review
    print(f"Saving to {output_csv} for easy review...")
    if filtered_venues:
        csv_fields = ['business_id', 'name', 'city', 'address', 'latitude',
                      'longitude', 'stars', 'review_count', 'is_open',
                      'categories', 'postal_code']

        with open(output_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=csv_fields, extrasaction='ignore')
            writer.writeheader()
            writer.writerows(filtered_venues)

    # Save statistics
    stats_file = "filter_stats.txt"
    print(f"Saving statistics to {stats_file}...\n")
    with open(stats_file, 'w') as f:
        f.write("=" * 60 + "\n")
        f.write("LA VENUE FILTERING STATISTICS\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Total businesses processed: {stats['total_processed']:,}\n")
        f.write(f"Businesses in LA area: {stats['la_area_count']:,}\n")
        f.write(f"LA businesses with relevant categories: {stats['relevant_category_count']:,}\n")
        f.write(f"Final filtered venues: {stats['final_count']:,}\n\n")
        f.write(f"Open venues: {stats['open_count']:,}\n")
        f.write(f"Closed venues: {stats['closed_count']:,}\n\n")
        f.write(f"Percentage of dataset kept: {(stats['final_count']/stats['total_processed']*100):.2f}%\n")

    # Print summary
    print("=" * 60)
    print("FILTERING COMPLETE")
    print("=" * 60)
    print(f"Total businesses processed: {stats['total_processed']:,}")
    print(f"Final filtered venues: {stats['final_count']:,}")
    print(f"Open venues: {stats['open_count']:,}")
    print(f"Closed venues: {stats['closed_count']:,}")


if __name__ == "__main__":
    # UPDATE THIS PATH to your yelp_academic_dataset_business.json file
    input_file = r"C:\path\to\yelp_academic_dataset_business.json"

    if not Path(input_file).exists():
        print(f"ERROR: File not found: {input_file}")
        print("Update the input_file path in this script.")
    else:
        filter_venues(input_file)
