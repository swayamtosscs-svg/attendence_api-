#!/bin/bash

BASE_URL="http://localhost:8087"

echo "=== Testing Chat & Profile Picture APIs ==="
echo ""

# Step 1: Login to get token (replace with your credentials)
echo "1. Login to get token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password_here"
  }')

echo "Login Response: $LOGIN_RESPONSE"
echo ""

# Extract token (if using jq)
# TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
# Or manually copy token from response

# Replace YOUR_TOKEN with actual token from login
TOKEN="YOUR_TOKEN_HERE"

echo "=== Testing Chat APIs ==="
echo ""

# Test 2: Send Message
echo "2. Testing Send Message API..."
curl -X POST "$BASE_URL/api/chat/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "69158b77bf21223e78398dc9",
    "content": "Hello! This is a test message"
  }'
echo ""
echo ""

# Test 3: Get Conversations
echo "3. Testing Get Conversations API..."
curl -X GET "$BASE_URL/api/chat/conversations" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# Test 4: Get Messages
echo "4. Testing Get Messages API..."
curl -X GET "$BASE_URL/api/chat/messages?userId=69158b77bf21223e78398dc9&limit=10" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "=== Testing Profile Picture APIs ==="
echo ""

# Test 5: Upload Profile Picture (create a test image first)
echo "5. Testing Upload Profile Picture API..."
echo "Note: Create a test.jpg file first or use existing image"
curl -X POST "$BASE_URL/api/users/me/avatar" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.jpg"
echo ""
echo ""

# Test 6: Delete Profile Picture
echo "6. Testing Delete Profile Picture API..."
curl -X DELETE "$BASE_URL/api/users/me/avatar" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "=== All Tests Complete ==="


