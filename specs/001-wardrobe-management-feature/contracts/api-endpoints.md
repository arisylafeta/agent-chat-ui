# API Endpoints - Wardrobe Management

## Base URL
- Development: `http://localhost:3000/api/wardrobe`
- Production: `https://your-domain.com/api/wardrobe`

## Authentication
All endpoints require authentication via Supabase Auth. Include the user's JWT token in the Authorization header:

```
Authorization: Bearer {jwt_token}
```

## Endpoints

### 1. Prettify Image with AI

**POST** `/api/wardrobe/prettify`

Processes an uploaded image with Gemini AI to create a professional product photo with white background.

#### Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File | Yes | Image file (JPEG, PNG, WebP, max 10MB) |

#### Request Example

```bash
curl -X POST http://localhost:3000/api/wardrobe/prettify \
  -H "Authorization: Bearer {token}" \
  -F "image=@/path/to/clothing.jpg"
```

#### Response (200 OK)

```json
{
  "prettifiedUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "message": "Image processed successfully"
}
```

**Note**: The prettified image is returned as a base64 data URL for immediate display. This is temporary and not stored in the database. The frontend displays the prettified image with "Use AI Version" and "Use Original" buttons. Only the chosen image is uploaded when creating the clothing item.

#### Error Responses

```json
// 400 Bad Request - Invalid file
{
  "error": "Invalid file type",
  "code": "INVALID_FILE_TYPE"
}

// 500 Internal Server Error - AI processing failed
{
  "error": "Failed to process image with AI",
  "code": "AI_PROCESSING_FAILED",
  "details": "Gemini API error message"
}
```

---

### 2. List Clothing Items

**GET** `/api/wardrobe`

Retrieves a paginated list of clothing items for the authenticated user.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 20 | Number of items per page (max 100) |
| `offset` | number | No | 0 | Number of items to skip |
| `category` | string | No | - | Filter by category (shirt, pants, etc.) |

#### Request Example

```bash
GET /api/wardrobe?limit=20&offset=0&category=jacket
```

#### Response (200 OK)

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Blue Denim Jacket",
      "category": "jacket",
      "brand": "Levi's",
      "image_url": "https://storage.supabase.co/...",
      "colors": ["blue", "indigo"],
      "fabrics": ["denim", "cotton"],
      "seasons": ["spring", "fall"],
      "tags": ["casual", "vintage"],
      "price": 89.99,
      "dress_codes": ["casual"],
      "gender": "unisex",
      "size": "M",
      "notes": "Bought at thrift store",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

#### Error Responses

```json
// 401 Unauthorized
{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED"
}

// 400 Bad Request
{
  "error": "Invalid query parameters",
  "code": "INVALID_PARAMS",
  "details": {
    "limit": "Must be between 1 and 100"
  }
}
```

---

### 3. Create Clothing Item

**POST** `/api/wardrobe`

Creates a new clothing item with image upload.

#### Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Name of the clothing item (max 100 chars) |
| `category` | string | Yes | Category (shirt, pants, jacket, etc.) |
| `brand` | string | No | Brand name (max 50 chars) |
| `image` | File | Yes | Image file (JPEG, PNG, WebP, max 10MB) - can be original or AI-prettified |
| `colors` | string[] | No | Array of color tags |
| `fabrics` | string[] | No | Array of fabric types |
| `seasons` | string[] | No | Array of seasons |
| `tags` | string[] | No | Custom tags |
| `price` | number | No | Purchase price |
| `dress_codes` | string[] | No | Dress code tags |
| `gender` | string | No | Gender category (men, women, unisex) |
| `size` | string | No | Size label |
| `notes` | string | No | Additional notes (max 500 chars) |

#### Request Example

```bash
curl -X POST http://localhost:3000/api/wardrobe \
  -H "Authorization: Bearer {token}" \
  -F "name=Blue Denim Jacket" \
  -F "category=jacket" \
  -F "brand=Levi's" \
  -F "image=@/path/to/jacket.jpg" \
  -F "prettifyWithAI=true" \
  -F "colors[]=blue" \
  -F "colors[]=indigo" \
  -F "seasons[]=spring" \
  -F "seasons[]=fall" \
  -F "price=89.99"
```

#### Response (201 Created)

```json
{
  "item": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Blue Denim Jacket",
    "category": "jacket",
    "brand": "Levi's",
    "image_url": "https://storage.supabase.co/...",
    "enhanced_image_url": null,
    "colors": ["blue", "indigo"],
    "fabrics": null,
    "seasons": ["spring", "fall"],
    "tags": null,
    "price": 89.99,
    "dress_codes": null,
    "gender": null,
    "size": null,
    "notes": null,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

#### Error Responses

```json
// 400 Bad Request - Validation Error
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": "Name is required",
    "image": "File size exceeds 10MB limit"
  }
}

// 415 Unsupported Media Type
{
  "error": "Invalid file type",
  "code": "INVALID_FILE_TYPE",
  "details": {
    "allowed": ["image/jpeg", "image/png", "image/webp"],
    "received": "application/pdf"
  }
}

