"use client";

import * as React from "react";
import { useCartStore, cartSubtotal } from "@/lib/storefront/store/cart-store";
import { useCustomerAuth } from "@/lib/storefront/customer-auth";
import { api } from "@/lib/api/client";

export function AbandonedCartSync() {
  const items = useCartStore((s) => s.items);
  const { customer } = useCustomerAuth();

  React.useEffect(() => {
    if (!items.length) return;
    const email = customer?.email;
    if (!email && !customer?.id) return;
    const timer = window.setTimeout(() => {
      void api
        .post("/storefront/abandoned-carts", {
          email,
          customerId: customer?.id,
          cartValue: cartSubtotal(items),
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            qty: item.qty,
            unitPrice: item.unitPrice,
          })),
        })
        .catch(() => undefined);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [items, customer]);

  return null;
}
