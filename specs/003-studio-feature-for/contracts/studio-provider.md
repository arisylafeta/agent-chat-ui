# Contract: Studio Provider (React Context)

## Purpose
Provide global state management for the Studio feature, enabling product selection across artifacts and maintaining outfit composition state.

## Location
`/providers/studio-provider.tsx`

## State Shape

```typescript
interface StudioState {
  // Products marked for try-on (from lens-results, shopping-results, wardrobe)
  selectedProducts: StudioProduct[];
  
  // Current outfit composition (max 6 items)
  currentOutfit: StudioProduct[];
  
  // Generated look result
  generatedLook: {
    imageUrl: string;      // Base64 data URL or Supabase Storage URL
    lookbookId?: string;   // Set after save
  } | null;
  
  // UI state
  isGenerating: boolean;
  activeDrawer: 'wardrobe' | 'shopping' | 'looks' | null;
}

interface StudioProduct {
  id: string;
  title: string;
  brand: string;
  image: string;           // High-quality image URL
  sourceData: Record<string, any>;  // Original product JSONB
}
```

## Context API

### Provider Component
```typescript
export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudioState>(initialState);
  
  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('studio-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      setState(prev => ({
        ...prev,
        selectedProducts: parsed.selectedProducts || [],
        currentOutfit: parsed.currentOutfit || []
      }));
    }
  }, []);
  
  // Save to localStorage on state change
  useEffect(() => {
    localStorage.setItem('studio-state', JSON.stringify({
      selectedProducts: state.selectedProducts,
      currentOutfit: state.currentOutfit
    }));
  }, [state.selectedProducts, state.currentOutfit]);
  
  return (
    <StudioContext.Provider value={{ state, actions }}>
      {children}
    </StudioContext.Provider>
  );
}
```

### Hook
```typescript
export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within StudioProvider');
  }
  return context;
}
```

## Actions

### `addToSelected(product: StudioProduct): void`
Add a product to the selected products list.

**Behavior:**
- Check if product already exists (by `id`)
- If exists, do nothing (idempotent)
- If not, append to `selectedProducts` array
- Trigger localStorage save

**Usage:**
```typescript
const { addToSelected } = useStudio();

// In lens-results "Select To Try" button
<button onClick={() => addToSelected(toStudioProduct(product))}>
  Select To Try
</button>
```

### `removeFromSelected(productId: string): void`
Remove a product from the selected products list.

**Behavior:**
- Filter out product with matching `id`
- Update `selectedProducts` array
- Trigger localStorage save

**Usage:**
```typescript
const { removeFromSelected } = useStudio();

<button onClick={() => removeFromSelected(product.id)}>
  Remove
</button>
```

### `moveToOutfit(productId: string): void`
Move a product from selected to current outfit.

**Behavior:**
- Check if outfit has space (max 6 items)
- If full, show toast and return
- Find product in `selectedProducts`
- Add to `currentOutfit`
- Remove from `selectedProducts`
- Trigger localStorage save

**Usage:**
```typescript
const { moveToOutfit } = useStudio();

<button onClick={() => moveToOutfit(product.id)}>
  Add to Outfit
</button>
```

### `removeFromOutfit(productId: string): void`
Remove a product from the current outfit.

**Behavior:**
- Filter out product with matching `id`
- Update `currentOutfit` array
- Trigger localStorage save

**Usage:**
```typescript
const { removeFromOutfit } = useStudio();

<button onClick={() => removeFromOutfit(product.id)}>
  Remove
</button>
```

### `clearSelected(): void`
Clear all selected products.

**Behavior:**
- Set `selectedProducts` to empty array
- Trigger localStorage save

**Usage:**
```typescript
const { clearSelected } = useStudio();

<button onClick={clearSelected}>
  Clear All
</button>
```

### `clearOutfit(): void`
Clear current outfit composition.

**Behavior:**
- Set `currentOutfit` to empty array
- Trigger localStorage save

**Usage:**
```typescript
const { clearOutfit } = useStudio();

<button onClick={clearOutfit}>
  Clear Outfit
</button>
```

### `setGeneratedLook(look: { imageUrl: string; lookbookId?: string } | null): void`
Set or clear the generated look result.

**Behavior:**
- Update `generatedLook` state
- Does not persist to localStorage (ephemeral)

**Usage:**
```typescript
const { setGeneratedLook } = useStudio();

// After generation
setGeneratedLook({
  imageUrl: 'data:image/png;base64,...',
  lookbookId: undefined
});

// After save
setGeneratedLook({
  imageUrl: 'https://storage.supabase.co/...',
  lookbookId: 'uuid-123'
});

// Clear
setGeneratedLook(null);
```

### `setGenerating(isGenerating: boolean): void`
Set the generating state (for loading indicators).

**Behavior:**
- Update `isGenerating` state
- Does not persist to localStorage

