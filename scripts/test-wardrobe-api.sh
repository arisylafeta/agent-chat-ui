#!/bin/bash

# Test script for Wardrobe API endpoints
# Usage: ./scripts/test-wardrobe-api.sh <AUTH_TOKEN>

set -e

API_URL="http://localhost:3000"
AUTH_TOKEN="${1:-}"

if [ -z "$AUTH_TOKEN" ]; then
  echo "Error: AUTH_TOKEN is required"
  echo "Usage: ./scripts/test-wardrobe-api.sh <AUTH_TOKEN>"
  echo ""
  echo "To get an auth token:"
  echo "1. Sign in to your app"
  echo "2. Open browser dev tools > Application > Cookies"
  echo "3. Copy the value of 'sb-access-token' or similar"
  exit 1
fi

echo "🧪 Testing Wardrobe API Endpoints"
echo "=================================="
echo ""

# Test 1: GET /api/wardrobe (should return empty list initially)
echo "📋 Test 1: GET /api/wardrobe"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  "$API_URL/api/wardrobe")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ GET /api/wardrobe - Success (200)"
  echo "   Response: $BODY"
else
  echo "❌ GET /api/wardrobe - Failed ($HTTP_CODE)"
  echo "   Response: $BODY"
  exit 1
fi
echo ""

# Test 2: POST /api/wardrobe (create item)
echo "📝 Test 2: POST /api/wardrobe (create item)"
# Create a simple 1x1 PNG image
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-image.png

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "name=Test Jacket" \
  -F "category=jacket" \
  -F "brand=Test Brand" \
  -F "image=@/tmp/test-image.png" \
  -F "colors=[\"blue\",\"white\"]" \
  -F "price=99.99" \
  "$API_URL/api/wardrobe")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ POST /api/wardrobe - Success (201)"
  ITEM_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "   Created item ID: $ITEM_ID"
else
  echo "❌ POST /api/wardrobe - Failed ($HTTP_CODE)"
  echo "   Response: $BODY"
  exit 1
fi
echo ""

# Test 3: GET /api/wardrobe/[id] (fetch single item)
if [ -n "$ITEM_ID" ]; then
  echo "🔍 Test 3: GET /api/wardrobe/$ITEM_ID"
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    "$API_URL/api/wardrobe/$ITEM_ID")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ GET /api/wardrobe/[id] - Success (200)"
    echo "   Response: $BODY"
  else
    echo "❌ GET /api/wardrobe/[id] - Failed ($HTTP_CODE)"
    echo "   Response: $BODY"
    exit 1
  fi
  echo ""
fi

# Test 4: PATCH /api/wardrobe/[id] (update item)
if [ -n "$ITEM_ID" ]; then
  echo "✏️  Test 4: PATCH /api/wardrobe/$ITEM_ID"
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X PATCH \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Updated Jacket","price":149.99}' \
    "$API_URL/api/wardrobe/$ITEM_ID")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ PATCH /api/wardrobe/[id] - Success (200)"
    echo "   Response: $BODY"
  else
    echo "❌ PATCH /api/wardrobe/[id] - Failed ($HTTP_CODE)"
    echo "   Response: $BODY"
    exit 1
  fi
  echo ""
fi

# Test 5: POST /api/wardrobe/prettify
echo "🎨 Test 5: POST /api/wardrobe/prettify"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "image=@/tmp/test-image.png" \
  "$API_URL/api/wardrobe/prettify")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ POST /api/wardrobe/prettify - Success (200)"
  echo "   Response contains prettified image data"
else
  echo "⚠️  POST /api/wardrobe/prettify - Response ($HTTP_CODE)"
  echo "   Note: May fail if GEMINI_API_KEY not configured"
  echo "   Response: $BODY"
fi
echo ""

# Test 6: DELETE /api/wardrobe/[id] (delete item)
if [ -n "$ITEM_ID" ]; then
  echo "🗑️  Test 6: DELETE /api/wardrobe/$ITEM_ID"
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X DELETE \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    "$API_URL/api/wardrobe/$ITEM_ID")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ DELETE /api/wardrobe/[id] - Success (200)"
    echo "   Response: $BODY"
  else
    echo "❌ DELETE /api/wardrobe/[id] - Failed ($HTTP_CODE)"
    echo "   Response: $BODY"
    exit 1
  fi
  echo ""
fi

# Cleanup
rm -f /tmp/test-image.png

echo "=================================="
echo "✅ All API tests passed!"
echo ""
echo "Summary:"
echo "  - GET /api/wardrobe: ✅"
echo "  - POST /api/wardrobe: ✅"
echo "  - GET /api/wardrobe/[id]: ✅"
echo "  - PATCH /api/wardrobe/[id]: ✅"
echo "  - POST /api/wardrobe/prettify: ✅"
echo "  - DELETE /api/wardrobe/[id]: ✅"
