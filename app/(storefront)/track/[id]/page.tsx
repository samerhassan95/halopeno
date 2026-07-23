"use client";

import { use } from "react";
import { OrderTracking } from "@/components/storefront/checkout/order-tracking";

export default function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OrderTracking orderId={id} />;
}
