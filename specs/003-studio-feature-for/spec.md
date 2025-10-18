---
# Studio Feature - Virtual Try-On Workspace
---

# Virtual Try-On Studio

## Overview

### Problem
Users need an interactive workspace to compose outfits by selecting products from their wardrobe and shopping results, visualizing how items look together on their avatar through AI-generated try-on images, and managing their created looks.

### Goals
- Provide a dedicated studio workspace for outfit composition and virtual try-on
- Enable users to select products from wardrobe, shopping results, and previous looks
- Generate AI-powered virtual try-on images showing selected products on user's avatar
- Support saving, downloading, sharing, and remixing generated looks
- Create responsive layout that adapts from mobile to desktop

### Non-Goals
- Real-time 3D rendering or AR try-on
- Video-based try-on
- Social features beyond basic sharing
- Product recommendations within studio (handled by agent)

## User Stories

- As a user, I want to open a studio workspace so that I can compose outfits visually
- As a user, I want to select products from my wardrobe so that I can try them in different combinations
- As a user, I want to select products from shopping results so that I can visualize how new items would look
- As a user, I want to use a previous look as a base so that I can remix and iterate on saved outfits
- As a user, I want to see a vertical grid of my current outfit items so that I understand what's being composed
- As a user, I want to generate a virtual try-on image so that I can see how the outfit looks on my avatar
- As a user, I want to save generated looks so that I can reference them later
- As a user, I want to download looks so that I can share them outside the app
- As a user, I want to share looks so that I can get feedback from others
- As a user, I want to remix a look so that I can create variations

## Requirements

### Functional

#### Layout Structure
- **Main Section**: Center image area with vertical column of 6 small squares for selected items
  - Center image displays user avatar initially, then generated look after API call
  - Vertical grid shows currently selected products (max 6 items)
  - Each grid square shows product thumbnail or empty state
- **Selected Products Section**: Displays products marked for try-on
  - Title: "Selected"
  - Responsive grid layout:
    - Desktop (lg+): Vertical on right side, shows 12 images
    - Medium (md): Vertical on right side, shows 6 images
    - Small medium (sm-md): Vertical on right side, shows 3 images
    - Mobile: Horizontal below main image
  - Products can be added from drawers

#### Drawer Components (3 total)
1. **Wardrobe Drawer**: Grid of products from user's wardrobe
   - Opens from bottom (mobile) or side (desktop)
   - Product grid with images, names, brands
   - Click to add to "Selected" section
2. **Shopping Drawer**: Grid of products from shopping/lens results
   - Same layout as wardrobe drawer
   - Shows products from recent searches
   - Click to add to "Selected" section
3. **Previous Looks Drawer**: Grid of previously saved looks
   - Shows thumbnail of each saved look
   - Click to load as base outfit (populates current outfit grid)
   - Displays metadata (date created, item count)

#### State Management
- Track selected products across sessions
- Maintain current outfit composition (6 items max)
- Persist selected items when navigating between drawers
- Sync state when products selected from lens-results or shopping-results artifacts

#### Actions
- **Try Button**: Moves selected items to current outfit grid (vertical column)
- **Generate Button**: Triggers API call to merge avatar + product images
  - Sends avatar image URL
  - Sends array of product image URLs
  - Receives generated look image
  - Displays in center image area
- **Save Button**: Persists current look to database
  - Stores product IDs, generated image URL, timestamp
- **Download Button**: Downloads generated look image to device
- **Share Button**: Generates shareable link or triggers native share
- **Remix Button**: Creates new composition based on current look

### Non-Functional

#### Performance
- Lazy load product images in drawers
- Optimize drawer rendering (virtualization for large lists)
- Cache generated looks locally
- API call timeout: 30 seconds for generation
- Show loading states during generation

#### Accessibility
- Keyboard navigation for all drawers and buttons
- ARIA labels for all interactive elements
- Focus management when drawers open/close
- Screen reader announcements for state changes
- Alt text for all product and look images

#### Security/Privacy
- User avatar images stored securely
- Generated looks associated with user account
- Shareable links expire after 30 days
- No public gallery without explicit opt-in

## API / Contracts

### Backend Endpoints

#### Generate Look
```typescript
POST /api/studio/generate-look
Request: {
  avatar_url: string;
  product_images: string[]; // max 6
  user_id: string;
}
Response: {
  look_id: string;
  generated_image_url: string;
  processing_time_ms: number;
}
```

#### Save Look
```typescript
POST /api/studio/save-look
Request: {
  look_id: string;
  product_ids: string[];
  generated_image_url: string;
  user_id: string;
}
Response: {
  saved_look_id: string;
  created_at: string;
}
```

#### Get Wardrobe Products
```typescript
GET /api/studio/wardrobe?user_id={user_id}
Response: {
  products: Product[];
}
```

#### Get Shopping Products
```typescript
GET /api/studio/shopping-history?user_id={user_id}&limit=50
Response: {
  products: Product[];
}
```

#### Get Previous Looks
```typescript
GET /api/studio/looks?user_id={user_id}
Response: {
  looks: Array<{
    look_id: string;
    thumbnail_url: string;
    product_ids: string[];
    created_at: string;
    product_count: number;
  }>;
}
```

### UI State Shape

