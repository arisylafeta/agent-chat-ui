/**
 * Prefetch enrichment data for a product
 * This starts the API call immediately, allowing the data to be ready
 * when the product detail drawer opens
 */

// Cache for in-flight requests to avoid duplicate calls
const inflightRequests = new Map<string, Promise<any>>();

export async function prefetchProductEnrichment(
  productId: string,
  productUrl: string
): Promise<void> {
  if (!productUrl) return;

  // Check if request is already in-flight
  const cacheKey = productUrl;
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  // Start the request
  const requestPromise = fetch('/api/products/enrich', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId,
      productUrl,
    }),
    credentials: 'include',
  })
    .then(response => response.json())
    .catch(error => {
      console.error('[prefetchProductEnrichment] Error:', error);
    })
    .finally(() => {
      // Clean up in-flight request after completion
      inflightRequests.delete(cacheKey);
    });

  // Store in-flight request
  inflightRequests.set(cacheKey, requestPromise);

  return requestPromise;
}
