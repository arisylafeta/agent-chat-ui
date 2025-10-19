# Studio Feature - Data Model

## Overview

The Studio feature leverages existing database schema from the `20251018_lookbook_schema.sql` migration. No new tables are required for MVP.

## Database Tables

### Existing Tables Used

#### `lookbooks`
Primary table for storing generated looks.

```sql
CREATE TABLE lookbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,  -- Used for generated look image
  visibility lookbook_visibility NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Studio Usage:**
- `cover_image_url` stores the AI-generated look image URL (from Supabase Storage)
- `title` defaults to "Look - {timestamp}" or user-provided name
- `visibility` defaults to 'private' for MVP
- `description` optional, can store generation metadata (model, timestamp, etc.)

#### `lookbook_wardrobe_items`
Junction table linking lookbooks to wardrobe items.

```sql
CREATE TABLE lookbook_wardrobe_items (
  lookbook_id UUID NOT NULL REFERENCES lookbooks(id) ON DELETE CASCADE,
  wardrobe_item_id UUID NOT NULL REFERENCES wardrobe_items(id) ON DELETE CASCADE,
  slot lookbook_layer NOT NULL,
  role lookbook_position NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (lookbook_id, wardrobe_item_id)
);
```

**Studio Usage:**
- Links saved lookbooks to products in user's wardrobe
- `slot` and `role` validation deferred to Phase 2 (MVP allows any 6 items)
- For MVP, use default values: `slot='base'`, `role='other'`

#### `wardrobe_items`
Stores user's wardrobe including items from search results.

```sql
CREATE TABLE wardrobe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  source source_enum DEFAULT 'user_upload',
  source_ref_id UUID,
  search_result_id UUID,
  metadata JSONB,  -- Stores original product snapshot
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Studio Usage:**
- When user saves a lookbook with products from lens/shopping results:
  1. Create `wardrobe_items` entry with `category='online'`
  2. Store original product data in `metadata` JSONB field
  3. Link to `search_result_id` if available
  4. Then link via `lookbook_wardrobe_items`

#### `search_results`
Stores search results from lens/shopping artifacts.

