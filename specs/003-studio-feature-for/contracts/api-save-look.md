# API Contract: Save Look

## Endpoint
```
POST /api/studio/save-look
```

## Purpose
Persist a generated look to the database by:
1. Uploading the generated image to Supabase Storage
2. Creating a lookbook entry
3. Creating wardrobe items for products from search results
4. Linking products to the lookbook via junction table

## Authentication
- **Required**: Yes
- **Method**: Supabase session cookie
- **Validation**: `auth.uid()` must be present

## Request

### Headers
```
Content-Type: application/json
Cookie: sb-access-token=...
```

### Body
```typescript
{
  title?: string;                    // Optional lookbook title
  products: StudioProduct[];         // Array of products in the outfit
  generatedImageBase64: string;      // Base64 data URL of generated image
}
```

### Field Specifications

#### `title` (optional)
- **Type**: string
- **Default**: `"Look - {timestamp}"`
- **Max Length**: 255 characters
- **Validation**: Trimmed, non-empty if provided

#### `products`
- **Type**: StudioProduct[]
- **Required**: Yes
- **Min Items**: 1
- **Max Items**: 6
- **Structure**:
  ```typescript
  {
    id: string;
    title: string;
    brand: string;
    image: string;
    sourceData: Record<string, any>;  // Original product JSONB
  }
  ```

#### `generatedImageBase64`
- **Type**: string
- **Required**: Yes
- **Format**: `data:image/{type};base64,{data}`
- **Validation**: Must be valid base64 data URL

### Example Request
```typescript
const response = await fetch('/api/studio/save-look', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: 'Summer Casual Look',
    products: [
      {
        id: 'prod-123',
        title: 'White Cotton T-Shirt',
        brand: 'Nike',
        image: 'https://...',
        sourceData: { /* original product data */ }
      },
      {
        id: 'prod-456',
        title: 'Blue Denim Jeans',
        brand: 'Levi\'s',
        image: 'https://...',
        sourceData: { /* original product data */ }
      }
    ],
    generatedImageBase64: 'data:image/png;base64,iVBORw0KGgo...'
  })
});
```

## Response

### Success Response (200 OK)
```typescript
{
  lookbookId: string;      // UUID of created lookbook
  imageUrl: string;        // Public Supabase Storage URL
  createdAt: string;       // ISO 8601 timestamp
}
```

### Example Success Response
```json
{
  "lookbookId": "550e8400-e29b-41d4-a716-446655440000",
  "imageUrl": "https://your-project.supabase.co/storage/v1/object/public/generated-looks/user-id/lookbook-id.png",
  "createdAt": "2025-10-19T14:30:00.000Z"
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
  "message": "Products array is required"
}
```

```json
{
  "error": "Invalid request",
  "message": "At least 1 product required"
}
```

```json
{
  "error": "Invalid request",
  "message": "Maximum 6 products allowed"
}
```

```json
{
  "error": "Invalid image",
  "message": "Generated image must be a valid base64 data URL"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Save failed",
  "message": "Failed to save look to database"
}
```

```json
{
  "error": "Upload failed",
  "message": "Failed to upload image to storage"
}
```

## Implementation Details

### Processing Flow

#### 1. Validate Request
```typescript
// Validate authentication
const user = await getUser(request);
if (!user) return 401;

// Validate products
if (!products || products.length === 0) return 400;
if (products.length > 6) return 400;

// Validate image
if (!generatedImageBase64.startsWith('data:image/')) return 400;
```

#### 2. Upload Image to Storage
```typescript
// Convert base64 to blob
const base64Data = generatedImageBase64.split(',')[1];
const buffer = Buffer.from(base64Data, 'base64');
const blob = new Blob([buffer], { type: 'image/png' });

// Generate unique filename
const lookbookId = crypto.randomUUID();
const filename = `${user.id}/${lookbookId}.png`;

// Upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('generated-looks')
  .upload(filename, blob, {
    contentType: 'image/png',
    upsert: false
  });

if (error) throw new Error('Upload failed');

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('generated-looks')
  .getPublicUrl(filename);
```

