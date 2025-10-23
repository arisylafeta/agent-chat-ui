# Firecrawl Product Enrichment Integration

## Overview

This integration uses Firecrawl API to enrich product data with detailed information scraped from product pages, including updated prices, descriptions, materials, sizing, and review summaries.

## Architecture

```
User clicks product
    ↓
useProductEnrichment hook
    ↓
Check Supabase cache (7 days)
    ↓
If cache miss → Call /api/products/enrich
    ↓
Firecrawl API scrapes product page
    ↓
Cache result in Supabase
    ↓
Return enriched data to UI
```

## Files Created

### 1. TypeScript Types
**`types/enriched-product.ts`**
- `EnrichedProductData` - The enriched data structure
- `EnrichedProduct` - Complete enriched product with metadata
- `EnrichmentStatus` - Status enum for loading states
- `UseProductEnrichmentReturn` - Hook return type

### 2. API Route
**`app/api/products/enrich/route.ts`**
- POST endpoint that accepts `productId` and `productUrl`
- Checks Supabase cache first (7-day TTL)
- Calls Firecrawl API with structured extraction prompt
- Caches results in Supabase
- Returns enriched data with cache status

### 3. React Hook
**`hooks/use-product-enrichment.ts`**
- `useProductEnrichment(productId, productUrl, autoEnrich?)`
- Manages loading states and error handling
- Provides `enrich()` function to trigger enrichment
- Returns enriched data and status

### 4. Database Migration
**`supabase/migrations/20250123_add_enriched_products_table.sql`**
- Creates `enriched_products` table with JSONB storage
- Indexes for performance (product_url, expires_at, user_id)
- RLS policies for authenticated users
- Cleanup function for expired entries

## Data Schema

### EnrichedProductData
```typescript
{
  price: number | null,              // Updated price from product page
  currency: string | null,           // Currency code (USD, EUR, etc.)
  description_summary: string | null, // 2-3 sentence summary
  materials_summary: string | null,   // Materials/fabric composition
  sizing_info: string | null,         // Sizing and fit details
  reviews_summary: string | null,     // Pros/cons from reviews
  confidence_score: number            // 0-1 reliability score
}
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd app-reoutfit
pnpm install
# No additional packages needed - using native fetch
```

### 2. Add Environment Variables
Add to `.env.local`:
```bash
# Firecrawl API Key (get from https://firecrawl.dev)
FIRECRAWL_API_KEY=fc-your-api-key-here
```

### 3. Run Database Migration
```bash
cd ../supabase
supabase db push
```

### 4. Verify Migration
```bash
supabase db reset  # Optional: reset to test from scratch
```

## Usage Example

### In a Component
```tsx
import { useProductEnrichment } from '@/hooks/use-product-enrichment';

function ProductDetail({ product }) {
  const { 
    enrichedData, 
    status, 
    error, 
    enrich, 
    isLoading,
    isCached 
  } = useProductEnrichment(product.id, product.product_url);

  return (
    <div>
      {/* Trigger button */}
      <button 
        onClick={enrich} 
        disabled={isLoading || status === 'success'}
      >
        {isLoading ? 'Loading...' : 'Get More Details'}
      </button>

      {/* Show cached indicator */}
      {isCached && <span>✓ From cache</span>}

      {/* Display enriched data */}
      {enrichedData && (
        <div>
          {enrichedData.price && (
            <p className="text-2xl font-bold">
              {enrichedData.currency}{enrichedData.price}
            </p>
          )}
          
          {enrichedData.description_summary && (
            <div>
              <h4>Description</h4>
              <p>{enrichedData.description_summary}</p>
            </div>
          )}
          
          {enrichedData.materials_summary && (
            <div>
              <h4>Materials</h4>
              <p>{enrichedData.materials_summary}</p>
            </div>
          )}
          
          {enrichedData.sizing_info && (
            <div>
              <h4>Sizing</h4>
              <p>{enrichedData.sizing_info}</p>
            </div>
          )}
          
          {enrichedData.reviews_summary && (
            <div>
              <h4>Customer Reviews</h4>
              <p>{enrichedData.reviews_summary}</p>
            </div>
          )}
          
          {/* Confidence indicator */}
          <div className="text-sm text-gray-500">
            Confidence: {(enrichedData.confidence_score * 100).toFixed(0)}%
          </div>
        </div>
      )}

      {/* Error handling */}
      {error && (
        <div className="text-red-500">
          Failed to load details: {error}
        </div>
      )}
    </div>
  );
}
```

## Cost Optimization

### Caching Strategy
- **7-day cache** in Supabase reduces API calls
- Cache key: `product_url` (unique per product page)
- Automatic expiry cleanup via `cleanup_expired_enriched_products()`

### Cost Estimates
- **Firecrawl cost**: 2 credits per enrichment (1 scrape + 1 AI extraction)
- **Hobby plan ($20/mo)**: 10,000 enrichments/month
- **With 7-day cache**: Effective cost reduced by ~90% for popular products

### Best Practices
1. **Lazy loading**: Only enrich when user clicks "Get More Details"
2. **Batch pre-enrichment**: Pre-enrich popular products during off-peak hours
3. **Monitor usage**: Track cache hit rate in Supabase
4. **Set rate limits**: Prevent abuse with user-level rate limiting

## Monitoring

### Check Cache Hit Rate
```sql
SELECT 
  COUNT(*) as total_requests,
  COUNT(DISTINCT product_url) as unique_products,
  AVG(EXTRACT(EPOCH FROM (expires_at - enriched_at)) / 86400) as avg_cache_days
FROM enriched_products
WHERE enriched_at > NOW() - INTERVAL '30 days';
```

### Cleanup Expired Entries
```sql
SELECT cleanup_expired_enriched_products();
```

### Monitor Firecrawl Usage
- Dashboard: https://firecrawl.dev/app
- API usage and credit consumption
- Rate limit monitoring

## Error Handling

The integration handles:
- ✅ Missing Firecrawl API key
- ✅ Unauthenticated users
- ✅ Invalid product URLs
- ✅ Firecrawl API errors
- ✅ Cache failures (non-blocking)
- ✅ Malformed responses

## Next Steps

1. **Update product-detail-content.tsx** to integrate the hook
2. **Add UI components** for enriched data display
3. **Set up monitoring** for cache hit rates
4. **Configure rate limiting** if needed
5. **Test with real products** to validate data quality

## API Reference

### POST /api/products/enrich

**Request:**
```json
{
  "productId": "string",
  "productUrl": "string"
}
```

**Response:**
```json
{
  "enrichedData": {
    "price": 99.99,
    "currency": "USD",
    "description_summary": "...",
    "materials_summary": "...",
    "sizing_info": "...",
    "reviews_summary": "...",
    "confidence_score": 0.85
  },
  "cached": false,
  "enrichedAt": "2025-01-23T12:00:00Z"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": {}
}
```

## Troubleshooting

### Issue: "Firecrawl API key not configured"
**Solution:** Add `FIRECRAWL_API_KEY` to `.env.local`

### Issue: "Unauthorized"
**Solution:** Ensure user is authenticated via Supabase Auth

### Issue: Low confidence scores
**Solution:** Check if product URLs are valid and accessible

### Issue: High API costs
**Solution:** 
- Verify cache is working (check `cached: true` in responses)
- Increase cache TTL if needed
- Implement user-level rate limiting

## License & Credits

- Firecrawl: https://firecrawl.dev
- Documentation: https://docs.firecrawl.dev
