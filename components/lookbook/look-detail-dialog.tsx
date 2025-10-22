'use client';

import { useEffect, useState } from 'react';
import { Lookbook } from '@/types/lookbook';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Calendar } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  role?: string;
  image_url?: string;
  metadata?: any;
  linkCategory: string; // Denormalized from junction
  linkRole: string; // Denormalized from junction
}

interface LookDetailDialogProps {
  lookbook: Lookbook | null;
  onClose: () => void;
}

export function LookDetailDialog({ lookbook, onClose }: LookDetailDialogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lookbook) {
      setProducts([]);
      setError(null);
      return;
    }

    const fetchLookDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`/api/lookbook/looks/${lookbook.id}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch look details');
        }

        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching look details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchLookDetails();
  }, [lookbook]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={!!lookbook} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[85vh] p-0">
        <DialogTitle className="sr-only">{lookbook?.title || 'Look Details'}</DialogTitle>

        {lookbook && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
            {/* Left Column - Look Image */}
            <div className="relative bg-gray-100 dark:bg-zinc-900 lg:sticky lg:top-0 flex items-center justify-center min-h-[40vh] lg:min-h-[85vh]">
              {lookbook.cover_image_url ? (
                <Image
                  src={lookbook.cover_image_url}
                  alt={lookbook.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="text-gray-400">
                  <Package className="h-24 w-24 mx-auto" />
                  <p className="mt-4 text-sm">No image available</p>
                </div>
              )}
            </div>

            {/* Right Column - Look Details & Products */}
            <div className="overflow-y-auto p-6 lg:p-8">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  {lookbook.title}
                </h2>
                {lookbook.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {lookbook.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(lookbook.created_at)}
                  </div>
                  <Badge
                    variant="secondary"
                    className={`capitalize ${
                      lookbook.visibility === 'public'
                        ? 'bg-green-100 text-green-800'
                        : lookbook.visibility === 'shared'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {lookbook.visibility}
                  </Badge>
                </div>
              </div>

              {/* Products Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Products ({products.length})
                </h3>

                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-accent-2" />
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {!loading && !error && products.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm">No products linked to this look</p>
                  </div>
                )}

                {!loading && !error && products.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="group rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {/* Product Image */}
                        <div className="relative aspect-square bg-gray-100 dark:bg-zinc-900">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-3">
                          {product.brand && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">
                              {product.brand}
                            </p>
                          )}
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
                            {product.name}
                          </h4>

                          {/* Role & Category Badges */}
                          <div className="flex flex-wrap gap-1">
                            {product.linkRole && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-accent-2/10 text-accent-2 border-accent-2/20"
                              >
                                {product.linkRole}
                              </Badge>
                            )}
                            {product.linkCategory && product.linkCategory !== product.linkRole && (
                              <Badge variant="outline" className="text-xs">
                                {product.linkCategory}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
