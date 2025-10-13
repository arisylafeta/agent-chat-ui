"use client";

import React, { useState, useMemo } from "react";
import { useStreamContext as useReactUIStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { Package, AlertCircle, SlidersHorizontal, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShoppingCart, Heart, Search, TrendingUp, MessageSquare } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import posthog from "posthog-js";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  image_full?: string;
  brand: string;
  currency: string;
  description: string;
  product_url: string;
  rating?: number;
  reviews?: number;
  in_stock?: boolean;
  source_icon?: string;
  position?: number;
  attributes: Record<string, any>;
};

type LensResultsProps = {
  title?: string;
  summary?: string;
  imageUrl?: string;
  products?: Product[];
  modelName?: string;
  isStreaming?: boolean;
  loadedCount?: number;
  totalCount?: number;
  error?: boolean;
  errorMessage?: string;
};

export function LensResults(props: LensResultsProps) {
  // Access meta passed via LoadExternalComponent
  const { meta } = useReactUIStreamContext();
  const artifactTuple = (meta as any)?.artifact ?? null;

  let ArtifactComp: any = null;
  let bag: any = null;
  if (Array.isArray(artifactTuple)) {
    [ArtifactComp, bag] = artifactTuple;
  }

  const setOpen = bag?.setOpen ?? (() => {});
  const isOpen = !!bag?.open;
  const products = useMemo(() => props.products || [], [props.products]);
  const hasProducts = products.length > 0;
  const hasError = props.error === true;

  // Filter and sort state
  const [sortBy, setSortBy] = useState<"relevance" | "price-asc" | "price-desc" | "rating">("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [inStockOnly, setInStockOnly] = useState(false);

  // Track search results loaded
  React.useEffect(() => {
    if (hasProducts && !props.isStreaming) {
      posthog.capture('search_results_loaded', {
        product_count: products.length,
        has_error: hasError,
        search_title: props.title,
      });
    }
    if (hasError) {
      posthog.capture('search_error', {
        error_message: props.errorMessage,
        search_title: props.title,
      });
    }
  }, [hasProducts, hasError, products.length, props.isStreaming, props.title, props.errorMessage]);
  
  // Drawer state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Disable background scroll when drawer is open
  React.useEffect(() => {
    const artifactContent = document.querySelector('[data-artifact-content]');
    if (artifactContent) {
      if (isDrawerOpen) {
        artifactContent.classList.add('overflow-hidden');
      } else {
        artifactContent.classList.remove('overflow-hidden');
      }
    }
  }, [isDrawerOpen]);

  // Get unique brands
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(p => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Apply filters
    if (selectedBrands.size > 0) {
      filtered = filtered.filter(p => p.brand && selectedBrands.has(p.brand));
    }
    
    if (inStockOnly) {
      filtered = filtered.filter(p => p.in_stock === true);
    }

    // Sort products
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-desc":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "relevance":
      default:
        // Sort by position (lower position = more relevant)
        filtered.sort((a, b) => (a.position || 999) - (b.position || 999));
        break;
    }

    return filtered;
  }, [products, selectedBrands, inStockOnly, sortBy]);

  return (
    <>
      <div
        onClick={() => setOpen((o: boolean) => !o)}
        className={cn(
          "group w-full min-w-0 cursor-pointer overflow-hidden rounded-2xl border transition-all focus:outline-none focus-visible:ring-2",
          hasError 
            ? "border-red-200 bg-red-50 hover:bg-red-100 focus-visible:ring-red-300"
            : "border-gray-200 bg-white-soft hover:bg-gray-soft focus-visible:ring-gray-300",
          isOpen ? "p-3 md:p-3 rounded-xl shadow-xs hover:shadow-xs" : "p-5 md:p-6 shadow-sm hover:shadow-md",
        )}
        role="button"
        aria-label="Open lens search results"
      >
        <div className="flex w-full min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {hasError ? (
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              ) : (
                <Package className="h-5 w-5 text-gray-500 shrink-0" />
              )}
              <h3 className={cn(
                "font-semibold tracking-tight truncate",
                hasError ? "text-red-900" : "text-gray-900",
                isOpen ? "text-base md:text-sm" : "text-xl md:text-2xl",
              )}>
                {props.title ?? "Visual Search Results"}
              </h3>
            </div>
            {!isOpen && props.summary && (
              <p className={cn(
                "mt-2 text-sm",
                hasError ? "text-red-700" : "text-gray-600"
              )}>
                {props.summary}
              </p>
            )}
          </div>
          <Package
            aria-hidden
            className={cn(
              "h-5 w-5 text-gray-400 transition-transform shrink-0",
            )}
          />
        </div>

        {!isOpen && hasProducts && (
          <div className="mt-4 flex gap-2">
            {products.slice(0, Math.min(products.length, 5)).map((product, idx) => (
              <div
                key={idx}
                className="flex-1 aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 min-w-0"
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
            {products.length > 5 && (
              <div className="flex-1 aspect-square rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center min-w-0">
                <span className="text-sm font-medium text-gray-600">
                  +{products.length - 5}
                </span>
              </div>
            )}
          </div>
        )}

      </div>

      {ArtifactComp ? (
        <ArtifactComp title={props.title ?? "Visual Search Results"}>
          <div className="p-6 md:p-8 relative" data-lens-results-content>
            {/* Filters and Sort Controls - Moved to top */}
            {hasProducts && !hasError && (
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      const newSort = e.target.value as any;
                      setSortBy(newSort);
                      posthog.capture('sort_changed', {
                        sort_by: newSort,
                        product_count: filteredProducts.length,
                      });
                    }}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => {
                    const newShowFilters = !showFilters;
                    setShowFilters(newShowFilters);
                    if (newShowFilters) {
                      posthog.capture('filters_opened', {
                        product_count: filteredProducts.length,
                      });
                    }
                  }}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-700"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {(selectedBrands.size > 0 || inStockOnly) && (
                    <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                      {selectedBrands.size + (inStockOnly ? 1 : 0)}
                    </span>
                  )}
                </button>

                {/* Results Count */}
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
                </span>
              </div>
            )}

            {/* Streaming Status */}
            {props.isStreaming && (
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse delay-75"></div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse delay-150"></div>
                </div>
                <span>
                  Loading products... {props.loadedCount || 0}
                  {props.totalCount ? ` / ${props.totalCount}` : ''}
                </span>
              </div>
            )}

            {/* Filter Panel */}
            {showFilters && hasProducts && !hasError && (
              <div className="mb-6 space-y-4">
                {/* Brand Filter */}
                {availableBrands.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Brands</h4>
                      {selectedBrands.size > 0 && (
                        <button
                          onClick={() => setSelectedBrands(new Set())}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {availableBrands.map(brand => (
                        <button
                          key={brand}
                          onClick={() => {
                            const newSet = new Set(selectedBrands);
                            const isAdding = !selectedBrands.has(brand);
                            if (selectedBrands.has(brand)) {
                              newSet.delete(brand);
                            } else {
                              newSet.add(brand);
                            }
                            setSelectedBrands(newSet);
                            posthog.capture('brand_filter_toggled', {
                              brand: brand,
                              action: isAdding ? 'added' : 'removed',
                              total_brands_selected: newSet.size,
                            });
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors border",
                            selectedBrands.has(brand)
                              ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-700"
                          )}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Availability</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const newValue = !inStockOnly;
                        setInStockOnly(newValue);
                        posthog.capture('in_stock_filter_toggled', {
                          enabled: newValue,
                        });
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors border",
                        inStockOnly
                          ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-700"
                      )}
                    >
                      In stock only
                    </button>
                  </div>
                </div>

                {/* Clear All Filters */}
                {(selectedBrands.size > 0 || inStockOnly) && (
                  <button
                    onClick={() => {
                      setSelectedBrands(new Set());
                      setInStockOnly(false);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Error State */}
            {hasError ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                <h4 className="text-lg font-medium text-red-900 mb-2">Search Failed</h4>
                <p className="text-sm text-red-700 max-w-md mx-auto">
                  {props.errorMessage || "Unable to complete the visual search. Please try again."}
                </p>
                {props.imageUrl && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Searched image:</p>
                    <div className="rounded-lg overflow-hidden border border-red-200 bg-gray-50 max-w-xs mx-auto">
                      <img
                        src={props.imageUrl}
                        alt="Search reference"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 min-[1000px]:grid-cols-3 min-[1200px]:grid-cols-4 min-[1300px]:grid-cols-5 gap-4">
                {filteredProducts.map((product, idx) => (
                  <ProductCard 
                    key={product.id || idx} 
                    product={product}
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsDrawerOpen(true);
                      posthog.capture('product_card_clicked', {
                        product_id: product.id,
                        product_name: product.name,
                        product_brand: product.brand,
                        product_price: product.price,
                        product_position: idx + 1,
                        in_stock: product.in_stock,
                      });
                    }}
                  />
                ))}
              </div>
            ) : hasProducts ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No products match your filters</p>
                <button
                  onClick={() => {
                    setSelectedBrands(new Set());
                    setInStockOnly(false);
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              </div>
            ) : props.isStreaming ? (
              <div className="text-center py-8 text-gray-500">
                <div className="flex gap-1 justify-center mb-3">
                  <div className="h-3 w-3 rounded-full bg-gray-400 animate-pulse"></div>
                  <div className="h-3 w-3 rounded-full bg-gray-400 animate-pulse delay-75"></div>
                  <div className="h-3 w-3 rounded-full bg-gray-400 animate-pulse delay-150"></div>
                </div>
                <p>Searching for similar products...</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No products found</p>
              </div>
            )}
          </div>
          {/* Product Detail Drawer */}
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerContent
              shouldStretch={false}
              overlayClassName="bg-black/40"
              portalProps={{ container: typeof document !== 'undefined' ? document.querySelector('[data-artifact-panel]') : undefined }}
              className="absolute left-0 right-0 bottom-0 w-full max-h-[60vh] bg-white-soft dark:bg-zinc-900 border-t border-gray-200"
            >
              {selectedProduct && (
                <ProductDetailDrawer 
                  product={selectedProduct} 
                  onClose={() => setIsDrawerOpen(false)}
                />
              )}
            </DrawerContent>
          </Drawer>
        </ArtifactComp>
      ) : null}
    </>
  );
}

function ProductCard({ product, onClick }: { product: Product; onClick?: () => void }) {
  const hasPrice = product.price > 0;
  const inStock = product.in_stock;

  // Format price with currency symbol
  const formatPrice = (price: number, currency: string) => {
    // Standardize currency display
    const currencySymbol = currency.replace(/[^$£€¥]/g, '') || '$';
    return `${currencySymbol}${price.toFixed(0)}`;
  };

  return (
    <button
      onClick={onClick}
      className="group block rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow overflow-hidden min-w-[180px] dark:bg-zinc-800 dark:border-zinc-700 text-left w-full"
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-gray-400" />
          </div>
        )}
        
        {/* Stock badge overlay - only show if explicitly true or false */}
        {inStock === true && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              In Stock
            </span>
          </div>
        )}
        {inStock === false && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">{product.brand}</p>
        )}

        {/* Name */}
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h4>

        {/* Price */}
        {hasPrice ? (
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatPrice(product.price, product.currency)}
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Price not available</p>
        )}
      </div>
    </button>
  );
}

