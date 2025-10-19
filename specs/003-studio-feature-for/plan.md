---
# Studio Feature MVP Implementation Plan
---

# Virtual Try-On Studio - MVP Implementation

## Summary

Build the core Studio feature as an artifact-based workspace where users can compose outfits by selecting products from chat artifacts (lens-results, shopping-results), visualize them on their avatar through AI-generated try-on images using Gemini 2.5 Flash Image model, and save the results. This MVP focuses on the essential flow: artifact opening, state management for selected products, current outfit composition (max 6 items), real-time AI image generation via Gemini API, and database persistence. The UI features a clean layout with top action buttons (Avatar/Products/Wardrobe) and bottom action buttons (Generate/Save/Share/Remix) surrounding the center image display.

**Target Outcome**: Users can click "Select To Try" in lens-results, open Studio, see selected products in a grid with inline "Add to Outfit" buttons, compose an outfit in the vertical column, upload/select an avatar, generate a realistic virtual try-on image using Gemini AI, and save the result to their looks collection.

## Design Clarifications

### Product Type Unification (Q1)
**Decision**: Option A - Create unified `StudioProduct` type
- Normalized interface: `{ id, title, brand, image, sourceData }`
- `image` field uses high-quality version (`image_full` if available)
- `sourceData` stores original product JSONB for flexibility
- Conversion utilities: `toStudioProduct()` for both `Product` and `WardrobeItem`

### Data Model (Q2)
**Decision**: Option A - Use existing `lookbooks` table
- No new tables needed - existing schema is sufficient
- `lookbooks.cover_image_url` stores generated look image
- `lookbook_wardrobe_items` junction table for product links
- Terminology: "lookbooks" in DB, "looks" in UI (no rename needed)

### Generated Image Storage (Q3)
**Decision**: Hybrid approach (show in state, save to storage)
- During generation: Store base64 data URL in React state (ephemeral)
- On save: Convert to blob, upload to Supabase Storage `generated-looks` bucket
- Store public URL in `lookbooks.cover_image_url`
- Benefits: Fast preview, persistent storage, no CDN costs

### Product Association (Q4)
**Decision**: Option A - Save to wardrobe first, then link
- Products from lens/shopping results → create `wardrobe_items` entry
- Use `category='online'` for search products
- Store original product data in `metadata` JSONB field
- Link via `lookbook_wardrobe_items` junction table
- Enables future wardrobe features without data duplication

### Slot/Role Validation (Q5)
**Decision**: Option D - Defer to Phase 2
- MVP allows any 6 items without position constraints
- Use default values: `slot='base'`, `role='other'`
- Leave TODO comments for future validation logic
- Phase 2 will implement proper categorization and conflict detection

## Context

### Specification
- **Spec File**: `/Users/admin/Desktop/AI/Reoutfit/app-reoutfit/specs/003-studio-feature-for/spec.md`
- **Feature**: Virtual Try-On Studio with outfit composition and AI-powered visualization
- **Data Model**: `specs/003-studio-feature-for/data-model.md`
- **Quickstart**: `specs/003-studio-feature-for/quickstart.md`
- **API Contracts**: `specs/003-studio-feature-for/contracts/`

### Relevant Code
- **Artifact System**: 
  - `components/artifact/artifact.tsx` - Artifact provider and context
  - `components/artifact/artifact-sidebar.tsx` - Sidebar container
  - `components/artifact/lens-results/lens-results.tsx` - Reference for artifact pattern
- **API Reference**:
  - `app/api/wardrobe/prettify/route.ts` - Gemini 2.5 Flash Image integration pattern (model for generate-look API)
- **Types**: 
  - `types/wardrobe.ts` - Product/wardrobe item types
  - `types/studio.ts` - Studio-specific types (to be created)
- **Existing Components**:
  - `components/studio/studio-toggle.tsx` - Studio entry point button
  - `components/chat/chat-header.tsx` - Header integration point
