#!/usr/bin/env python3
"""Test script for AI host assistant endpoint"""

import requests
import json

# Login first
login_response = requests.post(
    "http://localhost:8000/api/auth/login",
    json={"email": "nbmodi@usc.edu", "password": "password123"}
)

if login_response.status_code != 200:
    print(f"Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["access_token"]
print(f"[OK] Login successful, got token: {token[:20]}...")

# Test AI host assist endpoint
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

test_request = {
    "event_id": "event-test-001",
    "task": "Help me plan a shopping list for a birthday party with 20 guests"
}

print(f"\n[OUT] Testing AI host assistant with request:")
print(json.dumps(test_request, indent=2))

ai_response = requests.post(
    "http://localhost:8000/api/ai/host-assist",
    headers=headers,
    json=test_request
)

print(f"\n📥 Response status: {ai_response.status_code}")

if ai_response.status_code == 200:
    print("[OK] AI host assistant is working!")
    response_data = ai_response.json()
    print(f"\n🤖 AI Response:")
    print(response_data.get("response", "No response"))
else:
    print(f"[FAIL] AI host assistant failed!")
    print(f"Error: {ai_response.text}")
