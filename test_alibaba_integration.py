#!/usr/bin/env python3
"""
Test script for Alibaba integration
"""
import requests
import json
import sys

def test_alibaba_endpoints():
    """Test Alibaba API endpoints"""
    base_url = "http://localhost:8000"
    
    print("Testing Alibaba Integration Endpoints...")
    print("=" * 50)
    
    # Test 1: Get OAuth URL
    print("1. Testing OAuth URL endpoint...")
    try:
        response = requests.get(f"{base_url}/api/integrations/alibaba/oauth/url")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ OAuth URL generated: {data['url'][:50]}...")
        else:
            print(f"   ✗ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 2: Get status (should work even when disconnected)
    print("\n2. Testing status endpoint...")
    try:
        response = requests.get(f"{base_url}/api/integrations/alibaba/status")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Status retrieved: connected={data['connected']}")
            print(f"   ✓ Metrics: {data['metrics']}")
        else:
            print(f"   ✗ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 3: Test disconnect (should work even when not connected)
    print("\n3. Testing disconnect endpoint...")
    try:
        response = requests.post(f"{base_url}/api/integrations/alibaba/disconnect")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Disconnect successful: {data}")
        else:
            print(f"   ✗ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 4: Test sync endpoint (should fail without connection)
    print("\n4. Testing sync endpoint...")
    try:
        response = requests.post(
            f"{base_url}/api/integrations/alibaba/sync",
            json={"kind": "FULL"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Sync triggered: {data}")
        else:
            print(f"   ✗ Expected failure: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    print("\n" + "=" * 50)
    print("Alibaba Integration Test Complete!")

def test_mock_client():
    """Test the mock Alibaba client"""
    print("\nTesting Mock Alibaba Client...")
    print("=" * 50)
    
    try:
        from alibaba_client import MockAlibabaClient
        
        # Create mock client
        client = MockAlibabaClient(
            access_token="mock_token",
            refresh_token="mock_refresh",
            client_id="mock_client_id",
            client_secret="mock_client_secret"
        )
        
        # Test list orders
        print("1. Testing list orders...")
        orders, next_token = client.list_orders()
        print(f"   ✓ Retrieved {len(orders)} orders")
        if orders:
            print(f"   ✓ First order: {orders[0].order_id} - {orders[0].status}")
        
        # Test list suppliers
        print("\n2. Testing list suppliers...")
        suppliers, next_token = client.list_suppliers()
        print(f"   ✓ Retrieved {len(suppliers)} suppliers")
        if suppliers:
            print(f"   ✓ First supplier: {suppliers[0].name} - {suppliers[0].rating}")
        
        # Test list shipments
        print("\n3. Testing list shipments...")
        if orders:
            shipments = client.list_shipments(orders[0].order_id)
            print(f"   ✓ Retrieved {len(shipments)} shipments for order {orders[0].order_id}")
            if shipments:
                print(f"   ✓ First shipment: {shipments[0].tracking_no} - {shipments[0].status}")
        
        print("\n✓ Mock client tests passed!")
        
    except Exception as e:
        print(f"✗ Mock client test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("Alibaba Integration Test Suite")
    print("=" * 50)
    
    # Test mock client first
    test_mock_client()
    
    # Test API endpoints
    test_alibaba_endpoints()
    
    print("\nAll tests completed!")
