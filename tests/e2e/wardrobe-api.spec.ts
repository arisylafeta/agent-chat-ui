import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// Helper to create a test user and get auth token
async function getAuthToken() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local'
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Sign in with test user (you'll need to create this user in your Supabase project)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'arianit.sylafeta@gmail.com',
    password: 'SylafetaIsTestingThis!',
  });

  if (error) {
    throw new Error(`Failed to authenticate: ${error.message}`);
  }

  return data.session?.access_token;
}

// Helper to create a test image file
function createTestImageFile(): Buffer {
  // Create a simple 1x1 PNG image
  const pngData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  return pngData;
}

test.describe('Wardrobe API', () => {
  let authToken: string;
  let createdItemId: string;

  test.beforeAll(async () => {
    authToken = await getAuthToken();
  });

  test.describe('POST /api/wardrobe', () => {
    test('should create a new clothing item with image', async ({ request }) => {
      const formData = new FormData();
      formData.append('name', 'Test Blue Jacket');
      formData.append('category', 'jacket');
      formData.append('brand', 'Test Brand');
      formData.append('colors', JSON.stringify(['blue', 'white']));
      formData.append('seasons', JSON.stringify(['fall', 'winter']));
      formData.append('price', '99.99');
      formData.append('gender', 'unisex');
      formData.append('size', 'M');
      formData.append('notes', 'Test notes');
      
      // Create test image blob
      const imageBuffer = createTestImageFile();
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('image', blob, 'test-image.png');

      const response = await request.post(`${API_BASE_URL}/api/wardrobe`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        multipart: formData,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      
      expect(data.item).toBeDefined();
      expect(data.item.id).toBeDefined();
      expect(data.item.name).toBe('Test Blue Jacket');
      expect(data.item.category).toBe('jacket');
      expect(data.item.brand).toBe('Test Brand');
      expect(data.item.image_url).toBeDefined();
      expect(data.item.colors).toEqual(['blue', 'white']);
      expect(data.item.price).toBe(99.99);

      // Save item ID for later tests
      createdItemId = data.item.id;
    });

    test('should fail without authentication', async ({ request }) => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('category', 'shirt');
      
      const imageBuffer = createTestImageFile();
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('image', blob, 'test.png');

      const response = await request.post(`${API_BASE_URL}/api/wardrobe`, {
        multipart: formData,
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    test('should fail without required fields', async ({ request }) => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      // Missing category and image

      const response = await request.post(`${API_BASE_URL}/api/wardrobe`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        multipart: formData,
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Missing required fields');
    });

    test('should fail with invalid file type', async ({ request }) => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('category', 'shirt');
      
      // Create a text file instead of image
      const blob = new Blob(['not an image'], { type: 'text/plain' });
      formData.append('image', blob, 'test.txt');

      const response = await request.post(`${API_BASE_URL}/api/wardrobe`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        multipart: formData,
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid file type');
    });
  });

  test.describe('GET /api/wardrobe', () => {
    test('should list all clothing items for authenticated user', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/wardrobe`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.total).toBeDefined();
      expect(data.limit).toBe(20);
      expect(data.offset).toBe(0);
    });

    test('should support pagination', async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/wardrobe?limit=5&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.limit).toBe(5);
      expect(data.offset).toBe(0);
      expect(data.items.length).toBeLessThanOrEqual(5);
    });

    test('should filter by category', async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/wardrobe?category=jacket`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // All returned items should be jackets
      data.items.forEach((item: any) => {
        expect(item.category).toBe('jacket');
      });
    });

    test('should fail without authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/wardrobe`);

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  test.describe('GET /api/wardrobe/[id]', () => {
    test('should fetch a single clothing item', async ({ request }) => {
      // First create an item to fetch
      if (!createdItemId) {
        test.skip();
      }

      const response = await request.get(
        `${API_BASE_URL}/api/wardrobe/${createdItemId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.item).toBeDefined();
      expect(data.item.id).toBe(createdItemId);
      expect(data.item.name).toBeDefined();
      expect(data.item.category).toBeDefined();
    });

    test('should return 404 for non-existent item', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request.get(
        `${API_BASE_URL}/api/wardrobe/${fakeId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Item not found');
    });

    test('should fail without authentication', async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/wardrobe/${createdItemId}`
      );

      expect(response.status()).toBe(401);
    });
  });

  test.describe('PATCH /api/wardrobe/[id]', () => {
    test('should update a clothing item', async ({ request }) => {
      if (!createdItemId) {
        test.skip();
      }

      const updateData = {
        name: 'Updated Jacket Name',
        brand: 'Updated Brand',
        price: 149.99,
        tags: ['vintage', 'casual'],
      };

      const response = await request.patch(
        `${API_BASE_URL}/api/wardrobe/${createdItemId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: updateData,
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.item.id).toBe(createdItemId);
      expect(data.item.name).toBe('Updated Jacket Name');
      expect(data.item.brand).toBe('Updated Brand');
      expect(data.item.price).toBe(149.99);
      expect(data.item.tags).toEqual(['vintage', 'casual']);
    });

    test('should fail with no fields to update', async ({ request }) => {
      if (!createdItemId) {
        test.skip();
      }

      const response = await request.patch(
        `${API_BASE_URL}/api/wardrobe/${createdItemId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {},
        }
      );

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('No fields to update');
    });

    test('should return 404 for non-existent item', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request.patch(
        `${API_BASE_URL}/api/wardrobe/${fakeId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: { name: 'Test' },
        }
      );

      expect(response.status()).toBe(404);
    });

    test('should fail without authentication', async ({ request }) => {
      const response = await request.patch(
        `${API_BASE_URL}/api/wardrobe/${createdItemId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          data: { name: 'Test' },
        }
      );

      expect(response.status()).toBe(401);
    });
  });

  test.describe('DELETE /api/wardrobe/[id]', () => {
    test('should delete a clothing item', async ({ request }) => {
      if (!createdItemId) {
        test.skip();
      }

      const response = await request.delete(
        `${API_BASE_URL}/api/wardrobe/${createdItemId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.id).toBe(createdItemId);

      // Verify item is actually deleted
      const getResponse = await request.get(
        `${API_BASE_URL}/api/wardrobe/${createdItemId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(getResponse.status()).toBe(404);
    });

    test('should return 404 for non-existent item', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request.delete(
        `${API_BASE_URL}/api/wardrobe/${fakeId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(404);
    });

    test('should fail without authentication', async ({ request }) => {
      const response = await request.delete(
        `${API_BASE_URL}/api/wardrobe/some-id`
      );

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/wardrobe/prettify', () => {
    test('should process image with AI (or return fallback)', async ({ request }) => {
      const formData = new FormData();
      const imageBuffer = createTestImageFile();
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('image', blob, 'test-image.png');

      const response = await request.post(
        `${API_BASE_URL}/api/wardrobe/prettify`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          multipart: formData,
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.prettifiedImage).toBeDefined();
      expect(data.originalImage).toBeDefined();
      expect(data.prettifiedImage).toContain('data:image');
      expect(data.originalImage).toContain('data:image');
    });

    test('should fail without authentication', async ({ request }) => {
      const formData = new FormData();
      const imageBuffer = createTestImageFile();
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('image', blob, 'test.png');

      const response = await request.post(
        `${API_BASE_URL}/api/wardrobe/prettify`,
        {
          multipart: formData,
        }
      );

      expect(response.status()).toBe(401);
    });

    test('should fail without image', async ({ request }) => {
      const formData = new FormData();

      const response = await request.post(
        `${API_BASE_URL}/api/wardrobe/prettify`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          multipart: formData,
        }
      );

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Image file is required');
    });

    test('should fail with invalid file type', async ({ request }) => {
      const formData = new FormData();
      const blob = new Blob(['not an image'], { type: 'text/plain' });
      formData.append('image', blob, 'test.txt');

      const response = await request.post(
        `${API_BASE_URL}/api/wardrobe/prettify`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          multipart: formData,
        }
      );

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid file type');
    });
  });
});
