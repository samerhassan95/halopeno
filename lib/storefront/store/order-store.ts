"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ApiError } from "@/lib/api/client";
import { CUSTOMER_TOKEN_KEY } from "@/lib/storefront/customer-auth";
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
  backendOrderId?: string;
  loyaltyEarned?: number;
}

interface OrderState {
  orders: PlacedOrder[];
  placeOrder: (data: Omit<PlacedOrder, "id" | "createdAt" | "stage" | "backendOrderId" | "loyaltyEarned"> & { pickupLocationId?: string; paymentIntentId?: string }) => Promise<string>;
  getOrder: (id: string) => PlacedOrder | undefined;
}

async function syncOrderToBackend(
  localId: string,
  data: Omit<PlacedOrder, "id" | "createdAt" | "stage" | "backendOrderId" | "loyaltyEarned"> & {
    pickupLocationId?: string;
    paymentIntentId?: string;
  }
): Promise<{ id: string; loyaltyEarned?: number } | null> {
  if (!data.customerEmail) return null;
  const token = typeof window !== "undefined" ? window.localStorage.getItem(CUSTOMER_TOKEN_KEY) : null;
  const referral = typeof window !== "undefined" ? window.localStorage.getItem("halopeno-referral-code") : null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/storefront/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(referral ? { "x-referral-code": referral } : {}),
      },
      body: JSON.stringify({
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
        paymentIntentId: data.paymentIntentId,
        pickupLocationId: data.pickupLocationId,
        referralCode: referral,
        customerNotes: data.items.map((i) => i.note).filter(Boolean).join("; ") || undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, body.message ?? "Request failed");
    }
    const order = await res.json();
    return { id: order.id as string, loyaltyEarned: order.loyaltyEarned as number | undefined };
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
        const synced = await syncOrderToBackend(id, data);
        if (!synced) throw new Error("Unable to save the order to the admin system");

        const order: PlacedOrder = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
          stage: "confirmed",
          backendOrderId: synced.id,
          loyaltyEarned: synced.loyaltyEarned,
        };
        set((state) => ({ orders: [order, ...state.orders] }));
        return id;
      },
      getOrder: (id) => get().orders.find((o) => o.id === id),
    }),
    { name: "vantage-storefront-orders" }
  )
);
