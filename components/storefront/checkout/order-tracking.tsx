"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bike,
  CheckCircle2,
  ChefHat,
  Home,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/button";
import type { OrderStage } from "@/lib/storefront/store/order-store";
import { api, ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const stages: { key: OrderStage; label: string; icon: typeof CheckCircle2 }[] = [
  { key: "confirmed", label: "Order Confirmed", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing Your Order", icon: ChefHat },
  { key: "ready", label: "Ready for Dispatch", icon: Package },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Bike },
  { key: "delivered", label: "Delivered", icon: Home },
];

const statusToStage: Record<string, OrderStage> = {
  DRAFT: "confirmed",
  PENDING: "confirmed",
  CONFIRMED: "confirmed",
  PROCESSING: "preparing",
  READY_FOR_SHIPMENT: "ready",
  SHIPPED: "out_for_delivery",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  COMPLETED: "delivered",
};

const stoppedStatuses = new Set([
  "CANCELLED",
  "FAILED",
  "RETURNED",
  "PARTIALLY_RETURNED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

interface TrackingOrder {
  orderNumber: string;
  status: string;
  address: string;
  deliveryMethod: string;
  scheduledTime: string | null;
  createdAt: string;
  updatedAt: string;
}

function friendlyStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function OrderTracking({ orderId }: { orderId: string }) {
  const [order, setOrder] = React.useState<TrackingOrder | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const previousStatus = React.useRef<string | null>(null);

  const loadOrder = React.useCallback(
    async () => {
      try {
        const next = await api.get<TrackingOrder>(`/sales/orders/tracking/${encodeURIComponent(orderId)}`);
        if (previousStatus.current && previousStatus.current !== next.status) {
          toast.success(`Order status updated: ${friendlyStatus(next.status)}`);
        }
        previousStatus.current = next.status;
        setOrder(next);
        setError(null);
      } catch (err) {
        setError(err instanceof ApiError && err.status === 404 ? "Order not found" : "Unable to load live order status");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId]
  );

  function refreshOrder() {
    setRefreshing(true);
    void loadOrder();
  }

  React.useEffect(() => {
    const initial = window.setTimeout(() => void loadOrder(), 0);
    const timer = window.setInterval(() => void loadOrder(), 10_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [loadOrder]);

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <LoaderCircle className="size-8 animate-spin text-primary" aria-label="Loading order status" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <AlertCircle className="mx-auto size-12 text-destructive" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-brown">{error ?? "Order not found"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Check the order number or try again in a moment.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/shop">Continue shopping</Link>
          </Button>
          <Button variant="outline" onClick={refreshOrder}>
            <RefreshCw className="size-4" /> Try again
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/track">Enter another number</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stage = statusToStage[order.status] ?? "confirmed";
  const currentIndex = stages.findIndex((item) => item.key === stage);
  const stopped = stoppedStatuses.has(order.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brown sm:text-3xl">Track Your Order</h1>
          <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "w-fit rounded-full px-3 py-1.5 text-xs font-semibold",
            stopped ? "bg-destructive/10 text-destructive" : "bg-accent/15 text-olive-dark"
          )}>
            {friendlyStatus(order.status)}
          </span>
          <Button size="icon" variant="outline" disabled={refreshing} onClick={refreshOrder} aria-label="Refresh status">
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {stopped && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="size-5 shrink-0" />
          This order is {friendlyStatus(order.status).toLowerCase()}. Contact support if you need assistance.
        </div>
      )}

      <div className="rounded-[28px] bg-card p-6 shadow-soft sm:p-8">
        <div className="relative flex justify-between">
          <div className="absolute left-5 right-5 top-5 h-0.5 bg-border" />
          {!stopped && (
            <div
              className="absolute left-5 top-5 h-0.5 bg-accent transition-all duration-700"
              style={{ width: `calc(${(currentIndex / (stages.length - 1)) * 100}% - ${currentIndex === 0 ? 0 : 10}px)` }}
            />
          )}
          {stages.map((item, index) => {
            const done = !stopped && index <= currentIndex;
            return (
              <div key={item.key} className="relative z-10 flex flex-col items-center gap-2 text-center" style={{ width: `${100 / stages.length}%` }}>
                <span className={cn(
                  "flex size-10 items-center justify-center rounded-full transition-colors",
                  done ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
                )}>
                  <item.icon className="size-4" />
                </span>
                <span className={cn("hidden text-xs font-medium sm:block", done ? "text-brown" : "text-muted-foreground")}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center font-display text-lg font-semibold text-brown sm:hidden">
          {stopped ? friendlyStatus(order.status) : stages[currentIndex].label}
        </p>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Live status · updated {new Date(order.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {(stage === "out_for_delivery" || stage === "delivered") && order.deliveryMethod !== "pickup" && !stopped && (
        <div className="mt-6 flex items-center gap-4 rounded-[24px] bg-card p-5 shadow-soft">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">HD</span>
          <div className="flex-1">
            <p className="font-display font-semibold text-brown">Halopeno Delivery</p>
            <p className="text-sm text-muted-foreground">Your order is on the way</p>
          </div>
          <Button size="icon" variant="outline" aria-label="Call delivery support"><Phone className="size-4" /></Button>
          <Button size="icon" variant="outline" aria-label="Message delivery support"><MessageCircle className="size-4" /></Button>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[24px] bg-card p-5 shadow-soft">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-brown">
            <MapPin className="size-4 text-primary" /> Delivery Address
          </p>
          <p className="text-sm text-muted-foreground">{order.address || "Address unavailable"}</p>
          <div className="mt-3 flex h-32 items-center justify-center rounded-2xl bg-secondary/60 text-xs text-muted-foreground">Live map placeholder</div>
        </div>
        <div className="rounded-[24px] bg-card p-5 shadow-soft">
          <p className="mb-2 text-sm font-semibold text-brown">Need help with this order?</p>
          <p className="text-sm text-muted-foreground">Our support team is here for you.</p>
          <Button variant="outline" className="mt-3 w-full" asChild><Link href="/contact">Contact Support</Link></Button>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Button asChild variant="ghost"><Link href="/shop">Continue Shopping</Link></Button>
      </div>
    </div>
  );
}
