# Test info

- Name: Wardrobe API >> GET /api/wardrobe/[id] >> should fail without authentication
- Location: /Users/admin/Desktop/AI/Reoutfit/app-reoutfit/tests/e2e/wardrobe-api.spec.ts:254:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 404
    at /Users/admin/Desktop/AI/Reoutfit/app-reoutfit/tests/e2e/wardrobe-api.spec.ts:259:33
```

# Test source

```ts
  159 |       expect(data.items).toBeDefined();
  160 |       expect(Array.isArray(data.items)).toBe(true);
  161 |       expect(data.total).toBeDefined();
  162 |       expect(data.limit).toBe(20);
  163 |       expect(data.offset).toBe(0);
  164 |     });
  165 |
  166 |     test('should support pagination', async ({ request }) => {
  167 |       const response = await request.get(
  168 |         `${API_BASE_URL}/api/wardrobe?limit=5&offset=0`,
  169 |         {
  170 |           headers: {
  171 |             Authorization: `Bearer ${authToken}`,
  172 |           },
  173 |         }
  174 |       );
  175 |
  176 |       expect(response.status()).toBe(200);
  177 |       const data = await response.json();
  178 |       
  179 |       expect(data.limit).toBe(5);
  180 |       expect(data.offset).toBe(0);
  181 |       expect(data.items.length).toBeLessThanOrEqual(5);
  182 |     });
  183 |
  184 |     test('should filter by category', async ({ request }) => {
  185 |       const response = await request.get(
  186 |         `${API_BASE_URL}/api/wardrobe?category=jacket`,
  187 |         {
  188 |           headers: {
  189 |             Authorization: `Bearer ${authToken}`,
  190 |           },
  191 |         }
  192 |       );
  193 |
  194 |       expect(response.status()).toBe(200);
  195 |       const data = await response.json();
  196 |       
  197 |       // All returned items should be jackets
  198 |       data.items.forEach((item: any) => {
  199 |         expect(item.category).toBe('jacket');
  200 |       });
  201 |     });
  202 |
  203 |     test('should fail without authentication', async ({ request }) => {
  204 |       const response = await request.get(`${API_BASE_URL}/api/wardrobe`);
  205 |
  206 |       expect(response.status()).toBe(401);
  207 |       const data = await response.json();
  208 |       expect(data.error).toBe('Unauthorized');
  209 |     });
  210 |   });
  211 |
  212 |   test.describe('GET /api/wardrobe/[id]', () => {
  213 |     test('should fetch a single clothing item', async ({ request }) => {
  214 |       // First create an item to fetch
  215 |       if (!createdItemId) {
  216 |         test.skip();
  217 |       }
  218 |
  219 |       const response = await request.get(
  220 |         `${API_BASE_URL}/api/wardrobe/${createdItemId}`,
  221 |         {
  222 |           headers: {
  223 |             Authorization: `Bearer ${authToken}`,
  224 |           },
  225 |         }
  226 |       );
  227 |
  228 |       expect(response.status()).toBe(200);
  229 |       const data = await response.json();
  230 |       
  231 |       expect(data.item).toBeDefined();
  232 |       expect(data.item.id).toBe(createdItemId);
  233 |       expect(data.item.name).toBeDefined();
  234 |       expect(data.item.category).toBeDefined();
  235 |     });
  236 |
  237 |     test('should return 404 for non-existent item', async ({ request }) => {
  238 |       const fakeId = '00000000-0000-0000-0000-000000000000';
  239 |       
  240 |       const response = await request.get(
  241 |         `${API_BASE_URL}/api/wardrobe/${fakeId}`,
  242 |         {
  243 |           headers: {
  244 |             Authorization: `Bearer ${authToken}`,
  245 |           },
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
> 259 |       expect(response.status()).toBe(401);
      |                                 ^ Error: expect(received).toBe(expected) // Object.is equality
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
```