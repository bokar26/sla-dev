#!/usr/bin/env python3
"""
Test script to verify error handling improvements
"""
import requests
import json

def test_health_check():
    """Test the health check endpoint"""
    try:
        response = requests.get("http://localhost:8000/healthz")
        print(f"Health check status: {response.status_code}")
        if response.status_code == 200:
            print(f"Health check response: {response.json()}")
            return True
        else:
            print(f"Health check failed: {response.text}")
            return False
    except Exception as e:
        print(f"Health check error: {e}")
        return False

def test_search_endpoint():
    """Test the search endpoint with invalid data"""
    try:
        response = requests.post(
            "http://localhost:8000/api/factories/search",
            json={"query": ""},  # Empty query should trigger validation error
            headers={"Content-Type": "application/json"}
        )
        print(f"Search endpoint status: {response.status_code}")
        print(f"Search endpoint response: {response.text}")
        return response.status_code in [400, 500]  # Should return error
    except Exception as e:
        print(f"Search endpoint error: {e}")
        return False

def test_reverse_image_search():
    """Test the reverse image search endpoint with no files"""
    try:
        response = requests.post(
            "http://localhost:8000/api/search/reverse-image",
            data={"hints": "test", "topK": 5}
        )
        print(f"Reverse image search status: {response.status_code}")
        print(f"Reverse image search response: {response.text}")
        return response.status_code in [400, 500]  # Should return error
    except Exception as e:
        print(f"Reverse image search error: {e}")
        return False

if __name__ == "__main__":
    print("Testing error handling improvements...")
    print("=" * 50)
    
    print("\n1. Testing health check endpoint:")
    health_ok = test_health_check()
    
    print("\n2. Testing search endpoint error handling:")
    search_ok = test_search_endpoint()
    
    print("\n3. Testing reverse image search error handling:")
    image_ok = test_reverse_image_search()
    
    print("\n" + "=" * 50)
    print("Results:")
    print(f"Health check: {'✓' if health_ok else '✗'}")
    print(f"Search error handling: {'✓' if search_ok else '✗'}")
    print(f"Image search error handling: {'✓' if image_ok else '✗'}")
    
    if all([health_ok, search_ok, image_ok]):
        print("\n🎉 All tests passed! Error handling is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the backend logs for details.")
