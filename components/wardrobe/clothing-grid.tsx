'use client';

import { ClothingItem } from '@/types/wardrobe';
import { ClothingItemCard } from './clothing-item-card';
import { Loader2 } from 'lucide-react';

interface ClothingGridProps {
  items: ClothingItem[];
  loading?: boolean;
  onEdit?: (item: ClothingItem) => void;
  onDelete?: (item: ClothingItem) => void;
}

export function ClothingGrid({
  items,
  loading = false,
  onEdit,
  onDelete,
}: ClothingGridProps) {
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
    <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-5 gap-6">
      {items.map((item) => (
        <ClothingItemCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