**Usage:**
```typescript
const { setGenerating } = useStudio();

setGenerating(true);
try {
  const result = await generateLook();
  setGeneratedLook(result);
} finally {
  setGenerating(false);
}
```

### `setActiveDrawer(drawer: 'wardrobe' | 'shopping' | 'looks' | null): void`
Set which drawer is currently open.

**Behavior:**
- Update `activeDrawer` state
- Does not persist to localStorage

**Usage:**
```typescript
const { setActiveDrawer } = useStudio();

<button onClick={() => setActiveDrawer('wardrobe')}>
  Open Wardrobe
</button>
```

## Computed Values

### `selectedCount: number`
Number of products in selected list.

```typescript
const selectedCount = state.selectedProducts.length;
```

### `outfitCount: number`
Number of products in current outfit.

```typescript
const outfitCount = state.currentOutfit.length;
```

### `canAddToOutfit: boolean`
Whether more products can be added to outfit.

```typescript
const canAddToOutfit = state.currentOutfit.length < 6;
```

### `hasGeneratedLook: boolean`
Whether a generated look exists.

```typescript
const hasGeneratedLook = state.generatedLook !== null;
```

## Integration Points

### Lens Results Integration
```typescript
// In lens-results.tsx
import { useStudio } from '@/providers/studio-provider';

function ProductDetailDrawer({ product }) {
  const { addToSelected } = useStudio();
  
  return (
    <button onClick={() => addToSelected(toStudioProduct(product))}>
      Select To Try
    </button>
  );
}
```

### Shopping Results Integration
```typescript
// In shopping-results.tsx
import { useStudio } from '@/providers/studio-provider';

function ProductDetailDrawer({ product }) {
  const { addToSelected } = useStudio();
  
  return (
    <button onClick={() => addToSelected(toStudioProduct(product))}>
      Select To Try
    </button>
  );
}
```

### Studio Toggle Badge
```typescript
// In studio-toggle.tsx
import { useStudio } from '@/providers/studio-provider';

function StudioToggle() {
  const { selectedCount } = useStudio();
  
  return (
    <button>
      Studio
      {selectedCount > 0 && <Badge>{selectedCount}</Badge>}
    </button>
  );
}
```

## Persistence Strategy

### LocalStorage
- **Key**: `studio-state`
- **Persisted Fields**:
  - `selectedProducts`
  - `currentOutfit`
- **Not Persisted**:
  - `generatedLook` (ephemeral, regenerate on demand)
  - `isGenerating` (UI state)
  - `activeDrawer` (UI state)

### Debouncing
- Use `useDebounce` hook to debounce localStorage writes
- Debounce delay: 500ms
- Prevents excessive writes during rapid state changes

```typescript
const debouncedState = useDebounce(
  { selectedProducts, currentOutfit },
  500
);

useEffect(() => {
  localStorage.setItem('studio-state', JSON.stringify(debouncedState));
}, [debouncedState]);
```

## Error Handling

### LocalStorage Errors
```typescript
try {
  localStorage.setItem('studio-state', JSON.stringify(state));
} catch (error) {
  console.error('Failed to save studio state:', error);
  // Continue without persistence (graceful degradation)
}
```

### Invalid Data
```typescript
try {
  const saved = localStorage.getItem('studio-state');
  if (saved) {
    const parsed = JSON.parse(saved);
    // Validate structure
    if (Array.isArray(parsed.selectedProducts)) {
      setState(prev => ({ ...prev, selectedProducts: parsed.selectedProducts }));
    }
  }
} catch (error) {
  console.error('Failed to load studio state:', error);
  // Start with empty state
}
```

## Testing

### Unit Tests
```typescript
describe('StudioProvider', () => {
  it('should add product to selected', () => {
    const { result } = renderHook(() => useStudio(), {
      wrapper: StudioProvider
    });
    
    act(() => {
      result.current.addToSelected(mockProduct);
    });
    
    expect(result.current.selectedProducts).toHaveLength(1);
  });
  
  it('should not add duplicate products', () => {
    const { result } = renderHook(() => useStudio(), {
      wrapper: StudioProvider
    });
    
    act(() => {
      result.current.addToSelected(mockProduct);
      result.current.addToSelected(mockProduct);
    });
    
    expect(result.current.selectedProducts).toHaveLength(1);
  });
  
  it('should enforce max 6 items in outfit', () => {
    const { result } = renderHook(() => useStudio(), {
      wrapper: StudioProvider
    });
    
    act(() => {
      for (let i = 0; i < 7; i++) {
        result.current.moveToOutfit(`product-${i}`);
      }
    });
    
    expect(result.current.currentOutfit).toHaveLength(6);
  });
});
```

## Future Enhancements
- Undo/redo functionality
- Multiple outfit slots (save multiple compositions)
- Outfit history (track changes over time)
- Sync across devices (via Supabase)
- Offline support with sync on reconnect
