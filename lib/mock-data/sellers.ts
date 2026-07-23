import { faker } from "@faker-js/faker";
import type { Seller } from "@/types";

faker.seed(101);

const shopNames = [
  "Urban Nest Co.", "Silverline Traders", "Pixel & Palm", "Coastal Goods",
  "Ember & Oak", "Bright Basket Mart", "Northfield Supply", "Velvet Row",
  "Cedar & Stone", "Aurora Mercantile", "The Corner Depot", "Glow Studio Shop",
];

export const sellers: Seller[] = shopNames.map((shopName, i) => {
  const status: Seller["status"] = i < 8 ? "approved" : i < 11 ? "pending" : "rejected";
  const name = faker.person.fullName();
  return {
    id: `seller-${i + 1}`,
    name,
    shopName,
    avatar: name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join(""),
    status,
    productCount: faker.number.int({ min: 12, max: 320 }),
    totalSales: faker.number.int({ min: 4200, max: 186000 }),
    rating: Number(faker.number.float({ min: 3.6, max: 5, fractionDigits: 1 }).toFixed(1)),
    joinedAt: faker.date.past({ years: 2 }).toISOString(),
  };
});

export const approvedSellers = sellers.filter((s) => s.status === "approved");
export const pendingSellers = sellers.filter((s) => s.status === "pending");
export const rejectedSellers = sellers.filter((s) => s.status === "rejected");
export const topSellers = [...sellers].sort((a, b) => b.totalSales - a.totalSales).slice(0, 5);