- **Providers**: `providers/` - Auth and state management patterns
- **Environment**: `GEMINI_API_KEY` - Already configured for prettify API
- **Database**: `supabase/migrations/20251018_lookbook_schema.sql` - Existing lookbook schema

### MVP Scope Constraints
**In Scope**:
- Studio artifact component with responsive layout
- **Top Action Bar**: Avatar, Products, Wardrobe buttons(mocked, only button)
- **Selected Grid** (renamed from product-grid): Responsive grid (12→6→3→horizontal) with inline "Add to Outfit" buttons on each product card
- **Current Outfit Column**: Vertical column (6 items max) with small product thumbnails and remove buttons
- **Center Image Display**: Shows avatar or generated look
- **Bottom Action Bar**: Generate, Save, Share, Remix buttons
- **Generate Button**: Real Gemini 2.5 Flash Image API integration for virtual try-on
- **Save Button**: Persists looks to Supabase database using existing `lookbooks` table, creates wardrobe items for search products
- State management for selected products, current outfit, and avatar
- Integration with lens-results "Select To Try" button
- Real API endpoints using Gemini (similar to prettify API pattern)

**Out of Scope (Mocked)**:
- Products drawer (button present, shows "Coming Soon" toast)
- Wardrobe drawer (button present, shows "Coming Soon" toast)
- Share button (button present, shows "Coming Soon" toast)
- Remix button (button present, shows "Coming Soon" toast)

## Work Breakdown

### Phase 0: Foundation & Types (Day 1)
**Goal**: Set up types, state management foundation, and API contracts

#### Milestone 0.1: Type Definitions
- Create `types/studio.ts` with:
  - `StudioProduct` type - Unified interface with `id`, `title`, `brand`, `image` (high-quality), `sourceData` (JSONB)
  - `StudioState` interface (selectedProducts, currentOutfit, generatedLook, isGenerating, activeDrawer)
  - `GeneratedLook` type (imageUrl, lookbookId?)
  - API request/response types for generation and saving
  - Type conversion utilities: `toStudioProduct()` for Product and WardrobeItem

#### Milestone 0.2: State Management Setup
- Create `providers/studio-provider.tsx`:
  - React Context for studio state
  - `useStudio()` hook for consuming state
  - Actions: `addToSelected`, `removeFromSelected`, `moveToOutfit`, `removeFromOutfit`, `clearSelected`, `setGeneratedLook`
  - LocalStorage persistence for `selectedProducts` and `currentOutfit`
  - Max 6 items validation for current outfit

#### Milestone 0.3: API Routes (Real Implementation)
- Create `/app/api/studio/generate-look/route.ts`:
  - POST endpoint accepting FormData with avatar image and product images array
  - Uses Gemini 2.5 Flash Image model (similar to prettify API)
  - Validates authentication via Supabase
  - Validates image files (JPEG/PNG/WebP, max 10MB each)
  - Converts images to base64 for Gemini API
  - Prompt: "Create a realistic virtual try-on image showing the person wearing these clothing items: [products]. Maintain realistic proportions, lighting, and fit. Professional fashion photography style."
  - Returns generated image as base64 data URL
  - 30-second timeout configuration
  - Error handling with fallback
- Create `/app/api/studio/save-look/route.ts`:
  - POST endpoint accepting `{ title?, products: StudioProduct[], generatedImageBase64 }`
  - Validates authentication via Supabase
  - Uploads base64 image to Supabase Storage `generated-looks` bucket
  - Creates entry in existing `lookbooks` table with `cover_image_url`
  - For products from search results: creates `wardrobe_items` with `category='online'`, stores sourceData in `metadata` JSONB
  - Links products via `lookbook_wardrobe_items` junction table (slot='base', role='other' for MVP)
  - Returns `{ lookbookId, imageUrl, createdAt }`

**Deliverables**:
- `types/studio.ts`
- `providers/studio-provider.tsx`
- `app/api/studio/generate-look/route.ts` (real Gemini integration)
- `app/api/studio/save-look/route.ts`
- Database migration for `generated-looks` storage bucket

---

