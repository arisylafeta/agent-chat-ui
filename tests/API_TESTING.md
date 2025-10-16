# Wardrobe API Testing Guide

## Overview

This document describes how to test the Wardrobe Management API endpoints.

## Test Files

- **`tests/e2e/wardrobe-api.spec.ts`**: Playwright API tests (automated)
- **`scripts/test-wardrobe-api.sh`**: Manual test script (bash)

## Prerequisites

1. **Dev server running**: `pnpm dev`
2. **Database migrations applied**: Migrations should be pushed to Supabase
3. **Test user created**: You need a test user in your Supabase project

## Running Automated Tests (Playwright)

### Setup

1. Create a test user in your Supabase project:
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES ('test@example.com', crypt('testpassword123', gen_salt('bf')), NOW());
   ```

2. Set environment variables in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

### Run Tests

```bash
# Run all Playwright tests
pnpm test:e2e

# Run only wardrobe API tests
pnpm test:e2e wardrobe-api

# Run with UI
pnpm test:ui
```

## Running Manual Tests (Bash Script)

### Get Auth Token

1. Sign in to your app at `http://localhost:3000`
2. Open browser DevTools > Application > Storage
3. Find and copy your Supabase access token from cookies or localStorage

### Run Script

```bash
./scripts/test-wardrobe-api.sh YOUR_AUTH_TOKEN
```

The script will test all endpoints in sequence:
1. ✅ GET /api/wardrobe (list items)
2. ✅ POST /api/wardrobe (create item)
3. ✅ GET /api/wardrobe/[id] (get single item)
4. ✅ PATCH /api/wardrobe/[id] (update item)
5. ✅ POST /api/wardrobe/prettify (AI enhancement)
6. ✅ DELETE /api/wardrobe/[id] (delete item)

## Manual Testing with cURL

### 1. List Items

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/wardrobe
```

### 2. Create Item

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Blue Jacket" \
  -F "category=jacket" \
  -F "brand=Levi's" \
  -F "image=@/path/to/image.jpg" \
  -F "colors=[\"blue\",\"white\"]" \
  -F "price=99.99" \
  http://localhost:3000/api/wardrobe
```

### 3. Get Single Item

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/wardrobe/ITEM_ID
```

### 4. Update Item

```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","price":149.99}' \
  http://localhost:3000/api/wardrobe/ITEM_ID
```

### 5. Prettify Image

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  http://localhost:3000/api/wardrobe/prettify
```

### 6. Delete Item

```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/wardrobe/ITEM_ID
```

## Expected Responses

### Success Responses

- **GET /api/wardrobe**: `200 OK`
  ```json
  {
    "items": [...],
    "total": 10,
    "limit": 20,
    "offset": 0
  }
  ```

- **POST /api/wardrobe**: `201 Created`
  ```json
  {
    "item": {
      "id": "uuid",
      "name": "Blue Jacket",
      "category": "jacket",
      "image_url": "https://...",
      ...
    }
  }
  ```

- **GET /api/wardrobe/[id]**: `200 OK`
  ```json
  {
    "item": { ... }
  }
  ```

- **PATCH /api/wardrobe/[id]**: `200 OK`
  ```json
  {
    "item": { ... }
  }
  ```

- **DELETE /api/wardrobe/[id]**: `200 OK`
  ```json
  {
    "success": true,
    "id": "uuid"
  }
  ```

- **POST /api/wardrobe/prettify**: `200 OK`
  ```json
  {
    "prettifiedImage": "data:image/png;base64,...",
    "originalImage": "data:image/png;base64,..."
  }
  ```

### Error Responses

- **401 Unauthorized**: Missing or invalid auth token
- **400 Bad Request**: Invalid input data
- **404 Not Found**: Item doesn't exist
- **500 Internal Server Error**: Server error

## Testing Checklist

### Authentication
- [ ] Endpoints reject requests without auth token
- [ ] Endpoints accept requests with valid auth token
- [ ] Users can only access their own items (RLS)

### GET /api/wardrobe
- [ ] Returns list of items for authenticated user
- [ ] Supports pagination (limit, offset)
- [ ] Supports category filtering
- [ ] Returns empty array when no items exist

### POST /api/wardrobe
- [ ] Creates item with all fields
- [ ] Uploads image to Supabase Storage
- [ ] Returns created item with image URL
- [ ] Validates required fields (name, category, image)
- [ ] Validates image file type and size
- [ ] Rejects files over 10MB
- [ ] Rejects non-image files

### GET /api/wardrobe/[id]
- [ ] Returns single item by ID
- [ ] Returns 404 for non-existent item
- [ ] Enforces RLS (can't access other users' items)

### PATCH /api/wardrobe/[id]
- [ ] Updates item fields
- [ ] Returns updated item
- [ ] Validates item exists
- [ ] Enforces RLS
- [ ] Rejects empty update payload

### DELETE /api/wardrobe/[id]
- [ ] Deletes item from database
- [ ] Deletes image from storage
- [ ] Returns success response
- [ ] Returns 404 for non-existent item
- [ ] Enforces RLS

### POST /api/wardrobe/prettify
- [ ] Accepts image file
- [ ] Returns prettified and original images
- [ ] Falls back gracefully if AI service unavailable
- [ ] Validates image file type and size
- [ ] Rejects files over 10MB

## Troubleshooting

### "Unauthorized" errors
- Check that your auth token is valid and not expired
- Verify token is passed in Authorization header
- Ensure user exists in Supabase auth.users table

### "Item not found" errors
- Verify the item ID exists
- Check that the item belongs to the authenticated user (RLS)
- Ensure migrations have been applied

### Image upload failures
- Check file size (must be < 10MB)
- Verify file type (JPEG, PNG, WebP only)
- Ensure storage bucket exists and has correct RLS policies
- Check Supabase Storage quota

### Prettify endpoint issues
- Verify `GEMINI_API_KEY` is set in `.env.local`
- Check Gemini API quota and billing
- Endpoint should fall back to original image if AI fails

## Next Steps

After verifying all API endpoints work:
1. Proceed with UI component implementation (Phase 2)
2. Integrate components with API endpoints (Phase 3)
3. Add E2E tests for full user flows (Phase 4)
