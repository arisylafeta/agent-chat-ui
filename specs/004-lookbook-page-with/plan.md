---
# Lookbook Page with Avatar Generation - Implementation Plan
---

# Lookbook Page with Avatar Generation

## Summary

Build a dedicated `/lookbook` page that enables users to create personalized avatars by uploading head and body images along with body measurements. The feature uses Gemini 2.5 Flash Image model to generate realistic avatar composites, allows regeneration with user feedback, and persists avatars to Supabase Storage and the `avatars` database table. The implementation follows the wardrobe page pattern for layout consistency and includes a multi-step dialog workflow for avatar creation.

**Target Outcome**: Users can navigate to `/lookbook`, click "Create Avatar", upload head/body images, input measurements, preview AI-generated avatar, optionally regenerate with feedback, and save the final avatar to their account.

## Context

### Specification
- **Spec File**: `/Users/admin/Desktop/AI/Reoutfit/app-reoutfit/specs/004-lookbook-page-with/spec.md`
- **Feature**: Avatar generation from photos and measurements with AI-powered image composition

### Database Schema
- **Migration**: `/Users/admin/Desktop/AI/Reoutfit/supabase/migrations/20251018_lookbook_schema.sql`
- **Table**: `avatars` (user_id PK, image_url, height_cm, weight_kg, body_shape, measurements JSONB, preferences JSONB)
- **Storage Bucket**: `avatars` (needs to be created)

### Relevant Code Patterns
- **Page Layout**: `app/wardrobe/page.tsx` - Reference for consistent page structure with ChatHeader
- **API Pattern**: `app/api/wardrobe/prettify/route.ts` - Gemini 2.5 Flash Image integration pattern
- **Hook Pattern**: `hooks/use-wardrobe.ts` - Data fetching and mutation pattern
- **Form Pattern**: `components/wardrobe/clothing-item-form.tsx` - Multi-step dialog with image upload
- **Types**: `types/wardrobe.ts` - Type definitions pattern

### UI Components Available
- Dialog, Button, Input, Label, Select, Switch (shadcn/ui)
- Empty state components
- ChatHeader for navigation

## Work Breakdown

### Phase 0: Research & Setup
**Goal**: Verify dependencies, create storage bucket, define types

- [x] Review specification and database schema
- [ ] Create Supabase Storage bucket `avatars` with RLS policies
- [ ] Define TypeScript types in `types/lookbook.ts`:
  - `Avatar` interface
  - `AvatarMeasurements` interface
  - `GenerateAvatarData` interface
  - `GenerateAvatarResponse` interface
  - `SaveAvatarData` interface
- [ ] Verify Gemini API key is configured in environment

### Phase 1: Backend API Routes
**Goal**: Implement avatar generation and storage APIs

#### Milestone 1.1: Generate Avatar API
- [ ] Create `app/api/lookbook/generate-avatar/route.ts`
- [ ] Implement POST handler:
  - Parse FormData (headImage, bodyImage, measurements, regenerationNote)
  - Validate file types (JPEG, PNG, WebP) and sizes (max 10MB)
  - Verify user authentication via Supabase
  - Validate required measurements: height_cm, weight_kg (others optional)
  - Convert images to base64
  - Construct Gemini prompt for avatar generation
  - Call Gemini 2.5 Flash Image model
  - Return generated avatar + original images as data URLs
  - Handle errors with appropriate status codes and messages

#### Milestone 1.2: Avatar Storage API
- [ ] Create `app/api/lookbook/avatar/route.ts`
- [ ] Implement POST handler:
  - Parse JSON request (avatarImageDataUrl, measurements)
  - Verify user authentication
  - Validate required measurements: height_cm, weight_kg (body_shape and detailed measurements are optional)
  - Convert data URL to blob
  - Upload to Supabase Storage: `avatars/{user_id}/avatar.png`
  - Get public URL from storage
  - Upsert to `avatars` table (INSERT ... ON CONFLICT UPDATE)
  - Return success response with avatar data
- [ ] Implement GET handler:
  - Verify user authentication
  - Query `avatars` table for user's avatar
  - Return avatar data or null

