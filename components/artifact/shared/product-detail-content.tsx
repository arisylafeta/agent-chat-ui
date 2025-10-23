"use client";

import React from "react";
import { Star, ShoppingCart, Heart, Search, Save, Package, MessageSquare } from "lucide-react";
import { DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import posthog from "posthog-js";
import { useStudio } from "@/providers/studio-provider";
import { toStudioProduct } from "@/types/studio";
import type { Product } from "@/types/product";
import { toast } from "sonner";

type ProductDetailContentProps = {
  product: Product;
  onClose?: () => void;
  showReviews?: boolean;
  eventPrefix?: string;
};

/**
 * Product detail drawer content component.
 *
 * Displays product information in a two-column layout:
 * - Left: Product image (full size if available)
 * - Right: Product details, pricing, actions, description, attributes
 *
 * Props:
 * - `product`: Product data to display
 * - `onClose`: Optional callback when drawer should close
 * - `showReviews`: Whether to show fake reviews section (default: false)
 * - `eventPrefix`: Prefix for PostHog events (default: 'product')
 *
 * Usage:
 * ```tsx
 * <ArtifactDrawer open={isOpen} onOpenChange={setIsOpen}>
 *   <ProductDetailContent
 *     product={selectedProduct}
 *     onClose={() => setIsOpen(false)}
 *     showReviews={true}
 *     eventPrefix="lens"
 *   />
 * </ArtifactDrawer>
 * ```
 */
export function ProductDetailContent({
  product,
  onClose,
  showReviews = false,
  eventPrefix = "product",
}: ProductDetailContentProps) {
  const { addToSelected, removeFromSelected, state: studioState } = useStudio();
  const hasPrice = product.price > 0;
  const inStock = product.in_stock;

  // State for save to wardrobe functionality
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);

  // Format price with currency symbol
  const formatPrice = (price: number, currency: string) => {
    const currencySymbol = currency.replace(/[^$£€¥]/g, '') || '$';
    return `${currencySymbol}${price.toFixed(0)}`;
  };

  // Handle save to wardrobe
  const handleSaveToWardrobe = async () => {
    if (isSaving || isSaved) return;

    try {
      setIsSaving(true);

      // Track click event
      posthog.capture(`${eventPrefix}_save_to_wardrobe_clicked`, {
        product_id: product.id,
        product_name: product.name,
        product_brand: product.brand,
        product_price: product.price,
      });

      // Call API to save product
      const response = await fetch('/api/wardrobe/save-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save product');
      }

      const data = await response.json();

      // Track success event
      posthog.capture(`${eventPrefix}_saved_to_wardrobe_success`, {
        product_id: product.id,
        product_name: product.name,
        wardrobe_item_id: data.wardrobeItemId,
        already_exists: data.alreadyExists,
      });

      setIsSaved(true);

      if (data.alreadyExists) {
        toast.success("This item is already in your wardrobe");
      } else {
        toast.success("Saved to wardrobe!");
      }

    } catch (error: any) {
      console.error('Save to wardrobe error:', error);

      // Track failure event
      posthog.capture(`${eventPrefix}_saved_to_wardrobe_failed`, {
        product_id: product.id,
        error: error.message,
      });

      toast.error(error.message || "Failed to save to wardrobe");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Visually Hidden Title for Accessibility */}
      <DrawerTitle className="sr-only">{product.name}</DrawerTitle>

      <div className="px-4 pb-4 pt-4">
        {/* Two Column Layout on Large Screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Product Image Only */}
          <div>
            <div className="bg-white dark:bg-zinc-900 lg:rounded-lg overflow-hidden lg:sticky lg:top-0 flex items-center justify-center lg:h-[60vh]">
              {(product.image_full || product.image) ? (
                <img
                  src={product.image_full || product.image}
                  alt={product.name}
                  className="w-full h-auto lg:h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Right Column - ALL Product Info */}
          <div className="space-y-4">
            {/* Title and Brand */}
            <div>
              <h3 className="text-sm lg:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                {product.name}
              </h3>
              {product.brand && (
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {product.brand}
                </p>
              )}
            </div>

            {/* Price and Stock */}
            <div className="flex items-center justify-between">
              <div>
                {hasPrice ? (
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(product.price, product.currency)}
                  </div>
                ) : (
                  <p className="text-lg text-gray-500 dark:text-gray-400">Price not available</p>
                )}
              </div>
              {inStock === true && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  In Stock
                </span>
              )}
              {inStock === false && showReviews && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
                {product.reviews && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    ({product.reviews.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={product.product_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  posthog.capture(`${eventPrefix}_buy_product_clicked`, {
                    product_id: product.id,
                    product_name: product.name,
                    product_brand: product.brand,
                    product_price: product.price,
                    product_url: product.product_url,
                    in_stock: product.in_stock,
                    has_rating: !!product.rating,
                    rating: product.rating,
                  });
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-2 hover:bg-accent-2/90 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                Buy Product
              </a>
              <button
                onClick={() => {
                  const isSelected = studioState.selectedProducts.some(p => p.id === product.id);

                  if (isSelected) {
                    // Remove product from Studio
                    removeFromSelected(product.id);

                    // Track removal event
                    posthog.capture(`${eventPrefix}_product_removed_from_studio`, {
                      product_id: product.id,
                      product_name: product.name,
                      product_brand: product.brand,
                      product_price: product.price,
                    });
                  } else {
                    // Add product to Studio
                    addToSelected(toStudioProduct(product));

                    // Track addition event
                    posthog.capture(`${eventPrefix}_product_selected_for_studio`, {
                      product_id: product.id,
                      product_name: product.name,
                      product_brand: product.brand,
                      product_price: product.price,
                    });
                  }
                }}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2.5 border text-sm font-medium rounded-lg transition-colors",
                  studioState.selectedProducts.some(p => p.id === product.id)
                    ? "border-accent-2 bg-accent-2/10 text-accent-2 dark:bg-accent-2/20"
                    : "border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
                )}
              >
                <Heart className={cn(
                  "h-4 w-4",
                  studioState.selectedProducts.some(p => p.id === product.id) && "fill-current"
                )} />
                {studioState.selectedProducts.some(p => p.id === product.id) ? "Selected" : "Select To Try"}
              </button>
              <button
                onClick={() => {
                  posthog.capture(`${eventPrefix}_find_similar_clicked`, {
                    product_id: product.id,
                    product_name: product.name,
                    product_brand: product.brand,
                    product_price: product.price,
                  });
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                <Search className="h-4 w-4" />
                Find Similar
              </button>
              <button
                onClick={handleSaveToWardrobe}
                disabled={isSaving || isSaved}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2.5 border text-sm font-medium rounded-lg transition-colors",
                  isSaved
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 cursor-default"
                    : "border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300",
                  (isSaving || isSaved) && "opacity-75"
                )}
              >
                <Save className={cn("h-4 w-4", isSaved && "fill-current")} />
                {isSaving ? "Saving..." : isSaved ? "Saved" : "Save To Wardrobe"}
              </button>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Attributes */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Details</h4>
                <dl className="grid grid-cols-2 gap-2">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    value && (
                      <div key={key} className="text-xs">
                        <dt className="font-medium text-gray-600 dark:text-gray-400 capitalize">
                          {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="text-gray-900 dark:text-white mt-0.5">
                          {String(value)}
                        </dd>
                      </div>
                    )
                  ))}
                </dl>
              </div>
            )}

            {/* What People Are Saying - Only for lens results */}
            {showReviews && (
              <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">What People Are Saying</h4>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">Sarah M.</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      "Absolutely love this! The quality exceeded my expectations and it fits perfectly."
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {[...Array(4)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                        <Star className="h-3 w-3 text-gray-300" />
                      </div>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">Mike R.</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      "Great value for money. Shipping was fast and the product matches the description."
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
