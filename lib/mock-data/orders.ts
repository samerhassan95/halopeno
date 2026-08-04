import type { Order, OrderStatus, PaymentStatus, DeliveryStatus } from "@/types";
import { customers } from "./customers";

const statusPool: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "delivered",
  "delivered",
  "cancelled",
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

const totals = [80, 40, 70, 42, 75, 35, 105, 42];

export const orders: Order[] = Array.from({ length: 8 }).map((_, i) => {
  const status = statusPool[i % statusPool.length];
  const customer = customers[i % customers.length];
  return {
    id: `#HAL-${(10020 + i).toString()}`,
    customerId: customer.id,
    customerName: customer.name,
    customerAvatar: customer.avatar,
    sellerName: "In-house",
    channel: "in_house",
    date: new Date(Date.now() - i * 36e5 * 18).toISOString(),
    productCount: 1 + (i % 3),
    total: totals[i],
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
  pending: 1,
  confirmed: 1,
  processing: 1,
  shipped: 1,
  delivered: 3,
  cancelled: 1,
  returned: 0,
  refunded: 0,
};

export const totalOrderCount = Object.values(orderStatusCounts).reduce((a, b) => a + b, 0);
