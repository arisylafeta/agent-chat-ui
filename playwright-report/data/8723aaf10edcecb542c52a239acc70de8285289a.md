# Test info

- Name: Wardrobe API >> POST /api/wardrobe/prettify >> should process image with AI (or return fallback)
- Location: /Users/admin/Desktop/AI/Reoutfit/app-reoutfit/tests/e2e/wardrobe-api.spec.ts:409:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 404
    at /Users/admin/Desktop/AI/Reoutfit/app-reoutfit/tests/e2e/wardrobe-api.spec.ts:425:33
```

# Test source

```ts
  325 |             Authorization: `Bearer ${authToken}`,
  326 |             'Content-Type': 'application/json',
  327 |           },
  328 |           data: { name: 'Test' },
  329 |         }
  330 |       );
  331 |
  332 |       expect(response.status()).toBe(404);
  333 |     });
  334 |
  335 |     test('should fail without authentication', async ({ request }) => {
  336 |       const response = await request.patch(
  337 |         `${API_BASE_URL}/api/wardrobe/${createdItemId}`,
  338 |         {
  339 |           headers: {
  340 |             'Content-Type': 'application/json',
  341 |           },
  342 |           data: { name: 'Test' },
  343 |         }
  344 |       );
  345 |
  346 |       expect(response.status()).toBe(401);
  347 |     });
  348 |   });
  349 |
  350 |   test.describe('DELETE /api/wardrobe/[id]', () => {
  351 |     test('should delete a clothing item', async ({ request }) => {
  352 |       if (!createdItemId) {
  353 |         test.skip();
  354 |       }
  355 |
  356 |       const response = await request.delete(
  357 |         `${API_BASE_URL}/api/wardrobe/${createdItemId}`,
  358 |         {
  359 |           headers: {
  360 |             Authorization: `Bearer ${authToken}`,
  361 |           },
  362 |         }
  363 |       );
  364 |
  365 |       expect(response.status()).toBe(200);
  366 |       const data = await response.json();
  367 |       
  368 |       expect(data.success).toBe(true);
  369 |       expect(data.id).toBe(createdItemId);
  370 |
  371 |       // Verify item is actually deleted
  372 |       const getResponse = await request.get(
  373 |         `${API_BASE_URL}/api/wardrobe/${createdItemId}`,
  374 |         {
  375 |           headers: {
  376 |             Authorization: `Bearer ${authToken}`,
  377 |           },
  378 |         }
  379 |       );
  380 |
  381 |       expect(getResponse.status()).toBe(404);
  382 |     });
  383 |
  384 |     test('should return 404 for non-existent item', async ({ request }) => {
  385 |       const fakeId = '00000000-0000-0000-0000-000000000000';
  386 |       
  387 |       const response = await request.delete(
  388 |         `${API_BASE_URL}/api/wardrobe/${fakeId}`,
  389 |         {
  390 |           headers: {
  391 |             Authorization: `Bearer ${authToken}`,
  392 |           },
  393 |         }
  394 |       );
  395 |
  396 |       expect(response.status()).toBe(404);
  397 |     });
  398 |
  399 |     test('should fail without authentication', async ({ request }) => {
  400 |       const response = await request.delete(
  401 |         `${API_BASE_URL}/api/wardrobe/some-id`
  402 |       );
  403 |
  404 |       expect(response.status()).toBe(401);
  405 |     });
  406 |   });
  407 |
  408 |   test.describe('POST /api/wardrobe/prettify', () => {
  409 |     test('should process image with AI (or return fallback)', async ({ request }) => {
  410 |       const formData = new FormData();
  411 |       const imageBuffer = createTestImageFile();
  412 |       const blob = new Blob([imageBuffer], { type: 'image/png' });
  413 |       formData.append('image', blob, 'test-image.png');
  414 |
  415 |       const response = await request.post(
  416 |         `${API_BASE_URL}/api/wardrobe/prettify`,
  417 |         {
  418 |           headers: {
  419 |             Authorization: `Bearer ${authToken}`,
  420 |           },
  421 |           multipart: formData,
  422 |         }
  423 |       );
  424 |
> 425 |       expect(response.status()).toBe(200);
      |                                 ^ Error: expect(received).toBe(expected) // Object.is equality
  426 |       const data = await response.json();
  427 |       
  428 |       expect(data.prettifiedImage).toBeDefined();
  429 |       expect(data.originalImage).toBeDefined();
  430 |       expect(data.prettifiedImage).toContain('data:image');
  431 |       expect(data.originalImage).toContain('data:image');
  432 |     });
  433 |
  434 |     test('should fail without authentication', async ({ request }) => {
  435 |       const formData = new FormData();
  436 |       const imageBuffer = createTestImageFile();
  437 |       const blob = new Blob([imageBuffer], { type: 'image/png' });
  438 |       formData.append('image', blob, 'test.png');
  439 |
  440 |       const response = await request.post(
  441 |         `${API_BASE_URL}/api/wardrobe/prettify`,
  442 |         {
  443 |           multipart: formData,
  444 |         }
  445 |       );
  446 |
  447 |       expect(response.status()).toBe(401);
  448 |     });
  449 |
  450 |     test('should fail without image', async ({ request }) => {
  451 |       const formData = new FormData();
  452 |
  453 |       const response = await request.post(
  454 |         `${API_BASE_URL}/api/wardrobe/prettify`,
  455 |         {
  456 |           headers: {
  457 |             Authorization: `Bearer ${authToken}`,
  458 |           },
  459 |           multipart: formData,
  460 |         }
  461 |       );
  462 |
  463 |       expect(response.status()).toBe(400);
  464 |       const data = await response.json();
  465 |       expect(data.error).toContain('Image file is required');
  466 |     });
  467 |
  468 |     test('should fail with invalid file type', async ({ request }) => {
  469 |       const formData = new FormData();
  470 |       const blob = new Blob(['not an image'], { type: 'text/plain' });
  471 |       formData.append('image', blob, 'test.txt');
  472 |
  473 |       const response = await request.post(
  474 |         `${API_BASE_URL}/api/wardrobe/prettify`,
  475 |         {
  476 |           headers: {
  477 |             Authorization: `Bearer ${authToken}`,
  478 |           },
  479 |           multipart: formData,
  480 |         }
  481 |       );
  482 |
  483 |       expect(response.status()).toBe(400);
  484 |       const data = await response.json();
  485 |       expect(data.error).toContain('Invalid file type');
  486 |     });
  487 |   });
  488 | });
  489 |
```