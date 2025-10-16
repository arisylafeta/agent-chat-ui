---
# Wardrobe Management Feature Specification
---

# Wardrobe Management System

## Overview

### Problem
Users need a centralized way to catalog and manage their clothing items within the platform. Currently, there's no system for users to upload, organize, and track their wardrobe, which limits the platform's ability to provide personalized outfit recommendations and styling assistance.

### Goals
- Enable users to upload and catalog their clothing items with images
- Provide AI-powered image enhancement to create professional product shots
- Allow rich metadata capture for each clothing item (manual and AI-assisted)
- Create an intuitive interface for browsing, searching, and managing wardrobe items
- Support detailed item editing and deletion capabilities
- Integrate seamlessly with existing sidebar navigation

### Non-Goals
- Outfit creation/combination features (future phase)
- Social sharing of wardrobe items (future phase)
- Wardrobe analytics/insights (future phase)
- Multi-user wardrobe sharing (future phase)

## User Stories

- As a user, I want to upload photos of my clothing items so that I can build a digital wardrobe
- As a user, I want to capture or upload images from my camera/device so that I can quickly add items
- As a user, I want AI to enhance my clothing photos so that they look professional and consistent
- As a user, I want to add basic information (name, category, brand) so that I can organize my items
- As a user, I want the system to automatically extract metadata (colors, fabrics, seasons) so that I don't have to manually tag everything
- As a user, I want to view all my clothing items in a grid layout so that I can browse my wardrobe visually
- As a user, I want to click on an item to see full details so that I can review all information
- As a user, I want to edit item details so that I can keep my wardrobe information accurate
- As a user, I want to delete items I no longer own so that my wardrobe stays current
- As a user, I want an empty state with guidance when I have no items so that I know what to do next

## Requirements

### Functional

#### Database Schema
- Create `clothing_items` table with fields:
  - `id` (UUID, primary key)
  - `user_id` (UUID, foreign key to auth.users)
  - `name` (text, required)
  - `category` (text, required) - e.g., "shirt", "pants", "shoes", "dress", "jacket"
  - `brand` (text, optional)
  - `image_url` (text, required) - stored image (original or AI-prettified based on user choice)
  - `colors` (text[], optional) - array of color tags
  - `fabrics` (text[], optional) - e.g., "cotton", "wool", "polyester"
  - `seasons` (text[], optional) - e.g., "spring", "summer", "fall", "winter"
  - `tags` (text[], optional) - custom user tags
  - `price` (numeric, optional)
  - `dress_codes` (text[], optional) - e.g., "casual", "business", "formal"
  - `gender` (text, optional) - e.g., "men", "women", "unisex"
  - `size` (text, optional)
  - `notes` (text, optional)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
- Add RLS policies for user-specific access
- Create indexes on `user_id`, `category`, and `created_at`

#### Navigation Integration
- Add "Wardrobe" menu item to `app-sidebar.tsx`
- Link to `/wardrobe` route
- Use appropriate icon (e.g., shirt/hanger icon from Lucide)

#### Wardrobe Page (`/wardrobe`)
- Display product grid of clothing items (responsive: 2-4 columns based on viewport)
- Show item thumbnail, name, category, and brand on cards
- Display empty state component when user has no items
- Include "Add Item" button in page header
- Support infinite scroll or pagination for large wardrobes
- Implement loading states during data fetch

#### Add Item Form
- Trigger via button click (opens dialog/modal)
- Include image upload component with:
  - Drag-and-drop support
  - File picker button
  - Camera capture option (on supported devices)
  - Image preview before upload
- Required fields:
  - Name (text input)
  - Category (select/dropdown)
  - Image (file upload)
- Optional fields:
  - Brand (text input with autocomplete suggestions)
- "Prettify with AI" toggle (default: on)
- If prettify enabled:
  - Show loading state while AI processes image
  - Display prettified image with two action buttons:
    * "Use AI Version" - saves prettified image
    * "Use Original" - saves original image
  - User selects preferred option
  - Save chosen version to database