// 413 Payload Too Large
{
  "error": "File too large",
  "code": "FILE_TOO_LARGE",
  "details": {
    "maxSize": "10MB",
    "receivedSize": "15MB"
  }
}
```

---

### 4. Get Single Clothing Item

**GET** `/api/wardrobe/[id]`

Retrieves a single clothing item by ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Clothing item ID |

#### Request Example

```bash
GET /api/wardrobe/550e8400-e29b-41d4-a716-446655440000
```

#### Response (200 OK)

```json
{
  "item": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Blue Denim Jacket",
    "category": "jacket",
    "brand": "Levi's",
    "image_url": "https://storage.supabase.co/...",
    "enhanced_image_url": null,
    "colors": ["blue", "indigo"],
    "fabrics": ["denim", "cotton"],
    "seasons": ["spring", "fall"],
    "tags": ["casual", "vintage"],
    "price": 89.99,
    "dress_codes": ["casual"],
    "gender": "unisex",
    "size": "M",
    "notes": "Bought at thrift store",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

#### Error Responses

```json
// 404 Not Found
{
  "error": "Clothing item not found",
  "code": "NOT_FOUND"
}

// 403 Forbidden (user doesn't own this item)
{
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```

---

### 5. Update Clothing Item

**PATCH** `/api/wardrobe/[id]`

Updates an existing clothing item. All fields are optional.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Clothing item ID |

#### Request Body (application/json)

Any subset of the clothing item fields (except `id`, `user_id`, `created_at`).

#### Request Example

```bash
curl -X PATCH http://localhost:3000/api/wardrobe/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["casual", "vintage", "favorite"],
    "price": 79.99,
    "notes": "Bought at thrift store. Great condition!"
  }'
```

#### Response (200 OK)

```json
{
  "item": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Blue Denim Jacket",
    "category": "jacket",
    "brand": "Levi's",
    "image_url": "https://storage.supabase.co/...",
    "enhanced_image_url": null,
    "colors": ["blue", "indigo"],
    "fabrics": ["denim", "cotton"],
    "seasons": ["spring", "fall"],
    "tags": ["casual", "vintage", "favorite"],
    "price": 79.99,
    "dress_codes": ["casual"],
    "gender": "unisex",
    "size": "M",
    "notes": "Bought at thrift store. Great condition!",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T14:22:00Z"
  }
}
```

#### Error Responses

```json
// 404 Not Found
{
  "error": "Clothing item not found",
  "code": "NOT_FOUND"
}

// 403 Forbidden
{
  "error": "Access denied",
  "code": "FORBIDDEN"
}

// 400 Bad Request
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "price": "Must be a positive number"
  }
}
```

---

### 6. Delete Clothing Item

**DELETE** `/api/wardrobe/[id]`

Deletes a clothing item and its associated images from storage.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Clothing item ID |

#### Request Example

```bash
curl -X DELETE http://localhost:3000/api/wardrobe/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer {token}"
```

#### Response (200 OK)

```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Error Responses

```json
// 404 Not Found
{
  "error": "Clothing item not found",
  "code": "NOT_FOUND"
}

// 403 Forbidden
{
  "error": "Access denied",
  "code": "FORBIDDEN"
}

// 500 Internal Server Error (storage deletion failed)
{
  "error": "Failed to delete associated images",
  "code": "STORAGE_DELETE_FAILED",
  "details": {
    "imageUrl": "https://storage.supabase.co/..."
  }
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | No authentication token provided |
| `INVALID_TOKEN` | 401 | Authentication token is invalid or expired |
| `FORBIDDEN` | 403 | User doesn't have access to this resource |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request data failed validation |
| `INVALID_PARAMS` | 400 | Invalid query parameters |
| `INVALID_FILE_TYPE` | 415 | Unsupported file type |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |
| `STORAGE_UPLOAD_FAILED` | 500 | Failed to upload file to storage |
| `STORAGE_DELETE_FAILED` | 500 | Failed to delete file from storage |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Rate Limiting

- **Limit**: 100 requests per minute per user
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

**Response when rate limited (429 Too Many Requests)**:
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

## Pagination

For the list endpoint (`GET /api/wardrobe`):

- Use `limit` and `offset` parameters
- Maximum `limit` is 100
- Response includes `total` count for calculating pages
- Consider cursor-based pagination for large datasets (future enhancement)

## Image URLs

- All image URLs are signed URLs with 1-hour expiration
- Client should refresh URLs if expired (re-fetch item)
- Original images stored at: `{user_id}/{uuid}.{ext}`
- Enhanced images (future): `{user_id}/{uuid}_enhanced.{ext}`

## Versioning

Current API version: **v1** (implicit, no version prefix)

Future versions will use URL prefix: `/api/v2/wardrobe`

## CORS

- Development: `http://localhost:3000` allowed
- Production: Same-origin only
- Credentials: Required (cookies for auth)

## Testing

Use the provided curl examples or import into Postman/Insomnia.

For automated testing, see `quickstart.md` for test scenarios.