### Phase 1: Core UI Components (Day 2-3)
**Goal**: Build the Studio artifact layout with all visual elements

#### Milestone 1.1: Studio Artifact Shell
- Create `components/artifact/studio/studio.tsx`:
  - Main artifact component following lens-results pattern
  - No collapsed state for now.
  - Expanded state: Full studio layout
  - Integrates with `useStudio()` for state

#### Milestone 1.2: Layout Structure
- Create `components/artifact/studio/studio-layout.tsx`:
  - **Top Section**: Action buttons bar
    - Right Side: "Avatar", "Products", "Wardrobe" buttons (drawer triggers) on the side of the title. 
    - Consistent styling with artifact header
  - **Main Content**: Responsive grid layout:
    - Desktop (lg+): Main section (left 1/2) + Selected section (right 1/2)
    - Mobile: Main section (top) + Selected section (bottom, horizontal scroll)
  - **Main section** contains:
    - Center image area (avatar or generated look)
    - Vertical outfit column (6 squares, left side of center image)
  - **Selected section**:
    - "Selected" title
    - Product grid (responsive: 12→6→3 items)
    - Each product card has on hover "+ Add to Outfit" button 
    - Each product card has on hover "Remove" button 
    - Empty state message
  - **Bottom Section**: Primary action buttons
    - "Generate", "Save", "Share", "Remix" buttons
    - Positioned below main section.
    - Sticky on mobile for easy access

#### Milestone 1.3: Selected Grid Component
- Create `components/artifact/studio/selected-grid.tsx` (renamed from product-grid):
  - Reusable grid for displaying selected products
  - Product card with:
    - Image, name, brand
    - Inline "Add to Outfit" button (icon button overlay on hover)
    - Remove button (X icon in corner)
    - Card style is similar to @/components/wardrobe/clothing-item-card.tsx
  - Click on "Add to Outfit" moves item to outfit-column
  - Visual feedback when item is already in outfit (disabled state)
  - Empty state slots
  - Loading skeleton states

- Create `components/artifact/studio/outfit-column.tsx`:
  - Vertical column of 6 product slots
  - Shows current outfit items
  - Empty slots with dashed borders
  - small x button for click-to-remove
  - Very small and only images

#### Milestone 1.4: Center Image Display
- Create `components/artifact/studio/look-display.tsx`:
  - Large center image area
  - Shows avatar by default (retrieved from table avatars, placeholder for now).
  - Shows generated look after API call
  - Loading state with spinner overlay during generation
  - Aspect ratio maintained (3:4 portrait)

**Deliverables**:
- `components/artifact/studio/studio.tsx`
- `components/artifact/studio/studio-layout.tsx`
- `components/artifact/studio/selected-grid.tsx` (renamed from product-grid)
- `components/artifact/studio/outfit-column.tsx`
- `components/artifact/studio/look-display.tsx`
- `components/artifact/studio/top-actions.tsx` (Avatar/Products/Wardrobe buttons)
- `components/artifact/studio/bottom-actions.tsx` (Generate/Save/Share/Remix buttons)

---

### Phase 2: Action Buttons & Interactions (Day 3-4)
**Goal**: Implement all button actions and user interactions

#### Milestone 2.1: Action Button Components
- Create `components/artifact/studio/top-actions.tsx`:
  - Button group for drawer triggers
  - "Avatar" button (opens avatar selection/upload - mocker for MVP)
  - "Products" button (opens shopping history - mocked for MVP)
  - "Wardrobe" button (opens wardrobe items - mocked for MVP)
  - Consistent styling with artifact header
  - Icon + text labels

- Create `components/artifact/studio/bottom-actions.tsx`:
  - Primary action buttons below center image
  - "Generate" button (primary, triggers AI generation)
  - "Save" button (secondary, saves to database)
  - "Share" button (secondary, mocked for MVP)
  - "Remix" button (secondary, mocked for MVP)
  - Disabled states based on context (e.g., Generate disabled if outfit empty)
  - Loading states for async actions
  - Stack vertically always, under center image and outfit-column

