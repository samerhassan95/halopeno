import { faker } from "@faker-js/faker";
import type { Product, ProductStatus } from "@/types";
import { categories } from "./categories";
import { brands } from "./brands";
import { sellers } from "./sellers";

faker.seed(303);

const productNames = [
  "Wireless Noise-Cancel Headphones", "Aroma Diffuser Deluxe", "Trail Running Shoes",
  "Ceramic Pour-Over Set", "Smart Fitness Band", "Linen Weekend Bag",
  "Minimalist Desk Lamp", "Organic Face Serum", "Bamboo Cutting Board Set",
  "Portable Bluetooth Speaker", "Cotton Knit Throw Blanket", "Stainless Water Bottle",
  "Kids Building Blocks Set", "Leather Card Wallet", "Yoga Mat Pro",
  "Wireless Charging Stand", "Ceramic Plant Pot Trio", "Graphic Novel Box Set",
  "Non-stick Cookware Set", "Adjustable Standing Desk", "Retro Film Camera",
  "Merino Wool Beanie", "Electric Kettle 1.7L", "Kids Rain Jacket",
  "Scented Soy Candle Trio", "Compact Air Fryer", "Canvas Backpack",
  "Sunglasses Polarized", "Board Game Night Bundle", "Skincare Gift Set",
];

const statuses: ProductStatus[] = ["active", "active", "active", "active", "draft", "out_of_stock", "inactive"];

export const products: Product[] = productNames.map((name, i) => {
  const category = categories[i % categories.length];
  const brand = brands[i % brands.length];
  const useSeller = i % 3 !== 0;
  const seller = useSeller ? sellers[i % sellers.length] : null;
  const stock = faker.number.int({ min: 0, max: 400 });
  const status: ProductStatus = stock === 0 ? "out_of_stock" : statuses[i % statuses.length];
  const price = faker.number.int({ min: 12, max: 480 });
  const qtySold = faker.number.int({ min: 8, max: 960 });
  return {
    id: `prod-${i + 1}`,
    name,
    image: category.image,
    sku: `SKU-${(1000 + i).toString(36).toUpperCase()}`,
    sellerId: seller?.id ?? null,
    sellerName: seller?.shopName ?? "In-house",
    categoryId: category.id,
    categoryName: category.name,
    brandName: brand.name,
    qtySold,
    stock,
    price,
    revenue: qtySold * price,
    status,
    rating: Number(faker.number.float({ min: 3.2, max: 5, fractionDigits: 1 }).toFixed(1)),
  };
});

export const bestSellingProducts = [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
export const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 15).slice(0, 8);
export const outOfStockProducts = products.filter((p) => p.status === "out_of_stock").slice(0, 8);

export const totalProducts = products.length * 42;
export const inHouseProductCount = Math.round(totalProducts * 0.38);
export const sellerProductCount = totalProducts - inHouseProductCount;
export const activeProductCount = Math.round(totalProducts * 0.82);
export const outOfStockCount = Math.round(totalProducts * 0.06);