```sql
CREATE TABLE search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source search_source NOT NULL,  -- 'visual' | 'shopping' | 'affiliate' | 'ai_generated'
  image_url TEXT NOT NULL,
  product_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Studio Usage:**
- Products from lens-results/shopping-results are already saved here
- Reference via `search_result_id` when creating wardrobe items

#### `avatars`
Stores user avatar for try-on generation.

```sql
CREATE TABLE avatars (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  body_shape TEXT,
  measurements JSONB,
  preferences JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Studio Usage:**
- Fetch user's avatar for generation API
- Placeholder avatar if none exists

## Storage Buckets

### `avatars`
- **Purpose**: Store user avatar images
- **Access**: Public read, user-specific write
- **File Types**: JPEG, PNG, WebP
- **Max Size**: 10MB
- **Path Structure**: `{user_id}/avatar.{ext}`

### `generated-looks` (New - To Be Created)
- **Purpose**: Store AI-generated look images
- **Access**: Public read, user-specific write
- **File Types**: JPEG, PNG, WebP
- **Max Size**: 10MB
- **Path Structure**: `{user_id}/{lookbook_id}.{ext}`

**Migration Required:**
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-looks',
  'generated-looks',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
CREATE POLICY "Users can insert their own generated looks"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'generated-looks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own generated looks"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'generated-looks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own generated looks"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'generated-looks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own generated looks"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'generated-looks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Type Definitions

### `types/studio.ts`

```typescript
// Unified product type for Studio (normalized from all sources)
export interface StudioProduct {
  id: string;
  title: string;
  brand: string;
  image: string;  // High-quality image URL (use image_full if available)
  sourceData: Record<string, any>;  // Original product JSONB
}

// Studio state management
export interface StudioState {
  selectedProducts: StudioProduct[];  // Items in "Selected" section
  currentOutfit: StudioProduct[];     // Items in outfit column (max 6)
  generatedLook: {
    imageUrl: string;      // Base64 data URL or Supabase Storage URL
    lookbookId?: string;   // Set after save
  } | null;
  isGenerating: boolean;
  activeDrawer: 'wardrobe' | 'shopping' | 'looks' | null;
}

// API request/response types
export interface GenerateLookRequest {
  avatarUrl: string;
  productImages: string[];  // Array of high-quality image URLs
}

export interface GenerateLookResponse {
  generatedImage: string;  // Base64 data URL
  processingTimeMs: number;
}

export interface SaveLookRequest {
  title?: string;
  products: StudioProduct[];
  generatedImageBase64: string;
}

export interface SaveLookResponse {
  lookbookId: string;
  imageUrl: string;  // Supabase Storage URL
  createdAt: string;
}
```

### Type Mapping

#### From `Product` (lens-results/shopping-results) to `StudioProduct`:
```typescript
function toStudioProduct(product: Product): StudioProduct {
  return {
    id: product.id,
    title: product.name,
    brand: product.brand,
    image: product.image_full || product.image,  // Prefer high-quality
    sourceData: product,  // Store entire original object
  };
}
```

#### From `WardrobeItem` to `StudioProduct`:
```typescript
function wardrobeToStudioProduct(item: WardrobeItem): StudioProduct {
  return {
    id: item.id,
    title: item.name,
    brand: item.brand || 'Unknown',
    image: item.image_url || '',
    sourceData: item,
  };
}
```

## Data Flow

### Product Selection Flow
1. User clicks "Select To Try" in lens-results
2. `Product` converted to `StudioProduct` via `toStudioProduct()`
3. Added to `StudioState.selectedProducts` (React Context + localStorage)
4. User clicks "Add to Outfit" → moves to `currentOutfit` array (max 6)

### Generation Flow
1. User clicks "Generate"
2. Fetch avatar from `avatars` table
3. Extract `image` URLs from `currentOutfit`
4. Call Gemini API with avatar + product images
5. Receive base64 generated image
6. Store in `StudioState.generatedLook.imageUrl` (in-memory)

### Save Flow
1. User clicks "Save"
2. Convert base64 to blob
3. Upload to Supabase Storage `generated-looks/{user_id}/{uuid}.png`
4. Get public URL
5. Create `lookbooks` entry:
   - `title`: User-provided or "Look - {timestamp}"
   - `cover_image_url`: Supabase Storage URL
   - `visibility`: 'private'
6. For each product in `currentOutfit`:
   - If `sourceData` contains search result data:
     - Create `wardrobe_items` entry:
       - `name`: product.title
       - `brand`: product.brand
       - `category`: 'online'
       - `image_url`: product.image
       - `metadata`: product.sourceData (JSONB)
       - `source`: 'search_result'
   - Create `lookbook_wardrobe_items` link:
     - `lookbook_id`: new lookbook ID
     - `wardrobe_item_id`: wardrobe item ID
     - `slot`: 'base' (default for MVP)
     - `role`: 'other' (default for MVP)
7. Return `lookbookId` and `imageUrl`

## Constraints & Validation

### MVP Constraints
- **Max outfit size**: 6 products
- **Slot/role validation**: Deferred to Phase 2
- **Visibility**: All lookbooks private by default
- **Image format**: JPEG/PNG/WebP only
- **Max image size**: 10MB per image

### Future Enhancements (Phase 2+)
- Slot/role validation (no duplicate positions)
- Public/shared lookbooks
- Lookbook collections
- Product recommendations based on outfit composition
- Outfit analytics (most used items, color palettes)

## Migration Checklist

- [x] `lookbooks` table exists
- [x] `lookbook_wardrobe_items` junction table exists
- [x] `wardrobe_items` table exists with `metadata` JSONB
- [x] `search_results` table exists
- [x] `avatars` table exists
- [x] `avatars` storage bucket exists
- [ ] `generated-looks` storage bucket (needs creation)
- [ ] RLS policies for `generated-looks` bucket

## Notes

- **No new tables required** - Existing schema is sufficient
- **JSONB flexibility** - `metadata` field allows storing arbitrary product data
- **Phase 2 considerations** - Slot/role mapping will require product categorization logic