#### Milestone 2.2: Add to Outfit Logic (Inline Buttons)
- Implement `handleAddToOutfit(product)` in selected-grid:
  - Validates outfit has space (max 6 items)
  - Adds single product to outfit-column
  - Shows toast if outfit is full
  - Disables button for items already in outfit
  - Visual feedback on success
  - Updates UI immediately
  - LEAVE TODO in code for verifying that no two items have the same layer and position(ex. two jackets, two pants) - deferred to Phase 2. 

#### Milestone 2.3: Generate Button Logic
- Implement `handleGenerate()` in studio component:
  - Validates current outfit has at least 1 item
  - Validates avatar is selected/uploaded
  - Collects product images from current outfit
  - Prepares FormData with avatar and product images
  - Calls `/api/studio/generate-look` with POST request (FormData)
  - Shows loading overlay on center image with progress indicator
  - Handles success: displays generated image (base64 data URL)
  - Handles errors: shows error toast with retry option
  - Tracks generation time for analytics
  - Gemini API timeout handling (30s)

#### Milestone 2.4: Save Logic
- Implement `handleSave()`:
  - Validates generated look exists
  - Converts base64 data URL to blob if needed
  - Calls `/api/studio/save-look` with product IDs and image data
  - Shows success toast with "Saved to your looks"
  - Stores look_id in state for reference
  - PostHog tracking

#### Milestone 2.5: Mock Button Handlers
- Implement mock handlers for future features:
  - `handleOpenProducts()` → Toast: "Shopping history coming soon" add Posthog tracking
  - `handleOpenWardrobe()` → Toast: "Wardrobe coming soon" add Posthog tracking
  - `handleShare()` → Toast: "Share feature coming soon"  add Posthog tracking
  - `handleRemix()` → Toast: "Remix feature coming soon" add Posthog tracking

**Deliverables**:
- `components/artifact/studio/top-actions.tsx`
- `components/artifact/studio/bottom-actions.tsx`
- Complete interaction logic in `studio.tsx` and `selected-grid.tsx`
- Avatar selection component/drawer
- Error handling and toast notifications
- Loading states for all async operations

---

### Phase 3: Integration & State Sync (Day 4-5)
**Goal**: Connect Studio with existing artifacts and chat system

#### Milestone 3.1: Lens Results Integration
- Update `components/artifact/lens-results/lens-results.tsx`:
  - Modify "Select To Try" button to call `useStudio().addToSelected(product)`
  - Add visual feedback (checkmark or badge) when product is selected
  - Update PostHog tracking to include studio selection events

#### Milestone 3.2: Studio Toggle Enhancement
- Update `components/artifact/studio/studio-toggle.tsx`:
  - Add badge showing count of selected items
  - Use `useStudio()` to get selected count
  - Navigate to studio artifact on click (open artifact panel)
  - Add visual indicator when items are selected (no badge > badge with number).

#### Milestone 3.3: Artifact Registration
- Register Studio artifact in artifact system:
  - Add to artifact types/registry
  - Ensure proper artifact context passing
  - Test open/close behavior
  - Verify state persistence across artifact switches

#### Milestone 3.4: Cross-Artifact State Sync
- Implement state synchronization:
  - Selected products persist when switching between artifacts
  - Studio state available globally via context
  - LocalStorage sync on state changes
  - Handle edge cases (duplicate selections, max capacity)

**Deliverables**:
- Updated `lens-results.tsx` with studio integration
- Enhanced `studio-toggle.tsx` with badge and navigation
- Studio artifact registered and functional
- State sync working across artifacts

---

### Phase 4: API Implementation & Database (Day 5-6)
**Goal**: Implement real API endpoints and database persistence

