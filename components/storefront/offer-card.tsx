"use client";

import { Copy, Clock } from "lucide-react";
import { FoodImage } from "./food-image";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Offer } from "@/types/storefront";

const colorMap = {
  orange: "bg-accent/10",
  olive: "bg-secondary",
  brown: "bg-primary/10",
};

export function OfferCard({ offer }: { offer: Offer }) {
  function copyCode() {
    navigator.clipboard?.writeText(offer.code).catch(() => {});
    toast.success(`Coupon ${offer.code} copied`);
  }

  const expires = new Date(offer.expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className={cn("relative overflow-hidden rounded-[32px] p-6", colorMap[offer.color])}>
      <div className="absolute -right-8 -top-8 size-40 rounded-full bg-white/30 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="size-24 shrink-0 overflow-hidden rounded-3xl shadow-md sm:size-28">
          <FoodImage src={offer.image} alt={offer.title} containerClassName="size-full" className="size-full" />
        </div>
        <div className="flex-1">
          <span className="mb-1.5 inline-block rounded-full bg-card px-2.5 py-0.5 text-xs font-bold text-accent shadow-sm">
            {offer.discountLabel}
          </span>
          <h3 className="font-display text-lg font-semibold text-brown">{offer.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{offer.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 rounded-full border border-dashed border-primary/30 bg-card/75 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-card"
            >
              {offer.code} <Copy className="size-3" />
            </button>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" /> Ends {expires}
            </span>
          </div>
        </div>
        <Button size="sm" className="shrink-0" onClick={() => toast.success(`Applied to your next order`)}>
          Order Offer
        </Button>
      </div>
    </div>
  );
}
