import { z } from 'zod';

// Body shape types
export const bodyShapes = [
  'rectangle',
  'triangle',
  'inverted_triangle',
  'hourglass',
  'oval',
] as const;

export type BodyShape = (typeof bodyShapes)[number];

// Avatar Measurements Interface
export interface AvatarMeasurements {
  height_cm: number;
  weight_kg: number;
  body_shape?: BodyShape;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  shoulder_width_cm?: number;
  inseam_cm?: number;
}

// Avatar Database Interface
export interface Avatar {
  user_id: string;
  image_url: string;
  height_cm: number | null;
  weight_kg: number | null;
  body_shape: string | null;
  measurements: AvatarMeasurements | null;
  preferences: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// Generate Avatar Request Data
export interface GenerateAvatarData {
  headImage: File;
  bodyImage: File;
  measurements: AvatarMeasurements;
  regenerationNote?: string;
}

// Generate Avatar API Response
export interface GenerateAvatarResponse {
  avatarImage: string; // data URL
  headImage: string; // data URL
  bodyImage: string; // data URL
}

// Save Avatar Request Data
export interface SaveAvatarData {
  avatarImageDataUrl: string;
  measurements: AvatarMeasurements;
}

// Zod Schema for Measurements Form
export const avatarMeasurementsSchema = z.object({
  height_cm: z
    .number({
      message: 'Height is required and must be a number',
    })
    .positive('Height must be positive')
    .max(300, 'Height must be less than 300cm'),
  weight_kg: z
    .number({
      message: 'Weight is required and must be a number',
    })
    .positive('Weight must be positive')
    .max(500, 'Weight must be less than 500kg'),
  body_shape: z.enum(bodyShapes).optional().or(z.literal('')),
  chest_cm: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === '' || val === undefined) return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .refine((val) => {
      // Only validate if there's actually a value
      if (val === undefined) return true;
      return val > 0 && val <= 300;
    }, {
      message: 'Chest measurement must be between 1 and 300cm',
    }),
  waist_cm: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === '' || val === undefined) return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .refine((val) => {
      // Only validate if there's actually a value
      if (val === undefined) return true;
      return val > 0 && val <= 300;
    }, {
      message: 'Waist measurement must be between 1 and 300cm',
    }),
  hips_cm: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === '' || val === undefined) return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .refine((val) => {
      // Only validate if there's actually a value
      if (val === undefined) return true;
      return val > 0 && val <= 300;
    }, {
      message: 'Hips measurement must be between 1 and 300cm',
    }),
  shoulder_width_cm: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === '' || val === undefined) return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .refine((val) => {
      // Only validate if there's actually a value
      if (val === undefined) return true;
      return val > 0 && val <= 100;
    }, {
      message: 'Shoulder width must be between 1 and 100cm',
    }),
  inseam_cm: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === '' || val === undefined) return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .refine((val) => {
      // Only validate if there's actually a value
      if (val === undefined) return true;
      return val > 0 && val <= 150;
    }, {
      message: 'Inseam measurement must be between 1 and 150cm',
    }),
});

export type AvatarMeasurementsInput = z.input<typeof avatarMeasurementsSchema>;
export type AvatarMeasurementsOutput = z.output<typeof avatarMeasurementsSchema>;

// API Response types
export interface AvatarResponse {
  avatar: Avatar | null;
}

export interface SaveAvatarResponse {
  success: boolean;
  avatar: Avatar;
}

// Error Response
export interface AvatarErrorResponse {
  error: string;
}

// Lookbook types
export type LookbookVisibility = 'private' | 'shared' | 'public';

export interface Lookbook {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  visibility: LookbookVisibility;
  created_at: string;
  updated_at: string;
}

export interface LookbookInput {
  title: string;
  description?: string;
  cover_image_url?: string;
  visibility?: LookbookVisibility;
}

// Junction table types
export interface LookbookWardrobeItem {
  lookbook_id: string;
  wardrobe_item_id: string;
  category: string; // Denormalized from wardrobe_items
  role: string; // Denormalized from wardrobe_items
  note?: string;
  created_at: string;
}
