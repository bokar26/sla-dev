#!/usr/bin/env python3
"""
Test script for unified search functionality
"""
import requests
import json
import time

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

def test_unified_text_search():
    """Test unified search with text only"""
    try:
        response = requests.post(
            "http://localhost:8000/api/search/unified",
            json={"q": "cotton hoodie factory", "topK": 5},
            headers={"Content-Type": "application/json"}
        )
        print(f"Unified text search status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Mode: {data.get('mode')}")
            print(f"Results count: {data.get('total_found')}")
            print(f"Search time: {data.get('search_time')}s")
            return True
        else:
            print(f"Unified text search failed: {response.text}")
            return False
    except Exception as e:
        print(f"Unified text search error: {e}")
        return False

def test_unified_search_validation():
    """Test unified search validation"""
    try:
        # Test empty query
        response = requests.post(
            "http://localhost:8000/api/search/unified",
            json={"q": "", "topK": 5},
            headers={"Content-Type": "application/json"}
        )
        print(f"Empty query validation status: {response.status_code}")
        if response.status_code == 400:
            print("✓ Empty query properly rejected")
        else:
            print(f"✗ Empty query should be rejected: {response.text}")
        
        # Test no query and no files
        response = requests.post(
            "http://localhost:8000/api/search/unified",
            data={"q": "", "topK": "5"}
        )
        print(f"No query validation status: {response.status_code}")
        if response.status_code == 400:
            print("✓ No query properly rejected")
        else:
            print(f"✗ No query should be rejected: {response.text}")
        
        return True
    except Exception as e:
        print(f"Validation test error: {e}")
        return False

def test_unified_search_multipart():
    """Test unified search with multipart (simulating image upload)"""
    try:
        # Create a dummy image file for testing
        dummy_image = b"dummy image content"
        
        files = {
            'files': ('test.jpg', dummy_image, 'image/jpeg')
        }
        data = {
            'q': 'test query',
            'topK': '5'
        }
        
        response = requests.post(
            "http://localhost:8000/api/search/unified",
            files=files,
            data=data
        )
        print(f"Unified multipart search status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Mode: {data.get('mode')}")
            print(f"Results count: {data.get('total_found')}")
            print(f"Search time: {data.get('search_time')}s")
            print(f"Has extracted attributes: {'extracted_attributes' in data}")
            return True
        else:
            print(f"Unified multipart search failed: {response.text}")
            return False
    except Exception as e:
        print(f"Unified multipart search error: {e}")
        return False

def test_legacy_endpoints():
    """Test that legacy endpoints still work"""
    try:
        # Test legacy text search
        response = requests.post(
            "http://localhost:8000/api/factories/search",
            json={"query": "test query", "limit": 5},
            headers={"Content-Type": "application/json"}
        )
        print(f"Legacy text search status: {response.status_code}")
        
        # Test legacy reverse image search
        dummy_image = b"dummy image content"
        files = {
            'files': ('test.jpg', dummy_image, 'image/jpeg')
        }
        data = {
            'hints': 'test hints',
            'topK': '5'
        }
        
        response = requests.post(
            "http://localhost:8000/api/search/reverse-image",
            files=files,
            data=data
        )
        print(f"Legacy reverse image search status: {response.status_code}")
        
        return True
    except Exception as e:
        print(f"Legacy endpoints test error: {e}")
        return False

def test_error_handling():
    """Test error handling scenarios"""
    try:
        # Test invalid content type
        response = requests.post(
            "http://localhost:8000/api/search/unified",
            data="invalid data",
            headers={"Content-Type": "text/plain"}
        )
        print(f"Invalid content type status: {response.status_code}")
        
        # Test oversized file (simulate)
        large_data = b"x" * (13 * 1024 * 1024)  # 13MB
        files = {
            'files': ('large.jpg', large_data, 'image/jpeg')
        }
        data = {
            'q': 'test',
            'topK': '5'
        }
        
        response = requests.post(
            "http://localhost:8000/api/search/unified",
            files=files,
            data=data
        )
        print(f"Oversized file status: {response.status_code}")
        
        return True
    except Exception as e:
        print(f"Error handling test error: {e}")
        return False

if __name__ == "__main__":
    print("Testing Unified Search Functionality")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_check),
        ("Unified Text Search", test_unified_text_search),
        ("Search Validation", test_unified_search_validation),
        ("Unified Multipart Search", test_unified_search_multipart),
        ("Legacy Endpoints", test_legacy_endpoints),
        ("Error Handling", test_error_handling),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        print("-" * 30)
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"Test failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("Test Results:")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("\n🎉 All tests passed! Unified search is working correctly.")
    else:
        print(f"\n⚠️  {len(results) - passed} tests failed. Check the backend logs for details.")
