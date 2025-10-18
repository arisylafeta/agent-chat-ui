---
# Feature Spec: Lookbook Page with Avatar Generation
---

# Lookbook Page with Avatar Generation

## Overview

### Problem
Users need a way to create personalized avatars from their photos and body measurements to visualize how clothing items will look on them. Currently, there's no mechanism for users to generate and manage their digital avatar within the application.

### Goals
- Create a dedicated `/lookbook` page for avatar generation and management
- Implement a multi-step dialog for collecting head image, body image, and body measurements
- Integrate AI-powered avatar generation using Gemini 2.5 Flash Image model
- Allow users to preview, regenerate with feedback, and save their avatar
- Store avatar data in the `avatars` table with associated measurements

### Non-Goals
- Creating or managing lookbooks (outfit collections) - this will come later
- Displaying existing lookbooks or outfit recommendations
- Social sharing features for avatars
- Advanced avatar editing or customization beyond regeneration
- Integration with wardrobe items at this stage

## User Stories

- As a user, I want to upload a photo of my head so that my avatar has an accurate representation of my face
- As a user, I want to upload a photo of my body so that my avatar reflects my body type
- As a user, I want to input my body measurements so that the avatar generation is more accurate
- As a user, I want to preview my generated avatar before saving it so that I can ensure it looks correct
- As a user, I want to regenerate my avatar with additional notes if I'm not satisfied with the initial result
- As a user, I want to save my avatar so that I can use it for future lookbook features

## Requirements

### Functional

#### Page Structure
- Create `/app/lookbook/page.tsx` using the same layout pattern as `/app/wardrobe/page.tsx`
- Include `ChatHeader` component for navigation consistency
- Display page title "Your Lookbook" with gradient accent styling
- Include a prominent "Create Avatar" button to trigger the multi-step dialog

#### Multi-Step Dialog
- **Step 1: Head Image Upload**
  - File input for head/face photo
  - Image preview after selection
  - Validation: JPEG, PNG, WebP only, max 10MB
  - "Next" button to proceed to step 2
  
- **Step 2: Body Image Upload**
  - File input for full body or torso photo
  - Image preview after selection
  - Same validation as step 1
  - "Back" and "Next" buttons for navigation
  
- **Step 3: Body Measurements**
  - Form fields based on `avatars.measurements` JSONB schema:
    - **Required fields:**
      - Height (cm) - numeric input (REQUIRED)
      - Weight (kg) - numeric input (REQUIRED)
    - **Optional fields with sizing notice:**
      - Notice: "These measurements help us generate more accurate sizing recommendations"
      - Body shape - select dropdown (e.g., "rectangle", "triangle", "inverted_triangle", "hourglass", "oval")
      - Chest/Bust (cm)
      - Waist (cm)
      - Hips (cm)
      - Shoulder width (cm)
      - Inseam (cm)
  - "Back", "Skip", and "Generate Avatar" buttons
  - "Skip" button allows bypassing optional measurements (only height/weight required)
  
- **Step 4: Avatar Preview**
  - Display generated avatar image
  - Show loading state during generation (with spinner and message)
  - "Regenerate" button with optional feedback textarea
  - "Save Avatar" button to persist to database
  - "Cancel" button to close dialog

#### Avatar Generation API
- Create `/app/api/lookbook/generate-avatar/route.ts`
- Accept POST request with FormData:
  - `headImage`: File (head photo)
  - `bodyImage`: File (body photo)
  - `measurements`: JSON string (body measurements object)
  - `regenerationNote`: string (optional, for regeneration requests)
- Use Gemini 2.5 Flash Image model to combine images
- Prompt structure:
  ```
  Create a realistic full-body avatar by combining this head photo and body photo. 
  Maintain accurate proportions based on these measurements: [measurements].
  The avatar should be front-facing, well-lit, against a neutral background.
  Style: photorealistic, professional.
  [If regenerationNote exists: "User feedback: {regenerationNote}"]
  ```
