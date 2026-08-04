import type { Product, ProductStatus } from "@/types";
import { categories } from "./categories";
import { brands } from "./brands";

const catalog: Array<{
  name: string;
  sku: string;
  categoryIndex: number;
  price: number;
  stock: number;
  qtySold: number;
  status: ProductStatus;
  rating: number;
  image: string;
}> = [
  { name: "Zesty Crunch", sku: "HAL-ZC-200", categoryIndex: 0, price: 40, stock: 120, qtySold: 186, status: "active", rating: 4.8, image: "🌶️" },
  { name: "Mustard Blaze", sku: "HAL-MB-200", categoryIndex: 0, price: 40, stock: 95, qtySold: 142, status: "active", rating: 4.7, image: "🌶️" },
  { name: "Citrus Kick", sku: "HAL-CK-200", categoryIndex: 0, price: 35, stock: 110, qtySold: 94, status: "active", rating: 4.6, image: "🍋" },
  { name: "Vine Fire", sku: "HAL-VF-200", categoryIndex: 0, price: 35, stock: 105, qtySold: 108, status: "active", rating: 4.7, image: "🌿" },
  { name: "Ruby Heat", sku: "HAL-RH-200", categoryIndex: 0, price: 35, stock: 90, qtySold: 123, status: "active", rating: 4.9, image: "🔥" },
  { name: "Tahini Twist", sku: "HAL-TT-200", categoryIndex: 0, price: 35, stock: 12, qtySold: 76, status: "active", rating: 4.8, image: "🫙" },
  { name: "The Halopeno Set", sku: "HAL-SET-6X20", categoryIndex: 1, price: 42, stock: 60, qtySold: 64, status: "active", rating: 4.9, image: "🎁" },
];

export const products: Product[] = catalog.map((item, i) => {
  const category = categories[item.categoryIndex];
  const brand = brands[0];
  return {
    id: `prod-${i + 1}`,
    name: item.name,
    image: item.image,
    sku: item.sku,
    sellerId: null,
    sellerName: "In-house",
    categoryId: category.id,
    categoryName: category.name,
    brandName: brand.name,
    qtySold: item.qtySold,
    stock: item.stock,
    price: item.price,
    revenue: item.qtySold * item.price,
    status: item.status,
    rating: item.rating,
  };
});

export const bestSellingProducts = [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
export const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 15).slice(0, 8);
export const outOfStockProducts = products.filter((p) => p.status === "out_of_stock").slice(0, 8);

export const totalProducts = products.length;
export const inHouseProductCount = products.length;
export const sellerProductCount = 0;
export const activeProductCount = products.filter((p) => p.status === "active").length;
export const outOfStockCount = products.filter((p) => p.status === "out_of_stock").length;
