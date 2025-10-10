#!/bin/bash
# SLA Auth Smoke Test
# Tests the login endpoint with the dev user credentials

API_URL="http://localhost:8000/api"
TEST_EMAIL="sla@test.com"
TEST_PASSWORD="1234567"

echo "🧪 SLA Auth Smoke Test"
echo "======================"
echo "API URL: $API_URL"
echo "Test User: $TEST_EMAIL"
echo ""

# Test 1: Correct credentials
echo "✅ Test 1: Correct credentials"
curl -i -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  -w "\n\n"

echo ""

# Test 2: Case-insensitive email
echo "✅ Test 2: Case-insensitive email"
curl -i -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"SLA@Test.com\",\"password\":\"$TEST_PASSWORD\"}" \
  -w "\n\n"

echo ""

# Test 3: Wrong password
echo "❌ Test 3: Wrong password (should return 401)"
curl -i -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}" \
  -w "\n\n"

echo ""
echo "🎉 Smoke test completed!"
