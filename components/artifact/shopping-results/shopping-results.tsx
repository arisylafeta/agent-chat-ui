"use client";

import React, { useState, useMemo } from "react";
import { useStreamContext as useReactUIStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { ShoppingBag, AlertCircle, SlidersHorizontal, Star, ShoppingCart, Heart, Search, TrendingUp, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import posthog from "posthog-js";
import { useStudio } from "@/providers/studio-provider";
import { toStudioProduct } from "@/types/studio";

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

type ShoppingResultsProps = {
  title?: string;
  summary?: string;
  searchQuery?: string;
  products?: Product[];
  modelName?: string;
  isStreaming?: boolean;
  loadedCount?: number;
  totalCount?: number;
  error?: boolean;
  errorMessage?: string;
};

export function ShoppingResults(props: ShoppingResultsProps) {
  const { meta } = useReactUIStreamContext();
  const artifactTuple = (meta as any)?.artifact ?? null;
  
  // Access Studio state for product selection (used in ProductDetailDrawer)
  // const { addToSelected, state: studioState } = useStudio();

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
      posthog.capture('shopping_results_loaded', {
        product_count: products.length,
        has_error: hasError,
        search_query: props.searchQuery,
      });
    }
    if (hasError) {
      posthog.capture('shopping_error', {
        error_message: props.errorMessage,
        search_query: props.searchQuery,
      });
    }
  }, [hasProducts, hasError, products.length, props.isStreaming, props.searchQuery, props.errorMessage]);
  
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

    if (selectedBrands.size > 0) {
      filtered = filtered.filter(p => p.brand && selectedBrands.has(p.brand));
    }
    
    if (inStockOnly) {
      filtered = filtered.filter(p => p.in_stock === true);
    }

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
            : "border-accent-2/30 bg-gradient-to-br from-accent-1/10 to-accent-2/10 hover:from-accent-1/20 hover:to-accent-2/20 focus-visible:ring-accent-2",
          isOpen ? "p-3 md:p-3 rounded-xl shadow-xs hover:shadow-xs" : "p-5 md:p-6 shadow-sm hover:shadow-md",
        )}
        role="button"
        aria-label="Open shopping results"
      >
        <div className="flex w-full min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {hasError ? (
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              ) : (
                <ShoppingBag className="h-5 w-5 text-accent-2 shrink-0" />
              )}
              <h3 className={cn(
                "font-semibold tracking-tight truncate",
                hasError ? "text-red-900" : "text-gray-900",
                isOpen ? "text-base md:text-sm" : "text-xl md:text-2xl",
              )}>
                {props.title ?? "Shopping Results"}
              </h3>
            </div>
            {!isOpen && props.summary && (
              <p className={cn(
                "mt-2 text-sm",
                hasError ? "text-red-700" : "text-gray-700"
              )}>
                {props.summary}
              </p>
            )}
            {!isOpen && props.searchQuery && !hasError && (
              <p className="mt-1 text-xs text-gray-500">
                Searched for: <span className="font-medium">{props.searchQuery}</span>
              </p>
            )}
          </div>
          <ShoppingBag
            aria-hidden
            className={cn(
              "h-5 w-5 transition-transform shrink-0",
              hasError ? "text-red-400" : "text-accent-2"
            )}
          />
        </div>

        {!isOpen && hasProducts && (
          <div className="mt-4 grid grid-cols-6 gap-2">
            {products.slice(0, Math.min(products.length, 5)).map((product, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-md overflow-hidden bg-white border border-gray-200 min-w-0 relative group/preview"
              >
                {product.image ? (
                  <>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.price > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover/preview:opacity-100 transition-opacity">
                        <p className="text-[10px] font-semibold text-white truncate">
                          ${product.price}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <Package className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
            {products.length > 6 && (
              <div className="aspect-square rounded-md bg-accent-2/10 border border-accent-2/30 flex items-center justify-center min-w-0">
                <span className="text-xs font-semibold text-accent-2">
                  +{products.length - 6}
                </span>
              </div>
            )}
          </div>
        )}

      </div>

      {ArtifactComp ? (
        <ArtifactComp title={props.title ?? "Shopping Results"}>
          <div className="p-6 md:p-8 relative" data-shopping-results-content>
            {/* Filters and Sort Controls */}
            {hasProducts && !hasError && (
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      const newSort = e.target.value as any;
                      setSortBy(newSort);
                      posthog.capture('shopping_sort_changed', {
                        sort_by: newSort,
                        product_count: filteredProducts.length,
                      });
                    }}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-2"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    const newShowFilters = !showFilters;
                    setShowFilters(newShowFilters);
                    if (newShowFilters) {
                      posthog.capture('shopping_filters_opened', {
                        product_count: filteredProducts.length,
                      });
                    }
                  }}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-700"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {(selectedBrands.size > 0 || inStockOnly) && (
                    <span className="ml-1 px-1.5 py-0.5 bg-accent-2 text-white text-xs rounded-full">
                      {selectedBrands.size + (inStockOnly ? 1 : 0)}
                    </span>
                  )}
                </button>

                <span className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
                </span>
              </div>
            )}

            {/* Streaming Status */}
            {props.isStreaming && (
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-accent-2 animate-pulse"></div>
                  <div className="h-2 w-2 rounded-full bg-accent-2 animate-pulse delay-75"></div>
                  <div className="h-2 w-2 rounded-full bg-accent-2 animate-pulse delay-150"></div>
                </div>
                <span>
                  Loading products... {props.loadedCount || 0}
                  {props.totalCount ? ` / ${props.totalCount}` : ''}
                </span>
              </div>
            )}

            {/* Filter Panel */}
            {showFilters && hasProducts && !hasError && (
              <div className="mb-6 space-y-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                {availableBrands.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Brands</h4>
                      {selectedBrands.size > 0 && (
                        <button
                          onClick={() => setSelectedBrands(new Set())}
                          className="text-xs text-accent-2 hover:text-accent-2/80"
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
                            posthog.capture('shopping_brand_filter_toggled', {
                              brand: brand,
                              action: isAdding ? 'added' : 'removed',
                              total_brands_selected: newSet.size,
                            });
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors border",
                            selectedBrands.has(brand)
                              ? "bg-accent-2 border-accent-2 text-white"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-700"
                          )}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedBrands.size > 0 || inStockOnly) && (
                  <button
                    onClick={() => {
                      setSelectedBrands(new Set());
                      setInStockOnly(false);
                    }}
                    className="text-sm text-accent-2 hover:text-accent-2/80 font-medium"
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
                  {props.errorMessage || "Unable to complete the shopping search. Please try again."}
                </p>
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
                      posthog.capture('shopping_product_clicked', {
                        product_id: product.id,
                        product_name: product.name,
                        product_brand: product.brand,
                        product_price: product.price,
                        product_position: idx + 1,
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
                  className="mt-2 text-sm text-accent-2 hover:text-accent-2/80"
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
                <p>Searching for products...</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No products found</p>
              </div>
            )}
          </div>
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

  const formatPrice = (price: number, currency: string) => {
    const currencySymbol = currency.replace(/[^$£€¥]/g, '') || '$';
    return `${currencySymbol}${price.toFixed(0)}`;
  };

  return (
    <button
      onClick={onClick}
      className="group block rounded-lg border border-gray-200 bg-white hover:shadow-md hover:border-accent-2/50 transition-all overflow-hidden min-w-[180px] dark:bg-zinc-800 dark:border-zinc-700 text-left w-full"
    >
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
        
        {product.in_stock === true && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              In Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        {product.brand && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">{product.brand}</p>
        )}

        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h4>

        {hasPrice ? (
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatPrice(product.price, product.currency)}
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Price not available</p>
        )}

        {product.rating && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {product.rating.toFixed(1)}
              {product.reviews && ` (${product.reviews})`}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function ProductDetailDrawer({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addToSelected, state: studioState } = useStudio();
  const hasPrice = product.price > 0;

  const formatPrice = (price: number, currency: string) => {
    const currencySymbol = currency.replace(/[^$£€¥]/g, '') || '$';
    return `${currencySymbol}${price.toFixed(0)}`;
  };

  return (
    <>
      <DrawerTitle className="sr-only">{product.name}</DrawerTitle>

      <div className="px-4 pb-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          <div className="space-y-4">
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
              {product.in_stock === true && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  In Stock
                </span>
              )}
            </div>

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

            <div className="grid grid-cols-2 gap-2">
              <a
                href={product.product_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  posthog.capture('shopping_buy_clicked', {
                    product_id: product.id,
                    product_name: product.name,
                    product_brand: product.brand,
                    product_price: product.price,
                    product_url: product.product_url,
                  });
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-2 hover:bg-accent-2/90 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                Buy Product
              </a>
              <button 
                onClick={() => {
                  // Add product to Studio
                  addToSelected(toStudioProduct(product));
                  
                  // Track event
                  posthog.capture('shopping_select_to_try_clicked', {
                    product_id: product.id,
                    product_name: product.name,
                    product_brand: product.brand,
                    product_price: product.price,
                  });
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
                  posthog.capture('shopping_find_similar_clicked', {
                    product_id: product.id,
                    product_name: product.name,
                  });
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                <Search className="h-4 w-4" />
                Find Similar
              </button>
              <button 
                onClick={() => {
                  posthog.capture('shopping_track_price_clicked', {
                    product_id: product.id,
                    product_name: product.name,
                  });
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                Track Price
              </button>
            </div>

            {product.description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

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
          </div>
        </div>
      </div>
    </>
  );
}
