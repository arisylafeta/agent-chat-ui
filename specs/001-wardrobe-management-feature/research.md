# Wardrobe Management - Research & Technical Context

## Technology Stack Analysis

### Current Stack (from codebase inspection)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Package Manager**: pnpm
- **State Management**: React hooks, likely SWR or React Query for data fetching

### Relevant Existing Patterns

#### 1. Sidebar Navigation Pattern
**Location**: `components/sidebar/app-sidebar.tsx`

**Findings**:
- Already includes Wardrobe link with Archive icon
- Uses Lucide icons
- Responsive design with Sheet component for mobile
- Consistent styling with other navigation items

**Implication**: Navigation integration is already done. We just need to create the `/wardrobe` page.

#### 2. Image Upload Pattern
**Location**: `lib/upload-image.ts`

**Findings**:
- Existing utility for image uploads
- Should review and potentially reuse for clothing item uploads
- May need modifications for Supabase Storage integration

**Action**: Review this file to understand current upload patterns and adapt for wardrobe feature.

#### 3. Database Utilities
**Location**: `lib/db/`

**Findings**:
- `search.ts` - Search functionality (3219 bytes)
- `user.ts` - Empty file (placeholder)

**Implication**: Database utilities are minimal. We'll need to create new utilities for clothing items CRUD operations.

#### 4. API Route Pattern
**Location**: `app/api/`

**Findings**:
- Existing API routes for threads, monitoring, sentry
- Follow Next.js 15 App Router conventions
- Use route handlers (route.ts files)

**Implication**: Follow same pattern for wardrobe API routes.

## Image Upload & Storage Research

### Supabase Storage Best Practices

#### File Organization
```
clothing-images/
  {user_id}/
    {uuid}.jpg          # Original
    {uuid}_enhanced.jpg # AI-enhanced (future)
    {uuid}_thumb.jpg    # Thumbnail (optional optimization)
```

#### Upload Strategy
1. **Client-side compression**: Use browser APIs to compress before upload
2. **Progressive upload**: Show progress for better UX
3. **Signed URLs**: Generate signed URLs for private image access
4. **CDN**: Supabase Storage uses CDN automatically

#### Code Example
```typescript
// Upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('clothing-images')
  .upload(`${userId}/${uuid}.${extension}`, file, {
    cacheControl: '3600',
    upsert: false
  });

// Get public URL (for private buckets, use signed URL)
const { data: signedUrl } = await supabase.storage
  .from('clothing-images')
  .createSignedUrl(`${userId}/${uuid}.${extension}`, 3600); // 1 hour
```

### Image Optimization Strategies

#### Client-side Compression
```typescript
// Using browser Canvas API
async function compressImage(file: File, maxWidth: number, quality: number): Promise<Blob> {
  const img = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  const scale = Math.min(maxWidth / img.width, 1);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality);
  });
}
```

#### Thumbnail Generation
- Option 1: Generate on upload (server-side with Sharp)
- Option 2: Use Supabase Image Transformation (if available)
- Option 3: Generate on-demand with Next.js Image Optimization

**Recommendation**: Start with Next.js Image component for automatic optimization, add server-side thumbnail generation later if needed.

## Form Handling Research

### Options Considered

#### 1. React Hook Form + Zod
**Pros**:
- Type-safe validation
- Great performance (uncontrolled inputs)
- Easy integration with Zod schemas
- Popular in Next.js ecosystem

**Cons**:
- Additional dependency
- Learning curve for team

#### 2. Native React State + Zod
**Pros**:
- No additional dependencies
- Full control
- Simple for small forms

**Cons**:
- More boilerplate
- Manual validation handling

#### 3. Server Actions (Next.js 15)
**Pros**:
- Progressive enhancement
- Built-in validation
- Type-safe

**Cons**:
- Requires server-side rendering
- May not fit with client-side image preview needs

**Recommendation**: Use React Hook Form + Zod for type-safe, performant form handling with good DX.

## Data Fetching Strategy

### Options

#### 1. SWR (Vercel)
```typescript
import useSWR from 'swr';

function useWardrobe() {
  const { data, error, mutate } = useSWR('/api/wardrobe', fetcher);
  return {
    items: data?.items || [],
    isLoading: !error && !data,
    isError: error,
    mutate
  };
}
```

**Pros**:
- Automatic revalidation
- Cache management
- Optimistic updates
- Small bundle size

#### 2. TanStack Query (React Query)
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

function useWardrobe() {
  return useQuery({
    queryKey: ['wardrobe'],
    queryFn: fetchWardrobe
  });
}
```

**Pros**:
- Powerful caching
- DevTools
- More features (pagination, infinite scroll)

**Cons**:
- Larger bundle size
- More complex

**Recommendation**: Use SWR for simplicity and Vercel ecosystem alignment. Upgrade to React Query later if advanced features needed.

## Accessibility Research

### WCAG 2.1 AA Requirements

#### Color Contrast
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

**Action**: Test accent colors from styling.md against backgrounds.

#### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Focus indicators must be visible
- Tab order must be logical
- Modal focus trap required

**Implementation**:
```typescript
// Focus trap in modal
import { FocusTrap } from '@radix-ui/react-focus-trap';

<Dialog>
  <FocusTrap>
    {/* Modal content */}
  </FocusTrap>
</Dialog>
```

#### Screen Reader Support
- Use semantic HTML
- ARIA labels for icon buttons
- ARIA live regions for dynamic content
- Alt text for images

**Implementation**:
```typescript
<button aria-label="Add clothing item">
  <PlusIcon />
</button>

<div role="status" aria-live="polite">
  {uploadProgress}% uploaded
</div>
```

## Performance Considerations

### Image Loading Optimization

#### 1. Lazy Loading
```typescript
<Image
  src={item.image_url}
  alt={item.name}
  loading="lazy"
  width={150}
  height={150}
