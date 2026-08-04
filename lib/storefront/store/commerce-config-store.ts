"use client";

import { create } from "zustand";
import { api } from "@/lib/api/client";

export interface PaymentMethodOption {
  id: string;
  label: string;
  enabled?: boolean;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  metaTitle: string | null;
  metaDescription: string | null;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  currencyCode: string;
  currencySymbol: string;
  paymentMethods: PaymentMethodOption[];
  loyalty: unknown;
}

export interface CommerceQuote {
  deliveryFee: number;
  freeThreshold: number;
  taxRate: number;
}

interface CommerceConfigState {
  loaded: boolean;
  loading: boolean;
  site: SiteSettings | null;
  quote: CommerceQuote;
  fetchConfig: () => Promise<void>;
  refreshQuote: (subtotal: number) => Promise<void>;
}

const DEFAULT_QUOTE: CommerceQuote = {
  deliveryFee: 15,
  freeThreshold: 150,
  taxRate: 0.15,
};

export const useCommerceConfigStore = create<CommerceConfigState>((set, get) => ({
  loaded: false,
  loading: false,
  site: null,
  quote: DEFAULT_QUOTE,

  fetchConfig: async () => {
    if (get().loading || get().loaded) return;
    set({ loading: true });
    try {
      const [siteRes, quoteRes] = await Promise.all([
        api.get<{ value: SiteSettings }>("/storefront/site-settings"),
        api.post<CommerceQuote>("/storefront/checkout/quote", { subtotal: 0, country: "SA" }),
      ]);
      set({
        site: siteRes.value,
        quote: {
          deliveryFee: quoteRes.deliveryFee ?? DEFAULT_QUOTE.deliveryFee,
          freeThreshold: quoteRes.freeThreshold ?? DEFAULT_QUOTE.freeThreshold,
          taxRate: quoteRes.taxRate ?? DEFAULT_QUOTE.taxRate,
        },
        loaded: true,
        loading: false,
      });
    } catch {
      set({ loaded: true, loading: false });
    }
  },

  refreshQuote: async (subtotal: number) => {
    try {
      const quoteRes = await api.post<CommerceQuote>("/storefront/checkout/quote", {
        subtotal,
        country: "SA",
      });
      set({
        quote: {
          deliveryFee: quoteRes.deliveryFee ?? get().quote.deliveryFee,
          freeThreshold: quoteRes.freeThreshold ?? get().quote.freeThreshold,
          taxRate: quoteRes.taxRate ?? get().quote.taxRate,
        },
      });
    } catch {
      // keep previous
    }
  },
}));
