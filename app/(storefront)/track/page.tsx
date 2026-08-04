"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/storefront/ui/button";
import { Input } from "@/components/ui/input";

export default function TrackLookupPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = React.useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = orderNumber.trim();
    if (!value) return;
    router.push(`/track/${encodeURIComponent(value)}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="rounded-[28px] bg-card p-6 shadow-soft sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PackageSearch className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-brown">Track Your Order</h1>
            <p className="text-sm text-muted-foreground">Enter your order number (for example SC81218).</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="Order number"
            aria-label="Order number"
            className="h-12"
          />
          <Button type="submit" className="w-full" disabled={!orderNumber.trim()}>
            Track order
          </Button>
        </form>
      </div>
    </div>
  );
}
