# Wardrobe Management - Quick Start Guide

## Overview

This guide will help you get started with implementing the Wardrobe Management feature. Follow these steps in order for a smooth development experience.

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Supabase project set up
- Access to Supabase dashboard
- Local development environment running

## Setup Steps

### 1. Database Setup

#### Create the Migration

```bash
cd /Users/admin/Desktop/AI/Reoutfit
npx supabase migration new create_clothing_items_table
```

Copy the SQL from `data-model.md` into the new migration file in `supabase/migrations/`.

#### Apply the Migration

```bash
# For local development
npx supabase db reset

# For production (after testing)
npx supabase db push
```

### 2. Storage Bucket Setup

#### Via Supabase Dashboard

1. Go to Storage in Supabase Dashboard
2. Click "Create bucket"
3. Name: `clothing-images`
4. Set to **Private**
5. Configure file size limit: 10MB
6. Save

#### Add Storage Policies

Run this SQL in the SQL Editor:

```sql
-- Copy the storage RLS policies from data-model.md
```

Or create via Dashboard:
1. Go to Storage > clothing-images > Policies
2. Add the three policies (INSERT, SELECT, DELETE)

### 3. Install Dependencies

```bash
cd app-reoutfit

# Install any new dependencies if needed
pnpm add zod react-dropzone
pnpm add -D @types/react-dropzone

# Ensure shadcn components are installed
npx shadcn@latest add dialog button input select card badge switch
```

### 4. Environment Variables

Verify these exist in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5. Create Type Definitions

Create `lib/db/types.ts`:

```typescript
// Copy the TypeScript types from data-model.md
```

Create `lib/db/validation.ts`:

```typescript
// Copy the Zod schemas from data-model.md
```

### 6. Development Workflow

#### Phase 0: Start with Database
1. ✅ Create and apply migration
2. ✅ Set up storage bucket
3. ✅ Test RLS policies with multiple users
4. ✅ Create type definitions

#### Phase 1: Build API Layer
1. Create `app/api/wardrobe/route.ts` (GET, POST)
2. Create `app/api/wardrobe/[id]/route.ts` (GET, PATCH, DELETE)
3. Test endpoints with curl or Postman
4. Verify authentication and RLS work correctly

#### Phase 2: Build UI Components
1. Create components in `components/wardrobe/`
2. Start with simple components (Card, Empty state)
3. Build complex components (ImageUpload, AddItemDialog)
4. Test each component in isolation

#### Phase 3: Wire Up the Page
1. Create `app/(chat)/wardrobe/page.tsx`
2. Integrate components
3. Connect to API endpoints
4. Test full user flow

#### Phase 4: Polish
1. Add keyboard navigation
2. Verify accessibility
3. Optimize performance
4. Add error handling

#### Phase 5: Test & Deploy
1. Manual QA testing
2. Security review
3. Deploy to staging
4. Production deployment

## Testing Checklist

### Database Testing
- [ ] Can create clothing item as authenticated user
- [ ] Cannot view other users' items
- [ ] Cannot modify other users' items
- [ ] Indexes improve query performance
- [ ] Triggers update timestamps correctly

### Storage Testing
- [ ] Can upload image to own folder
- [ ] Cannot access other users' images
- [ ] File size limit enforced (10MB)
- [ ] Only allowed MIME types accepted
- [ ] Images deleted when item deleted

### API Testing
- [ ] GET /api/wardrobe returns user's items
- [ ] POST /api/wardrobe creates item with image
- [ ] GET /api/wardrobe/[id] returns single item
- [ ] PATCH /api/wardrobe/[id] updates item
- [ ] DELETE /api/wardrobe/[id] removes item and images
- [ ] Unauthenticated requests rejected
- [ ] Invalid data returns proper errors

### UI Testing
- [ ] Empty state displays when no items
- [ ] Grid displays items correctly
- [ ] Add item dialog opens and closes
- [ ] Image upload works (drag-drop, file picker, camera)
- [ ] Form validation shows errors
- [ ] Item detail view displays all fields
- [ ] Edit mode allows field updates
- [ ] Delete confirmation prevents accidents
- [ ] Loading states show during async operations
- [ ] Success/error toasts appear appropriately

### Accessibility Testing
- [ ] All form inputs have labels
- [ ] Keyboard navigation works throughout
- [ ] Focus trap in modals
- [ ] ESC closes dialogs
- [ ] Screen reader announces dynamic content
- [ ] Color contrast meets WCAG AA
- [ ] Images have alt text

### Performance Testing
- [ ] Page loads in < 1.5s
- [ ] Images lazy load
- [ ] Grid handles 100+ items smoothly
- [ ] Upload completes in < 5s for typical files
- [ ] No memory leaks with repeated actions

## Common Issues & Solutions

### Issue: RLS policies not working
**Solution**: Ensure you're using `auth.uid()` correctly and that the user is authenticated. Test with `SELECT auth.uid()` in SQL editor.

### Issue: Storage upload fails
**Solution**: Check bucket permissions, file size, and MIME type. Verify user is authenticated.

### Issue: Images not displaying
**Solution**: Ensure you're using signed URLs for private buckets. Check CORS settings in Supabase.

### Issue: TypeScript errors with Supabase types
**Solution**: Regenerate types with `npx supabase gen types typescript --local > lib/db/database.types.ts`

### Issue: Form validation not working
**Solution**: Ensure Zod schemas match between client and server. Check for typos in field names.

## Useful Commands

```bash
# Start local Supabase
npx supabase start

# Stop local Supabase
npx supabase stop

# Reset database (careful!)
npx supabase db reset

# Generate TypeScript types
npx supabase gen types typescript --local > lib/db/database.types.ts

# Run Next.js dev server
pnpm dev

# Run linter
pnpm lint

# Build for production
pnpm build
```

## API Testing Examples

### Create Item (with curl)

```bash
curl -X POST http://localhost:3000/api/wardrobe \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Blue Denim Jacket" \
  -F "category=jacket" \
  -F "brand=Levi's" \
  -F "image=@/path/to/image.jpg" \
  -F "prettifyWithAI=true"
```

### Get Items

```bash
curl http://localhost:3000/api/wardrobe \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Item

```bash
curl -X PATCH http://localhost:3000/api/wardrobe/ITEM_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["casual", "vintage"], "price": 89.99}'
```

### Delete Item

```bash
curl -X DELETE http://localhost:3000/api/wardrobe/ITEM_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Next Steps

After completing the basic implementation:

1. **Gather User Feedback**: Deploy to staging and get real user input
2. **Optimize Performance**: Profile and optimize slow queries/renders
3. **Add Analytics**: Track usage metrics (items added, time spent, etc.)
4. **Plan AI Integration**: Design AI enhancement and metadata extraction
5. **Advanced Features**: Search, filters, outfit creation

## Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hook Form](https://react-hook-form.com/) (if using for forms)

## Support

For questions or issues:
- Check the spec: `specs/001-wardrobe-management-feature/spec.md`
- Review the plan: `specs/001-wardrobe-management-feature/plan.md`
- Check data model: `specs/001-wardrobe-management-feature/data-model.md`
