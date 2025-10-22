export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  image_full?: string;
  brand: string;
  currency: string;
  description: string;
  product_url: string;
  rating?: number;
  reviews?: number;
  in_stock?: boolean;
  source_icon?: string;
  position?: number;
  attributes: Record<string, any>;
};
