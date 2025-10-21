/**
 * Outfit Role System for AI-Powered Categorization
 *
 * This module defines the role-based validation system for outfit composition.
 * It maps clothing categories to outfit roles and enforces validation rules
 * to prevent invalid outfit combinations (e.g., dress + pants, multiple tops).
 *
 * Architecture:
 * - Multimodal LLM in agent analyzes images and assigns category/role
 * - Frontend validates outfit composition using these rules
 * - UI displays items organized by role
 *
 * @see docs/ai-categorization-feature-research.md for full design
 */

import type { ClothingCategory } from './wardrobe';

// ============================================================================
// OUTFIT ROLES
// ============================================================================

/**
 * Outfit roles represent the functional position of a clothing item in an outfit.
 * Each product maps to exactly one role based on its category.
 */
export const OUTFIT_ROLES = [
  'top',         // Shirts, blouses, t-shirts
  'bottom',      // Pants, shorts, skirts
  'dress',       // Dresses (conflicts with top/bottom)
  'fullbody',    // Suits, tracksuits, jumpsuits, rompers (conflicts with top/bottom/dress)
  'outerwear',   // Jackets, coats (can layer over anything)
  'footwear',    // Shoes, boots, sneakers
  'accessory',   // Bags, jewelry, belts, hats (max 3)
] as const;

export type OutfitRole = (typeof OUTFIT_ROLES)[number];

// ============================================================================
// CATEGORY TO ROLE MAPPING
// ============================================================================

/**
 * Maps clothing categories to their outfit role.
 * This mapping is used by getProductRole() to determine the role of a product.
 *
 * Note: Categories not in this map default to 'accessory' role.
 */
export const CATEGORY_TO_ROLE: Record<string, OutfitRole> = {
  // Tops
  'shirt': 'top',
  'blouse': 'top',
  't-shirt': 'top',
  'tshirt': 'top',
  'tank top': 'top',
  'tanktop': 'top',
  'crop top': 'top',
  'croptop': 'top',
  'sweater': 'top',
  'hoodie': 'top',
  'cardigan': 'top',

  // Bottoms
  'pants': 'bottom',
  'jeans': 'bottom',
  'shorts': 'bottom',
  'skirt': 'bottom',
  'trousers': 'bottom',
  'leggings': 'bottom',

  // Dresses
  'dress': 'dress',

  // Fullbody (NEW - these are the key additions)
  'suit': 'fullbody',
  'tracksuit': 'fullbody',
  'jumpsuit': 'fullbody',
  'romper': 'fullbody',
  'overalls': 'fullbody',
  'coveralls': 'fullbody',

  // Outerwear
  'jacket': 'outerwear',
  'coat': 'outerwear',
  'blazer': 'outerwear',
  'parka': 'outerwear',
  'windbreaker': 'outerwear',
  'vest': 'outerwear',

  // Footwear
  'shoes': 'footwear',
  'boots': 'footwear',
  'sneakers': 'footwear',
  'sandals': 'footwear',
  'heels': 'footwear',
  'flats': 'footwear',

  // Accessories (explicit mapping, though these default to accessory anyway)
  'accessories': 'accessory',
  'bag': 'accessory',
  'purse': 'accessory',
  'backpack': 'accessory',
  'belt': 'accessory',
  'hat': 'accessory',
  'scarf': 'accessory',
  'jewelry': 'accessory',
  'watch': 'accessory',
  'sunglasses': 'accessory',
  'glasses': 'accessory',
};

// ============================================================================
// PRODUCT INTERFACE
// ============================================================================

/**
 * Minimal product interface for role determination.
 * Products can have an explicit role or derive it from category.
 */
