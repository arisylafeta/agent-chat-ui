import { z } from 'zod';

// Source types
export const sourceTypes = ['user_upload', 'affiliate_product', 'search_result'] as const;
export type SourceType = (typeof sourceTypes)[number];

// Enums
export const clothingCategories = [
  'shirt',
  'pants',
  'dress',
  'jacket',
  'shoes',
  'accessories',
  'other',
] as const;

export const seasons = ['spring', 'summer', 'fall', 'winter'] as const;

export const genders = ['male', 'female', 'unisex'] as const;

// Types
export type ClothingCategory = (typeof clothingCategories)[number];
export type Season = (typeof seasons)[number];
export type Gender = (typeof genders)[number];

// Zod Schemas
export const clothingItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(clothingCategories),
  brand: z.string().min(1, 'Brand is required'),
  colors: z.array(z.string()).optional(),
  fabrics: z.array(z.string()).optional(),
  seasons: z.array(z.enum(seasons)).optional(),
  price: z.number().positive('Price must be positive').optional().or(z.literal(undefined)),
  dress_codes: z.array(z.string()).optional(),
  gender: z.enum(genders).optional(),
  size: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  purchase_date: z.string().optional(),
});

export type ClothingItemInput = z.infer<typeof clothingItemSchema>;

// Database types
export interface WardrobeItem {
  id: string;
  user_id: string;
  name: string;
  category: ClothingCategory;
  brand?: string;
  image_url?: string;
  colors?: string[];
  fabrics?: string[];
  seasons?: Season[];
  price?: number;
  dress_codes?: string[];
  gender?: Gender;
  size?: string;
  notes?: string;
  tags?: string[];
  purchase_date?: string;
  source?: SourceType;
  source_ref_id?: string;
  affiliate_product_id?: string;
  search_result_id?: string;
  created_at: string;
  updated_at: string;
}

// Legacy alias for backwards compatibility
export type ClothingItem = WardrobeItem;

// API Response types
export interface WardrobeListResponse {
  items: WardrobeItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface WardrobeItemResponse {
  item: WardrobeItem;
}

export interface WardrobeDeleteResponse {
  success: boolean;
  id: string;
}

export interface PrettifyResponse {
  prettifiedImage: string;
  originalImage: string;
}
