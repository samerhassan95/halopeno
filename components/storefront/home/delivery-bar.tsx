"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, LocateFixed, Clock, Store, Truck } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { cmsText, type SectionCmsData } from "@/lib/storefront/section-cms";

export function DeliveryBar({ data }: { data?: SectionCmsData } = {}) {
  const message = cmsText(data, "message", "Free delivery on orders over $75");
  const secondaryMessage = cmsText(data, "secondaryMessage", "Pickup available today");
  const icon = cmsText(data, "icon", "delivery");
  const link = cmsText(data, "link", "");
  const [mode, setMode] = React.useState<"delivery" | "pickup">(icon === "store" ? "pickup" : "delivery");
  const [address, setAddress] = React.useState("");
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    if (icon === "store") setMode("pickup");
    if (icon === "delivery") setMode("delivery");
  }, [icon]);

  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setChecked(true);
    toast.success(message || "Great news, we deliver to your area!");
  }

  const Icon = icon === "store" ? Store : icon === "none" ? null : Truck;

  return (
    <section className="relative z-10 mx-auto -mt-5 max-w-[1280px] px-4 sm:px-6 lg:px-10">
      <div className="rounded-[28px] border border-primary/10 bg-card/95 p-4 shadow-soft-lg backdrop-blur sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 rounded-2xl bg-secondary/80 px-4 py-3 text-sm text-brown">
            {Icon ? (
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
            ) : null}
            <div>
              {message ? <p className="font-semibold">{message}</p> : null}
              {secondaryMessage ? <p className="mt-1 text-muted-foreground">{secondaryMessage}</p> : null}
            </div>
          </div>
          {link ? (
            <Button asChild variant="outline" className="shrink-0 rounded-full">
              <Link href={link}>Learn more</Link>
            </Button>
          ) : null}
        </div>

        {icon !== "none" ? (
          <div className="mb-4 inline-flex rounded-full bg-secondary p-1">
            {(["delivery", "pickup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-semibold capitalize transition-colors",
                  mode === m ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        ) : null}

        <form onSubmit={handleCheck} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label htmlFor="delivery-address" className="sr-only">
              Delivery address
            </label>
            <MapPin className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="delivery-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={mode === "delivery" ? "Enter your delivery address" : "Choose a pickup location"}
              className="h-12 rounded-full ps-11"
            />
          </div>
          <Button type="button" variant="outline" className="gap-2" onClick={() => setAddress("Current location")}>
            <LocateFixed className="size-4" /> Use my location
          </Button>
          <Button type="submit">Check Availability</Button>
        </form>

        {checked && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-olive-dark">
            <Clock className="size-4" />
            {mode === "delivery" ? "Estimated delivery time: 30-45 minutes" : "Ready for pickup in 15-20 minutes"}
          </div>
        )}
      </div>
    </section>
  );
}
