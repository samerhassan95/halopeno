import { faker } from "@faker-js/faker";
import type { Order, OrderStatus, PaymentStatus, DeliveryStatus } from "@/types";
import { customers } from "./customers";
import { sellers } from "./sellers";

faker.seed(404);

const statusPool: OrderStatus[] = [
  "pending", "pending",
  "confirmed", "confirmed",
  "processing", "processing", "processing",
  "shipped", "shipped", "shipped",
  "delivered", "delivered", "delivered", "delivered", "delivered", "delivered",
  "cancelled",
  "returned",
  "refunded",
];

const paymentByStatus: Record<OrderStatus, PaymentStatus> = {
  pending: "unpaid",
  confirmed: "paid",
  processing: "paid",
  shipped: "paid",
  delivered: "paid",
  cancelled: "unpaid",
  returned: "paid",
  refunded: "refunded",
};

const deliveryByStatus: Record<OrderStatus, DeliveryStatus> = {
  pending: "pending",
  confirmed: "pending",
  processing: "pending",
  shipped: "in_transit",
  delivered: "delivered",
  cancelled: "failed",
  returned: "delivered",
  refunded: "delivered",
};

export const orders: Order[] = Array.from({ length: 120 }).map((_, i) => {
  const status = statusPool[i % statusPool.length];
  const customer = customers[i % customers.length];
  const useSeller = i % 2 === 0;
  const seller = useSeller ? sellers[i % sellers.length] : null;
  return {
    id: `#VG-${(20450 + i).toString()}`,
    customerId: customer.id,
    customerName: customer.name,
    customerAvatar: customer.avatar,
    sellerName: seller?.shopName ?? "In-house",
    channel: seller ? "seller" : "in_house",
    date: faker.date.recent({ days: 30 }).toISOString(),
    productCount: faker.number.int({ min: 1, max: 6 }),
    total: faker.number.int({ min: 24, max: 1450 }),
    paymentStatus: paymentByStatus[status],
    deliveryStatus: deliveryByStatus[status],
    status,
  };
});

export const recentOrders = [...orders]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 10);

export function ordersByStatus(status: OrderStatus) {
  return orders.filter((o) => o.status === status);
}

export const orderStatusCounts: Record<OrderStatus, number> = {
  pending: 284,
  confirmed: 412,
  processing: 356,
  shipped: 498,
  delivered: 3120,
  cancelled: 142,
  returned: 68,
  refunded: 54,
};

export const totalOrderCount = Object.values(orderStatusCounts).reduce((a, b) => a + b, 0);
