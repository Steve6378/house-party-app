"""
Analyze ZIP codes in Yelp dataset to identify LA area coverage.
"""

import json
from collections import Counter
from pathlib import Path


def analyze_zips(input_file: str):
    """Show ZIP code distribution for California businesses."""
    ca_zip_counts = Counter()

    print(f"Analyzing {input_file}...")

    with open(input_file, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            if line_num % 10000 == 0:
                print(f"Processed {line_num:,} businesses...")

            try:
                business = json.loads(line)
                state = business.get('state', '').upper()
                zip_code = business.get('postal_code', '').strip()

                if state == 'CA' and zip_code:
                    # Get first 3 digits for grouping
                    zip_prefix = zip_code[:3] if len(zip_code) >= 3 else zip_code
                    ca_zip_counts[zip_prefix] += 1

            except (json.JSONDecodeError, KeyError):
                continue

    print("\n" + "="*60)
    print("CALIFORNIA ZIP CODE PREFIXES (Top 50)")
    print("="*60)

    for zip_prefix, count in ca_zip_counts.most_common(50):
        print(f"{zip_prefix}xx: {count:,} businesses")

    # LA area specific (900-918, 935)
    print("\n" + "="*60)
    print("LA COUNTY AREA ZIP PREFIXES (900-918, 935)")
    print("="*60)

    la_prefixes = [str(i) for i in range(900, 919)] + ['935']
    for prefix in sorted(la_prefixes):
        if prefix in ca_zip_counts:
            print(f"{prefix}xx: {ca_zip_counts[prefix]:,} businesses")

    # Orange County (926-928)
    print("\n" + "="*60)
    print("ORANGE COUNTY ZIP PREFIXES (926-928)")
    print("="*60)

    oc_prefixes = [str(i) for i in range(926, 929)]
    for prefix in sorted(oc_prefixes):
        if prefix in ca_zip_counts:
            print(f"{prefix}xx: {ca_zip_counts[prefix]:,} businesses")


if __name__ == "__main__":
    input_file = r"C:\path\to\yelp_academic_dataset_business.json"

    if not Path(input_file).exists():
        print(f"ERROR: File not found: {input_file}")
        print("Update the input_file path in this script.")
    else:
        analyze_zips(input_file)