- Return JSON response:
  ```typescript
  {
    avatarImage: string; // base64 data URL
    headImage: string;   // original head image as data URL
    bodyImage: string;   // original body image as data URL
  }
  ```
- Handle errors gracefully with fallback responses

#### Avatar Storage
- On "Save Avatar", make POST request to `/app/api/lookbook/avatar/route.ts`
- Upload avatar image to Supabase Storage bucket `avatars` with path: `{user_id}/avatar.png`
- Insert/update record in `avatars` table:
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
- Return success/error response

#### Empty State
- When no avatar exists, show empty state with:
  - Illustration or icon
  - Title: "Create Your Avatar"
  - Description: "Get started by creating your personalized avatar to visualize outfits"
  - "Create Avatar" button

#### Existing Avatar Display
- If avatar exists, display it prominently on the page
- Show avatar image with measurements summary
- Include "Update Avatar" button to trigger the dialog again
- Show last updated timestamp

### Non-Functional

#### Performance
- Image uploads should show progress indicators
- Avatar generation should complete within 30 seconds or show timeout error
- Optimize image sizes before upload (client-side compression if needed)
- Use lazy loading for avatar preview images

#### Accessibility
- All form inputs must have proper labels and ARIA attributes
- Dialog must be keyboard navigable (Tab, Shift+Tab, Escape to close)
- Focus management: trap focus within dialog, return focus on close
- Image upload buttons must have descriptive text for screen readers
- Loading states must announce to screen readers
- Error messages must be associated with form fields

#### Security/Privacy
- Validate file types and sizes on both client and server
- Sanitize all user inputs (measurements, regeneration notes)
- Ensure RLS policies prevent users from accessing other users' avatars
- Use authenticated Supabase client for all database operations
- Store images in user-specific storage paths
- Do not expose raw API keys in client code

## API / Contracts

### Backend Endpoints

#### POST `/api/lookbook/generate-avatar`
**Request (FormData):**
```typescript
{
  headImage: File;
  bodyImage: File;
  measurements: string; // JSON stringified object
  regenerationNote?: string;
}
```

**Response:**
```typescript
{
  avatarImage: string; // data URL
  headImage: string;   // data URL
  bodyImage: string;   // data URL
}
```

**Error Response:**
```typescript
{
  error: string;
}
```

#### POST `/api/lookbook/avatar`
**Request (JSON):**
```typescript
{
  avatarImageDataUrl: string;
  measurements: {
    height_cm?: number;
    weight_kg?: number;
    body_shape?: string;
    chest_cm?: number;
    waist_cm?: number;
    hips_cm?: number;
    shoulder_width_cm?: number;
    inseam_cm?: number;
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  avatar: {
    user_id: string;
    image_url: string;
    height_cm: number;
    weight_kg: number;
    body_shape: string;
    measurements: object;
    created_at: string;
    updated_at: string;
  };
}
```

#### GET `/api/lookbook/avatar`
**Response:**
```typescript
{
  avatar: {
    user_id: string;
    image_url: string;
    height_cm: number;
    weight_kg: number;
    body_shape: string;
    measurements: object;
    created_at: string;
    updated_at: string;
  } | null;
}
```

### Database Schema

The `avatars` table (already created in migration `20251018_lookbook_schema.sql`):
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

### Component Contracts

#### `AvatarGenerationDialog` Component
```typescript
interface AvatarGenerationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (avatarData: AvatarData) => Promise<void>;
  existingAvatar?: Avatar | null;
}
```

#### `useLookbook` Hook
```typescript
interface UseLookbookReturn {
  avatar: Avatar | null;
  loading: boolean;
  error: string | null;
  generateAvatar: (data: GenerateAvatarData) => Promise<GenerateAvatarResponse>;
  saveAvatar: (data: SaveAvatarData) => Promise<void>;
  fetchAvatar: () => Promise<void>;
}
```