```typescript
type StudioState = {
  selectedProducts: Product[]; // Items in "Selected" section
  currentOutfit: Product[]; // Items in vertical grid (max 6)
  generatedLook: {
    image_url: string;
    look_id: string;
  } | null;
  isGenerating: boolean;
  activeDrawer: 'wardrobe' | 'shopping' | 'looks' | null;
};
```

### Artifact Interaction
- Studio is a full-page artifact (not embedded in chat)
- Accessed via `StudioToggle` button in chat header
- Uses `useArtifact` hook for state management
- `setOpen` controls studio visibility
- `setContext` passes selected products from chat artifacts (lens-results, shopping-results)

## Configuration

### Environment Variables

#### Local Development
```
NEXT_PUBLIC_STUDIO_API_URL=http://localhost:3000/api/studio
STUDIO_AI_MODEL_ENDPOINT=http://localhost:8000/generate
STUDIO_MAX_PRODUCTS=6
```

#### Production
```
NEXT_PUBLIC_STUDIO_API_URL=https://api.reoutfit.com/studio
STUDIO_AI_MODEL_ENDPOINT=https://ai.reoutfit.com/generate
STUDIO_MAX_PRODUCTS=6
STUDIO_IMAGE_CDN=https://cdn.reoutfit.com
```

### Auth Mode
- Uses existing Supabase auth (session-based)
- API calls include auth headers from `useSupabaseClient`
- No separate auth flow required

## Acceptance Criteria

1. **Layout Responsiveness**
   - Selected section shows 12 items on lg+, 6 on md, 3 on sm-md, horizontal on mobile
   - Main image and vertical grid maintain aspect ratios across breakpoints
   - Drawers adapt to screen size (full-screen on mobile, overlay on desktop)

2. **Product Selection Flow**
   - User can open any of 3 drawers independently
   - Clicking product in drawer adds to "Selected" section
   - "Try" button moves selected items to current outfit grid
   - Current outfit grid shows max 6 items with visual feedback for empty slots

3. **Generation Flow**
   - "Generate" button disabled until at least 1 item in current outfit
   - Loading state shows during API call (spinner + progress text)
   - Generated image replaces avatar in center area
   - Error handling with retry option if generation fails

4. **Action Buttons**
   - Save: Persists to database, shows success toast
   - Download: Triggers browser download of generated image
   - Share: Opens native share sheet or copies link
   - Remix: Clears selected section, keeps current outfit as base

5. **State Persistence**
   - Selected products persist when switching drawers
   - Current outfit persists across page refreshes (localStorage)
   - Generated looks saved to user account

6. **Integration with Chat Artifacts**
   - Clicking "Select To Try" in lens-results adds product to studio selected section
   - Studio badge in header shows count of selected items
   - Opening studio from chat preserves selected items

7. **Accessibility**
   - All interactive elements keyboard accessible
   - Focus trap in open drawers
   - Screen reader support for all state changes
   - Color contrast meets WCAG AA standards

## QA Scenarios

### Happy Path
1. User opens studio from chat header
2. User opens wardrobe drawer, selects 3 products
3. User clicks "Try" to move products to current outfit grid
4. User clicks "Generate" to create look
5. Generated image displays in center area
6. User clicks "Save" to persist look
7. Success toast confirms save

### Product Selection from Chat
1. User performs visual search in chat
2. Lens results artifact displays products
3. User clicks "Select To Try" on 2 products
4. Studio badge shows "2" selected items
5. User opens studio
6. Selected section shows 2 products
7. User adds 1 more from wardrobe drawer
8. User clicks "Try" to compose outfit

### Load Previous Look
1. User opens "Previous Looks" drawer
2. Grid shows 5 saved looks with thumbnails
3. User clicks on a look from 2 days ago
4. Current outfit grid populates with that look's products
5. Center image shows that look's generated image
6. User can modify and regenerate

### Generation Failure
1. User composes outfit with 4 products
2. User clicks "Generate"
3. API call times out after 30 seconds
4. Error toast displays with "Retry" button
5. User clicks "Retry"
6. Generation succeeds on second attempt

### Responsive Behavior
1. User opens studio on desktop (1920px)
2. Selected section shows 12 items vertically on right
3. User resizes to tablet (768px)
4. Selected section shows 6 items vertically on right
5. User resizes to mobile (375px)
6. Selected section moves below main image, shows horizontal scroll
7. Drawers become full-screen overlays

### Empty States
1. User opens studio for first time
2. Center image shows avatar placeholder
3. Current outfit grid shows 6 empty slots
4. Selected section shows "No items selected" message
5. User opens wardrobe drawer
6. Drawer shows "No wardrobe items" if empty
7. Helpful text suggests adding items via chat

### Share and Download
1. User generates a look
2. User clicks "Download"
3. Browser downloads PNG file named "reoutfit-look-{timestamp}.png"
4. User clicks "Share"
5. On mobile: Native share sheet opens
6. On desktop: Shareable link copied to clipboard
7. Toast confirms action

### Remix Flow
1. User has generated look displayed
2. User clicks "Remix"
3. Selected section clears
4. Current outfit items remain in grid
5. User can add new items to selected section
6. User clicks "Try" to update outfit
7. User generates new variation