### Phase 2: Frontend Hook & State Management
**Goal**: Create reusable hook for avatar operations

#### Milestone 2.1: useLookbook Hook (Optional - for consistency with useWardrobe pattern)
- [ ] Create `hooks/use-lookbook.ts`
- [ ] Implement state management:
  - `avatar` state (Avatar | null)
  - `loading`, `error` states
  - `generating`, `saving` loading states
- [ ] Implement `fetchAvatar()`:
  - GET request to `/api/lookbook/avatar`
  - Update avatar state
  - Handle errors
- [ ] Implement `generateAvatar()`:
  - POST FormData to `/api/lookbook/generate-avatar`
  - Return GenerateAvatarResponse
  - Handle errors with user-friendly messages
- [ ] Implement `saveAvatar()`:
  - POST JSON to `/api/lookbook/avatar`
  - Update avatar state
  - Trigger refetch
  - Handle errors
- [ ] Add useEffect to fetch avatar on mount
- [ ] **Alternative**: Handle API calls directly in dialog component if simpler

### Phase 3: Avatar Generation Dialog Component
**Goal**: Build multi-step dialog for avatar creation

#### Milestone 3.1: Dialog Structure & Step Navigation
- [ ] Create `components/lookbook/avatar-generation-dialog.tsx`
- [ ] Implement dialog state:
  - Current step (1-4)
  - Head image file & preview
  - Body image file & preview
  - Measurements form data
  - Generated avatar preview
  - Regeneration note
- [ ] Implement step navigation:
  - Next/Back buttons
  - Step validation before proceeding
  - Progress indicator (optional)

#### Milestone 3.2: Step 1 - Head Image Upload
- [ ] Create file input with drag-and-drop support
- [ ] Implement image preview after selection
- [ ] Add validation:
  - File type (JPEG, PNG, WebP)
  - File size (max 10MB)
  - Display error messages
- [ ] Add "Next" button (disabled until valid image selected)
- [ ] Add remove image button

#### Milestone 3.3: Step 2 - Body Image Upload
- [ ] Reuse file input component from Step 1
- [ ] Implement image preview
- [ ] Add validation (same as Step 1)
- [ ] Add "Back" and "Next" buttons

#### Milestone 3.4: Step 3 - Measurements Form
- [ ] Create form with react-hook-form + zod validation
- [ ] Add required fields:
  - Height (cm) - numeric input with validation (REQUIRED)
  - Weight (kg) - numeric input with validation (REQUIRED)
- [ ] Add optional fields with sizing notice:
  - Notice: "These measurements help us generate more accurate sizing recommendations"
  - Body shape - select dropdown (rectangle, triangle, inverted_triangle, hourglass, oval)
  - Chest/Bust (cm)
  - Waist (cm)
  - Hips (cm)
  - Shoulder width (cm)
  - Inseam (cm)
- [ ] Add "Back", "Skip" and "Generate Avatar" buttons
  - "Skip" button bypasses optional measurements, only requires height/weight
  - "Generate Avatar" validates required fields only
- [ ] Display validation errors inline for required fields

#### Milestone 3.5: Step 4 - Avatar Preview & Regeneration
- [ ] Display loading state during generation:
  - Spinner with "Generating your avatar..." message
  - Estimated time indicator (optional)
- [ ] Display generated avatar image when ready
- [ ] Add "Regenerate" section:
  - Textarea for user feedback/notes
  - "Regenerate" button
  - Show loading state during regeneration
- [ ] Add action buttons:
  - "Save Avatar" (primary)
  - "Cancel" (secondary)
- [ ] Handle save success:
  - Show success toast
  - Close dialog
  - Trigger parent refetch

### Phase 4: Lookbook Page
**Goal**: Create main lookbook page with avatar display

#### Milestone 4.1: Page Structure
- [ ] Create `app/lookbook/page.tsx`
- [ ] Implement layout matching wardrobe page:
  - ChatHeader with sidebar toggle
  - Title section with gradient "Your Lookbook" heading
  - Blob SVG background decoration
  - Main content area

