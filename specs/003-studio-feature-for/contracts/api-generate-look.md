# API Contract: Generate Look

## Endpoint
```
POST /api/studio/generate-look
```

## Purpose
Generate an AI-powered virtual try-on image by compositing user's avatar with selected product images using Gemini 2.5 Flash Image model.

## Authentication
- **Required**: Yes
- **Method**: Supabase session cookie
- **Validation**: `auth.uid()` must be present

## Request

### Headers
```
Content-Type: multipart/form-data
Cookie: sb-access-token=...
```

### Body (FormData)
```typescript
{
  avatar: File;           // User's avatar image file
  products: File[];       // Array of product image files (max 6)
}
```

### Field Specifications

#### `avatar`
- **Type**: File (Blob)
- **Required**: Yes
- **Format**: JPEG, PNG, WebP
- **Max Size**: 10MB
- **Validation**: Must be valid image file

#### `products`
- **Type**: File[] (Blob array)
- **Required**: Yes
- **Min Items**: 1
- **Max Items**: 6
- **Format**: JPEG, PNG, WebP per file
- **Max Size**: 10MB per file
- **Validation**: All must be valid image files

### Example Request (JavaScript)
```typescript
const formData = new FormData();
formData.append('avatar', avatarBlob, 'avatar.jpg');
productBlobs.forEach((blob, idx) => {
  formData.append('products', blob, `product-${idx}.jpg`);
});

const response = await fetch('/api/studio/generate-look', {
  method: 'POST',
  body: formData,
  credentials: 'include',
});
```

## Response

### Success Response (200 OK)
```typescript
{
  generatedImage: string;      // Base64 data URL (data:image/png;base64,...)
  processingTimeMs: number;    // Generation time in milliseconds
}
```

### Example Success Response
```json
{
  "generatedImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "processingTimeMs": 18234
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 400 Bad Request
```json
{
  "error": "Invalid request",
  "message": "Avatar image is required"
}
```

```json
{
  "error": "Invalid request",
  "message": "At least 1 product image required"
}
```

```json
{
  "error": "Invalid request",
  "message": "Maximum 6 product images allowed"
}
```

```json
{
  "error": "Invalid file type",
  "message": "Only JPEG, PNG, and WebP images are supported"
}
```

```json
{
  "error": "File too large",
  "message": "Image size must be less than 10MB"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Generation failed",
  "message": "Failed to generate look image"
}
```

#### 504 Gateway Timeout
```json
{
  "error": "Timeout",
  "message": "Image generation timed out after 30 seconds"
}
```

## Implementation Details

### Gemini API Integration

#### Model
- **Name**: `gemini-2.5-flash`
- **Capability**: Image generation with multi-image input

#### Prompt Template
```
Create a realistic virtual try-on image showing the person in the avatar wearing these clothing items. Maintain realistic proportions, lighting, and fit. Professional fashion photography style. Ensure the person's face and body type match the avatar exactly.
```

#### Input Processing
1. Convert avatar File to base64
2. Convert each product File to base64
3. Construct Gemini API request with:
   - Avatar as primary image
   - Products as reference images
   - Prompt for try-on generation

#### Output Processing
1. Receive generated image from Gemini (base64 or URL)
2. Convert to base64 data URL if needed
3. Return to client

### Performance Considerations
- **Timeout**: 30 seconds
- **Retry Logic**: None (client can retry)
- **Caching**: None (each generation is unique)
- **Rate Limiting**: Consider implementing per-user limits

### Error Handling
- Validate all inputs before calling Gemini API
- Catch Gemini API errors and return user-friendly messages
- Log errors for debugging (include user_id, timestamp, error details)
- Fallback: Return avatar image if generation fails (optional)

## Testing

### Happy Path Test
```typescript
// 1. Prepare test data
const avatarBlob = await fetch('/test-avatar.jpg').then(r => r.blob());
const productBlobs = await Promise.all([
  fetch('/test-shirt.jpg').then(r => r.blob()),
  fetch('/test-pants.jpg').then(r => r.blob()),
]);

// 2. Make request
const formData = new FormData();
formData.append('avatar', avatarBlob);
productBlobs.forEach(blob => formData.append('products', blob));

const response = await fetch('/api/studio/generate-look', {
  method: 'POST',
  body: formData,
});

// 3. Verify response
expect(response.status).toBe(200);
const data = await response.json();
expect(data.generatedImage).toMatch(/^data:image\/png;base64,/);
expect(data.processingTimeMs).toBeGreaterThan(0);
```

### Error Cases
- Missing avatar → 400
- No products → 400
- Too many products (>6) → 400
- Invalid file type → 400
- File too large → 400
- Unauthenticated request → 401
- Gemini API failure → 500

## Security Considerations
- Validate file types server-side (don't trust client)
- Scan uploaded images for malicious content
- Rate limit per user (e.g., 10 generations per hour)
- Don't expose Gemini API key to client
- Sanitize error messages (don't leak internal details)

## Monitoring & Observability
- Log generation requests (user_id, product_count, timestamp)
- Track processing time (alert if >25s average)
- Monitor success/failure rate (alert if <90% success)
- Track Gemini API errors
- PostHog event: `studio_look_generated` with metadata

## Future Enhancements
- Background processing with webhook callback
- Multiple style options (casual, formal, etc.)
- Pose selection for avatar
- Lighting adjustments
- Batch generation for multiple outfits
