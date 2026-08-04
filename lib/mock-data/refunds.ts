import type { Refund } from "@/types";
import { customers } from "./customers";
import { orders } from "./orders";

const reasons = [
  "Jar cracked in transit",
  "Wrong flavor delivered",
  "Changed my mind",
];

export const refunds: Refund[] = Array.from({ length: 3 }).map((_, i) => {
  const customer = customers[i % customers.length];
  const order = orders[i % orders.length];
  return {
    id: `RF-${(3400 + i).toString()}`,
    orderId: order.id,
    customerName: customer.name,
    amount: [40, 35, 42][i],
    reason: reasons[i % reasons.length],
    date: new Date(Date.now() - i * 86400000 * 2).toISOString(),
    status: i === 0 ? "pending" : i === 1 ? "approved" : "rejected",
  };
});

export const recentRefunds = refunds.slice(0, 6);
