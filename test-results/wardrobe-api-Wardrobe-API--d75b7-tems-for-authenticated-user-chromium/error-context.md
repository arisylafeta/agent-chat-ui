# Test info

- Name: Wardrobe API >> GET /api/wardrobe >> should list all clothing items for authenticated user
- Location: /Users/admin/Desktop/AI/Reoutfit/app-reoutfit/tests/e2e/wardrobe-api.spec.ts:149:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 404
    at /Users/admin/Desktop/AI/Reoutfit/app-reoutfit/tests/e2e/wardrobe-api.spec.ts:156:33
```

# Test source

```ts
   56 |       formData.append('colors', JSON.stringify(['blue', 'white']));
   57 |       formData.append('seasons', JSON.stringify(['fall', 'winter']));
   58 |       formData.append('price', '99.99');
   59 |       formData.append('gender', 'unisex');
   60 |       formData.append('size', 'M');
   61 |       formData.append('notes', 'Test notes');
   62 |       
   63 |       // Create test image blob
   64 |       const imageBuffer = createTestImageFile();
   65 |       const blob = new Blob([imageBuffer], { type: 'image/png' });
   66 |       formData.append('image', blob, 'test-image.png');
   67 |
   68 |       const response = await request.post(`${API_BASE_URL}/api/wardrobe`, {
   69 |         headers: {
   70 |           Authorization: `Bearer ${authToken}`,
   71 |         },
   72 |         multipart: formData,
   73 |       });
   74 |
   75 |       expect(response.status()).toBe(201);
   76 |       const data = await response.json();
   77 |       
   78 |       expect(data.item).toBeDefined();
   79 |       expect(data.item.id).toBeDefined();
   80 |       expect(data.item.name).toBe('Test Blue Jacket');
   81 |       expect(data.item.category).toBe('jacket');
   82 |       expect(data.item.brand).toBe('Test Brand');
   83 |       expect(data.item.image_url).toBeDefined();
   84 |       expect(data.item.colors).toEqual(['blue', 'white']);
   85 |       expect(data.item.price).toBe(99.99);
   86 |
   87 |       // Save item ID for later tests
   88 |       createdItemId = data.item.id;
   89 |     });
   90 |
   91 |     test('should fail without authentication', async ({ request }) => {
   92 |       const formData = new FormData();
   93 |       formData.append('name', 'Test Item');
   94 |       formData.append('category', 'shirt');
   95 |       
   96 |       const imageBuffer = createTestImageFile();
   97 |       const blob = new Blob([imageBuffer], { type: 'image/png' });
   98 |       formData.append('image', blob, 'test.png');
   99 |
  100 |       const response = await request.post(`${API_BASE_URL}/api/wardrobe`, {
  101 |         multipart: formData,
  102 |       });
  103 |
  104 |       expect(response.status()).toBe(401);
  105 |       const data = await response.json();
  106 |       expect(data.error).toBe('Unauthorized');
  107 |     });
  108 |
  109 |     test('should fail without required fields', async ({ request }) => {
  110 |       const formData = new FormData();
  111 |       formData.append('name', 'Test Item');
  112 |       // Missing category and image
  113 |
  114 |       const response = await request.post(`${API_BASE_URL}/api/wardrobe`, {
  115 |         headers: {
  116 |           Authorization: `Bearer ${authToken}`,
  117 |         },
  118 |         multipart: formData,
  119 |       });
  120 |
  121 |       expect(response.status()).toBe(400);
  122 |       const data = await response.json();
  123 |       expect(data.error).toContain('Missing required fields');
  124 |     });
  125 |
  126 |     test('should fail with invalid file type', async ({ request }) => {
  127 |       const formData = new FormData();
  128 |       formData.append('name', 'Test Item');
  129 |       formData.append('category', 'shirt');
  130 |       
  131 |       // Create a text file instead of image
  132 |       const blob = new Blob(['not an image'], { type: 'text/plain' });
  133 |       formData.append('image', blob, 'test.txt');
  134 |
  135 |       const response = await request.post(`${API_BASE_URL}/api/wardrobe`, {
  136 |         headers: {
  137 |           Authorization: `Bearer ${authToken}`,
  138 |         },
  139 |         multipart: formData,
  140 |       });
  141 |
  142 |       expect(response.status()).toBe(400);
  143 |       const data = await response.json();
  144 |       expect(data.error).toContain('Invalid file type');
  145 |     });
  146 |   });
  147 |
  148 |   test.describe('GET /api/wardrobe', () => {
  149 |     test('should list all clothing items for authenticated user', async ({ request }) => {
  150 |       const response = await request.get(`${API_BASE_URL}/api/wardrobe`, {
  151 |         headers: {
  152 |           Authorization: `Bearer ${authToken}`,
  153 |         },
  154 |       });
  155 |
> 156 |       expect(response.status()).toBe(200);
      |                                 ^ Error: expect(received).toBe(expected) // Object.is equality
  157 |       const data = await response.json();
  158 |       
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
```