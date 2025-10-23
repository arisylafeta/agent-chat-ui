'use client';

import { ClothingItem } from '@/types/wardrobe';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface WardrobeDrawerGridProps {
  items: ClothingItem[];
  loading?: boolean;
  onItemClick?: (item: ClothingItem) => void;
}

/**
 * Responsive grid for drawer display of wardrobe items
 * Uses container queries to adapt to actual container width
 * Automatically flows from 2 → 3 → 4 → 5 columns based on available space
 * Container-aware: works in full-screen mobile drawer OR desktop sidebar
 * Cards are fully clickable to add items to selected products
 */
export function WardrobeDrawerGrid({
  items,
  loading = false,
  onItemClick,
}: WardrobeDrawerGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent-2" />
      </div>
    );
  }

  // Don't show anything if empty - let the parent handle empty state
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid auto-rows-max grid-cols-2 gap-4 @[32rem]:grid-cols-3 @[48rem]:grid-cols-4 @[64rem]:grid-cols-5">
      {items.map((item) => (
        <Card
          key={item.id}
          className="group relative overflow-hidden transition-all hover:shadow-lg bg-white-soft p-0 gap-0 cursor-pointer"
          onClick={() => onItemClick?.(item)}
        >
          {/* Item Image */}
          <div className="relative aspect-square overflow-hidden bg-gray-soft">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 32rem) 50vw, (max-width: 48rem) 33vw, (max-width: 64rem) 25vw, 20vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <div className="text-center p-4">
                  <p className="text-xs">No image</p>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-3 py-2">
            {/* Title */}
            <h3 className="text-sm font-semibold text-black-soft line-clamp-2">
              {item.name}
            </h3>
            {/* Brand */}
            {item.brand && (
              <p className="text-xs text-black-soft/60 line-clamp-1 mt-0.5">
                {item.brand}
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
