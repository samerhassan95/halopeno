"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SpiceLevel } from "@/types/storefront";
import { api } from "@/lib/api/client";

export interface CartAddon {
  id: string;
  label: string;
  price: number;
}

export interface CartItem {
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  basePrice: number;
  variationId: string;
  variationLabel: string;
  spiceLevel: SpiceLevel;
  addons: CartAddon[];
  qty: number;
  note?: string;
}

interface CouponState {
  code: string;
  discountPct: number;
  freeShipping?: boolean;
}

interface CartState {
  items: CartItem[];
  coupon: CouponState | null;
  isDrawerOpen: boolean;
  addItem: (item: Omit<CartItem, "lineId">) => void;
  removeItem: (lineId: string) => void;
  updateQty: (lineId: string, qty: number) => void;
  clear: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      isDrawerOpen: false,

      addItem: (item) => {
        const lineId = `${item.productId}-${item.variationId}-${item.spiceLevel}-${item.addons.map((a) => a.id).sort().join(",")}`;
        set((state) => {
          const existing = state.items.find((i) => i.lineId === lineId);
          if (existing) {
            return {
              items: state.items.map((i) => (i.lineId === lineId ? { ...i, qty: i.qty + item.qty } : i)),
            };
          }
          return { items: [...state.items, { ...item, lineId }] };
        });
      },

      removeItem: (lineId) => set((state) => ({ items: state.items.filter((i) => i.lineId !== lineId) })),

      updateQty: (lineId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.lineId !== lineId)
              : state.items.map((i) => (i.lineId === lineId ? { ...i, qty } : i)),
        })),

      clear: () => set({ items: [], coupon: null }),

      applyCoupon: async (code) => {
        const upper = code.trim().toUpperCase();
        if (!upper) return false;
        const subtotal = cartSubtotal(get().items);
        try {
          const res = await api.post<{
            valid: boolean;
            coupon?: { code: string; discountPct: number; freeShipping?: boolean };
          }>("/storefront/coupons/validate", { code: upper, subtotal });
          if (!res.valid || !res.coupon) return false;
          set({
            coupon: {
              code: res.coupon.code,
              discountPct: res.coupon.discountPct,
              freeShipping: res.coupon.freeShipping,
            },
          });
          return true;
        } catch {
          return false;
        }
      },

      removeCoupon: () => set({ coupon: null }),

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
    }),
    {
      name: "vantage-storefront-cart",
      version: 2,
      migrate: (persistedState, version) => {
        const state = persistedState as { items?: CartItem[]; coupon?: CouponState | null };
        const items = state.items ?? [];
        return {
          items: version < 2 ? items.filter((item) => item.image.startsWith("/images/products/")) : items,
          coupon: state.coupon ?? null,
        };
      },
      partialize: (state) => ({ items: state.items, coupon: state.coupon }),
    }
  )
);

export function lineTotal(item: CartItem) {
  return (item.unitPrice + item.addons.reduce((s, a) => a.price + s, 0)) * item.qty;
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function cartItemCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export const FREE_DELIVERY_THRESHOLD = 150;
export const DELIVERY_FEE = 15;
export const TAX_RATE = 0.15;
