"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, ApiError } from "@/lib/api/client";
import type { CartItem } from "./cart-store";

export type OrderStage = "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered";

export interface PlacedOrder {
  id: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  deliveryMethod: "delivery" | "pickup" | "scheduled";
  scheduledTime?: string;
  address: string;
  paymentMethod: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  stage: OrderStage;
  /** Set once the order has been synced to the backend (Vantage admin can see it). */
  backendOrderId?: string;
}

interface OrderState {
  orders: PlacedOrder[];
  placeOrder: (data: Omit<PlacedOrder, "id" | "createdAt" | "stage" | "backendOrderId">) => Promise<string>;
  getOrder: (id: string) => PlacedOrder | undefined;
}

async function syncOrderToBackend(
  localId: string,
  data: Omit<PlacedOrder, "id" | "createdAt" | "stage" | "backendOrderId">
): Promise<string | null> {
  if (!data.customerEmail) return null;

  try {
    const order = await api.post<{ id: string }>("/sales/orders/storefront", {
      orderNumber: localId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      items: data.items.map((item) => ({
        productId: item.productId,
        productSlug: item.slug,
        variantId: item.variationId || undefined,
        name: item.name,
        sku: item.slug,
        quantity: item.qty,
        unitPrice: item.unitPrice + item.addons.reduce((sum, addon) => sum + addon.price, 0),
      })),
      subtotal: data.subtotal,
      discountTotal: data.discount,
      taxTotal: data.tax,
      shippingTotal: data.deliveryFee,
      total: data.total,
      deliveryMethod: data.deliveryMethod,
      address: data.address,
      scheduledTime: data.scheduledTime,
      paymentMethod: data.paymentMethod,
      customerNotes: data.items.map((i) => i.note).filter(Boolean).join("; ") || undefined,
    });
    return order.id;
  } catch (err) {
    console.warn("Order sync to backend failed:", err instanceof ApiError ? err.message : err);
    return null;
  }
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      placeOrder: async (data) => {
        const id = `SC${Math.floor(10000 + Math.random() * 89999)}`;
        const backendOrderId = await syncOrderToBackend(id, data);
        if (!backendOrderId) throw new Error("Unable to save the order to the admin system");

        const order: PlacedOrder = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
          stage: "confirmed",
          backendOrderId,
        };
        set((state) => ({ orders: [order, ...state.orders] }));

        return id;
      },
      getOrder: (id) => get().orders.find((o) => o.id === id),
    }),
    { name: "vantage-storefront-orders" }
  )
);
