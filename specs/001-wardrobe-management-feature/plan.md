---
# Wardrobe Management Feature - Implementation Plan
---

# Wardrobe Management System Implementation

## Summary
Implement a complete wardrobe management system that allows users to upload, organize, and manage their clothing items. The feature includes database schema creation, API endpoints, UI components for grid display and item management, image upload/storage integration with Supabase, and placeholders for future AI enhancement capabilities. Target outcome: Users can build and maintain a digital wardrobe with rich metadata for each clothing item.

## Progress Tracking

### Phase 0: Planning & Design ✅ COMPLETE
- [x] Feature specification created (`spec.md`)
- [x] Implementation plan created (`plan.md`)
- [x] Data model designed (`data-model.md`)
- [x] API contracts defined (`contracts/api-endpoints.md`)
- [x] UI components specified (`contracts/ui-components.md`)
- [x] Research completed (`research.md`)
- [x] Quick start guide created (`quickstart.md`)

### Phase 1: Database & Infrastructure (PENDING)
- [ ] Create Supabase migration
- [ ] Apply RLS policies
- [ ] Set up storage bucket
- [ ] Create TypeScript types

### Phase 2: API Implementation (PENDING)
- [ ] GET /api/wardrobe
- [ ] POST /api/wardrobe
- [ ] POST /api/wardrobe/prettify (Gemini AI integration)
- [ ] GET /api/wardrobe/[id]
- [ ] PATCH /api/wardrobe/[id]
- [ ] DELETE /api/wardrobe/[id]

### Phase 3: UI Components (PENDING)
- [ ] ClothingItemCard
- [ ] ClothingItemGrid
- [ ] EmptyWardrobe
- [ ] ImageUpload
- [ ] PrettifyResultView (shows AI result with accept/reject buttons)
- [ ] AddItemDialog
- [ ] ItemDetailView

### Phase 4: Page Integration (PENDING)
- [ ] /wardrobe page
- [ ] Data fetching hooks
- [ ] State management
- [ ] Error handling

### Phase 5: Polish & Testing (PENDING)
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Manual QA
- [ ] Security review

## Context
- **Spec**: `/Users/admin/Desktop/AI/Reoutfit/app-reoutfit/specs/001-wardrobe-management-feature/spec.md`
- **Tasks**: `/Users/admin/Desktop/AI/Reoutfit/app-reoutfit/specs/001-wardrobe-management-feature/tasks.md` (to be generated)
- **Branch**: `001-wardrobe-management-feature`
- **Relevant Code**:
  - Sidebar navigation: `components/sidebar/app-sidebar.tsx` (already has Wardrobe link)
  - Database utilities: `lib/db/`
  - API routes: `app/api/`
  - Image upload utility: `lib/upload-image.ts`
  - Supabase migrations: `supabase/migrations/`
  - Auth layout pattern: `app/(auth)/`
  - Chat layout pattern: `app/(chat)/`

## Work Breakdown

### Phase 0: Database & Infrastructure Setup
**Goal**: Create database schema, storage bucket, and RLS policies

