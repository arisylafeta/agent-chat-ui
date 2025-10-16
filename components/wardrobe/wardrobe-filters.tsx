'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { ClothingCategory } from '@/types/wardrobe';

const CATEGORIES: ClothingCategory[] = [
  'shirt',
  'pants',
  'dress',
  'jacket',
  'shoes',
  'accessories',
  'other',
];

interface WardrobeFiltersProps {
  search: string;
  category: ClothingCategory | 'all';
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: ClothingCategory | 'all') => void;
  onClearFilters: () => void;
}

export function WardrobeFilters({
  search,
  category,
  onSearchChange,
  onCategoryChange,
  onClearFilters,
}: WardrobeFiltersProps) {

  const hasActiveFilters = search !== '' || category !== 'all';

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Search - Left side */}
      <div className="relative w-full sm:w-auto sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Spacer to push category/clear to the right */}
      <div className="flex-1 hidden sm:block"></div>

      {/* Category and Clear - Right side */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat: ClothingCategory) => (
              <SelectItem key={cat} value={cat} className="capitalize">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-2 shrink-0"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