## Configuration

### Environment Variables

**Required:**
- `GEMINI_API_KEY` - Google Gemini API key for avatar generation
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

**Supabase Storage:**
- Bucket name: `avatars`
- Public access: No (authenticated users only)
- File size limit: 10MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

### Auth Mode
- Use Supabase Auth with RLS policies
- All API routes must verify user authentication via `supabase.auth.getUser()`
- Client-side requests use authenticated Supabase client from `@/utils/supabase/client`

## Acceptance Criteria

- [ ] `/lookbook` page renders with consistent layout matching wardrobe page
- [ ] "Create Avatar" button opens multi-step dialog
- [ ] Step 1 accepts head image upload with validation and preview
- [ ] Step 2 accepts body image upload with validation and preview
- [ ] Step 3 displays measurement form with all required fields
- [ ] "Generate Avatar" button triggers API call with loading state
- [ ] Generated avatar displays in preview step with clear image
- [ ] "Regenerate" button allows user to add feedback and regenerate
- [ ] "Save Avatar" button persists avatar to database and storage
- [ ] Saved avatar displays on main lookbook page with measurements
- [ ] "Update Avatar" button allows editing existing avatar
- [ ] All form validations work correctly (file types, sizes, required fields)
- [ ] Error messages display clearly for failed uploads or generation
- [ ] Dialog is keyboard accessible and focus is managed properly
- [ ] Loading states are clear and informative
- [ ] Success/error toasts appear after save operations
- [ ] RLS policies prevent unauthorized access to avatars
- [ ] Images are stored securely in user-specific storage paths

## QA Scenarios

### Happy Path
1. User navigates to `/lookbook`
2. Clicks "Create Avatar" button
3. Uploads valid head image in step 1, sees preview, clicks "Next"
4. Uploads valid body image in step 2, sees preview, clicks "Next"
5. Fills in measurements (height, weight, body shape), clicks "Generate Avatar"
6. Sees loading spinner for 5-10 seconds
7. Generated avatar appears in preview
8. Clicks "Save Avatar"
9. Success toast appears
10. Dialog closes
11. Avatar displays on main lookbook page with measurements

### Regeneration Flow
1. User completes happy path up to preview step
2. User is not satisfied with generated avatar
3. Clicks "Regenerate" button
4. Enters feedback: "Make the proportions more accurate"
5. Clicks "Regenerate" button
6. New avatar generates with feedback incorporated
7. User is satisfied and clicks "Save Avatar"

### Update Existing Avatar
1. User has previously saved avatar
2. Navigates to `/lookbook`
3. Sees existing avatar displayed
4. Clicks "Update Avatar" button
5. Dialog opens with empty form (fresh start)
6. User uploads new images and measurements
7. Generates and saves new avatar
8. Old avatar is replaced in database and storage

### Validation Errors
1. User tries to upload 15MB image → Error: "File size exceeds 10MB limit"
2. User tries to upload PDF file → Error: "Invalid file type. Only JPEG, PNG, and WebP are allowed"
3. User leaves height field empty → Error: "Height is required"
4. User enters negative weight → Error: "Weight must be a positive number"

### API Failures
1. Gemini API is down → Fallback error message: "Avatar generation service is temporarily unavailable. Please try again later."
2. Supabase storage upload fails → Error: "Failed to save avatar image. Please try again."
3. Database insert fails → Error: "Failed to save avatar data. Please try again."

### Network Issues
1. User loses internet connection during upload → Error: "Network error. Please check your connection and try again."
2. Request times out after 30 seconds → Error: "Avatar generation timed out. Please try again with smaller images."

### Accessibility
1. User navigates dialog using only keyboard (Tab, Shift+Tab, Enter, Escape)
2. Screen reader announces each step and form field
3. Error messages are read by screen reader
4. Loading states announce "Generating avatar, please wait"
5. Focus returns to "Create Avatar" button after dialog closes
