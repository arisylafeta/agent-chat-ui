# Firecrawl Setup Guide

Quick setup guide to get product enrichment working.

## Step 1: Get Firecrawl API Key

1. Go to https://firecrawl.dev
2. Sign up for a free account (500 credits/month, no credit card required)
3. Navigate to your dashboard: https://firecrawl.dev/app
4. Copy your API key (starts with `fc-`)

## Step 2: Add Environment Variable

Add to your `.env.local` file:

```bash
FIRECRAWL_API_KEY=fc-your-actual-api-key-here
```

## Step 3: Run Database Migration

```bash
cd supabase
supabase db push
```

This creates the `enriched_products` table for caching.

## Step 4: Verify Setup

Start your dev server:

```bash
cd ../app-reoutfit
pnpm dev
```

## Step 5: Test Integration

1. Open a product detail drawer
2. Click "Get More Details" button
3. Should see enriched data appear (price, description, materials, sizing, reviews)

## Troubleshooting

### "Firecrawl API key not configured"
- Check `.env.local` has `FIRECRAWL_API_KEY`
- Restart dev server after adding env var

### "Unauthorized"
- Make sure you're logged in to the app
- Check Supabase auth is working

### Migration fails
- Check Supabase connection: `supabase status`
- Try: `supabase db reset` (warning: resets all data)

## Usage in Components

```tsx
import { ProductEnrichmentSection } from '@/components/artifact/shared/product-enrichment-section';

// In your product detail component:
<ProductEnrichmentSection
  productId={product.id}
  productUrl={product.product_url}
  eventPrefix="lens"
/>
```

## Cost Monitoring

- Free tier: 500 credits/month
- Each enrichment: 2 credits
- Cache duration: 7 days
- Monitor usage: https://firecrawl.dev/app

## Next Steps

1. Integrate `ProductEnrichmentSection` into `product-detail-content.tsx`
2. Test with real product URLs
3. Monitor cache hit rates in Supabase
4. Upgrade plan if needed ($20/mo for 20,000 credits)
