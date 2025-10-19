# Studio Feature - Quickstart Guide

## Overview
This guide will help you set up and run the Studio feature locally for development and testing.

## Prerequisites

### Required
- Node.js 18+ and pnpm
- Supabase CLI installed globally
- Supabase project set up (local or cloud)
- Gemini API key

### Recommended
- VS Code with TypeScript extension
- Supabase Studio running locally
- PostHog account for analytics (optional)

## Setup Steps

### 1. Environment Variables

Create or update `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Studio Configuration (optional)
STUDIO_MAX_PRODUCTS=6
STUDIO_GENERATION_TIMEOUT_MS=30000
```

### 2. Database Migration

Run the storage bucket migration for generated looks:

```bash
# Navigate to project root
cd app-reoutfit

# Create migration file
supabase migration new create_generated_looks_bucket

# Add the following SQL to the migration file:
```

```sql
-- Create generated-looks storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-looks',
  'generated-looks',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for generated-looks bucket
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

```bash
# Apply migration
supabase db push
```

### 3. Install Dependencies

```bash
# From project root
pnpm install
```

### 4. Verify Existing Schema

Ensure the following tables exist (from `20251018_lookbook_schema.sql`):
- `lookbooks`
- `lookbook_wardrobe_items`
- `wardrobe_items`
- `search_results`
- `avatars`

Check with:
```bash
supabase db diff
```

### 5. Start Development Server

```bash
pnpm dev
```

The app should be running at `http://localhost:3000`

## Testing the Feature

### 1. Create Test Data

#### Upload Test Avatar
```bash
# Using Supabase Studio or API
# Navigate to Storage > avatars bucket
# Upload a test avatar image
```

Or via code:
```typescript
// In browser console or test script
const avatarFile = /* get file from input */;
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, avatarFile);
```

#### Create Test Products
```typescript
// Add test products to wardrobe
const { data, error } = await supabase
  .from('wardrobe_items')
  .insert([
    {
      user_id: userId,
      name: 'White T-Shirt',
      brand: 'Nike',
      category: 'shirt',
      image_url: 'https://example.com/shirt.jpg'
    },
    {
      user_id: userId,
      name: 'Blue Jeans',
      brand: 'Levi\'s',
      category: 'pants',
      image_url: 'https://example.com/jeans.jpg'
    }
  ]);
```

### 2. Test User Flow

1. **Open Studio**
   - Navigate to chat interface
   - Click "Studio" button in header
   - Studio artifact should open

2. **Select Products**
   - Perform a visual search (lens-results)
   - Click "Select To Try" on a product
   - Studio badge should show count

3. **Compose Outfit**
   - Open Studio
   - See selected products in "Selected" section
   - Click "Add to Outfit" on products
   - Products move to outfit column (max 6)

4. **Generate Look**
   - Ensure avatar is uploaded
   - Click "Generate" button
   - Wait for generation (15-30s)
   - Generated image displays in center

5. **Save Look**
   - Click "Save" button
   - Provide optional title
   - Success toast appears
   - Check database for new lookbook entry

### 3. Verify Database Entries

```sql
-- Check lookbooks
SELECT * FROM lookbooks WHERE owner_id = 'your-user-id';

-- Check wardrobe items created from search results
SELECT * FROM wardrobe_items WHERE category = 'online';

-- Check lookbook-product links
SELECT * FROM lookbook_wardrobe_items WHERE lookbook_id = 'your-lookbook-id';
```

### 4. Verify Storage

```bash
# Check generated-looks bucket
supabase storage ls generated-looks/{user-id}
```

## Common Issues & Solutions

### Issue: "Gemini API Error"
**Solution:** Verify `GEMINI_API_KEY` is set correctly in `.env.local`

### Issue: "Storage bucket not found"
**Solution:** Run the migration to create `generated-looks` bucket

### Issue: "Avatar not found"
**Solution:** Upload a test avatar to the `avatars` bucket

### Issue: "Products not showing in Studio"
**Solution:** Ensure `StudioProvider` is wrapped around the app in `layout.tsx`

### Issue: "LocalStorage not persisting"
**Solution:** Check browser console for localStorage errors (quota exceeded, private mode)

### Issue: "Generation timeout"
**Solution:** 
- Check Gemini API status
- Verify image URLs are accessible
- Increase timeout in `.env.local`

## Development Workflow

### 1. Component Development
```bash
# Create new component
touch components/artifact/studio/my-component.tsx

# Import in studio.tsx
import { MyComponent } from './my-component';
```

### 2. Type Definitions
```bash
# Add types to types/studio.ts
export interface MyType {
  // ...
}
```

### 3. API Routes
```bash
# Create new API route
touch app/api/studio/my-endpoint/route.ts

# Test with curl
curl -X POST http://localhost:3000/api/studio/my-endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 4. Testing
```bash
# Run unit tests
pnpm test

# Run specific test file
pnpm test studio-provider.test.ts

# Run with coverage
pnpm test --coverage
```

### 5. Linting & Formatting
```bash
# Lint
pnpm lint

# Format
pnpm format
```

## Debugging Tips

### Enable Debug Logging
```typescript
// In studio.tsx or provider
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Studio state:', state);
}
```

### Inspect LocalStorage
```javascript
// In browser console
JSON.parse(localStorage.getItem('studio-state'));
```

### Monitor API Calls
```typescript
// In API route
console.log('Request:', {
  method: request.method,
  body: await request.json(),
  headers: Object.fromEntries(request.headers)
});
```

### Check Supabase Logs
```bash
# View realtime logs
supabase logs --follow

# Filter by function
supabase logs --filter "function=generate-look"
```

## Performance Optimization

### Image Loading
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src={product.image}
  alt={product.title}
  width={300}
  height={300}
  loading="lazy"
/>
```

### Virtualization (for large lists)
```bash
pnpm add react-window
```

```typescript
import { FixedSizeGrid } from 'react-window';

<FixedSizeGrid
  columnCount={3}
  rowCount={Math.ceil(products.length / 3)}
  columnWidth={200}
  rowHeight={250}
  height={600}
  width={650}
>
  {ProductCell}
</FixedSizeGrid>
```

### Debounce State Updates
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSave = useDebouncedCallback(
  (state) => {
    localStorage.setItem('studio-state', JSON.stringify(state));
  },
  500
);
```

## Deployment Checklist

- [ ] Environment variables set in production
- [ ] Database migrations applied
- [ ] Storage buckets created with RLS policies
- [ ] Gemini API key configured
- [ ] PostHog events tested
- [ ] Error tracking enabled (Sentry/similar)
- [ ] Performance monitoring enabled
- [ ] Feature flag configured (if using)
- [ ] Documentation updated
- [ ] Team notified of deployment

## Resources

### Documentation
- [Spec Document](./spec.md)
- [Implementation Plan](./plan.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/)

### External Links
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Context API](https://react.dev/reference/react/useContext)

### Support
- GitHub Issues: [Link to repo issues]
- Slack Channel: #studio-feature
- Team Lead: [Name]

## Next Steps

After completing the quickstart:
1. Review the [Implementation Plan](./plan.md)
2. Read through [API Contracts](./contracts/)
3. Familiarize yourself with [Data Model](./data-model.md)
4. Start with Phase 0 implementation (types and state management)
5. Join the team standup for questions

Happy coding! 🚀