#### Milestone 4.2: Empty State
- [ ] Create empty state component:
  - Illustration/icon (avatar placeholder)
  - Title: "Create Your Avatar"
  - Description: "Get started by creating your personalized avatar to visualize outfits"
  - "Create Avatar" button
- [ ] Show empty state when no avatar exists

#### Milestone 4.3: Avatar Display
- [ ] Create avatar display section:
  - Large avatar image display
  - Measurements summary card:
    - Height, weight, body shape
    - Additional measurements (collapsible)
  - Last updated timestamp
  - "Update Avatar" button
- [ ] Show avatar display when avatar exists

#### Milestone 4.4: Dialog Integration
- [ ] Add state for dialog open/close
- [ ] Connect "Create Avatar" / "Update Avatar" buttons to dialog
- [ ] Pass useLookbook hook methods to dialog
- [ ] Handle dialog close and success callbacks
- [ ] Show success/error toasts

### Phase 5: Storage Bucket Setup
**Goal**: Configure Supabase Storage for avatars

#### Milestone 5.1: Create Bucket
- [ ] Create `avatars` bucket in Supabase dashboard or via migration
- [ ] Configure bucket settings:
  - Public: false (authenticated access only)
  - File size limit: 10MB
  - Allowed MIME types: image/jpeg, image/png, image/webp

#### Milestone 5.2: RLS Policies
- [ ] Create storage policy: Users can upload to their own folder
  ```sql
  CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
  ```
- [ ] Create storage policy: Users can read their own avatars
  ```sql
  CREATE POLICY "Users can view their own avatars"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
  ```
- [ ] Create storage policy: Users can update their own avatars
  ```sql
  CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
  ```

### Phase 6: Testing & Polish
**Goal**: Ensure feature works end-to-end with good UX

#### Milestone 6.1: Manual Testing
- [ ] Test happy path: create avatar from scratch
- [ ] Test regeneration flow with feedback
- [ ] Test update existing avatar
- [ ] Test validation errors (file type, size, required fields)
- [ ] Test API failures (network, Gemini API down)
- [ ] Test authentication edge cases
- [ ] Test mobile responsiveness

#### Milestone 6.2: Accessibility
- [ ] Verify keyboard navigation works in dialog
- [ ] Test with screen reader
- [ ] Verify focus management (trap focus in dialog)
- [ ] Check color contrast ratios
- [ ] Ensure all images have alt text
- [ ] Verify loading states announce to screen readers

#### Milestone 6.3: Error Handling
- [ ] Add user-friendly error messages for all failure scenarios
- [ ] Implement timeout handling (30 seconds for generation)
- [ ] Add retry logic for transient failures (optional)
- [ ] Ensure errors don't crash the app
- [ ] Test error recovery flows

#### Milestone 6.4: Performance
- [ ] Optimize image uploads (client-side compression if needed)
- [ ] Add loading indicators for all async operations
- [ ] Test with slow network conditions
- [ ] Verify no memory leaks (image cleanup)
- [ ] Check bundle size impact

## Constitution Check

### Principle 1 (Streaming Graph Compatibility)
**N/A** - This feature does not involve LangGraph streaming or chat functionality. It's a standalone page with API routes.

### Principle 2 (Tool Call Integrity)
**N/A** - No tool calls or LangGraph integration in this feature.

### Principle 3 (External UI & Artifacts)
**N/A** - This feature does not use artifacts or external UI components from LangGraph.