- Form validation with error messages
- Upload progress indicator
- Success/error toast notifications

#### Item Detail View
- Click item card to open detail view (modal or dedicated page)
- Display stored image
- Show all metadata fields (editable)
- Include edit mode toggle
- Display all fields including AI-generated ones:
  - Colors (tag chips)
  - Fabrics (tag chips)
  - Seasons (tag chips)
  - Dress codes (tag chips)
  - Custom tags (tag chips)
  - Price, gender, size, notes
- "Delete Item" button with confirmation dialog
- "Save Changes" button when in edit mode

#### Image Upload & Storage
- Upload to Supabase Storage bucket `clothing-images`
- Generate unique filenames (UUID-based)
- Support JPEG, PNG, WebP formats
- Max file size: 10MB
- Image optimization/compression on upload
- Store single image per item (user's chosen version)

#### AI Enhancement (Gemini Integration)
- When "Prettify with AI" is enabled:
  - Call POST /api/wardrobe/prettify with uploaded image
  - Backend sends image to Gemini image generation model
  - Prompt: "Transform this clothing item into a professional product photo with a clean white background, maintaining the item's original appearance, colors, and details"
  - Return prettified image to frontend
  - Display prettified result with "Use AI Version" and "Use Original" buttons
  - User selects preferred option
  - Only chosen image is stored in database

#### AI Metadata Extraction (TODO - Backend Integration)
- Automatically analyze uploaded image to extract:
  - Dominant colors
  - Fabric type (if detectable)
  - Clothing category (verify user input)
  - Suggested seasons
  - Suggested dress codes
- Populate fields automatically but allow user override
- Placeholder: Manual entry for MVP

### Non-Functional

#### Performance
- Image upload should complete within 5 seconds for typical file sizes
- Grid view should render within 1 second for up to 100 items
- Implement image lazy loading for grid view
- Use optimized thumbnails (150x150px) for grid cards
- Cache wardrobe data with SWR or React Query

#### Accessibility
- All form inputs must have proper labels and ARIA attributes
- Image upload area must be keyboard accessible
- Modal dialogs must trap focus and support ESC to close
- Grid items must be navigable via keyboard
- Color contrast must meet WCAG AA standards
- Screen reader announcements for upload progress and success/error states

#### Security/Privacy
- All clothing items are private to the user (enforced via RLS)
- Image uploads must be validated server-side (file type, size)
- Sanitize all user input to prevent XSS
- Use signed URLs for image access with expiration
- Rate limit upload endpoints to prevent abuse

## API / Contracts

### Backend Endpoints

#### `GET /api/wardrobe`
- Returns array of clothing items for authenticated user
- Query params: `limit`, `offset`, `category` (filter)
- Response: `{ items: ClothingItem[], total: number }`

#### `POST /api/wardrobe`
- Creates new clothing item
- Body: `{ name, category, brand?, image: File }`
- Returns: `{ item: ClothingItem }`
- Handles image upload to Supabase Storage

#### `POST /api/wardrobe/prettify`
- Processes image with Gemini AI to create product-grade photo
- Body: `{ image: File }` (multipart/form-data)
- Sends image to Gemini with prompt for white background product photo
- Returns: `{ originalUrl: string, prettifiedUrl: string }`
- Frontend displays both for user selection
- Does not save to database (temporary URLs)

#### `GET /api/wardrobe/:id`
- Returns single clothing item by ID
- Validates user ownership
- Response: `{ item: ClothingItem }`

#### `PATCH /api/wardrobe/:id`
- Updates clothing item fields
- Body: Partial<ClothingItem>
- Returns: `{ item: ClothingItem }`

#### `DELETE /api/wardrobe/:id`
- Deletes clothing item and associated images
- Validates user ownership
- Returns: `{ success: boolean }`

### Database Types
```typescript
interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  brand?: string;
  image_url: string;
  enhanced_image_url?: string;
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
```

### UI Component Contracts
- Use shadcn/ui components: Dialog, Button, Input, Select, Card
- Follow styling rules from `styling.md`
- Use Tailwind v4 tokens for colors
- Implement responsive grid with Tailwind

## Configuration

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side operations (image deletion)
- `GEMINI_API_KEY` - Google Gemini API key for image prettification
- `AI_METADATA_API_KEY` - (TODO) For future AI metadata extraction

### Supabase Configuration
- Create `clothing-images` storage bucket
- Set bucket to private (authenticated users only)
- Configure RLS policies for bucket access
- Set max file size limit in bucket settings

### Auth Mode
- Use Supabase Auth (existing authentication)
- All API routes must validate user session
- Image uploads require authenticated user

## Acceptance Criteria

- ✅ User can navigate to Wardrobe page from sidebar
- ✅ Empty state displays when user has no clothing items
- ✅ User can open "Add Item" dialog from Wardrobe page
- ✅ User can upload image via drag-drop, file picker, or camera
- ✅ User can enter name, category, and brand for new item
- ✅ "Prettify with AI" toggle is present (functionality TODO)
- ✅ Form validates required fields before submission
- ✅ Upload progress is visible during image upload
- ✅ Success toast appears after successful item creation
- ✅ New item appears in wardrobe grid immediately after creation
- ✅ Grid displays items with thumbnail, name, category, brand
- ✅ Grid is responsive (2-4 columns based on viewport)
- ✅ User can click item card to open detail view
- ✅ Detail view shows all item metadata
- ✅ User can edit item fields in detail view
- ✅ User can save changes to item
- ✅ User can delete item with confirmation dialog
- ✅ Deleted items are removed from grid immediately
- ✅ All images are stored in Supabase Storage
- ✅ Only user's own items are visible (RLS enforced)
- ✅ All form inputs have proper labels and ARIA attributes
- ✅ Modal dialogs are keyboard accessible (focus trap, ESC to close)
- ✅ Color contrast meets WCAG AA standards
- ✅ Image uploads are validated (type, size)
- ✅ Error handling for failed uploads with user-friendly messages

## QA Scenarios

### Happy Path
1. User clicks "Wardrobe" in sidebar → navigates to `/wardrobe`
2. Empty state displays with "Add your first item" message
3. User clicks "Add Item" button → dialog opens
4. User drags image into upload area → preview appears
5. User enters name "Blue Denim Jacket", selects category "Jacket", enters brand "Levi's"
6. User toggles "Prettify with AI" on
7. User clicks "Add Item" → upload progress shows → success toast appears
8. Dialog closes, grid displays new item card
9. User clicks item card → detail view opens
10. All fields are displayed correctly
11. User clicks "Edit" → fields become editable
12. User adds tags "casual", "vintage" → clicks "Save" → success toast
13. User clicks "Delete" → confirmation dialog → confirms → item removed

### Image Upload Variations
- Upload via file picker button
- Upload via drag-and-drop
- Upload via camera capture (mobile)
- Upload with "Prettify with AI" enabled
- Upload with "Prettify with AI" disabled

### Error Handling
- Upload file exceeding 10MB → error message displayed
- Upload unsupported file type (e.g., PDF) → error message displayed
- Submit form with missing required fields → validation errors shown
- Network failure during upload → error toast with retry option
- Attempt to delete item → network failure → error toast

### Edge Cases
- User has 100+ items → pagination/infinite scroll works correctly
- User uploads very large image → compression applied, upload succeeds
- User rapidly clicks "Add Item" multiple times → only one dialog opens
- User closes dialog mid-upload → upload is cancelled
- User navigates away during upload → upload continues in background (or is cancelled with warning)

### Accessibility
- Navigate wardrobe page using only keyboard
- Use screen reader to add new item
- Navigate grid items with arrow keys
- Open detail view with Enter key
- Close dialog with ESC key
- Form validation errors announced to screen reader

### Security
- User A cannot view User B's clothing items
- User A cannot edit/delete User B's clothing items
- Direct API calls without auth token are rejected
- Malicious file uploads (e.g., executable disguised as image) are rejected
- XSS attempts in name/brand fields are sanitized
