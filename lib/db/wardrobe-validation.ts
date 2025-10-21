// Zod validation schemas for wardrobe management

import { z } from 'zod';

export const ClothingCategorySchema = z.enum([
  'shirt',
  'pants',
  'shorts',
  'dress',
  'skirt',
  'jacket',
  'coat',
  'sweater',
  'hoodie',
  'shoes',
  'boots',
  'sneakers',
  'accessories',
  'suit',        // NEW: Fullbody category
  'tracksuit',   // NEW: Fullbody category
  'jumpsuit',    // NEW: Fullbody category
  'romper',      // NEW: Fullbody category
  'other',
]);

export const SeasonSchema = z.enum([
  'spring',
  'summer',
  'fall',
  'winter',
  'all-season',
]);

export const DressCodeSchema = z.enum([
  'casual',
  'business-casual',
  'business',
  'formal',
  'athletic',
]);

export const GenderSchema = z.enum(['men', 'women', 'unisex']);

export const ClothingItemCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  category: ClothingCategorySchema,
  brand: z.string().max(50).optional(),
  colors: z.array(z.string()).optional(),
  fabrics: z.array(z.string()).optional(),
  seasons: z.array(SeasonSchema).optional(),
  tags: z.array(z.string()).optional(),
  price: z.number().positive().optional(),
  dress_codes: z.array(DressCodeSchema).optional(),
  gender: GenderSchema.optional(),
  size: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  prettifyWithAI: z.boolean().optional(),
});

export const ClothingItemUpdateSchema = ClothingItemCreateSchema.partial();

export const ImageFileSchema = z.object({
  type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
});

export type ClothingCategory = z.infer<typeof ClothingCategorySchema>;
export type Season = z.infer<typeof SeasonSchema>;
export type DressCode = z.infer<typeof DressCodeSchema>;
export type Gender = z.infer<typeof GenderSchema>;
export type ClothingItemCreate = z.infer<typeof ClothingItemCreateSchema>;
export type ClothingItemUpdateInput = z.infer<typeof ClothingItemUpdateSchema>;
