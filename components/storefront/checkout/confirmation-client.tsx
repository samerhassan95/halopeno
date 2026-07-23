"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, MapPin, CreditCard, Clock, PackageSearch } from "lucide-react";
import { Button } from "../ui/button";
import { useOrderStore } from "@/lib/storefront/store/order-store";
import { paymentMethodLabel } from "@/lib/storefront/payment-labels";
import { formatSAR } from "@/lib/storefront/format";
import { EmptyState } from "@/components/common/empty-state";

export function ConfirmationClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const { getOrder } = useOrderStore();
  const order = orderId ? getOrder(orderId) : undefined;

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <EmptyState
          icon={PackageSearch}
          title="Order not found"
          description="We couldn't find that order. It may have already been completed."
          action={
            <Button asChild>
              <Link href="/shop">Browse Shop</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <div className="rounded-[32px] bg-card p-8 text-center shadow-soft-lg sm:p-12">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent/15 text-accent"
        >
          <CheckCircle2 className="size-11" strokeWidth={1.5} />
        </motion.div>

        <h1 className="mt-6 font-display text-3xl font-semibold text-brown">Order Confirmed!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you. Your order <span className="font-semibold text-brown">#{order.id}</span> is being prepared.
        </p>

        <div className="mt-8 space-y-3 rounded-2xl bg-secondary/50 p-5 text-left text-sm">
          <div className="flex items-center gap-3">
            <Clock className="size-4 shrink-0 text-primary" />
            <span>
              Estimated {order.deliveryMethod === "pickup" ? "pickup" : "delivery"}:{" "}
              <span className="font-medium text-brown">
                {order.scheduledTime ? new Date(order.scheduledTime).toLocaleString() : "30-45 minutes"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="size-4 shrink-0 text-primary" />
            <span>{order.address}</span>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="size-4 shrink-0 text-primary" />
            <span>{paymentMethodLabel(order.paymentMethod)} · {formatSAR(order.total)}</span>
          </div>
        </div>

        <div className="mt-6 space-y-1.5 text-left text-sm">
          {order.items.map((i) => (
            <div key={i.lineId} className="flex justify-between text-muted-foreground">
              <span>{i.qty}× {i.name}</span>
              <span>{formatSAR((i.unitPrice + i.addons.reduce((s, a) => s + a.price, 0)) * i.qty)}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" size="lg" asChild>
            <Link href={`/track/${order.id}`}>Track Order</Link>
          </Button>
          <Button className="flex-1" size="lg" variant="outline" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
