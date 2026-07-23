import { faker } from "@faker-js/faker";
import type { Refund } from "@/types";
import { customers } from "./customers";
import { orders } from "./orders";

faker.seed(505);

const reasons = [
  "Item damaged in transit",
  "Wrong item delivered",
  "Changed my mind",
  "Product not as described",
  "Late delivery",
  "Defective product",
];

export const refunds: Refund[] = Array.from({ length: 12 }).map((_, i) => {
  const customer = customers[(i * 3) % customers.length];
  const order = orders[(i * 5) % orders.length];
  return {
    id: `RF-${(3400 + i).toString()}`,
    orderId: order.id,
    customerName: customer.name,
    amount: faker.number.int({ min: 18, max: 620 }),
    reason: reasons[i % reasons.length],
    date: faker.date.recent({ days: 14 }).toISOString(),
    status: i % 4 === 0 ? "approved" : i % 4 === 1 ? "rejected" : "pending",
  };
});

export const recentRefunds = refunds.slice(0, 6);