- **Task 0.1**: Create Supabase migration for `clothing_items` table
  - Define all 16 fields (id, user_id, name, category, brand, image_url, colors, fabrics, seasons, tags, price, dress_codes, gender, size, notes, created_at, updated_at)
  - Note: Single image_url field (stores user's chosen version: original or AI-prettified)
  - Add foreign key constraint to auth.users
  - Create indexes on user_id, category, created_at
  - Add updated_at trigger for automatic timestamp updates

- **Task 0.2**: Create RLS policies for clothing_items
  - SELECT: Users can only view their own items
  - INSERT: Users can only insert items with their own user_id
  - UPDATE: Users can only update their own items
  - DELETE: Users can only delete their own items

- **Task 0.3**: Create Supabase Storage bucket configuration
  - Create `clothing-images` bucket (private)
  - Set max file size to 10MB
  - Configure allowed MIME types (image/jpeg, image/png, image/webp)
  - Add storage RLS policies for authenticated users

- **Task 0.4**: Create TypeScript types for ClothingItem
  - Define interface in `lib/db/types.ts` or similar
  - Export for use across API and components
  - Include Zod schema for validation

### Phase 1: API Layer Implementation
**Goal**: Build RESTful API endpoints for CRUD operations

- **Task 1.1**: Create GET /api/wardrobe endpoint
  - Fetch user's clothing items with pagination
  - Support query params: limit, offset, category filter
  - Return items array and total count
  - Validate user authentication via Supabase Auth

- **Task 1.2**: Create POST /api/wardrobe endpoint
  - Accept multipart form data (name, category, brand, image)
  - Validate required fields (name, category, image)
  - Upload image to Supabase Storage with UUID filename
  - Insert record into clothing_items table
  - Return created item with image URL

- **Task 1.2b**: Create POST /api/wardrobe/prettify endpoint
  - Accept image file (multipart/form-data)
  - Validate authentication and file type
  - Send image to Gemini image generation API
  - Use prompt: "Transform this clothing item into a professional product photo with a clean white background, maintaining the item's original appearance, colors, and details"
  - Return prettified image as base64 data URL
  - Image is NOT saved to database at this stage
  - Frontend keeps original in memory and shows prettified result
  - User chooses which version to save

- **Task 1.3**: Create GET /api/wardrobe/[id] endpoint
  - Fetch single clothing item by ID
  - Validate user ownership via RLS
  - Return 404 if not found or unauthorized
  - Include all metadata fields

- **Task 1.4**: Create PATCH /api/wardrobe/[id] endpoint
  - Accept partial updates to clothing item
  - Validate user ownership
  - Update updated_at timestamp
  - Return updated item

- **Task 1.5**: Create DELETE /api/wardrobe/[id] endpoint
  - Validate user ownership
  - Delete associated image from Storage
  - Delete database record
  - Return success status

- **Task 1.6**: Add API error handling and validation
  - Implement consistent error responses
  - Add rate limiting middleware (optional)
  - Validate file types and sizes server-side
  - Sanitize user inputs to prevent XSS

### Phase 2: Core UI Components
**Goal**: Build reusable UI components for wardrobe management

- **Task 2.1**: Create ClothingItemCard component
  - Display thumbnail image (150x150px optimized)
  - Show name, category, brand
  - Implement hover states
  - Add click handler for detail view
  - Use shadcn Card component
  - Follow styling.md conventions (Tailwind v4 tokens)

- **Task 2.2**: Create EmptyWardrobe component
  - Display when user has no items
  - Include helpful message and illustration
  - Show "Add your first item" CTA button
  - Use accent colors from styling.md

- **Task 2.3**: Create ImageUpload component
  - Implement drag-and-drop zone
  - Add file picker button
  - Support camera capture (input accept="image/*" capture)
  - Show image preview after selection
  - Display upload progress indicator
  - Validate file type and size client-side
  - Show error messages for invalid files

- **Task 2.4**: Create AddItemDialog component
  - Use shadcn Dialog component
  - Include ImageUpload component
  - Add form fields: name (Input), category (Select), brand (Input)
  - Add "Prettify with AI" toggle (Switch)
  - When prettify enabled:
    * Call POST /api/wardrobe/prettify after image selection
    * Show loading state during AI processing
    * Display prettified image with two buttons:
      - "Use AI Version" button (primary)
      - "Use Original" button (secondary)
    * Store user's choice (original or prettified image)
    * Selected image is used in final form submission
  - Implement form validation with error messages
  - Handle form submission with loading state
  - Show success/error toasts (using sonner)
  - Close dialog on success

- **Task 2.5**: Create ItemDetailView component
  - Display full-size image (enhanced or original)
  - Show all metadata fields in organized layout
  - Implement edit mode toggle
  - Make fields editable in edit mode (Input, Select, tag chips)
  - Add "Save Changes" button (visible in edit mode)
  - Add "Delete Item" button with confirmation dialog
  - Use shadcn components (Dialog, Button, Input, Badge for tags)
  - Implement keyboard accessibility (ESC to close, focus trap)

- **Task 2.6**: Create ClothingItemGrid component
  - Responsive grid layout (2-4 columns based on viewport)
  - Use Tailwind grid utilities
  - Implement loading skeleton states
  - Add infinite scroll or pagination
  - Handle empty state
  - Optimize with lazy loading for images

- **Task 2.7**: Create PrettifyResultView component
  - Display prettified image preview
  - Show two action buttons:
    * "Use AI Version" (primary button, accent color)
    * "Use Original" (secondary button, outline)
  - Include small text hint: "AI enhanced with white background"
  - Handle button clicks and return user's choice to parent
  - Show loading state while waiting for user decision
  - Accessible button labels and keyboard navigation

### Phase 3: Wardrobe Page Implementation
**Goal**: Create the main wardrobe page with full functionality

- **Task 3.1**: Create /wardrobe route structure
  - Create `app/(chat)/wardrobe/page.tsx`
  - Set up page layout with header
  - Add "Add Item" button in header
  - Implement responsive design

- **Task 3.2**: Implement data fetching with SWR/React Query
  - Fetch clothing items on page load
  - Implement caching strategy
  - Handle loading and error states
  - Add refetch on focus/reconnect

- **Task 3.3**: Integrate ClothingItemGrid with data
  - Map fetched items to ClothingItemCard components
  - Handle empty state with EmptyWardrobe component
  - Implement optimistic updates for mutations

- **Task 3.4**: Wire up AddItemDialog
  - Connect to POST /api/wardrobe endpoint
  - Handle image upload with progress
  - Implement form submission logic
  - Trigger grid refresh on success
  - Show toast notifications

- **Task 3.5**: Wire up ItemDetailView
  - Open on card click
  - Fetch item details if needed
  - Connect edit functionality to PATCH endpoint
  - Connect delete functionality to DELETE endpoint
  - Implement optimistic updates
  - Handle navigation/modal state

- **Task 3.6**: Add page-level error boundaries
  - Catch and display errors gracefully
  - Provide retry mechanisms
  - Log errors for monitoring

### Phase 4: Polish & Accessibility
**Goal**: Ensure production-ready quality and accessibility

- **Task 4.1**: Implement keyboard navigation
  - Grid items navigable with arrow keys
  - Tab order logical throughout page
  - Enter key opens detail view
  - ESC closes dialogs
  - Focus management in modals

- **Task 4.2**: Add ARIA attributes and labels
  - All form inputs have proper labels
  - Buttons have aria-labels
  - Dialogs have aria-describedby
  - Upload area has proper role and instructions
  - Screen reader announcements for dynamic content

- **Task 4.3**: Verify color contrast (WCAG AA)
  - Check all text against backgrounds
  - Ensure accent colors meet contrast ratios
  - Test in dark mode if applicable
  - Use color-blind friendly indicators

- **Task 4.4**: Optimize image loading
  - Implement lazy loading for grid images
  - Generate and use thumbnails (150x150px)
  - Add blur placeholder for images
  - Optimize image formats (WebP preferred)

- **Task 4.5**: Add loading states and skeletons
  - Grid loading skeleton
  - Form submission loading states
  - Image upload progress indicators
  - Disable buttons during async operations

- **Task 4.6**: Implement comprehensive error handling
  - Network failure recovery
  - File upload errors with retry
  - Form validation errors
  - 404 handling for missing items
  - User-friendly error messages

### Phase 5: Testing & Documentation
**Goal**: Ensure reliability and maintainability

- **Task 5.1**: Manual QA testing
  - Test all happy path scenarios from spec
  - Test error scenarios (file too large, network failure, etc.)
  - Test edge cases (100+ items, rapid clicks, etc.)
  - Test on multiple browsers and devices
  - Test keyboard-only navigation
  - Test with screen reader

- **Task 5.2**: Create component documentation
  - Document props and usage for each component
  - Add JSDoc comments
  - Create Storybook stories (optional)

- **Task 5.3**: Update README or docs
  - Document new wardrobe feature
  - Add setup instructions for storage bucket
  - Document environment variables
  - Add API endpoint documentation

- **Task 5.4**: Security review
  - Verify RLS policies are correct
  - Check for XSS vulnerabilities
  - Validate file upload security
  - Review API authentication
  - Test unauthorized access attempts

## Constitution Check

### Principle 1 (Streaming Graph Compatibility)
**N/A** - This feature does not interact with LangGraph streaming. It's a standalone CRUD feature using standard Next.js API routes and Supabase.

### Principle 2 (Tool Call Integrity)
**N/A** - No tool calls involved in this feature.

### Principle 3 (External UI & Artifacts)
**N/A** - This feature does not use the artifact system or external UI components from LangGraph.

### Principle 4 (Multimodal Constraints)
**Compliant** - Image upload component will enforce file type restrictions (JPEG, PNG, WebP only) and size limits (10MB max), similar to existing multimodal constraints. Client-side and server-side validation will prevent invalid uploads.

### Principle 5 (Config & Auth)
**Compliant** - Uses existing Supabase Auth for user authentication. All API routes will validate user sessions. No new public environment variables needed; uses existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Server-side operations use `SUPABASE_SERVICE_ROLE_KEY` for image deletion.

### Principle 6 (Error Handling & UX)
**Compliant** - Comprehensive error handling with toast notifications (using sonner). Upload progress indicators, loading states, and user-friendly error messages. Network failures will show retry options. Form validation prevents invalid submissions.

### Principle 7 (Versioning & Deps)
**Compliant** - Uses existing Next.js 15, React 19, TypeScript stack. No new major dependencies. Uses pnpm for package management. Leverages existing shadcn/ui components (Dialog, Button, Input, Select, Card, Badge, Switch). May add `react-dropzone` for drag-and-drop if not already present.

### Principle 8 (Privacy & Secrets)
**Compliant** - No new secrets exposed via `NEXT_PUBLIC_`. All user data protected by RLS policies. Images stored in private Supabase Storage bucket with authenticated access only. User IDs from auth session, never exposed or hardcoded.

### Principle 9 (Accessibility)
**Compliant** - Full keyboard navigation support. All form inputs have proper labels and ARIA attributes. Modal dialogs implement focus trap and ESC to close. Color contrast meets WCAG AA. Screen reader announcements for dynamic content. Grid items navigable with keyboard.

### Principle 10 (Observability)
**N/A** - No message streaming or hidden messages in this feature. Standard API logging can be added for monitoring.

## Gemini AI Integration Details

### API Setup
- **Service**: Google Gemini API (Imagen or Gemini Vision)
- **Endpoint**: `/api/wardrobe/prettify`
- **Authentication**: Server-side only (GEMINI_API_KEY in .env)
- **Model**: Gemini Pro Vision or Imagen 2

### Prompt Engineering
```
Transform this clothing item into a professional product photo with a clean white background, maintaining the item's original appearance, colors, and details. Remove any distracting background elements while preserving the clothing item's texture, color accuracy, and shape. The result should look like a high-quality e-commerce product photo.
```

### Implementation Flow
1. User uploads image and enables "Prettify with AI"
2. Frontend calls POST /api/wardrobe/prettify with image
3. Backend:
   - Validates image (type, size)
   - Converts image to base64 or buffer
   - Sends to Gemini API with prompt
   - Receives prettified image
   - Returns prettified image as base64 data URL
4. Frontend displays PrettifyResultView with prettified image
5. User clicks either "Use AI Version" or "Use Original"
6. Selected image is used in POST /api/wardrobe

### Cost Considerations
- Gemini API pricing: ~$0.0025 per image (check current pricing)
- Only charged when user enables prettify
- Consider rate limiting per user
- Monitor usage and costs via Google Cloud Console

### Error Handling
- Gemini API timeout: Fall back to original image
- API quota exceeded: Show error, allow original upload
- Invalid response: Log error, use original image
- Network failure: Retry once, then fall back

### Future Optimizations
- Cache prettified results (optional)
- Batch processing for multiple images
- A/B test different prompts for quality
- Add user feedback mechanism

## Risks / Mitigations

### Risk: Gemini API costs growing with usage
**Mitigation**:
- Monitor API usage and set budget alerts
- Implement per-user rate limiting (e.g., 10 prettifications per day)
- Make prettify opt-in (toggle off by default initially)
- Consider caching results for duplicate images
- Evaluate cost vs. value after initial rollout

### Risk: Gemini API latency affecting UX
**Mitigation**:
- Show clear loading state with progress indicator
- Set reasonable timeout (30 seconds)
- Allow user to cancel and use original
- Process asynchronously (don't block form submission)
- Consider WebSocket for real-time updates

### Risk: AI-generated images not meeting quality expectations
**Mitigation**:
- Always show side-by-side comparison
- User has final choice (original vs prettified)
- Iterate on prompt based on user feedback
- A/B test different prompts
- Collect user satisfaction data

### Risk: Large image uploads causing performance issues
**Mitigation**: 
- Enforce 10MB max file size client and server-side
- Implement client-side image compression before upload
- Use Supabase Storage's built-in optimization
- Generate and cache thumbnails (150x150px) for grid view
- Implement lazy loading for images

### Risk: Storage costs growing with user uploads
**Mitigation**:
- Set reasonable file size limits (10MB)
- Implement image compression/optimization
- Monitor storage usage via Supabase dashboard
- Consider cleanup policy for deleted items
- Future: Implement storage quotas per user if needed

### Risk: AI enhancement placeholder may confuse users
**Mitigation**:
- Clearly mark "Prettify with AI" as coming soon (TODO)
- Store flag in database for future implementation
- Provide clear messaging that feature is in development
- Or remove toggle entirely until AI service is ready

### Risk: RLS policies misconfigured leading to data leaks
**Mitigation**:
- Thoroughly test RLS policies with multiple users
- Use Supabase policy testing tools
- Implement security review checklist
- Test unauthorized access attempts
- Add automated tests for policy enforcement

### Risk: Concurrent edits causing data conflicts
**Mitigation**:
- Use optimistic updates with rollback on error
- Implement updated_at timestamp checking
- Show conflict resolution UI if needed
- Use Supabase real-time subscriptions for live updates (future enhancement)

### Risk: Form validation inconsistencies between client and server
**Mitigation**:
- Use shared Zod schema for validation
- Validate on both client (UX) and server (security)
- Keep validation logic DRY
- Test edge cases thoroughly

### Risk: Mobile camera capture not working on all devices
**Mitigation**:
- Provide fallback to standard file picker
- Test on multiple mobile browsers (Safari, Chrome, Firefox)
- Progressive enhancement approach
- Clear error messages if camera unavailable

## Rollout

### Phase 1: Development & Testing (Week 1-2)
- Complete database setup and API implementation
- Build core UI components
- Internal testing with development team
- Fix critical bugs

### Phase 2: Beta Testing (Week 3)
- Deploy to staging environment
- Invite small group of beta users
- Gather feedback on UX and performance
- Monitor error rates and storage usage
- Iterate based on feedback

### Phase 3: Gradual Rollout (Week 4)
- Deploy to production
- Enable for 10% of users initially
- Monitor key metrics:
  - Upload success rate
  - API response times
  - Error rates
  - User engagement (items added per user)
  - Storage usage
- Gradually increase to 50%, then 100%

### Feature Flags
- `ENABLE_WARDROBE_FEATURE`: Master toggle for entire feature
- `ENABLE_AI_PRETTIFY`: Toggle for AI enhancement (disabled until implemented)
- Implement using environment variables or feature flag service

### Monitoring
- Track API endpoint performance (response times, error rates)
- Monitor Supabase Storage usage and costs
- Set up alerts for:
  - Upload failure rate > 5%
  - API response time > 2s
  - Storage bucket approaching quota
- Log user actions for analytics (items added, edited, deleted)

### Rollback Plan
- Keep feature flag to disable quickly if critical issues arise
- Database migrations are reversible (create down migration)
- Storage bucket can be paused/made read-only
- API endpoints can be disabled via middleware
- Document rollback procedure in runbook

### Success Metrics
- 80%+ of users add at least one clothing item within first week
- Upload success rate > 95%
- Average page load time < 1.5s
- Zero critical security issues
- Positive user feedback (NPS > 40)

### Post-Launch
- Gather user feedback via in-app survey
- Monitor support tickets for common issues
- Plan Phase 2 features:
  - AI image enhancement integration
  - AI metadata extraction
  - Advanced search and filtering
  - Outfit creation from wardrobe items
