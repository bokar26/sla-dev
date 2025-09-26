#!/usr/bin/env python3
"""
Test script for real Alibaba integration (no mocks).
"""

import os
import requests
import json

BASE_URL = "http://localhost:8000"

def test_oauth_url():
    """Test OAuth URL generation - should fail without env vars."""
    print("Testing OAuth URL generation...")
    try:
        response = requests.get(f"{BASE_URL}/oauth/url")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 500:
            print("✅ PASS: Correctly returns 500 when env vars not configured")
        else:
            print("❌ FAIL: Should return 500 when env vars not configured")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_status_endpoint():
    """Test status endpoint - should work without env vars."""
    print("\nTesting status endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/status")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if response.status_code == 200 and data.get("connected") == False:
            print("✅ PASS: Status endpoint returns correct disconnected state")
        else:
            print("❌ FAIL: Status endpoint should return disconnected state")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_disconnect_endpoint():
    """Test disconnect endpoint."""
    print("\nTesting disconnect endpoint...")
    try:
        response = requests.post(f"{BASE_URL}/disconnect")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if response.status_code == 200:
            print("✅ PASS: Disconnect endpoint works")
        else:
            print("❌ FAIL: Disconnect endpoint should work")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_sync_endpoint():
    """Test sync endpoint."""
    print("\nTesting sync endpoint...")
    try:
        response = requests.post(f"{BASE_URL}/sync?kind=FULL")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if response.status_code == 500:
            print("✅ PASS: Sync correctly fails when not connected")
        else:
            print("❌ FAIL: Sync should fail when not connected")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_data_endpoints():
    """Test data endpoints."""
    endpoints = ["/orders", "/shipments", "/suppliers"]
    
    for endpoint in endpoints:
        print(f"\nTesting {endpoint} endpoint...")
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            print(f"Status: {response.status_code}")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if response.status_code == 200:
                print(f"✅ PASS: {endpoint} endpoint works")
            else:
                print(f"❌ FAIL: {endpoint} endpoint should work")
                
        except Exception as e:
            print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    print("🧪 Testing Real Alibaba Integration (No Mocks)")
    print("=" * 50)
    
    test_oauth_url()
    test_status_endpoint()
    test_disconnect_endpoint()
    test_sync_endpoint()
    test_data_endpoints()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    print("\nTo test with real OAuth:")
    print("1. Set ALIBABA_CLIENT_ID, ALIBABA_CLIENT_SECRET, ALIBABA_REDIRECT_URI")
    print("2. Restart the backend")
    print("3. Try connecting through the frontend")
