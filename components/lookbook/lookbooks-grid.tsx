'use client';

import { Lookbook } from '@/types/lookbook';
import { LookbookCard } from './lookbook-card';
import { Loader2 } from 'lucide-react';

interface LookbooksGridProps {
  lookbooks: Lookbook[];
  loading?: boolean;
  onEdit?: (lookbook: Lookbook) => void;
  onDelete?: (lookbook: Lookbook) => void;
  onView?: (lookbook: Lookbook) => void;
}

export function LookbooksGrid({
  lookbooks,
  loading = false,
  onEdit,
  onDelete,
  onView,
}: LookbooksGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent-2" />
      </div>
    );
  }

  // Don't show anything if empty - let the parent handle empty state
  if (lookbooks.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-5 gap-6">
      {lookbooks.map((lookbook) => (
        <LookbookCard
          key={lookbook.id}
          lookbook={lookbook}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  );
}
