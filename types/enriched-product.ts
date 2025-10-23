/**
 * Enriched product data fetched from Firecrawl
 * This extends basic product info with detailed data scraped from the product page
 */
export type EnrichedProductData = {
  /** Updated price from the product page (may differ from Google Lens data) */
  price: number | null;
  
  /** Currency code (USD, EUR, GBP, etc.) */
  currency: string | null;
  
  /** AI-generated summary of the product description */
  description_summary: string | null;
  
  /** Summary of materials/fabric composition */
  materials_summary: string | null;
  
  /** Sizing information and fit details */
  sizing_info: string | null;
  
  /** AI-generated summary of customer reviews (pros/cons) */
  reviews_summary: string | null;
};

/**
 * Complete enriched product combining base product with enriched data
 */
export type EnrichedProduct = {
  /** Original product ID */
  product_id: string;
  
  /** Product URL that was scraped */
  product_url: string;
  
  /** Enriched data from Firecrawl */
  enriched_data: EnrichedProductData;
  
  /** When this data was fetched */
  enriched_at: string;
  
  /** Cache expiry timestamp */
  expires_at: string;
};

/**
 * Status of enrichment request
 */
export type EnrichmentStatus = 'idle' | 'loading' | 'success' | 'error' | 'cached';

/**
 * Hook return type for useProductEnrichment
 */
export type UseProductEnrichmentReturn = {
  /** Enriched product data (null if not yet fetched) */
  enrichedData: EnrichedProductData | null;
  
  /** Current status of the enrichment request */
  status: EnrichmentStatus;
  
  /** Error message if status is 'error' */
  error: string | null;
  
  /** Function to trigger enrichment */
  enrich: () => Promise<void>;
  
  /** Whether data is currently being fetched */
  isLoading: boolean;
  
  /** Whether data was loaded from cache */
  isCached: boolean;
};
