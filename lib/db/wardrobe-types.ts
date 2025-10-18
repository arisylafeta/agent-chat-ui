// TypeScript types for wardrobe management

export type SourceType = 'user_upload' | 'affiliate_product' | 'search_result';

export interface WardrobeItem {
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
  source?: SourceType;
  source_ref_id?: string;
  affiliate_product_id?: string;
  search_result_id?: string;
  created_at: string;
  updated_at: string;
}

// Legacy alias for backwards compatibility
export type ClothingItem = WardrobeItem;

export type WardrobeItemInsert = Omit<
  WardrobeItem,
  'id' | 'created_at' | 'updated_at'
>;

export type WardrobeItemUpdate = Partial<
  Omit<WardrobeItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

// Legacy aliases
export type ClothingItemInsert = WardrobeItemInsert;
export type ClothingItemUpdate = WardrobeItemUpdate;

// API response types
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

export interface WardrobeErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export interface PrettifyResponse {
  prettifiedImage: string; // base64 data URL
  originalImage: string; // base64 data URL
}
