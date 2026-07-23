import type { OrderStatus, PaymentStatus } from "@/types";

const STATUS_MAP: Record<string, OrderStatus> = {
  DRAFT: "pending",
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  READY_FOR_SHIPMENT: "shipped",
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "shipped",
  DELIVERED: "delivered",
  COMPLETED: "delivered",
  CANCELLED: "cancelled",
  FAILED: "cancelled",
  RETURNED: "returned",
  PARTIALLY_RETURNED: "returned",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "refunded",
};

const PAYMENT_MAP: Record<string, PaymentStatus> = {
  PENDING: "unpaid",
  AUTHORIZED: "unpaid",
  PAID: "paid",
  PARTIALLY_PAID: "partial",
  FAILED: "unpaid",
  VOIDED: "unpaid",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "refunded",
};

export function toFrontendOrderStatus(backendStatus: string): OrderStatus {
  return STATUS_MAP[backendStatus] ?? "pending";
}

export function toFrontendPaymentStatus(backendStatus: string): PaymentStatus {
  return PAYMENT_MAP[backendStatus] ?? "unpaid";
}

export function aggregateStatusCounts(
  breakdown: { status: string; count: number }[]
): Record<OrderStatus, number> {
  const result: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
    refunded: 0,
  };
  for (const b of breakdown) {
    result[toFrontendOrderStatus(b.status)] += b.count;
  }
  return result;
}
