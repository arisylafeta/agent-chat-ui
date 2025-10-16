// TypeScript types for wardrobe management

export interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  brand?: string;
  image_url: string;
  colors?: string[];
  fabrics?: string[];
  seasons?: string[];
  tags?: string[];
  price?: number;
  dress_codes?: string[];
  gender?: string;
  size?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ClothingItemInsert = Omit<
  ClothingItem,
  'id' | 'created_at' | 'updated_at'
>;

export type ClothingItemUpdate = Partial<
  Omit<ClothingItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

// API response types
export interface WardrobeListResponse {
  items: ClothingItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface WardrobeItemResponse {
  item: ClothingItem;
}

export interface WardrobeDeleteResponse {
  success: boolean;
  id: string;
}

export interface WardrobeErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export interface PrettifyResponse {
  prettifiedImage: string; // base64 data URL
  originalImage: string; // base64 data URL
}