export interface ProductWithRole {
  category?: string | ClothingCategory;
  role?: OutfitRole | string;
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

/**
 * Result of outfit validation check.
 * Used by canAddToOutfit() to communicate validation outcome.
 */
export interface ValidationResult {
  canAdd: boolean;
  reason?: string;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get the outfit role for a product.
 *
 * Priority:
 * 1. Use explicit product.role if provided
 * 2. Map product.category via CATEGORY_TO_ROLE
 * 3. Default to 'accessory' if no match
 *
 * @param product - Product with optional category and role
 * @returns The outfit role for this product
 *
 * @example
 * getProductRole({ category: 'suit' }) // => 'fullbody'
 * getProductRole({ category: 'shirt' }) // => 'top'
 * getProductRole({ role: 'dress' }) // => 'dress' (explicit override)
 * getProductRole({ category: 'unknown' }) // => 'accessory' (fallback)
 */
export function getProductRole(product: ProductWithRole): OutfitRole {
  // Priority 1: Explicit role override
  if (product.role && OUTFIT_ROLES.includes(product.role as OutfitRole)) {
    return product.role as OutfitRole;
  }

  // Priority 2: Category mapping
  if (product.category) {
    const categoryLower = product.category.toLowerCase();
    const mappedRole = CATEGORY_TO_ROLE[categoryLower];
    if (mappedRole) {
      return mappedRole;
    }
  }

  // Priority 3: Default fallback
  return 'accessory';
}

/**
 * Get human-readable label for an outfit role.
 *
 * @param role - The outfit role
 * @returns Display label for the role
 *
 * @example
 * getRoleLabel('top') // => 'Top'
 * getRoleLabel('fullbody') // => 'Full Body'
 */
export function getRoleLabel(role: OutfitRole): string {
  const labels: Record<OutfitRole, string> = {
    top: 'Top',
    bottom: 'Bottom',
    dress: 'Dress',
    fullbody: 'Full Body',
    outerwear: 'Outerwear',
    footwear: 'Footwear',
    accessory: 'Accessory',
  };

  return labels[role];
}

/**
 * Validate whether a product can be added to the current outfit.
 *
 * Validation rules:
 * 1. Max 6 items total
 * 2. Max 1 top (no duplicate tops)
 * 3. Max 1 bottom (no duplicate bottoms)
 * 4. Max 1 dress (conflicts with top/bottom)
 * 5. Max 1 fullbody (conflicts with top/bottom/dress)
 * 6. Max 1 outerwear (can layer over anything)
 * 7. Max 1 footwear (no duplicate shoes)
 * 8. Max 3 accessories
 *
 * Conflict rules:
 * - Dress conflicts with top/bottom (can't wear dress + shirt/pants)
 * - Fullbody conflicts with top/bottom/dress (suit covers everything)
 * - Outerwear, footwear, accessories can combine with any core item
 *
 * @param currentOutfit - Array of products currently in outfit
 * @param newProduct - Product to add
 * @returns Validation result with canAdd boolean and reason string
 *
 * @example
 * const outfit = [{ category: 'shirt' }, { category: 'pants' }];
 * canAddToOutfit(outfit, { category: 'dress' })
 * // => { canAdd: false, reason: "Can't add dress - you already have a top or bottom" }
 */
export function canAddToOutfit(
  currentOutfit: ProductWithRole[],
  newProduct: ProductWithRole
): ValidationResult {
  const newRole = getProductRole(newProduct);

  // Rule 1: Max 6 items total
  if (currentOutfit.length >= 6) {
    return {
      canAdd: false,
      reason: 'Outfit is full (max 6 items)',
    };
  }

  // Count current roles
  const roleCounts: Record<string, number> = {};
  for (const item of currentOutfit) {
    const role = getProductRole(item);
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  }

  const hasTop = roleCounts['top'] > 0;
  const hasBottom = roleCounts['bottom'] > 0;
  const hasDress = roleCounts['dress'] > 0;
  const hasFullbody = roleCounts['fullbody'] > 0;
  const accessoryCount = roleCounts['accessory'] || 0;

  // Rule 2: Max 1 top
  if (newRole === 'top' && hasTop) {
    return {
      canAdd: false,
      reason: 'You already have a top in this outfit',
    };
  }

  // Rule 3: Max 1 bottom
  if (newRole === 'bottom' && hasBottom) {
    return {
      canAdd: false,
      reason: 'You already have a bottom in this outfit',
    };
  }

  // Rule 4: Dress conflicts with top/bottom
  if (newRole === 'dress') {
    if (hasDress) {
      return {
        canAdd: false,
        reason: 'You already have a dress in this outfit',
      };
    }
    if (hasTop || hasBottom) {
      return {
        canAdd: false,
        reason: "Can't add dress - you already have a top or bottom",
      };
    }
    if (hasFullbody) {
      return {
        canAdd: false,
        reason: "Can't add dress - you already have a full body item (suit/jumpsuit/tracksuit)",
      };
    }
  }

  // Rule 5: Fullbody conflicts with top/bottom/dress
  if (newRole === 'fullbody') {
    if (hasFullbody) {
      return {
        canAdd: false,
        reason: 'You already have a full body item (suit/jumpsuit/tracksuit) in this outfit',
      };
    }
    if (hasTop || hasBottom) {
      return {
        canAdd: false,
        reason: "Can't add full body item - you already have a top or bottom",
      };
    }
    if (hasDress) {
      return {
        canAdd: false,
        reason: "Can't add full body item - you already have a dress",
      };
    }
  }

  // Rule 6: Max 1 outerwear
  if (newRole === 'outerwear' && roleCounts['outerwear'] > 0) {
    return {
      canAdd: false,
      reason: 'You already have outerwear in this outfit',
    };
  }

  // Rule 7: Max 1 footwear
  if (newRole === 'footwear' && roleCounts['footwear'] > 0) {
    return {
      canAdd: false,
      reason: 'You already have footwear in this outfit',
    };
  }

  // Rule 8: Max 3 accessories
  if (newRole === 'accessory' && accessoryCount >= 3) {
    return {
      canAdd: false,
      reason: 'Maximum 3 accessories allowed per outfit',
    };
  }

  // Additional conflict check: prevent adding top/bottom when dress exists
  if ((newRole === 'top' || newRole === 'bottom') && hasDress) {
    return {
      canAdd: false,
      reason: "Can't add top or bottom - you already have a dress",
    };
  }

  // Additional conflict check: prevent adding top/bottom when fullbody exists
  if ((newRole === 'top' || newRole === 'bottom') && hasFullbody) {
    return {
      canAdd: false,
      reason: "Can't add top or bottom - you already have a full body item (suit/jumpsuit/tracksuit)",
    };
  }

  return {
    canAdd: true,
  };
}

/**
 * Sort products by their role for display.
 * Uses ROLE_DISPLAY_ORDER to show items in logical outfit order.
 *
 * Display order: outerwear → top → dress/fullbody → bottom → footwear → accessories
 *
 * @param products - Array of products to sort
 * @returns Sorted array of products
 *
 * @example
 * const items = [
 *   { category: 'shoes' },
 *   { category: 'shirt' },
 *   { category: 'jacket' },
 * ];
 * sortByRole(items)
 * // => [jacket, shirt, shoes] (outerwear → top → footwear)
 */
export function sortByRole<T extends ProductWithRole>(products: T[]): T[] {
  const ROLE_DISPLAY_ORDER: Record<OutfitRole, number> = {
    outerwear: 1,
    top: 2,
    dress: 3,
    fullbody: 3,  // Same priority as dress (mutually exclusive)
    bottom: 4,
    footwear: 5,
    accessory: 6,
  };

  return [...products].sort((a, b) => {
    const roleA = getProductRole(a);
    const roleB = getProductRole(b);
    return ROLE_DISPLAY_ORDER[roleA] - ROLE_DISPLAY_ORDER[roleB];
  });
}