#### 3. Create Lookbook Entry
```typescript
const { data: lookbook, error } = await supabase
  .from('lookbooks')
  .insert({
    id: lookbookId,
    owner_id: user.id,
    title: title || `Look - ${new Date().toISOString()}`,
    cover_image_url: publicUrl,
    visibility: 'private'
  })
  .select()
  .single();

if (error) throw new Error('Failed to create lookbook');
```

#### 4. Process Products
```typescript
for (const product of products) {
  // Check if product is from search results (has sourceData)
  if (product.sourceData) {
    // Create wardrobe item
    const { data: wardrobeItem, error } = await supabase
      .from('wardrobe_items')
      .insert({
        user_id: user.id,
        name: product.title,
        brand: product.brand,
        category: 'online',
        image_url: product.image,
        source: 'search_result',
        metadata: product.sourceData
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create wardrobe item:', error);
      continue; // Skip this product but continue with others
    }

    // Link to lookbook
    await supabase
      .from('lookbook_wardrobe_items')
      .insert({
        lookbook_id: lookbookId,
        wardrobe_item_id: wardrobeItem.id,
        slot: 'base',  // Default for MVP
        role: 'other'  // Default for MVP
      });
  } else {
    // Product is already in wardrobe, just link it
    await supabase
      .from('lookbook_wardrobe_items')
      .insert({
        lookbook_id: lookbookId,
        wardrobe_item_id: product.id,
        slot: 'base',
        role: 'other'
      });
  }
}
```

#### 5. Return Response
```typescript
return {
  lookbookId: lookbook.id,
  imageUrl: publicUrl,
  createdAt: lookbook.created_at
};
```

### Transaction Handling
- Use Supabase transactions if available
- If image upload fails, don't create lookbook
- If lookbook creation fails, delete uploaded image
- If product linking fails, log error but don't rollback (partial success acceptable)

### Error Handling
- Wrap each step in try-catch
- Log errors with context (user_id, step, error details)
- Return user-friendly error messages
- Clean up resources on failure (delete uploaded image)

## Testing

### Happy Path Test
```typescript
const response = await fetch('/api/studio/save-look', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Look',
    products: [
      {
        id: 'test-1',
        title: 'Test Product',
        brand: 'Test Brand',
        image: 'https://example.com/image.jpg',
        sourceData: { price: 50, currency: 'USD' }
      }
    ],
    generatedImageBase64: 'data:image/png;base64,iVBORw0KGgo...'
  })
});

expect(response.status).toBe(200);
const data = await response.json();
expect(data.lookbookId).toBeDefined();
expect(data.imageUrl).toMatch(/^https:\/\//);
expect(data.createdAt).toBeDefined();

// Verify database entries
const lookbook = await supabase
  .from('lookbooks')
  .select('*')
  .eq('id', data.lookbookId)
  .single();
expect(lookbook.data).toBeDefined();

const wardrobeItems = await supabase
  .from('lookbook_wardrobe_items')
  .select('*')
  .eq('lookbook_id', data.lookbookId);
expect(wardrobeItems.data.length).toBe(1);
```

### Error Cases
- Missing products → 400
- Empty products array → 400
- Too many products → 400
- Invalid base64 image → 400
- Unauthenticated request → 401
- Storage upload failure → 500
- Database insert failure → 500

## Security Considerations
- Validate user owns all wardrobe items being linked
- Sanitize product titles and brands (XSS prevention)
- Limit lookbook creation rate (e.g., 20 per day per user)
- Validate image size before upload (max 10MB)
- Don't expose internal error details to client

## Monitoring & Observability
- Log save requests (user_id, product_count, timestamp)
- Track success/failure rate (alert if <95% success)
- Monitor storage usage per user
- Track time to save (alert if >5s average)
- PostHog event: `studio_look_saved` with metadata:
  ```typescript
  {
    lookbook_id: string,
    product_count: number,
    has_custom_title: boolean,
    processing_time_ms: number
  }
  ```

## Future Enhancements
- Batch save multiple looks
- Update existing lookbook
- Add tags/categories to lookbooks
- Share lookbook with specific users
- Export lookbook as PDF/image collection
- Duplicate lookbook for remixing
