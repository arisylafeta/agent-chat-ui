'use client';

import { ClothingItem } from '@/types/wardrobe';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface ClothingItemDetailProps {
  item: ClothingItem | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (item: ClothingItem) => void;
  onDelete?: (item: ClothingItem) => void;
}

export function ClothingItemDetail({
  item,
  open,
  onClose,
  onEdit,
  onDelete,
}: ClothingItemDetailProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{item.name}</span>
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onEdit(item);
                    onClose();
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    onDelete(item);
                    onClose();
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          {item.image_url && (
            <div className="relative aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden bg-gray-soft">
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-1">Category</h4>
              <Badge variant="secondary" className="capitalize">
                {item.category}
              </Badge>
            </div>

            {/* Brand */}
            {item.brand && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Brand</h4>
                <p className="text-black-soft">{item.brand}</p>
              </div>
            )}

            {/* Colors */}
            {item.colors && item.colors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Colors</h4>
                <div className="flex gap-2 flex-wrap">
                  {item.colors.map((color: string) => (
                    <Badge key={color} variant="outline" className="capitalize">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Fabrics */}
            {item.fabrics && item.fabrics.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Fabrics</h4>
                <div className="flex gap-2 flex-wrap">
                  {item.fabrics.map((fabric: string) => (
                    <Badge key={fabric} variant="outline" className="capitalize">
                      {fabric}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Seasons */}
            {item.seasons && item.seasons.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Seasons</h4>
                <div className="flex gap-2 flex-wrap">
                  {item.seasons.map((season: string) => (
                    <Badge key={season} variant="outline" className="capitalize">
                      {season}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Dress Codes */}
            {item.dress_codes && item.dress_codes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Dress Codes</h4>
                <div className="flex gap-2 flex-wrap">
                  {item.dress_codes.map((code: string) => (
                    <Badge key={code} variant="outline" className="capitalize">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            {item.price && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Price</h4>
                <p className="text-lg font-semibold text-accent-2">
                  ${item.price.toFixed(2)}
                </p>
              </div>
            )}

            {/* Gender */}
            {item.gender && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Gender</h4>
                <p className="text-black-soft capitalize">{item.gender}</p>
              </div>
            )}

            {/* Size */}
            {item.size && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Size</h4>
                <p className="text-black-soft">{item.size}</p>
              </div>
            )}

            {/* Purchase Date */}
            {item.purchase_date && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">
                  Purchase Date
                </h4>
                <p className="text-black-soft">
                  {new Date(item.purchase_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Tags</h4>
              <div className="flex gap-2 flex-wrap">
                {item.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Notes</h4>
              <p className="text-black-soft whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p>Created: {new Date(item.created_at).toLocaleString()}</p>
            {item.updated_at && (
              <p>Updated: {new Date(item.updated_at).toLocaleString()}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
