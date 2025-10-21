"use client";

import React from "react";
import { useStudio } from "@/providers/studio-provider";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProductRole, getRoleLabel, sortByRole, OutfitRole } from "@/types/outfit-roles";

const MAX_OUTFIT_ITEMS = 6;

/**
 * Outfit Column Component
 * Vertical column showing current outfit composition (max 6 items)
 * Now with role-based organization and labels
 */
export function OutfitColumn() {
  const { state, removeFromOutfit } = useStudio();
  const { currentOutfit } = state;

  // Sort outfit by role for logical display order
  // We need to create a mapping to preserve original products after sorting
  const sortedOutfit = React.useMemo(() => {
    if (currentOutfit.length === 0) return [];

    // Create array with sourceData for sorting
    const itemsWithSourceData = currentOutfit.map(product => ({
      originalProduct: product,
      sourceData: product.sourceData,
    }));

    // Sort by role using the sourceData
    const sorted = sortByRole(itemsWithSourceData.map(item => item.sourceData));

    // Map back to original products in sorted order
    return sorted.map(sourceData => {
      return itemsWithSourceData.find(item => item.sourceData === sourceData)?.originalProduct;
    }).filter(Boolean);
  }, [currentOutfit]);

  // Create array of 6 slots with sorted products
  const slots = Array.from({ length: MAX_OUTFIT_ITEMS }, (_, index) => {
    const product = sortedOutfit[index];
    return { index, product };
  });

  // Count filled slots by role for display
  const roleCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    currentOutfit.forEach(product => {
      const role = getProductRole(product.sourceData);
      counts[role] = (counts[role] || 0) + 1;
    });
    return counts;
  }, [currentOutfit]);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header with count */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-black-soft/60">
          Outfit ({currentOutfit.length}/{MAX_OUTFIT_ITEMS})
        </span>
        {Object.keys(roleCounts).length > 0 && (
          <div className="flex gap-1">
            {Object.entries(roleCounts).map(([role, count]) => (
              <span key={role} className="text-xs text-black-soft/40" title={getRoleLabel(role as OutfitRole)}>
                {getRoleLabel(role as OutfitRole).charAt(0)}×{count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Outfit Slots */}
      <div className="flex flex-1 flex-col justify-start gap-3">
        {slots.map(({ index, product }) => {
          const role = product ? getProductRole(product.sourceData) : null;
          const roleLabel = role ? getRoleLabel(role) : null;

          return (
            <div key={index} className="flex flex-col gap-1">
              {/* Role Label (only show for filled slots) */}
              {product && roleLabel && (
                <span className="text-xs font-medium text-black-soft/50 px-1">
                  {roleLabel}
                </span>
              )}

              {/* Product Slot */}
              <div
                className={cn(
                  "group relative h-16 w-16 overflow-hidden rounded-md border-2 transition-all",
                  product
                    ? "border-accent-2 bg-white-soft shadow-sm"
                    : "border-dashed border-black-soft/10 bg-white-soft/50"
                )}
              >
                {product ? (
                  <>
                    {/* Product Thumbnail */}
                    <div className="relative h-full w-full overflow-hidden rounded-md bg-gray-soft">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromOutfit(product.id)}
                      className="absolute -right-1 -top-1 rounded-full bg-white-soft p-0.5 shadow-md opacity-0 transition-opacity hover:bg-gray-soft group-hover:opacity-100"
                      aria-label={`Remove ${roleLabel} from outfit`}
                    >
                      <X className="h-3 w-3 text-black-soft" />
                    </button>
                  </>
                ) : (
                  // Empty slot indicator
                  <div className="flex h-full items-center justify-center">
                    <span className="text-xs text-black-soft/15">{index + 1}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