/>
```

#### 2. Blur Placeholder
```typescript
<Image
  src={item.image_url}
  alt={item.name}
  placeholder="blur"
  blurDataURL={item.blur_data_url}
/>
```

#### 3. Responsive Images
```typescript
<Image
  src={item.image_url}
  alt={item.name}
  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
/>
```

### Database Query Optimization

#### Pagination Strategy
```sql
-- Cursor-based pagination (recommended for large datasets)
SELECT * FROM clothing_items
WHERE user_id = $1 AND created_at < $2
ORDER BY created_at DESC
LIMIT 20;

-- Offset-based pagination (simpler, but slower for large offsets)
SELECT * FROM clothing_items
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 20 OFFSET 40;
```

**Recommendation**: Start with offset-based for simplicity, migrate to cursor-based if performance issues arise.

#### Index Usage
- Index on `(user_id, created_at DESC)` for efficient pagination
- Index on `(user_id, category)` for category filtering
- Consider partial index for specific queries

### Bundle Size Optimization

#### Code Splitting
```typescript
// Lazy load heavy components
const ItemDetailView = dynamic(() => import('./item-detail-view'), {
  loading: () => <Skeleton />
});
```

#### Tree Shaking
- Import only needed Lucide icons
- Use modular imports for libraries

## Security Research

### Input Validation

#### File Upload Security
1. **MIME type validation**: Check both client and server
2. **File size limits**: 10MB max
3. **File extension validation**: Whitelist only jpg, png, webp
4. **Magic number validation**: Verify file headers match MIME type
5. **Virus scanning**: Consider for production (optional)

#### XSS Prevention
```typescript
// Sanitize user input
import DOMPurify from 'isomorphic-dompurify';

const sanitizedNotes = DOMPurify.sanitize(userInput);
```

**Note**: React escapes by default, but be careful with `dangerouslySetInnerHTML`.

#### SQL Injection Prevention
- Use parameterized queries (Supabase client handles this)
- Never concatenate user input into SQL
- RLS policies provide additional protection

### Authentication & Authorization

#### JWT Token Handling
```typescript
// Get user from Supabase session
const { data: { user } } = await supabase.auth.getUser();

// Validate in API route
export async function GET(request: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // RLS will automatically filter to user's items
  const { data } = await supabase
    .from('clothing_items')
    .select('*');
    
  return Response.json({ items: data });
}
```

## AI Integration Research (Future Phase)

### Image Enhancement Options

#### 1. Remove.bg API
- Background removal
- $0.20 per image
- Good quality
- Simple API

#### 2. Cloudinary AI
- Background removal
- Image enhancement
- Generative fill
- Pay-as-you-go pricing

#### 3. Replicate (Stable Diffusion)
- Custom models
- Background removal
- Image-to-image transformation
- $0.0002 per second

#### 4. OpenAI DALL-E (Image Edit)
- Inpainting
- Background replacement
- Higher cost
- Good quality

**Recommendation**: Start with Remove.bg for simplicity, evaluate others based on quality/cost needs.

### Metadata Extraction Options

#### 1. OpenAI GPT-4 Vision
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4-vision-preview",
  messages: [{
    role: "user",
    content: [
      { type: "text", text: "Analyze this clothing item and extract: colors, fabric type, category, season suitability, dress code." },
      { type: "image_url", image_url: { url: imageUrl } }
    ]
  }]
});
```

**Pros**: Accurate, flexible, understands context
**Cons**: Higher cost (~$0.01 per image)

#### 2. Google Cloud Vision API
- Label detection
- Color detection
- Object detection
- Lower cost

**Pros**: Fast, cheaper, good for basic metadata
**Cons**: Less contextual understanding

#### 3. Custom ML Model
- Train on clothing dataset
- Host on Replicate or HuggingFace
- Full control

**Pros**: Lowest long-term cost, customizable
**Cons**: Requires ML expertise, training data

**Recommendation**: Start with GPT-4 Vision for MVP, optimize costs later with specialized models.

## Testing Strategy

### Unit Tests
- Component rendering
- Form validation
- Utility functions
- API route handlers

### Integration Tests
- API endpoint flows
- Database operations
- File upload process
- Authentication flows

### E2E Tests (Playwright)
```typescript
test('user can add clothing item', async ({ page }) => {
  await page.goto('/wardrobe');
  await page.click('button:has-text("Add Item")');
  await page.fill('input[name="name"]', 'Blue Jacket');
  await page.selectOption('select[name="category"]', 'jacket');
  await page.setInputFiles('input[type="file"]', 'test-image.jpg');
  await page.click('button:has-text("Add Item")');
  await expect(page.locator('text=Blue Jacket')).toBeVisible();
});
```

### Manual Testing Checklist
See quickstart.md for comprehensive checklist.

## Monitoring & Observability

### Metrics to Track
1. **Upload Success Rate**: % of successful uploads
2. **API Response Times**: P50, P95, P99
3. **Error Rates**: By endpoint and error type
4. **Storage Usage**: Total and per-user
5. **User Engagement**: Items added per user, time on page

### Tools
- Vercel Analytics (built-in)
- Sentry (error tracking)
- Supabase Dashboard (database metrics)
- Custom logging for business metrics

## Conclusion

This research provides the technical foundation for implementing the wardrobe management feature. Key decisions:

1. **Use SWR** for data fetching
2. **Use React Hook Form + Zod** for forms
3. **Follow existing patterns** from codebase
4. **Prioritize accessibility** from the start
5. **Optimize images** with Next.js Image component
6. **Defer AI features** to Phase 2 with clear placeholders

Next step: Generate tasks.md with actionable implementation tasks.
