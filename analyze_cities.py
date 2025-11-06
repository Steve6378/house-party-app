"""
Quick diagnostic to see what cities are in the Yelp dataset.
Helps understand geographic distribution.
"""

import json
from collections import Counter
from pathlib import Path


def analyze_cities(input_file: str, top_n: int = 50):
    """Count businesses by city and state."""
    city_counts = Counter()
    state_counts = Counter()
    ca_city_counts = Counter()

    print(f"Analyzing {input_file}...")

    with open(input_file, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            if line_num % 10000 == 0:
                print(f"Processed {line_num:,} businesses...")

            try:
                business = json.loads(line)
                city = business.get('city', '').strip()
                state = business.get('state', '').strip()

                if city and state:
                    city_counts[f"{city}, {state}"] += 1
                    state_counts[state] += 1

                    if state == 'CA':
                        ca_city_counts[city] += 1

            except json.JSONDecodeError:
                continue

    print("\n" + "="*60)
    print(f"TOP {top_n} CITIES IN DATASET")
    print("="*60)
    for city, count in city_counts.most_common(top_n):
        print(f"{city}: {count:,}")

    print("\n" + "="*60)
    print("TOP STATES")
    print("="*60)
    for state, count in state_counts.most_common(10):
        print(f"{state}: {count:,}")

    print("\n" + "="*60)
    print(f"TOP CALIFORNIA CITIES")
    print("="*60)
    for city, count in ca_city_counts.most_common(30):
        print(f"{city}: {count:,}")


if __name__ == "__main__":
    input_file = r"C:\path\to\yelp_academic_dataset_business.json"

    if not Path(input_file).exists():
        print(f"ERROR: File not found: {input_file}")
        print("Update the input_file path in this script.")
    else:
        analyze_cities(input_file)
