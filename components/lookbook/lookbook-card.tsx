'use client';

import { Lookbook } from '@/types/lookbook';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, MoreHorizontal, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';

interface LookbookCardProps {
  lookbook: Lookbook;
  onEdit?: (lookbook: Lookbook) => void;
  onDelete?: (lookbook: Lookbook) => void;
  onView?: (lookbook: Lookbook) => void;
}

export function LookbookCard({
  lookbook,
  onEdit,
  onDelete,
  onView,
}: LookbookCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg bg-white-soft p-0 gap-0">
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-soft">
        {lookbook.cover_image_url ? (
          <Image
            src={lookbook.cover_image_url}
            alt={lookbook.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <Eye className="h-12 w-12" />
          </div>
        )}

        {/* Three-dot menu */}
        <div className="absolute top-2 right-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 bg-white-soft/90 hover:bg-white-soft backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(lookbook)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Look
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(lookbook)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(lookbook)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {/* Title */}
        <h3 className="text-xl font-bold text-black-soft line-clamp-2 mb-1">
          {lookbook.title}
        </h3>

        {/* Description */}
        {lookbook.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {lookbook.description}
          </p>
        )}

        {/* Visibility badge */}
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={`capitalize px-3 py-1 ${
              lookbook.visibility === 'public'
                ? 'bg-green-100 text-green-800'
                : lookbook.visibility === 'shared'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {lookbook.visibility}
          </Badge>

          {/* Click to view */}
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(lookbook)}
              className="text-accent-2 hover:text-accent-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