#### Milestone 4.1: Storage Bucket Migration
- Create Supabase migration for `generated-looks` storage bucket:
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
  ```
- Add RLS policies for user-specific access to bucket
- **Note**: Existing `lookbooks` table is used for storing look metadata (no new table needed)

#### Milestone 4.2: Generate Look API (Gemini Integration)
- Implement `/app/api/studio/generate-look/route.ts`:
  - Parse FormData (avatar image file, product image files array)
  - Validate authentication via Supabase
  - Validate all images (JPEG/PNG/WebP, max 10MB each)
  - Convert images to base64 for Gemini API
  - Construct prompt for virtual try-on:
    - "Create a realistic virtual try-on image showing the person in the avatar wearing these clothing items. Maintain realistic proportions, lighting, and fit. Professional fashion photography style."
  - Call Gemini 2.5 Flash Image model with avatar + product images
  - Extract generated image from response (base64)
  - Generate unique look_id (UUID)
  - Return generated image as data URL
  - Error handling: timeouts, invalid images, API failures
  - Fallback: return avatar if generation fails
  - Log generation metrics (time, success/failure)

#### Milestone 4.3: Save Look API (Real Implementation)
- Implement `/app/api/studio/save-look/route.ts`:
  - Validate user authentication (Supabase session)
  - Convert base64 image to blob and upload to `generated-looks` bucket
  - Create entry in `lookbooks` table with `cover_image_url` pointing to uploaded image
  - For each product in outfit:
    - If from search results (has sourceData): create `wardrobe_items` entry with `category='online'`, `metadata=sourceData`
    - Link via `lookbook_wardrobe_items` with default `slot='base'`, `role='other'`
  - Return `{ lookbookId, imageUrl, createdAt }`
  - Add error handling for storage and database failures

#### Milestone 4.4: Avatar Upload Endpoint
- Create `/app/api/studio/avatar/upload/route.ts`:
  - POST endpoint accepting avatar image file
  - Validates authentication via Supabase
  - Validates image (JPEG/PNG/WebP, max 10MB)
  - Uploads to Supabase Storage (bucket: `avatars`)
  - Returns avatar URL
  - Optional: Save to user profile for future use

**Deliverables**:
- Supabase migration for `generated-looks` storage bucket with RLS policies
- Fully implemented `/api/studio/generate-look` (Gemini integration)
- Fully implemented `/api/studio/save-look` (uses existing `lookbooks` table)
- Avatar upload endpoint
- Error handling and validation
- Environment variable: `GEMINI_API_KEY` (reuse existing)

---

### Phase 5: Polish & Testing (Day 6-7)
**Goal**: Refine UX, add loading states, and ensure quality

#### Milestone 5.1: Loading & Empty States
- Add comprehensive loading states:
  - Skeleton loaders for product grids
  - Spinner overlay during generation
  - Button loading indicators
  - Progress text during long operations

- Add empty states:
  - "No items selected" in selected grid
  - "Add items to your outfit" in outfit column
  - "Generate a look to see it here" in center image
  - Helpful hints and CTAs

#### Milestone 5.2: Error Handling & Validation
- Add input validation:
  - Max 6 items in outfit (visual feedback)
  - Image URL validation before API calls
  - User authentication checks
  - Network error detection

- Add error recovery:
  - Retry button for failed generation
  - Clear error states on new actions
  - Graceful degradation for missing data

#### Milestone 5.3: Responsive Design Refinement
- Test and refine breakpoints:
  - Desktop (1920px, 1440px, 1280px)
  - Tablet (1024px, 768px)
  - Mobile (640px, 375px)
- Ensure touch targets are adequate (min 44px)
- Test horizontal scroll on mobile selected section
- Verify outfit column positioning across sizes

#### Milestone 5.4: Accessibility Audit
- Keyboard navigation:
  - Tab through all interactive elements
  - Enter/Space to activate buttons
  - Escape to close artifact
- ARIA labels:
  - Product cards with descriptive labels
  - Button purposes clearly stated
  - Loading states announced
- Screen reader testing:
  - Test with VoiceOver/NVDA
  - Ensure state changes are announced
- Color contrast:
  - Verify all text meets WCAG AA
  - Test in dark mode (if applicable)

#### Milestone 5.5: Performance Optimization
- Image optimization:
  - Lazy load product images
  - Use Next.js Image component where possible
  - Implement progressive loading
- State optimization:
  - Memoize expensive computations
  - Debounce localStorage writes
  - Optimize re-renders with React.memo
- Bundle size:
  - Check for unnecessary dependencies
  - Code split studio components

**Deliverables**:
- Polished loading and empty states
- Comprehensive error handling
- Responsive design verified across devices
- Accessibility compliance (WCAG AA)
- Performance optimizations applied

---

### Phase 6: Integration Testing & Documentation (Day 7)
**Goal**: End-to-end testing and developer documentation

#### Milestone 6.1: Integration Testing
- Test complete user flows:
  1. Select products from lens-results → Open studio → See selected items
  2. Move selected to outfit → Generate look → Save → Download
  3. Error scenarios: Network failure, timeout, invalid images
  4. Edge cases: Max capacity, empty states, duplicate selections
  5. Cross-artifact navigation: Switch between lens-results and studio

#### Milestone 6.2: Browser Testing
- Test on browsers:
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)
- Test on devices:
  - Desktop (Mac, Windows)
  - Tablet (iPad, Android tablet)
  - Mobile (iPhone, Android phone)

#### Milestone 6.3: Documentation
- Create `docs/studio-feature.md`:
  - Feature overview and architecture
  - Component hierarchy and responsibilities
  - State management flow diagram
  - API endpoint documentation
  - Future enhancement roadmap (drawers, share, remix)

- Update existing docs:
  - Add Studio to artifact types list
  - Document new API routes
  - Update integration guide for lens-results

#### Milestone 6.4: Code Review Prep
- Code cleanup:
  - Remove console.logs
  - Add JSDoc comments to complex functions
  - Ensure consistent code style
  - Remove unused imports
- Create PR description:
  - Feature summary
  - Screenshots/GIFs of functionality
  - Testing checklist
  - Known limitations (mocked features)

**Deliverables**:
- Comprehensive integration tests passed
- Browser/device compatibility verified
- `docs/studio-feature.md` created
- Code cleaned and documented
- PR ready for review

---

## Constitution Check

### Principle 1 (Streaming Graph Compatibility)
✅ **Compliant**: Studio artifact uses `useStreamContext` to access artifact tuple, maintaining compatibility with LangGraph streaming. State is managed independently via React Context, not interfering with thread continuity.

### Principle 2 (Tool Call Integrity)
✅ **Compliant**: Studio does not involve tool calls or tool results. It's a UI-only artifact that operates on user interactions.

### Principle 3 (External UI & Artifacts)
✅ **Compliant**: 
- Studio uses `useArtifact()` hook for `setOpen` and `setContext`
- Artifact context (selected products) can be passed back on submit if needed
- Follows lens-results pattern for artifact integration
- Uses `LoadExternalComponent` rendering pattern

### Principle 4 (Multimodal Constraints)
✅ **Compliant**: Studio displays images but doesn't handle file uploads directly. Image URLs come from existing products (already validated in lens-results).

### Principle 5 (Config & Auth)
✅ **Compliant**:
- Uses existing Supabase auth via `useSupabaseClient`
- API routes check authentication before processing
- Environment variables:
  - `NEXT_PUBLIC_STUDIO_API_URL` (optional, defaults to relative paths)
  - `STUDIO_AI_MODEL_ENDPOINT` (server-side only, no `NEXT_PUBLIC_` leak)
- No new auth flow required

### Principle 6 (Error Handling & UX)
✅ **Compliant**:
- Toast notifications for all errors (using `sonner`)
- Retry mechanism for failed generation
- Loading states prevent user confusion
- No auto-scroll issues (artifact panel is separate from chat)

### Principle 7 (Versioning & Deps)
✅ **Compliant**:
- Uses existing Next.js 15, React 19, TypeScript 5.7
- No new major dependencies (reuses existing UI components)
- Managed with `pnpm` (existing package manager)

### Principle 8 (Privacy & Secrets)
✅ **Compliant**:
- AI model endpoint URL kept server-side only
- User avatars and generated looks tied to authenticated user
- No secrets exposed via `NEXT_PUBLIC_` variables
- Supabase RLS enforces user-specific data access

### Principle 9 (Accessibility)
✅ **Compliant**:
- Keyboard navigation for all interactions
- ARIA labels on all buttons and interactive elements
- Focus management in artifact panel
- Color contrast verified (uses existing design tokens)
- Screen reader support for state changes

### Principle 10 (Observability)
✅ **Compliant**:
- PostHog events for key actions (select, generate, save, download)
- No hidden messages or special rendering rules
- State changes are explicit and traceable
- Error logging for API failures

---

## Risks / Mitigations

### Risk 1: AI Generation API Latency
**Risk**: Image generation may take 20-30 seconds, causing user frustration.

**Mitigation**:
- Show progress indicator with estimated time
- Allow users to continue browsing (non-blocking)
- Implement timeout with clear error message and retry
- Consider background processing with notification when ready (future)

### Risk 2: State Sync Complexity
**Risk**: Managing state across artifacts and localStorage may cause inconsistencies.

**Mitigation**:
- Single source of truth via React Context
- Atomic state updates with validation
- LocalStorage sync debounced to prevent race conditions
- Clear state on logout/session end
- Comprehensive testing of edge cases

### Risk 3: Mobile UX Constraints
**Risk**: Horizontal scroll for selected products on mobile may be unintuitive.

**Mitigation**:
- Add visual scroll indicators (fade edges)
- Snap scrolling for better control
- Alternative: Collapse to "X items selected" with expand button
- User testing to validate approach

### Risk 4: Image Quality & Format Issues
**Risk**: Product images from various sources may have inconsistent quality/formats.

**Mitigation**:
- Validate image URLs before API call
- Implement fallback images for broken URLs
- Server-side image processing to normalize formats
- Clear error messages for unsupported formats

### Risk 5: Database Migration Conflicts
**Risk**: New `looks` table may conflict with existing schema or naming.

**Mitigation**:
- Review existing schema before migration
- Use descriptive table name (`studio_looks` if `looks` exists)
- Test migration on local Supabase instance first
- Rollback plan documented

### Risk 6: Performance with Large Product Lists
**Risk**: Rendering many products in selected grid may cause lag.

**Mitigation**:
- Implement virtualization for grids (react-window or similar)
- Lazy load images with intersection observer
- Limit selected products to reasonable max (e.g., 50)
- Paginate or infinite scroll for future drawer implementations

---

## Rollout

### Phase 1: Internal Testing (Week 1)
- Deploy to staging environment
- Team testing with real product data
- Collect feedback on UX and performance
- Fix critical bugs and UX issues

### Phase 2: Beta Release (Week 2)
- Feature flag: `enable_studio_feature` (default: false)
- Enable for 10% of users (A/B test)
- Monitor metrics:
  - Studio open rate
  - Generation success rate
  - Average generation time
  - Save/download rates
  - Error rates
- Collect user feedback via in-app survey

### Phase 3: Gradual Rollout (Week 3-4)
- Increase to 25% → 50% → 100% based on metrics
- Monitor performance and error rates at each stage
- Rollback plan: Disable feature flag if error rate > 5%

### Monitoring & Alerts
- **Key Metrics**:
  - Generation API response time (alert if > 35s)
  - Generation success rate (alert if < 90%)
  - Studio artifact load time (alert if > 2s)
  - Error rate per endpoint (alert if > 3%)
- **PostHog Events**:
  - `studio_opened`
  - `product_selected_for_studio`
  - `outfit_generated`
  - `look_saved`
  - `look_downloaded`
  - `generation_failed`

### Rollback Steps
1. Disable feature flag `enable_studio_feature`
2. Verify users can still access lens-results without issues
3. Investigate root cause from logs and metrics
4. Fix issues in hotfix branch
5. Re-enable after validation

### Success Criteria
- 70%+ of users who open studio generate at least one look
- 90%+ generation success rate
- Average generation time < 25 seconds
- < 2% error rate across all studio APIs
- Positive user feedback (NPS > 40)