### Principle 4 (Multimodal Constraints)
**✅ COMPLIANT** - Image upload constraints match constitution:
- Accept only JPEG, PNG, WebP (aligned with constitution's image types)
- Reject duplicates by filename (not applicable here as single upload per step)
- Support drag-and-drop (implemented in file input)
- Max file size: 10MB (reasonable limit)

### Principle 5 (Config & Auth)
**✅ COMPLIANT**:
- Uses Supabase Auth (not LangGraph auth)
- Requires `GEMINI_API_KEY` environment variable (server-side only, not `NEXT_PUBLIC_`)
- Uses existing Supabase config (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- All API routes verify authentication via `supabase.auth.getUser()`

### Principle 6 (Error Handling & UX)
**✅ COMPLIANT**:
- Surface connection failures via toasts (using `sonner`)
- Show loading states during generation and save operations
- Provide clear error messages for validation failures
- Handle API failures gracefully with fallback messages
- Timeout handling for long-running generation (30 seconds)

### Principle 7 (Versioning & Deps)
**✅ COMPLIANT**:
- Uses existing Next.js 15, React 19, TypeScript setup
- Uses pnpm for package management
- No new dependencies required (uses existing shadcn/ui components)
- Compatible with Tailwind v4 styling

### Principle 8 (Privacy & Secrets)
**✅ COMPLIANT**:
- `GEMINI_API_KEY` stored server-side only (not exposed to client)
- No `NEXT_PUBLIC_` prefix on sensitive keys
- User avatars stored in user-specific storage paths
- RLS policies enforce user isolation
- No API keys in client code

### Principle 9 (Accessibility)
**✅ COMPLIANT**:
- Keyboard navigation in dialog (Tab, Shift+Tab, Escape to close)
- Focus management (trap focus in dialog, return on close)
- All form inputs have proper labels
- Error messages associated with fields
- Loading states announce to screen readers
- Alt text on images
- Readable contrast (using design system colors)

### Principle 10 (Observability)
**N/A** - No message streaming or LangGraph observability concerns. Standard API logging applies.

## Risks / Mitigations

### Risk: Gemini API Rate Limits or Downtime
**Mitigation**:
- Implement timeout (30 seconds) to prevent indefinite waiting
- Show clear error message: "Avatar generation service is temporarily unavailable"
- Consider fallback: allow saving without generation (manual upload)
- Add retry button in error state

### Risk: Large Image Files Cause Slow Uploads
**Mitigation**:
- Client-side image compression before upload (optional, Phase 6)
- Show upload progress indicator
- Enforce 10MB file size limit
- Provide guidance on optimal image sizes in UI

### Risk: Generated Avatar Quality Issues
**Mitigation**:
- Allow regeneration with user feedback
- Iterate on Gemini prompt based on user testing
- Provide clear instructions on what makes a good input photo
- Consider showing example photos in empty state

### Risk: Storage Costs for Avatar Images
**Mitigation**:
- Limit to one avatar per user (upsert pattern)
- Implement image optimization/compression
- Monitor storage usage in Supabase dashboard
- Consider cleanup policy for inactive users (future)

### Risk: User Uploads Inappropriate Images
**Mitigation**:
- RLS policies ensure users only see their own avatars
- Consider content moderation API in future (not MVP)
- Terms of service should cover appropriate use
- Admin tools for moderation (future consideration)

### Risk: Measurements Data Privacy
**Mitigation**:
- Store measurements in JSONB (flexible schema)
- RLS policies prevent cross-user access
- No sharing of measurements outside user's account
- Clear privacy policy about data usage

## Rollout

### Development
- [ ] Implement on feature branch `004-lookbook-page-with`
- [ ] Test locally with Supabase local development
- [ ] Create storage bucket in local Supabase instance
- [ ] Verify Gemini API integration works

### Staging
- [ ] Deploy to staging environment
- [ ] Create storage bucket in staging Supabase project
- [ ] Test with real Gemini API
- [ ] Perform QA scenarios from spec
- [ ] Test with multiple user accounts

### Production
- [ ] Create storage bucket in production Supabase project
- [ ] Verify RLS policies are applied
- [ ] Deploy to production
- [ ] Monitor error logs for first 24 hours
- [ ] Monitor Gemini API usage and costs
- [ ] Monitor storage usage

### Monitoring
- [ ] Track avatar generation success/failure rates
- [ ] Monitor API response times (generation should be < 30s)
- [ ] Track storage bucket size growth
- [ ] Monitor user engagement (avatar creation rate)
- [ ] Set up alerts for API failures

### Rollback Plan
- [ ] Feature can be disabled by removing `/lookbook` route from navigation
- [ ] API routes can be disabled individually if needed
- [ ] Storage bucket can be paused if costs spike
- [ ] No database migrations to rollback (table already exists)
- [ ] Gemini API can be disabled with feature flag (future enhancement)
