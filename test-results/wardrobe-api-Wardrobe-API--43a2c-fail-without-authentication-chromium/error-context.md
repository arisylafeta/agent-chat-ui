# Test info

- Name: Wardrobe API >> PATCH /api/wardrobe/[id] >> should fail without authentication
- Location: /Users/admin/Desktop/AI/Reoutfit/app-reoutfit/tests/e2e/wardrobe-api.spec.ts:335:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 404
    at /Users/admin/Desktop/AI/Reoutfit/app-reoutfit/tests/e2e/wardrobe-api.spec.ts:346:33
```

# Test source

```ts
  246 |         }
  247 |       );
  248 |
  249 |       expect(response.status()).toBe(404);
  250 |       const data = await response.json();
  251 |       expect(data.error).toBe('Item not found');
  252 |     });
  253 |
  254 |     test('should fail without authentication', async ({ request }) => {
  255 |       const response = await request.get(
  256 |         `${API_BASE_URL}/api/wardrobe/${createdItemId}`
  257 |       );
  258 |
  259 |       expect(response.status()).toBe(401);
  260 |     });
  261 |   });
  262 |
  263 |   test.describe('PATCH /api/wardrobe/[id]', () => {
  264 |     test('should update a clothing item', async ({ request }) => {
  265 |       if (!createdItemId) {
  266 |         test.skip();
  267 |       }
  268 |
  269 |       const updateData = {
  270 |         name: 'Updated Jacket Name',
  271 |         brand: 'Updated Brand',
  272 |         price: 149.99,
  273 |         tags: ['vintage', 'casual'],
  274 |       };
  275 |
  276 |       const response = await request.patch(
  277 |         `${API_BASE_URL}/api/wardrobe/${createdItemId}`,
  278 |         {
  279 |           headers: {
  280 |             Authorization: `Bearer ${authToken}`,
  281 |             'Content-Type': 'application/json',
  282 |           },
  283 |           data: updateData,
  284 |         }
  285 |       );
  286 |
  287 |       expect(response.status()).toBe(200);
  288 |       const data = await response.json();
  289 |       
  290 |       expect(data.item.id).toBe(createdItemId);
  291 |       expect(data.item.name).toBe('Updated Jacket Name');
  292 |       expect(data.item.brand).toBe('Updated Brand');
  293 |       expect(data.item.price).toBe(149.99);
  294 |       expect(data.item.tags).toEqual(['vintage', 'casual']);
  295 |     });
  296 |
  297 |     test('should fail with no fields to update', async ({ request }) => {
  298 |       if (!createdItemId) {
  299 |         test.skip();
  300 |       }
  301 |
  302 |       const response = await request.patch(
  303 |         `${API_BASE_URL}/api/wardrobe/${createdItemId}`,
  304 |         {
  305 |           headers: {
  306 |             Authorization: `Bearer ${authToken}`,
  307 |             'Content-Type': 'application/json',
  308 |           },
  309 |           data: {},
  310 |         }
  311 |       );
  312 |
  313 |       expect(response.status()).toBe(400);
  314 |       const data = await response.json();
  315 |       expect(data.error).toContain('No fields to update');
  316 |     });
  317 |
  318 |     test('should return 404 for non-existent item', async ({ request }) => {
  319 |       const fakeId = '00000000-0000-0000-0000-000000000000';
  320 |       
  321 |       const response = await request.patch(
  322 |         `${API_BASE_URL}/api/wardrobe/${fakeId}`,
  323 |         {
  324 |           headers: {
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
> 346 |       expect(response.status()).toBe(401);
      |                                 ^ Error: expect(received).toBe(expected) // Object.is equality
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
  425 |       expect(response.status()).toBe(200);
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
```