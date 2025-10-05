"use client";

import React, { useState, useMemo } from "react";
import { useStreamContext as useReactUIStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { ExternalLink, Star, Package, AlertCircle, SlidersHorizontal } from "lucide-react";
import { cn } from "../../../lib/utils";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  brand: string;
  currency: string;
  description: string;
  product_url: string;
  attributes: {
    rating?: number;
    reviews?: number;
    in_stock?: boolean;
  };
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
      filtered = filtered.filter(p => p.attributes?.in_stock === true);
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
        filtered.sort((a, b) => (b.attributes?.rating || 0) - (a.attributes?.rating || 0));
        break;
      case "relevance":
      default:
        // Keep original order (relevance from API)
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
          <ExternalLink
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
          <div className="p-6 md:p-8">
            {/* Source Image */}
            {props.imageUrl && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Search Image</h4>
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 max-w-xs">
                  <img
                    src={props.imageUrl}
                    alt="Search reference"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            {/* Summary */}
            {props.summary && (
              <p className="text-sm text-gray-600 mb-6">{props.summary}</p>
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

            {/* Filters and Sort Controls */}
            {hasProducts && !hasError && (
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Sort:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
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
                <span className="text-sm text-gray-600 ml-auto">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
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
                      <h4 className="text-sm font-medium text-gray-700">Brands</h4>
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
                            if (selectedBrands.has(brand)) {
                              newSet.delete(brand);
                            } else {
                              newSet.add(brand);
                            }
                            setSelectedBrands(newSet);
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors border",
                            selectedBrands.has(brand)
                              ? "bg-blue-100 border-blue-300 text-blue-700"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
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
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Availability</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setInStockOnly(!inStockOnly)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors border",
                        inStockOnly
                          ? "bg-blue-100 border-blue-300 text-blue-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
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
                  <ProductCard key={product.id || idx} product={product} />
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
        </ArtifactComp>
      ) : null}
    </>
  );
}

function ProductCard({ product }: { product: Product }) {
  const hasPrice = product.price > 0;
  const hasRating = product.attributes?.rating !== undefined;
  const inStock = product.attributes?.in_stock;

  return (
    <a
      href={product.product_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow overflow-hidden min-w-[180px]"
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
        {inStock === false && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-sm font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-gray-500 mb-1 truncate">{product.brand}</p>
        )}

        {/* Name */}
        <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h4>

        {/* Rating */}
        {hasRating && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-600">
              {product.attributes.rating?.toFixed(1)}
              {product.attributes.reviews && (
                <span className="text-gray-400"> ({product.attributes.reviews})</span>
              )}
            </span>
          </div>
        )}

        {/* Price */}
        {hasPrice ? (
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-gray-900">
              {product.currency}{product.price.toFixed(2)}
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Price not available</p>
        )}

        {/* Stock Status */}
        {inStock === true && (
          <p className="text-xs text-green-600 mt-1">In Stock</p>
        )}
      </div>

      {/* External Link Icon */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-gray-700">
          <span>View product</span>
          <ExternalLink className="h-3 w-3" />
        </div>
      </div>
    </a>
  );
}
