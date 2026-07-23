export type DietType = "veg" | "non-veg" | "vegan";
export type SpiceLevel = "mild" | "medium" | "hot" | "extra-hot";

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  itemCount: number;
}

export interface ProductVariation {
  id: string;
  label: string; // Regular / Large / Family
  priceDelta: number;
}

export interface ProductAddon {
  id: string;
  label: string;
  price: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  longDescription: string;
  longDescriptionAr?: string;
  image: string;
  gallery: string[];
  categorySlug: string;
  diet: DietType;
  spiceLevel: SpiceLevel;
  price: number;
  oldPrice?: number;
  rating: number;
  reviewCount: number;
  prepTime: string;
  weight: string;
  bestSeller?: boolean;
  isNew?: boolean;
  ordersCount?: number;
  ingredients: string[];
  allergens: string[];
  variations: ProductVariation[];
  addons: ProductAddon[];
  tags: string[];
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  image: string;
  discountLabel: string;
  code: string;
  expiresAt: string;
  color: "orange" | "olive" | "brown";
}

export interface Review {
  id: string;
  customerName: string;
  avatar: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  photos?: string[];
  helpfulCount: number;
  productSlug?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  city: string;
  isDefault?: boolean;
}

export interface PastOrder {
  id: string;
  date: string;
  items: string;
  total: number;
  status: "delivered" | "cancelled" | "processing";
  image: string;
}
