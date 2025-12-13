"""
Test script for Google Maps Places API
Tests address autocomplete functionality
"""

import requests
from config import settings

def test_places_autocomplete():
    """Test Google Places Autocomplete API"""

    api_key = settings.GOOGLE_MAPS_API_KEY
    print(f"Using API Key: {api_key[:10]}...{api_key[-5:]}")

    # Test address
    test_input = "123 Main Street"

    # Google Places Autocomplete API endpoint
    url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"

    params = {
        "input": test_input,
        "key": api_key,
        "types": "address"
    }

    print(f"\nTesting Places Autocomplete with input: '{test_input}'")
    print(f"URL: {url}")

    try:
        response = requests.get(url, params=params)
        data = response.json()

        print(f"\nResponse Status: {response.status_code}")
        print(f"API Status: {data.get('status')}")

        if data.get('status') == 'OK':
            print(f"\nFound {len(data.get('predictions', []))} predictions:")
            for i, pred in enumerate(data.get('predictions', [])[:5]):
                print(f"  {i+1}. {pred.get('description')}")
            print("\n[OK] Google Places API is working correctly!")
            return True
        elif data.get('status') == 'REQUEST_DENIED':
            print(f"\n[FAIL] API Request Denied!")
            print(f"Error message: {data.get('error_message', 'No error message')}")
            print("\nPossible causes:")
            print("  1. API key is invalid or expired")
            print("  2. Places API is not enabled for this project")
            print("  3. Billing is not enabled for the Google Cloud project")
            print("  4. API key restrictions are blocking the request")
            return False
        elif data.get('status') == 'ZERO_RESULTS':
            print("\n[WARN] No results found, but API is working")
            return True
        else:
            print(f"\n[FAIL] Unexpected status: {data.get('status')}")
            print(f"Error message: {data.get('error_message', 'No error message')}")
            return False

    except Exception as e:
        print(f"\n[FAIL] Error making request: {e}")
        return False


def test_geocoding():
    """Test Google Geocoding API as alternative"""

    api_key = settings.GOOGLE_MAPS_API_KEY

    # Test address
    test_address = "1600 Amphitheatre Parkway, Mountain View, CA"

    url = "https://maps.googleapis.com/maps/api/geocode/json"

    params = {
        "address": test_address,
        "key": api_key
    }

    print(f"\n\nTesting Geocoding API with address: '{test_address}'")

    try:
        response = requests.get(url, params=params)
        data = response.json()

        print(f"Response Status: {response.status_code}")
        print(f"API Status: {data.get('status')}")

        if data.get('status') == 'OK':
            result = data.get('results', [{}])[0]
            print(f"Formatted address: {result.get('formatted_address')}")
            location = result.get('geometry', {}).get('location', {})
            print(f"Coordinates: {location.get('lat')}, {location.get('lng')}")
            print("\n[OK] Geocoding API is working!")
            return True
        else:
            print(f"[FAIL] Geocoding failed: {data.get('error_message', 'Unknown error')}")
            return False

    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Google Maps API Test")
    print("=" * 60)

    places_ok = test_places_autocomplete()
    geocoding_ok = test_geocoding()

    print("\n" + "=" * 60)
    print("Summary:")
    print(f"  Places Autocomplete: {'[OK] OK' if places_ok else '[FAIL] FAILED'}")
    print(f"  Geocoding: {'[OK] OK' if geocoding_ok else '[FAIL] FAILED'}")
    print("=" * 60)

    if not places_ok:
        print("\n[WARN] To fix Places API issues:")
        print("1. Go to https://console.cloud.google.com/apis/library")
        print("2. Search for 'Places API' and enable it")
        print("3. Make sure billing is enabled for the project")
        print("4. Check API key restrictions allow Places API")
