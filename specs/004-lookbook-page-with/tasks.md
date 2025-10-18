---
# Lookbook Page with Avatar Generation - Implementation Tasks
---

# Task List: Lookbook Avatar Generation Feature

## Overview
This task list implements a `/lookbook` page with multi-step avatar generation from head/body images and measurements. The feature uses Gemini 2.5 Flash Image for AI-powered avatar composition and stores results in Supabase Storage + PostgreSQL.

**Key Requirements:**
- Required: Head image, body image, height (cm), weight (kg)
- Optional: Body shape, detailed measurements (chest, waist, hips, etc.)
- Skip button for optional measurements
- Regeneration with user feedback
- Supabase Storage bucket with RLS policies

---

## Phase 0: Setup & Infrastructure

### T001 [P] [X] - Create Supabase Storage Bucket for Avatars
**File:** Supabase Dashboard or migration
**Description:** Create `avatars` storage bucket with proper configuration
**Status:** ✅ COMPLETED - Added to 20251018_lookbook_schema.sql migration
**Tasks:**
- Create bucket named `avatars` in Supabase
- Set bucket to private (authenticated access only)
- Configure file size limit: 10MB
- Set allowed MIME types: image/jpeg, image/png, image/webp
- Create RLS policy: Users can upload to `{user_id}/` folder
- Create RLS policy: Users can read from `{user_id}/` folder
- Create RLS policy: Users can update files in `{user_id}/` folder

**SQL for RLS Policies:**
```sql
-- Insert policy
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Select policy
CREATE POLICY "Users can view their own avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update policy
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Verification:**
- Upload test image via Supabase client
- Verify RLS prevents cross-user access
- Confirm file size limit enforcement

---

### T002 [P] [X] - Define TypeScript Types for Lookbook
**File:** `types/lookbook.ts`
**Description:** Create type definitions for avatar data structures
**Status:** ✅ COMPLETED - Created types/lookbook.ts with all interfaces and schemas
**Tasks:**
- Create `Avatar` interface matching database schema
- Create `AvatarMeasurements` interface for JSONB measurements field
- Create `GenerateAvatarData` interface for API request
- Create `GenerateAvatarResponse` interface for API response
- Create `SaveAvatarData` interface for save request
- Export all types

**Type Definitions:**
```typescript
export interface AvatarMeasurements {
  height_cm: number;
  weight_kg: number;
  body_shape?: 'rectangle' | 'triangle' | 'inverted_triangle' | 'hourglass' | 'oval';
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  shoulder_width_cm?: number;
  inseam_cm?: number;
}