function ProductDetailDrawer({ product, onClose }: { product: Product; onClose: () => void }) {
  const hasPrice = product.price > 0;
  const inStock = product.in_stock;

  // Format price with currency symbol
  const formatPrice = (price: number, currency: string) => {
    const currencySymbol = currency.replace(/[^$£€¥]/g, '') || '$';
    return `${currencySymbol}${price.toFixed(0)}`;
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
              {inStock === false && (
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
                  posthog.capture('buy_product_clicked', {
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
                  posthog.capture('select_to_try_clicked', {
                    product_id: product.id,
                    product_name: product.name,
                    product_brand: product.brand,
                    product_price: product.price,
                  });
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                <Heart className="h-4 w-4" />
                Select To Try
              </button>
              <button 
                onClick={() => {
                  posthog.capture('find_similar_clicked', {
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
                onClick={() => {
                  posthog.capture('track_price_clicked', {
                    product_id: product.id,
                    product_name: product.name,
                    product_brand: product.brand,
                    product_price: product.price,
                  });
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                Track Price
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
                    <div key={key} className="text-xs">
                      <dt className="font-medium text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="text-gray-900 dark:text-white mt-0.5">
                        {String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* What People Are Saying */}
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
          </div>
        </div>
      </div>
    </>
  );
}
