# Studio Artifact Integration Guide

## Overview

The Studio feature is integrated as an **artifact** in the chat system, allowing it to be triggered both via AI chat messages and manually via a button click. This document explains how the artifact integration works and how all the pieces fit together.

---

## Architecture

### Core Components

#### 1. **StudioArtifactProvider** (`providers/studio-artifact-provider.tsx`)
The main provider that enables manual Studio triggering.

**Responsibilities:**
- Manages `shouldRenderStudio` state (whether Studio should be displayed)
- Provides `openStudio()` and `closeStudio()` functions
- Renders `ManualStudioRenderer` as a child
- Wraps the entire chat layout

**Usage:**
```tsx
// app/(chat)/layout.tsx
<StudioArtifactProvider>
  {children}
</StudioArtifactProvider>
```

#### 2. **ManualStudioRenderer** (internal to provider)
A hidden component that renders the Studio artifact when triggered.

**Responsibilities:**
- Listens to `shouldRenderStudio` state
- Uses `useArtifact()` hook to access artifact system
- Calls `setOpen(true)` to open the artifact sidebar
- Renders `<Studio />` through `ArtifactContent`
- Handles cleanup when artifact closes

**Key Logic:**
- When `shouldRenderStudio` becomes `true` → calls `setOpen(true)`
- When artifact closes (`open` becomes `false`) → calls `closeStudio()`
- Tracks `hasOpened` flag to prevent race conditions

#### 3. **StudioToggle** (`components/artifact/studio/studio-toggle.tsx`)
The button that triggers Studio to open.

**Responsibilities:**
- Displays "Studio" button with badge showing selected product count
- Calls `openStudio()` when clicked
- Shown in chat header and artifact sidebar (when not viewing Studio)

**Usage:**
```tsx
// components/chat/chat-header.tsx
{threadId && <StudioToggle />}

// components/artifact/artifact-sidebar.tsx
{artifactTitle !== 'studio' && <StudioToggle />}
```

#### 4. **Studio** (`components/artifact/studio/studio.tsx`)
The main Studio component that renders the layout.

**Responsibilities:**
- Simple wrapper that renders `StudioLayout`
- Can be triggered via chat messages OR manual button click
- Artifact wrapping is handled by parent (either `LoadExternalComponent` or `ManualStudioRenderer`)

---

## Integration Flow

### Manual Trigger Flow (Button Click)

```
1. User clicks StudioToggle button
   ↓
2. StudioToggle.handleClick() → openStudio()
   ↓
3. StudioArtifactProvider → shouldRenderStudio = true
   ↓
4. ManualStudioRenderer detects change
   ↓
5. ManualStudioRenderer → setOpen(true)
   ↓
6. Artifact system opens sidebar
   ↓
7. ManualStudioRenderer renders:
   <ArtifactContent title="Studio">
     <Studio />
   </ArtifactContent>
   ↓
8. Studio → StudioLayout renders in artifact sidebar
   ↓
9. ArtifactSidebar detects title "Studio"
   ↓
10. Header shows TopActions (Avatar/Products/Wardrobe) instead of StudioToggle
```

### Chat Message Trigger Flow

```
1. AI agent sends Studio component via LoadExternalComponent
   ↓
2. LoadExternalComponent renders Studio with artifact tuple
   ↓
3. Studio receives artifact context from meta
   ↓
4. Studio renders StudioLayout
   ↓
5. Artifact system handles opening/closing
```

### Close Flow

```
1. User clicks X button in artifact header
   ↓
2. Artifact system → open = false
   ↓
3. ManualStudioRenderer detects close (hasOpened = true)
   ↓
4. ManualStudioRenderer → closeStudio()
   ↓
5. StudioArtifactProvider → shouldRenderStudio = false
   ↓
6. ManualStudioRenderer → setOpen(false)
   ↓
7. Artifact fully closes (no blank panel)
```

---

## Artifact Switching Behavior

Studio behaves like other artifacts (lens-results, shopping-results):

### When Studio is Open
- Clicking lens-results preview → lens-results takes over artifact slot
- Clicking shopping-results preview → shopping-results takes over artifact slot
- Studio closes automatically

### When Other Artifact is Open
- Clicking Studio button → Studio takes over artifact slot
- Other artifact closes automatically

**Implementation:**
```tsx
// ManualStudioRenderer always calls setOpen when triggered
useEffect(() => {
  if (shouldRenderStudio) {
    setOpen(true); // Takes over artifact slot
  }
}, [shouldRenderStudio, setOpen]);
```

---

## Header Button Logic

The artifact sidebar header conditionally shows different buttons based on the current artifact:

### When Studio is Open
- Shows: **TopActions** (Avatar, Products, Wardrobe buttons)
- Hides: StudioToggle button

### When Other Artifacts are Open
- Shows: **StudioToggle** button
- Hides: TopActions

**Implementation:**
```tsx
// components/artifact/artifact-sidebar.tsx
{artifactTitle.trim().toLowerCase() === 'studio' ? (
  <TopActions />
) : (
  <StudioToggle />
)}
```

