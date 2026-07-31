export interface WholesalePricingTier {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
  discount: number;
  customerGroup: string;
}

export interface WholesaleVariant {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  size: string;
  color: string;
  material: string;
  weight: string;
  dimensions: string;
  packagingType: string;
  stock: number;
  price: number;
  wholesalePrice: number;
  image: string;
}

export interface WholesaleBundleItem {
  id: string;
  product: string;
  quantity: number;
}

export interface WholesaleConfig {
  moq: number;
  maxOrderQuantity: number | null;
  quantityIncrement: number;
  packagingUnit: string;
  unitsPerPackage: number;
  visibility: string;
  collection: string;
  tags: string;
  suggestedRetailPrice: number;
  taxClass: string;
  pricingTiers: WholesalePricingTier[];
  variants: WholesaleVariant[];
  bundleItems: WholesaleBundleItem[];
  bundleDiscount: number;
  bundlePrice: number;
  warehouse: string;
  lowStockAlert: number;
  backorderAllowed: boolean;
  trackInventory: boolean;
  weight: string;
  length: string;
  width: string;
  height: string;
  deliveryType: string;
  canonicalUrl: string;
  openGraphImage: string;
  videoUrl: string;
  galleryUrls: string;
  documentUrls: string;
  featured: boolean;
}

export interface WholesaleProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  status: string;
  type: string;
  categoryId: string | null;
  category?: { id: string; name: string } | null;
  brandId: string | null;
  brand?: { id: string; name: string } | null;
  regularPrice: string;
  wholesalePrice: string | null;
  stock: number;
  createdAt: string;
  updatedAt: string;
  images?: { url: string }[];
  wholesaleConfig?: Partial<WholesaleConfig> | null;
}

export const defaultWholesaleConfig: WholesaleConfig = {
  moq: 10,
  maxOrderQuantity: null,
  quantityIncrement: 1,
  packagingUnit: "Carton",
  unitsPerPackage: 12,
  visibility: "Registered Businesses Only",
  collection: "",
  tags: "",
  suggestedRetailPrice: 0,
  taxClass: "Standard",
  pricingTiers: [],
  variants: [],
  bundleItems: [],
  bundleDiscount: 0,
  bundlePrice: 0,
  warehouse: "Main Warehouse",
  lowStockAlert: 10,
  backorderAllowed: false,
  trackInventory: true,
  weight: "",
  length: "",
  width: "",
  height: "",
  deliveryType: "Standard freight",
  canonicalUrl: "",
  openGraphImage: "",
  videoUrl: "",
  galleryUrls: "",
  documentUrls: "",
  featured: false,
};
