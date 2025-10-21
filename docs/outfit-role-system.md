# Outfit Role System Design

**Date**: 2025-10-20
**Status**: Design Document (Not Yet Implemented)
**Purpose**: Define role-based slot system for outfit composition in Virtual Try-On Studio

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Proposed Solution](#proposed-solution)
4. [Implementation Details](#implementation-details)
5. [API Changes](#api-changes)
6. [UI/UX Changes](#uiux-changes)
7. [Migration Strategy](#migration-strategy)
8. [Future Enhancements](#future-enhancements)

---

## Overview

### Problem Statement

Currently, the Virtual Try-On Studio has the following limitations:

1. **No semantic understanding** of clothing items - treats all items as generic products
2. **No slot restrictions** - users can add 6 shirts or 6 shoes to an outfit
3. **Poor prompt clarity** - AI doesn't know which item is top/bottom/shoes
4. **Inconsistent results** - lack of labeled images leads to unpredictable generations

### Solution

Implement a **role-based slot system** that:

- Maps clothing categories to logical outfit roles (top, bottom, footwear, etc.)
- Prevents duplicate roles (e.g., only one top, one bottom)
- Provides labeled image prompts to AI for better generations
- Improves UX with clear slot labels and validation

### Design Choice

**Hybrid Approach (Option 2)**:
- Use category→role mapping as default
- Allow explicit role override via `sourceData.role`
- No database migration required
- Backward compatible with existing data

---

## Current State Analysis

### Existing Category System

From `lib/db/wardrobe-validation.ts`:

```typescript
export const ClothingCategorySchema = z.enum([
  'shirt',      // Top
  'pants',      // Bottom
  'shorts',     // Bottom
  'dress',      // Full outfit
  'skirt',      // Bottom
  'jacket',     // Outerwear
  'coat',       // Outerwear
  'sweater',    // Top
  'hoodie',     // Top
  'shoes',      // Footwear
  'boots',      // Footwear
  'sneakers',   // Footwear
  'accessories',// Accessory
  'other',      // Uncategorized
]);
```

**14 categories** serving **6 logical roles**:
- Tops: 3 categories (shirt, sweater, hoodie)
- Bottoms: 3 categories (pants, shorts, skirt)
- Dress: 1 category (standalone)
- Outerwear: 2 categories (jacket, coat)
- Footwear: 3 categories (shoes, boots, sneakers)
- Accessories: 2 categories (accessories, other)

### Current Data Structure

**Wardrobe Items** (`lib/db/wardrobe-types.ts`):
```typescript
export interface WardrobeItem {
  id: string;
  category: string;  // One of the 14 categories above
  // ... other fields
}
```

**Studio Products** (`types/studio.ts`):
```typescript
export interface StudioProduct {
  id: string;
  title: string;
  image: string;
  sourceData: Record<string, any>;  // Contains original item data
}
```

**Key Insight**: The `sourceData` field can contain:
- `category` from wardrobe items
- `role` if explicitly set (new field, optional)

### Current Issues

1. ❌ Multiple items with same role allowed (6 shirts possible)
2. ❌ AI prompt doesn't label images by role
3. ❌ No visual indication of what slot each item fills
4. ❌ No validation when adding items to outfit

---

## Proposed Solution

### 1. Role Definition

Create a new type system for outfit roles:

```typescript
// types/outfit-roles.ts

/**
 * Logical outfit roles that clothing items can serve
 */
export const OUTFIT_ROLES = [
  'top',        // Shirts, sweaters, hoodies, blouses, t-shirts
  'bottom',     // Pants, shorts, skirts, jeans, trousers
  'dress',      // Dresses (full outfit, excludes top+bottom)
  'outerwear',  // Jackets, coats, blazers, cardigans
  'footwear',   // Shoes, boots, sneakers, sandals
  'accessory',  // Belts, hats, scarves, jewelry, bags
] as const;

export type OutfitRole = typeof OUTFIT_ROLES[number];
```

### 2. Category-to-Role Mapping

Define static mapping from categories to roles:

```typescript
// types/outfit-roles.ts

import { ClothingCategory } from '@/lib/db/wardrobe-validation';

/**
 * Map each clothing category to its logical outfit role
 */
export const CATEGORY_TO_ROLE: Record<ClothingCategory, OutfitRole> = {
  // Tops
  shirt: 'top',
  sweater: 'top',
  hoodie: 'top',

  // Bottoms
  pants: 'bottom',
  shorts: 'bottom',
  skirt: 'bottom',

  // Dress (standalone full outfit)
  dress: 'dress',

  // Outerwear
  jacket: 'outerwear',
  coat: 'outerwear',

  // Footwear
  shoes: 'footwear',
  boots: 'footwear',
  sneakers: 'footwear',

  // Accessories (fallback)
  accessories: 'accessory',
  other: 'accessory',
};
```

### 3. Role Resolution Logic

Function to determine product role:

```typescript
// types/outfit-roles.ts

import { StudioProduct } from '@/types/studio';

/**
 * Get the outfit role for a product
 * Priority: explicit role > category mapping > fallback to accessory
 */
export function getProductRole(product: StudioProduct): OutfitRole {
  // 1. Check if product has explicit role override
  const explicitRole = product.sourceData?.role;
  if (explicitRole && OUTFIT_ROLES.includes(explicitRole as OutfitRole)) {
    return explicitRole as OutfitRole;
  }

  // 2. Map from category
  const category = product.sourceData?.category;
  if (category && category in CATEGORY_TO_ROLE) {
    return CATEGORY_TO_ROLE[category as ClothingCategory];
  }

  // 3. Fallback
  return 'accessory';
}

/**
 * Get human-readable role label
 */
export function getRoleLabel(role: OutfitRole): string {
  const labels: Record<OutfitRole, string> = {
    top: 'Top',
    bottom: 'Bottom',
    dress: 'Dress',
    outerwear: 'Outerwear',
    footwear: 'Footwear',
    accessory: 'Accessory',
  };
  return labels[role];
}
```

### 4. Validation Rules

Define what items can be added to an outfit:

```typescript
// types/outfit-roles.ts

export interface ValidationResult {
  canAdd: boolean;
  reason?: string;
}

/**
 * Outfit composition rules:
 * - 1x top (unless dress)
 * - 1x bottom (unless dress)
 * - 1x dress (excludes top+bottom)
 * - 0-1x outerwear
 * - 0-1x footwear
 * - 0-3x accessories
 * - Max 6 items total
 */
export function canAddToOutfit(
  currentOutfit: StudioProduct[],
  newProduct: StudioProduct
): ValidationResult {
  const newRole = getProductRole(newProduct);

  // Check max items (6 total)
  if (currentOutfit.length >= 6) {
    return {
      canAdd: false,
      reason: 'Maximum 6 items in outfit',
    };
  }

  // Special case: Allow multiple accessories (up to 3)
  if (newRole === 'accessory') {
    const accessoryCount = currentOutfit.filter(
      (p) => getProductRole(p) === 'accessory'
    ).length;

    if (accessoryCount >= 3) {
      return {
        canAdd: false,
        reason: 'Maximum 3 accessories allowed',
      };
    }

    return { canAdd: true };
  }

  // Check if role slot is already occupied
  const roleExists = currentOutfit.some(
    (p) => getProductRole(p) === newRole
  );

  if (roleExists) {
    return {
      canAdd: false,
      reason: `You already have a ${getRoleLabel(newRole).toLowerCase()} in your outfit`,
    };
  }

  // Dress exclusion rules
  if (newRole === 'dress') {
    const hasTopOrBottom = currentOutfit.some((p) => {
      const role = getProductRole(p);
      return role === 'top' || role === 'bottom';
    });

    if (hasTopOrBottom) {
      return {
        canAdd: false,
        reason: 'Remove top/bottom before adding a dress',
      };
    }
  }

  // Top/Bottom exclusion when dress exists
  if (newRole === 'top' || newRole === 'bottom') {
    const hasDress = currentOutfit.some(
      (p) => getProductRole(p) === 'dress'
    );

    if (hasDress) {
      return {
        canAdd: false,
        reason: 'Remove dress before adding separate top/bottom',
      };
    }
  }

  return { canAdd: true };
}
```

### 5. Role Display Order

Define logical order for display in UI:

```typescript
// types/outfit-roles.ts

/**
 * Preferred display order for outfit roles
 * Used in outfit column to show items in logical order
 */
export const ROLE_DISPLAY_ORDER: OutfitRole[] = [
  'outerwear',  // Layer 1: Outermost
  'top',        // Layer 2: Upper body
  'dress',      // Alternative to top+bottom
  'bottom',     // Layer 3: Lower body
  'footwear',   // Layer 4: Feet
  'accessory',  // Layer 5: Accessories (multiple allowed)
];

/**
 * Sort outfit items by role display order
 */
export function sortByRole(products: StudioProduct[]): StudioProduct[] {
  return [...products].sort((a, b) => {
    const roleA = getProductRole(a);
    const roleB = getProductRole(b);

    const indexA = ROLE_DISPLAY_ORDER.indexOf(roleA);
    const indexB = ROLE_DISPLAY_ORDER.indexOf(roleB);

    return indexA - indexB;
  });
}
```

---

## Implementation Details

### Phase 1: Type System (types/outfit-roles.ts)

Create new file with:
- ✅ `OutfitRole` type definition
- ✅ `CATEGORY_TO_ROLE` mapping
- ✅ `getProductRole()` function
- ✅ `getRoleLabel()` function
- ✅ `canAddToOutfit()` validation
- ✅ `sortByRole()` utility
- ✅ Full TypeScript type safety

**Dependencies**: None (pure types/logic)

### Phase 2: State Management (providers/studio-provider.tsx)

Update studio provider to:
- Import validation logic
- Modify `addToOutfit()` to check `canAddToOutfit()`
- Show toast error if item can't be added
- Optionally auto-sort outfit by role

**Changes**:
```typescript
const addToOutfit = (product: StudioProduct) => {
  const validation = canAddToOutfit(state.currentOutfit, product);

  if (!validation.canAdd) {
    toast.error(validation.reason);
    return;
  }

  setState(prev => ({
    ...prev,
    currentOutfit: [...prev.currentOutfit, product],
  }));
};
```

### Phase 3: UI Updates (components/artifact/studio/outfit-column.tsx)

Update outfit column to:
- Show role labels on slots
- Highlight which roles are filled
- Optionally show suggested roles (empty slots)

**Example**:
```tsx
<div className="flex h-full flex-col justify-between gap-4">
  {ROLE_DISPLAY_ORDER.map((role) => {
    const product = currentOutfit.find(p => getProductRole(p) === role);

    return (
      <div key={role} className="relative">
        {/* Role label */}
        <div className="text-xs text-gray-500 mb-1">
          {getRoleLabel(role)}
        </div>

        {/* Product slot */}
        <div className={cn(
          "h-16 w-16 rounded-md border-2",
          product ? "border-accent-2" : "border-dashed"
        )}>
          {product ? (
            <img src={product.image} alt={product.title} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-xs text-gray-400">Empty</span>
            </div>
          )}
        </div>
      </div>
    );
  })}
</div>
```

### Phase 4: API Integration (app/api/studio/generate-look/route.ts)

Already implemented! The API now:
- ✅ Accepts products with role/category metadata
- ✅ Labels images in prompt by role
- ✅ Sends structured prompts to Gemini

**Example prompt**:
```
INPUT IMAGES (in order):
1. TOP
2. BOTTOM
3. FOOTWEAR
4. AVATAR
```

### Phase 5: Frontend Request (components/artifact/studio/bottom-actions.tsx)

Already implemented! Now sends:
```typescript
products: currentOutfit.map(product => ({
  url: product.image,
  category: product.sourceData?.category,
  role: getProductRole(product), // Add explicit role
}))
```

---

## API Changes

### No Breaking Changes

All changes are **backward compatible**:

1. **Legacy format still works**:
   ```json
   { "avatarUrl": "...", "productUrls": ["..."] }
   ```

2. **New format adds metadata**:
   ```json
   {
     "avatarUrl": "...",
     "products": [
       { "url": "...", "role": "top", "category": "shirt" }
     ]
   }
   ```

3. **Role resolution is automatic**:
   - If `role` provided → use it
   - If only `category` → map to role
   - If neither → fallback to `accessory`

### Enhanced Prompt Generation

The API now generates labeled prompts:

```
INPUT IMAGES (in order):
1. OUTERWEAR (jacket)
2. TOP (shirt)
3. BOTTOM (pants)
4. FOOTWEAR (sneakers)
5. ACCESSORY (watch)
6. AVATAR (the person to dress)
```

This gives Gemini AI much clearer context about which item is which.

---

## UI/UX Changes

### Before (Current)

```
┌─────────────┐
│ Outfit (6)  │
├─────────────┤
│ [img] [X]   │  ← No role label
│ [img] [X]   │
│ [img] [X]   │
│ [   ]       │
│ [   ]       │
│ [   ]       │
└─────────────┘
```

- Generic slots numbered 1-6
- No indication of what role each item serves
- Can add duplicate roles

### After (Proposed)

```
┌─────────────┐
│ Outfit      │
├─────────────┤
│ Outerwear   │
│ [img] [X]   │  ← Role labeled
├─────────────┤
│ Top         │
│ [img] [X]   │
├─────────────┤
│ Bottom      │
│ [img] [X]   │
├─────────────┤
│ Footwear    │
│ [empty]     │  ← Empty slots shown
├─────────────┤
│ Accessories │
│ [empty]     │
└─────────────┘
```

- Role labels above each slot
- Empty slots clearly indicated
- Logical top-to-bottom order
- Visual feedback when slot is filled

### Interaction Flow

1. **User clicks "Add to Outfit" on a product**
2. **Validation runs**: Check if role slot available
3. **Success**: Item added, slot fills, visual feedback
4. **Failure**: Toast error explaining why (e.g., "You already have a top")

---

## Migration Strategy

### No Migration Required! ✅

This design works with existing data:

1. **Existing wardrobe items** have `category` field
2. **Category maps to role** automatically via `CATEGORY_TO_ROLE`
3. **No database changes** needed
4. **New items can set explicit `role`** (optional future enhancement)

### Rollout Plan

**Phase 1 - Backend (1 day)**:
- ✅ Already done! API accepts and uses role/category

**Phase 2 - Type System (2 hours)**:
- Create `types/outfit-roles.ts`
- Add validation functions
- Export utilities

**Phase 3 - State Management (1 hour)**:
- Update `studio-provider.tsx`
- Add validation to `addToOutfit()`
- Test edge cases

**Phase 4 - UI Updates (4 hours)**:
- Update `outfit-column.tsx` with role labels
- Add visual indicators for empty/filled slots
- Improve drag-and-drop (future)
- Polish styling

**Total**: ~1 day of development

---

## Future Enhancements

### Short Term

1. **Drag-to-reorder** - Allow rearranging accessories
2. **Swap functionality** - Replace one top with another directly
3. **Role suggestions** - Show recommended items based on outfit
4. **Quick filters** - Filter wardrobe by role needed

### Medium Term

1. **Explicit role override** - Add UI to manually set item role
2. **Custom roles** - User-defined roles (e.g., "base layer", "statement piece")
3. **Outfit templates** - Pre-defined role combinations ("Casual", "Formal", "Athletic")
4. **Smart suggestions** - AI recommends items to complete outfit

### Long Term

1. **Layering system** - Support multiple tops (base + mid + outer)
2. **Occasion-based roles** - Different role sets for different contexts
3. **Seasonal roles** - Seasonal item suggestions
4. **Social sharing** - Share outfit with role breakdown

---

## Testing Strategy

### Unit Tests

```typescript
describe('getProductRole', () => {
  it('should return explicit role if provided', () => {
    const product = {
      sourceData: { role: 'top', category: 'jacket' }
    };
    expect(getProductRole(product)).toBe('top');
  });

  it('should map category to role', () => {
    const product = {
      sourceData: { category: 'shirt' }
    };
    expect(getProductRole(product)).toBe('top');
  });

  it('should fallback to accessory', () => {
    const product = { sourceData: {} };
    expect(getProductRole(product)).toBe('accessory');
  });
});

describe('canAddToOutfit', () => {
  it('should allow adding item to empty outfit', () => {
    const result = canAddToOutfit([], mockShirt);
    expect(result.canAdd).toBe(true);
  });

  it('should prevent duplicate roles', () => {
    const outfit = [mockShirt];
    const result = canAddToOutfit(outfit, mockSweater);
    expect(result.canAdd).toBe(false);
    expect(result.reason).toContain('already have a top');
  });

  it('should allow multiple accessories', () => {
    const outfit = [mockWatch, mockBelt];
    const result = canAddToOutfit(outfit, mockScarf);
    expect(result.canAdd).toBe(true);
  });

  it('should prevent adding dress with top', () => {
    const outfit = [mockShirt];
    const result = canAddToOutfit(outfit, mockDress);
    expect(result.canAdd).toBe(false);
  });
});
```

### Integration Tests

1. Add item → Verify slot fills
2. Add duplicate role → Verify error toast
3. Add dress with top → Verify rejection
4. Remove item → Verify slot empties
5. Generate look → Verify labeled prompt sent

---

## Appendix: Complete Type Definitions

```typescript
// types/outfit-roles.ts

import { ClothingCategory } from '@/lib/db/wardrobe-validation';
import { StudioProduct } from '@/types/studio';

/**
 * Logical outfit roles that clothing items can serve
 */
export const OUTFIT_ROLES = [
  'top',
  'bottom',
  'dress',
  'outerwear',
  'footwear',
  'accessory',
] as const;

export type OutfitRole = typeof OUTFIT_ROLES[number];

/**
 * Category-to-role mapping
 */
export const CATEGORY_TO_ROLE: Record<ClothingCategory, OutfitRole> = {
  shirt: 'top',
  sweater: 'top',
  hoodie: 'top',
  pants: 'bottom',
  shorts: 'bottom',
  skirt: 'bottom',
  dress: 'dress',
  jacket: 'outerwear',
  coat: 'outerwear',
  shoes: 'footwear',
  boots: 'footwear',
  sneakers: 'footwear',
  accessories: 'accessory',
  other: 'accessory',
};

/**
 * Preferred display order
 */
export const ROLE_DISPLAY_ORDER: OutfitRole[] = [
  'outerwear',
  'top',
  'dress',
  'bottom',
  'footwear',
  'accessory',
];

/**
 * Validation result
 */
export interface ValidationResult {
  canAdd: boolean;
  reason?: string;
}

/**
 * Get product role
 */
export function getProductRole(product: StudioProduct): OutfitRole {
  const explicitRole = product.sourceData?.role;
  if (explicitRole && OUTFIT_ROLES.includes(explicitRole as OutfitRole)) {
    return explicitRole as OutfitRole;
  }

  const category = product.sourceData?.category;
  if (category && category in CATEGORY_TO_ROLE) {
    return CATEGORY_TO_ROLE[category as ClothingCategory];
  }

  return 'accessory';
}

/**
 * Get role label
 */
export function getRoleLabel(role: OutfitRole): string {
  const labels: Record<OutfitRole, string> = {
    top: 'Top',
    bottom: 'Bottom',
    dress: 'Dress',
    outerwear: 'Outerwear',
    footwear: 'Footwear',
    accessory: 'Accessory',
  };
  return labels[role];
}

/**
 * Validate adding item to outfit
 */
export function canAddToOutfit(
  currentOutfit: StudioProduct[],
  newProduct: StudioProduct
): ValidationResult {
  const newRole = getProductRole(newProduct);

  if (currentOutfit.length >= 6) {
    return { canAdd: false, reason: 'Maximum 6 items in outfit' };
  }

  if (newRole === 'accessory') {
    const accessoryCount = currentOutfit.filter(
      (p) => getProductRole(p) === 'accessory'
    ).length;
    if (accessoryCount >= 3) {
      return { canAdd: false, reason: 'Maximum 3 accessories allowed' };
    }
    return { canAdd: true };
  }

  const roleExists = currentOutfit.some(
    (p) => getProductRole(p) === newRole
  );
  if (roleExists) {
    return {
      canAdd: false,
      reason: `You already have a ${getRoleLabel(newRole).toLowerCase()} in your outfit`,
    };
  }

  if (newRole === 'dress') {
    const hasTopOrBottom = currentOutfit.some((p) => {
      const role = getProductRole(p);
      return role === 'top' || role === 'bottom';
    });
    if (hasTopOrBottom) {
      return { canAdd: false, reason: 'Remove top/bottom before adding a dress' };
    }
  }

  if (newRole === 'top' || newRole === 'bottom') {
    const hasDress = currentOutfit.some(
      (p) => getProductRole(p) === 'dress'
    );
    if (hasDress) {
      return { canAdd: false, reason: 'Remove dress before adding separate top/bottom' };
    }
  }

  return { canAdd: true };
}

/**
 * Sort outfit by role
 */
export function sortByRole(products: StudioProduct[]): StudioProduct[] {
  return [...products].sort((a, b) => {
    const roleA = getProductRole(a);
    const roleB = getProductRole(b);
    const indexA = ROLE_DISPLAY_ORDER.indexOf(roleA);
    const indexB = ROLE_DISPLAY_ORDER.indexOf(roleB);
    return indexA - indexB;
  });
}
```

---

**Last Updated**: 2025-10-20
**Status**: Ready for Implementation
**Next Steps**: Await approval before implementing