**Title Detection:**
- Uses `MutationObserver` to watch for title changes
- Continuously monitors (doesn't disconnect after first detection)
- Updates `artifactTitle` state when title changes
- Handles React Portal timing (ArtifactTitle uses portals)

---

## State Management

### StudioArtifactProvider State
- `shouldRenderStudio: boolean` - Whether Studio should be rendered
- Persisted: **No** (ephemeral, resets on page refresh)

### StudioProvider State (separate)
- `selectedProducts: StudioProduct[]` - Products selected for try-on
- `currentOutfit: StudioProduct[]` - Products in current outfit (max 6)
- `generatedLook: GeneratedLook | null` - Generated try-on image
- `selectedAvatar: Avatar | null` - User's avatar
- Persisted: **Yes** (localStorage)

---

## Race Condition Prevention

### The Problem
When opening Studio, multiple effects fire in sequence:
1. `shouldRenderStudio` becomes `true`
2. `setOpen(true)` is called
3. Before artifact opens, effect sees `!open && shouldRenderStudio`
4. Prematurely calls `closeStudio()`
5. Studio never renders

### The Solution
Use `hasOpened` flag to track if artifact has successfully opened:

```tsx
const [hasOpened, setHasOpened] = useState(false);

// Track when artifact opens
useEffect(() => {
  if (open && shouldRenderStudio) {
    setHasOpened(true);
  }
}, [open, shouldRenderStudio]);

// Only close trigger if artifact was previously open
useEffect(() => {
  if (!open && shouldRenderStudio && hasOpened) {
    closeStudio();
    setHasOpened(false);
  }
}, [open, shouldRenderStudio, hasOpened, closeStudio]);
```

---

## File Structure

```
app/(chat)/
  layout.tsx                          # Wraps with StudioArtifactProvider

components/
  artifact/
    artifact-sidebar.tsx              # Conditional header buttons
    studio/
      studio.tsx                      # Main Studio component
      studio-layout.tsx               # Studio UI layout
      studio-toggle.tsx               # Trigger button
      top-actions.tsx                 # Avatar/Products/Wardrobe buttons
      [other components...]

providers/
  studio-artifact-provider.tsx        # Manual trigger provider + renderer
  studio-provider.tsx                 # Studio state management (separate)
```

---

## Key Differences from Other Artifacts

### Lens-Results / Shopping-Results
- Triggered **only** via chat messages
- Have preview cards with `onClick={() => setOpen(!open)}`
- Receive artifact tuple via `LoadExternalComponent`

### Studio
- Triggered via **chat messages OR button click**
- No preview card (uses StudioToggle button)
- Can receive artifact tuple OR be rendered manually
- Has dedicated provider for manual triggering

---

## Testing Checklist

- [ ] Click Studio button from chat header → Studio opens
- [ ] Click Studio button from artifact sidebar (when lens-results open) → Studio replaces lens-results
- [ ] Click lens-results preview when Studio is open → lens-results replaces Studio
- [ ] Click X to close Studio → artifact fully closes (no blank panel)
- [ ] Open Studio → header shows Avatar/Products/Wardrobe buttons
- [ ] Open lens-results → header shows Studio button
- [ ] Switch between artifacts → header updates correctly
- [ ] Selected products persist when switching between artifacts
- [ ] Page refresh → Studio state persists (selectedProducts, currentOutfit)

---

## Common Issues & Solutions

### Issue: Blank artifact stays open after closing Studio
**Cause:** `shouldRenderStudio` becomes false but artifact isn't closed  
**Solution:** Added effect to call `setOpen(false)` when `shouldRenderStudio` becomes false

### Issue: Header doesn't update when switching to Studio
**Cause:** MutationObserver disconnects after finding first title  
**Solution:** Keep observer active, continuously watch for title changes

### Issue: Studio closes immediately after opening
**Cause:** Race condition - closeStudio() called before artifact opens  
**Solution:** Use `hasOpened` flag to prevent premature cleanup

### Issue: Can't switch from lens-results to Studio
**Cause:** `setOpen(true)` only called if `!open`  
**Solution:** Always call `setOpen(true)` when `shouldRenderStudio` is true

---

## Future Enhancements

1. **Persistent Studio State Across Sessions**
   - Save `shouldRenderStudio` to localStorage
   - Auto-open Studio on page load if it was open

2. **Deep Linking**
   - URL parameter to open Studio directly
   - Example: `/chat/thread-id?artifact=studio`

3. **Multiple Studio Instances**
   - Support multiple Studio artifacts in different threads
   - Track Studio state per thread

4. **Artifact Context Passing**
   - Pass data from Studio back to chat on close
   - Use `setContext()` from `useArtifact()`

---

## Related Documentation

- [Studio Provider Contract](./contracts/studio-provider.md)
- [Data Model](./data-model.md)
- [Implementation Tasks](./tasks.md)
- [Quickstart Guide](./quickstart.md)
