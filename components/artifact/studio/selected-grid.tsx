"use client";

import React from "react";
import { useStudio } from "@/providers/studio-provider";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Selected Grid Component
 * Displays selected products with inline "Add to Outfit" and remove actions
 */
export function SelectedGrid() {
  const { state, moveToOutfit, removeFromSelected } = useStudio();
  const { selectedProducts, currentOutfit } = state;

  // Empty state
  if (selectedProducts.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <div className="rounded-full bg-gray-soft p-4 mb-4">
          <Plus className="h-8 w-8 text-black-soft/40" />
        </div>
        <p className="text-lg font-medium text-black-soft/60">No items selected</p>
        <p className="text-sm text-black-soft/40 mt-2">
          Select products from search results to try them on
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
      {selectedProducts.map((product) => {
        const isInOutfit = currentOutfit.some((p) => p.id === product.id);

        return (
          <div
            key={product.id}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-soft bg-white-soft transition-shadow hover:shadow-md"
          >
            {/* Product Image */}
            <div className="relative aspect-square w-full overflow-hidden bg-gray-soft">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  No image
                </div>
              )}

              {/* Hover Overlay with Add to Outfit Button */}
              <div className="absolute inset-0 flex items-center justify-center bg-black-soft/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="sm"
                  onClick={() => moveToOutfit(product.id)}
                  disabled={isInOutfit}
                  className={cn(
                    "gap-2",
                    isInOutfit && "cursor-not-allowed opacity-50"
                  )}
                >
                  <Plus className="h-4 w-4" />
                  {isInOutfit ? "In Outfit" : "Add to Outfit"}
                </Button>
              </div>

              {/* Remove Button (top-right corner) */}
              <button
                onClick={() => removeFromSelected(product.id)}
                className="absolute right-2 top-2 rounded-full bg-white-soft p-1.5 shadow-md opacity-0 transition-opacity hover:bg-gray-soft group-hover:opacity-100"
                aria-label="Remove from selected"
              >
                <X className="h-4 w-4 text-black-soft" />
              </button>
            </div>

            {/* Product Info */}
            <div className="flex flex-col gap-1 p-3">
              <h4 className="line-clamp-2 text-sm font-medium text-black-soft">
                {product.title}
              </h4>
              <p className="text-xs text-black-soft/60">{product.brand}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
