# Wardrobe Management - Data Model

## Database Schema

### Table: `clothing_items`

Primary table for storing user clothing items with rich metadata.

```sql
CREATE TABLE clothing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  image_url TEXT NOT NULL,
  colors TEXT[],
  fabrics TEXT[],
  seasons TEXT[],
  tags TEXT[],
  price NUMERIC(10, 2),
  dress_codes TEXT[],
  gender TEXT,
  size TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_clothing_items_user_id ON clothing_items(user_id);
CREATE INDEX idx_clothing_items_category ON clothing_items(category);
CREATE INDEX idx_clothing_items_created_at ON clothing_items(created_at DESC);

-- Trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clothing_items_updated_at
  BEFORE UPDATE ON clothing_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own items
CREATE POLICY "Users can view own clothing items"
  ON clothing_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert items with their own user_id
CREATE POLICY "Users can insert own clothing items"
  ON clothing_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own items
CREATE POLICY "Users can update own clothing items"
  ON clothing_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own items
CREATE POLICY "Users can delete own clothing items"
  ON clothing_items
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Storage Bucket

### Bucket: `clothing-images`

Configuration:
- **Privacy**: Private (authenticated users only)
- **Max File Size**: 10MB
- **Allowed MIME Types**: image/jpeg, image/png, image/webp
- **File Path Structure**: `{user_id}/{uuid}.{extension}`

### Storage RLS Policies

```sql
-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload own images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'clothing-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can view their own images
CREATE POLICY "Users can view own images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'clothing-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'clothing-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## TypeScript Types

### Core Types

```typescript
// lib/db/types.ts

export interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  brand?: string;
  image_url: string;
  colors?: string[];
  fabrics?: string[];
  seasons?: string[];
  tags?: string[];
  price?: number;
  dress_codes?: string[];
  gender?: string;
  size?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ClothingItemInsert = Omit<ClothingItem, 'id' | 'created_at' | 'updated_at'>;
export type ClothingItemUpdate = Partial<Omit<ClothingItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
```

### Validation Schema (Zod)

```typescript
// lib/db/validation.ts

import { z } from 'zod';

export const ClothingCategorySchema = z.enum([
  'shirt',
  'pants',
  'shorts',
  'dress',
  'skirt',
  'jacket',
  'coat',
  'sweater',
  'hoodie',
  'shoes',
  'boots',
  'sneakers',
  'accessories',
  'other'
]);

export const SeasonSchema = z.enum(['spring', 'summer', 'fall', 'winter', 'all-season']);
export const DressCodeSchema = z.enum(['casual', 'business-casual', 'business', 'formal', 'athletic']);
export const GenderSchema = z.enum(['men', 'women', 'unisex']);

export const ClothingItemCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  category: ClothingCategorySchema,
  brand: z.string().max(50).optional(),
  colors: z.array(z.string()).optional(),
  fabrics: z.array(z.string()).optional(),
  seasons: z.array(SeasonSchema).optional(),
  tags: z.array(z.string()).optional(),
  price: z.number().positive().optional(),
  dress_codes: z.array(DressCodeSchema).optional(),
  gender: GenderSchema.optional(),
  size: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  prettifyWithAI: z.boolean().optional()
});

export const ClothingItemUpdateSchema = ClothingItemCreateSchema.partial();

export const ImageFileSchema = z.object({
  type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB')
});
```

## API Response Types

```typescript
// API response types

export interface WardrobeListResponse {
  items: ClothingItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface WardrobeItemResponse {
  item: ClothingItem;
}

export interface WardrobeDeleteResponse {
  success: boolean;
  id: string;
}

export interface WardrobeErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}
```

## Data Relationships

```
auth.users (Supabase Auth)
    |
    | 1:N
    |
clothing_items
    |
    | References
    |
storage.objects (clothing-images bucket)
    - {user_id}/{uuid}.{ext} (original)
    - {user_id}/{uuid}_enhanced.{ext} (AI-enhanced, optional)
```

## Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key, auto-generated |
| `user_id` | UUID | Yes | Foreign key to auth.users, owner of item |
| `name` | TEXT | Yes | User-provided name for the item |
| `category` | TEXT | Yes | Clothing category (shirt, pants, etc.) |
| `brand` | TEXT | No | Brand name |
| `image_url` | TEXT | Yes | URL to stored image in Storage (original or AI-prettified based on user choice) |
| `colors` | TEXT[] | No | Array of color tags (e.g., ["blue", "white"]) |
| `fabrics` | TEXT[] | No | Array of fabric types (e.g., ["cotton", "polyester"]) |
| `seasons` | TEXT[] | No | Suitable seasons (e.g., ["spring", "fall"]) |
| `tags` | TEXT[] | No | Custom user tags for organization |
| `price` | NUMERIC | No | Purchase price (for reference) |
| `dress_codes` | TEXT[] | No | Appropriate dress codes (e.g., ["casual", "business"]) |
| `gender` | TEXT | No | Gender category (men, women, unisex) |
| `size` | TEXT | No | Size label (S, M, L, 32, etc.) |
| `notes` | TEXT | No | Free-form notes about the item |
| `created_at` | TIMESTAMPTZ | Yes | Timestamp when item was created |
| `updated_at` | TIMESTAMPTZ | Yes | Timestamp when item was last updated |

## Future Enhancements

### Phase 2: AI Metadata
- Add `ai_extracted_metadata` JSONB field for storing raw AI analysis
- Add `ai_confidence_scores` JSONB for metadata confidence levels
- Add `ai_processed_at` timestamp

### Phase 3: Advanced Features
- Add `outfit_ids` UUID[] for linking items to outfits
- Add `wear_count` INTEGER for tracking usage
- Add `last_worn_at` TIMESTAMPTZ
- Add `purchase_date` DATE
- Add `purchase_url` TEXT for online purchases
- Add `condition` TEXT (new, good, fair, worn)
- Add `location` TEXT (closet, storage, laundry, etc.)

### Phase 4: Social Features
- Add `is_public` BOOLEAN for sharing
- Add `share_token` UUID for public links
- Create `wardrobe_shares` table for collaborative wardrobes