export interface Avatar {
  user_id: string;
  image_url: string;
  height_cm: number | null;
  weight_kg: number | null;
  body_shape: string | null;
  measurements: AvatarMeasurements | null;
  preferences: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface GenerateAvatarData {
  headImage: File;
  bodyImage: File;
  measurements: AvatarMeasurements;
  regenerationNote?: string;
}

export interface GenerateAvatarResponse {
  avatarImage: string; // data URL
  headImage: string;   // data URL
  bodyImage: string;   // data URL
}

export interface SaveAvatarData {
  avatarImageDataUrl: string;
  measurements: AvatarMeasurements;
}
```

**Verification:**
- TypeScript compiles without errors
- Types match database schema
- All required fields are non-optional

---

## Phase 1: Backend API Routes

### T003 [X] - Implement Generate Avatar API Route
**File:** `app/api/lookbook/generate-avatar/route.ts`
**Description:** Create API endpoint for AI-powered avatar generation using Gemini
**Status:** ✅ COMPLETED - Created generate-avatar API route with Gemini integration
**Dependencies:** T002
**Tasks:**
- Create route file with POST handler
- Import Gemini SDK (`@google/genai`)
- Parse FormData: headImage, bodyImage, measurements, regenerationNote
- Verify user authentication via Supabase `getUser()`
- Validate file types (JPEG, PNG, WebP) and sizes (max 10MB)
- Validate required measurements: height_cm, weight_kg
- Convert images to base64
- Construct Gemini prompt:
  - "Create a realistic full-body avatar by combining this head photo and body photo."
  - Include measurements in prompt
  - Include regeneration note if provided
- Call Gemini 2.5 Flash Image model
- Extract generated image from response
- Return JSON with avatarImage, headImage, bodyImage as data URLs
- Handle errors: 401 (auth), 400 (validation), 503 (Gemini down), 500 (server)
- Add timeout handling (30 seconds)

**Reference:** `app/api/wardrobe/prettify/route.ts` for Gemini integration pattern

**Verification:**
- Test with valid head/body images → returns generated avatar
- Test with missing auth → 401 error
- Test with invalid file type → 400 error
- Test with oversized file → 400 error
- Test with missing required measurements → 400 error
- Test regeneration with feedback note → includes note in prompt

---

### T004 [X] - Implement Avatar Storage API Route (POST)
**File:** `app/api/lookbook/avatar/route.ts`
**Description:** Create API endpoint to save avatar to storage and database
**Status:** ✅ COMPLETED - Created POST handler for avatar storage
**Dependencies:** T001, T002, T003
**Tasks:**
- Create route file with POST handler
- Import Supabase server client
- Parse JSON request: avatarImageDataUrl, measurements
- Verify user authentication
- Validate required measurements: height_cm, weight_kg
- Convert data URL to Blob
- Upload to Supabase Storage: `avatars/{user_id}/avatar.png`
- Get public/signed URL from storage
- Upsert to `avatars` table:
  ```sql
  INSERT INTO avatars (user_id, image_url, height_cm, weight_kg, body_shape, measurements)
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    image_url = EXCLUDED.image_url,
    height_cm = EXCLUDED.height_cm,
    weight_kg = EXCLUDED.weight_kg,
    body_shape = EXCLUDED.body_shape,
    measurements = EXCLUDED.measurements,
    updated_at = NOW()
  ```
- Return success response with avatar data
- Handle errors: 401 (auth), 400 (validation), 500 (storage/db failure)

**Verification:**
- Test save → avatar appears in storage bucket
- Test save → database record created/updated
- Test upsert → second save updates existing record
- Test RLS → user can only save their own avatar

---

### T005 [P] [X] - Implement Avatar Fetch API Route (GET)
**File:** `app/api/lookbook/avatar/route.ts`
**Description:** Add GET handler to fetch user's existing avatar
**Status:** ✅ COMPLETED - Created GET handler for avatar retrieval
**Dependencies:** T002
**Tasks:**
- Add GET export to existing route file
- Verify user authentication
- Query `avatars` table for user's avatar:
  ```sql
  SELECT * FROM avatars WHERE user_id = $1
  ```
- Return avatar data or null if not found
- Handle errors: 401 (auth), 500 (db failure)

**Verification:**
- Test with existing avatar → returns avatar data
- Test with no avatar → returns null
- Test without auth → 401 error
- Test RLS → user can only fetch their own avatar

---

## Phase 2: Frontend Hook & State Management

### T006 [P] [X] - Create useLookbook Hook
**File:** `hooks/use-lookbook.ts`
**Description:** Create reusable hook for avatar operations (follows useWardrobe pattern)
**Status:** ✅ COMPLETED - Created useLookbook hook with all methods
**Dependencies:** T002, T004, T005
**Tasks:**
- Create hook with state: avatar, loading, error, generating, saving
- Import Supabase client for auth
- Implement `fetchAvatar()`:
  - GET request to `/api/lookbook/avatar`
  - Update avatar state
  - Handle errors with user-friendly messages
- Implement `generateAvatar(data: GenerateAvatarData)`:
  - Create FormData with headImage, bodyImage, measurements
  - POST to `/api/lookbook/generate-avatar`
  - Return GenerateAvatarResponse
  - Handle errors with timeouts
- Implement `saveAvatar(data: SaveAvatarData)`:
  - POST JSON to `/api/lookbook/avatar`
  - Update avatar state
  - Trigger refetch
  - Handle errors
- Add useEffect to fetch avatar on mount
- Export hook with all methods and state

**Verification:**
- Hook fetches avatar on mount
- generateAvatar returns response correctly
- saveAvatar updates state and refetches
- Error states are set properly
- Loading states work correctly

---

## Phase 3: Avatar Generation Dialog Component

### T007 [X] - Create Avatar Generation Dialog Structure
**File:** `components/lookbook/avatar-generation-dialog.tsx`
**Description:** Build multi-step dialog shell with navigation
**Status:** ✅ COMPLETED - Created comprehensive multi-step dialog component
**Dependencies:** T002, T006
**Tasks:**
- Create dialog component with props: open, onClose, onSave, existingAvatar
- Implement state:
  - currentStep (1-4)
  - headImage (File | null)
  - headImagePreview (string | null)
  - bodyImage (File | null)
  - bodyImagePreview (string | null)
  - measurements (AvatarMeasurements)
  - generatedAvatar (string | null)
  - regenerationNote (string)
  - isGenerating (boolean)
- Implement step navigation:
  - handleNext() with validation
  - handleBack()
  - handleSkip() for measurements step
- Render Dialog with conditional step content
- Add progress indicator (optional)

**Verification:**
- Dialog opens/closes correctly
- Step navigation works
- State persists across steps
- Dialog resets on close

---

### T008 [P] [X] - Implement Step 1: Head Image Upload
**File:** `components/lookbook/avatar-generation-dialog.tsx`
**Description:** Add head image upload UI with validation
**Status:** ✅ COMPLETED - Included in dialog component
**Dependencies:** T007
**Tasks:**
- Create file input with drag-and-drop support
- Add image preview after selection
- Implement validation:
  - File type: JPEG, PNG, WebP only
  - File size: max 10MB
  - Display error messages
- Add "Remove Image" button
- Add "Next" button (disabled until valid image selected)
- Handle file selection and preview generation
- Clear preview on remove

**Verification:**
- Drag-and-drop works
- File input works
- Preview displays correctly
- Validation errors show for invalid files
- Next button enables only with valid image

---

### T009 [P] [X] - Implement Step 2: Body Image Upload
**File:** `components/lookbook/avatar-generation-dialog.tsx`
**Description:** Add body image upload UI (reuse Step 1 logic)
**Status:** ✅ COMPLETED - Included in dialog component
**Dependencies:** T007
**Tasks:**
- Reuse file input component/logic from Step 1
- Add image preview for body image
- Apply same validation rules
- Add "Back" and "Next" buttons
- Handle file selection and preview
- Clear preview on remove

**Verification:**
- File upload works same as Step 1
- Preview displays correctly
- Back button returns to Step 1
- Next button enables only with valid image

---

### T010 [X] - Implement Step 3: Measurements Form
**File:** `components/lookbook/avatar-generation-dialog.tsx`
**Description:** Add measurements form with required/optional fields
**Status:** ✅ COMPLETED - Included in dialog component with skip button
**Dependencies:** T007
**Tasks:**
- Install/import react-hook-form and zod
- Create form schema with zod:
  - height_cm: required, positive number
  - weight_kg: required, positive number
  - body_shape: optional string
  - chest_cm, waist_cm, hips_cm, shoulder_width_cm, inseam_cm: optional numbers
- Add required fields section:
  - Height (cm) input with validation
  - Weight (kg) input with validation
- Add optional fields section with notice:
  - Notice: "These measurements help us generate more accurate sizing recommendations"
  - Body shape select dropdown
  - Chest/Bust, Waist, Hips, Shoulder, Inseam inputs
- Add buttons:
  - "Back" → previous step
  - "Skip" → proceed with only height/weight
  - "Generate Avatar" → validate and proceed
- Display inline validation errors for required fields
- Handle form submission

**Verification:**
- Required fields validate correctly
- Optional fields are truly optional
- Skip button bypasses optional fields
- Generate button validates required fields only
- Validation errors display inline
- Form data updates state correctly

---

### T011 [X] - Implement Step 4: Avatar Preview & Regeneration
**File:** `components/lookbook/avatar-generation-dialog.tsx`
**Description:** Add avatar preview with regeneration and save functionality
**Status:** ✅ COMPLETED - Included in dialog component
**Dependencies:** T006, T007, T010
**Tasks:**
- Trigger avatar generation when entering step 4:
  - Call useLookbook.generateAvatar() with images and measurements
  - Show loading state: spinner + "Generating your avatar..." message
- Display generated avatar image when ready
- Add regeneration section:
  - Textarea for user feedback/notes
  - "Regenerate" button
  - Show loading state during regeneration
  - Call generateAvatar again with regeneration note
- Add action buttons:
  - "Save Avatar" (primary) → calls onSave callback
  - "Cancel" (secondary) → closes dialog
- Handle save success:
  - Show success toast
  - Close dialog
  - Trigger parent refetch
- Handle errors:
  - Display error message
  - Allow retry or cancel

**Verification:**
- Generation starts automatically on step 4
- Loading state displays during generation
- Generated avatar displays correctly
- Regeneration with feedback works
- Save button persists avatar
- Success toast appears
- Dialog closes after save
- Error handling works

---

## Phase 4: Lookbook Page

### T012 [X] - Create Lookbook Page Structure
**File:** `app/lookbook/page.tsx`
**Description:** Create main lookbook page with layout matching wardrobe page
**Status:** ✅ COMPLETED - Created lookbook page with full layout
**Dependencies:** T006, T011
**Tasks:**
- Create page component with 'use client' directive
- Import ChatHeader, useChatSidebar, useLookbook
- Add state for dialog open/close
- Implement layout:
  - ChatHeader with sidebar toggle
  - Title section with gradient "Your Lookbook" heading
  - Blob SVG background decoration (reuse from wardrobe)
  - Main content area
- Add router for navigation
- Handle sidebar toggle
- Export page component

**Reference:** `app/wardrobe/page.tsx` for layout pattern

**Verification:**
- Page renders without errors
- ChatHeader displays correctly
- Sidebar toggle works
- Layout matches wardrobe page style
- Navigation works

---

### T013 [P] [X] - Implement Empty State for Lookbook
**File:** `app/lookbook/page.tsx`
**Description:** Add empty state when no avatar exists
**Status:** ✅ COMPLETED - Included in page with avatar icon and CTA
**Dependencies:** T012
**Tasks:**
- Import Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription components
- Create empty state section:
  - Avatar placeholder illustration/icon
  - Title: "Create Your Avatar"
  - Description: "Get started by creating your personalized avatar to visualize outfits"
  - "Create Avatar" button
- Show empty state when avatar is null
- Connect button to open dialog

**Verification:**
- Empty state displays when no avatar
- Illustration/icon displays correctly
- Button opens dialog
- Text is clear and helpful

---

### T014 [P] [X] - Implement Avatar Display Section
**File:** `app/lookbook/page.tsx`
**Description:** Add avatar display when avatar exists
**Status:** ✅ COMPLETED - Included with measurements cards and formatting
**Dependencies:** T012
**Tasks:**
- Create avatar display section:
  - Large avatar image display (Image component with proper sizing)
  - Measurements summary card:
    - Height, weight, body shape (if available)
    - Collapsible section for detailed measurements
  - Last updated timestamp (formatted)
  - "Update Avatar" button
- Show avatar display when avatar exists
- Connect "Update Avatar" button to open dialog
- Format measurements for display
- Handle missing optional measurements gracefully

**Verification:**
- Avatar image displays correctly
- Measurements summary shows all data
- Timestamp is formatted properly
- Update button opens dialog
- Missing optional fields don't break UI

---

### T015 [X] - Integrate Avatar Generation Dialog
**File:** `app/lookbook/page.tsx`
**Description:** Connect dialog to page with proper callbacks
**Status:** ✅ COMPLETED - Dialog fully integrated with save/generate callbacks
**Dependencies:** T011, T012
**Tasks:**
- Import AvatarGenerationDialog component
- Add dialog state management
- Implement handleCreateAvatar:
  - Open dialog
  - Reset any previous state
- Implement handleSaveAvatar:
  - Call useLookbook.saveAvatar()
  - Show success toast
  - Close dialog
  - Refetch avatar
- Handle dialog close:
  - Reset dialog state
  - Clear any temporary data
- Pass proper props to dialog:
  - open, onClose, onSave, existingAvatar
- Add error handling with toasts

**Verification:**
- Dialog opens from "Create Avatar" button
- Dialog opens from "Update Avatar" button
- Save callback works correctly
- Success toast appears
- Avatar refetches after save
- Error toasts display on failure
- Dialog closes properly

---

## Phase 5: Testing & Polish

### T016 [P] - Manual Testing: Happy Path
**Description:** Test complete avatar creation flow
**Dependencies:** T015
**Tasks:**
- Navigate to `/lookbook`
- Click "Create Avatar" button
- Upload valid head image (JPEG, < 10MB)
- Verify preview displays
- Click "Next"
- Upload valid body image
- Verify preview displays
- Click "Next"
- Enter height: 175, weight: 70
- Optionally fill body shape and measurements
- Click "Generate Avatar"
- Wait for generation (verify loading state)
- Verify generated avatar displays
- Click "Save Avatar"
- Verify success toast
- Verify dialog closes
- Verify avatar displays on main page

**Expected:** Complete flow works without errors

---

### T017 [P] - Manual Testing: Regeneration Flow
**Description:** Test avatar regeneration with feedback
**Dependencies:** T015
**Tasks:**
- Complete happy path up to preview step
- Enter regeneration note: "Make proportions more accurate"
- Click "Regenerate"
- Verify loading state
- Verify new avatar generates
- Click "Save Avatar"
- Verify success

**Expected:** Regeneration incorporates feedback

---

### T018 [P] - Manual Testing: Skip Measurements
**Description:** Test skipping optional measurements
**Dependencies:** T015
**Tasks:**
- Start avatar creation
- Upload head and body images
- On measurements step, enter only height and weight
- Click "Skip"
- Verify avatar generates with minimal data
- Save avatar
- Verify measurements show only height/weight

**Expected:** Skip button works, avatar generates with required fields only

---

### T019 [P] - Manual Testing: Validation Errors
**Description:** Test all validation scenarios
**Dependencies:** T015
**Tasks:**
- Try uploading 15MB image → verify error message
- Try uploading PDF file → verify error message
- Try leaving height empty → verify error message
- Try entering negative weight → verify error message
- Try proceeding without images → verify disabled buttons

**Expected:** All validations work with clear error messages

---

### T020 [P] - Manual Testing: Update Existing Avatar
**Description:** Test updating an existing avatar
**Dependencies:** T015
**Tasks:**
- Create initial avatar
- Click "Update Avatar" button
- Upload new images
- Enter new measurements
- Generate and save
- Verify old avatar is replaced
- Verify database shows updated timestamp

**Expected:** Update replaces existing avatar

---

### T021 [P] - Accessibility Testing
**Description:** Verify keyboard navigation and screen reader support
**Dependencies:** T015
**Tasks:**
- Navigate dialog using only keyboard (Tab, Shift+Tab, Enter, Escape)
- Verify focus trap in dialog
- Verify Escape closes dialog
- Verify focus returns to trigger button after close
- Test with screen reader:
  - Verify step announcements
  - Verify form field labels
  - Verify error messages are announced
  - Verify loading states are announced
- Check color contrast ratios
- Verify all images have alt text

**Expected:** Full keyboard accessibility, screen reader support

---

### T022 [P] - Error Handling Testing
**Description:** Test error scenarios and recovery
**Dependencies:** T015
**Tasks:**
- Simulate Gemini API failure → verify error message
- Simulate network timeout → verify timeout error
- Simulate storage upload failure → verify error message
- Simulate database failure → verify error message
- Verify retry options work
- Verify errors don't crash app

**Expected:** All errors handled gracefully with clear messages

---

### T023 [P] - Mobile Responsiveness Testing
**Description:** Test on mobile devices and small screens
**Dependencies:** T015
**Tasks:**
- Test on mobile viewport (375px width)
- Verify dialog is usable on mobile
- Verify image uploads work on mobile
- Verify form inputs are touch-friendly
- Verify buttons are appropriately sized
- Test on tablet viewport (768px width)

**Expected:** Feature works well on all screen sizes

---

## Parallel Execution Guide

### Group 1: Setup (Run First)
```bash
# These can run in parallel
Task T001 & Task T002
```

### Group 2: Backend APIs (After Setup)
```bash
# T003 can run independently
Task T003

# T004 and T005 can run in parallel after T003
Task T004 & Task T005
```

### Group 3: Frontend Hook (After APIs)
```bash
Task T006
```

### Group 4: Dialog Components (After Hook)
```bash
# T007 must run first (dialog structure)
Task T007

# Then these can run in parallel
Task T008 & Task T009

# T010 must run after T008/T009
Task T010

# T011 must run after T010
Task T011
```

### Group 5: Page Components (After Dialog)
```bash
# T012 must run first
Task T012

# Then these can run in parallel
Task T013 & Task T014

# T015 must run after all page components
Task T015
```

### Group 6: Testing (After Implementation)
```bash
# All testing tasks can run in parallel
Task T016 & Task T017 & Task T018 & Task T019 & Task T020 & Task T021 & Task T022 & Task T023
```

---

## Summary

**Total Tasks:** 23
- Setup: 2 tasks
- Backend: 3 tasks
- Frontend Hook: 1 task
- Dialog Components: 5 tasks
- Page Components: 4 tasks
- Testing: 8 tasks

**Estimated Effort:** 2-3 days for experienced developer

**Critical Path:**
T001/T002 → T003 → T004 → T006 → T007 → T008/T009 → T010 → T011 → T012 → T013/T014 → T015 → Testing

**Key Deliverables:**
1. Supabase Storage bucket with RLS policies
2. Two API routes (generate-avatar, avatar)
3. useLookbook hook for state management
4. Multi-step avatar generation dialog
5. Lookbook page with empty state and avatar display
6. Comprehensive test coverage
