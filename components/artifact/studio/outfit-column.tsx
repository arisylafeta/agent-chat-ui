"use client";

import React from "react";
import { useStudio } from "@/providers/studio-provider";
import { X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const MAX_OUTFIT_ITEMS = 6;

/**
 * Outfit Column Component
 * Vertical column showing current outfit composition (max 6 items)
 */
export function OutfitColumn() {
  const { state, removeFromOutfit } = useStudio();
  const { currentOutfit } = state;

  // Create array of 6 slots
  const slots = Array.from({ length: MAX_OUTFIT_ITEMS }, (_, index) => {
    const product = currentOutfit[index];
    return { index, product };
  });

  return (
    <div className="flex flex-col gap-2">
      {slots.map(({ index, product }) => (
        <div
          key={index}
          className={cn(
            "group relative h-16 w-16 overflow-hidden rounded-md border-2 transition-all",
            product
              ? "border-accent-2 bg-white-soft"
              : "border-dashed border-gray-soft bg-gray-soft/30"
          )}
        >
          {product ? (
            <>
              {/* Product Thumbnail */}
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-xs text-black-soft/40">?</span>
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={() => removeFromOutfit(product.id)}
                className="absolute -right-1 -top-1 rounded-full bg-white-soft p-0.5 shadow-md opacity-0 transition-opacity hover:bg-gray-soft group-hover:opacity-100"
                aria-label="Remove from outfit"
              >
                <X className="h-3 w-3 text-black-soft" />
              </button>
            </>
          ) : (
            // Empty slot indicator
            <div className="flex h-full items-center justify-center">
              <span className="text-xs text-black-soft/20">{index + 1}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
