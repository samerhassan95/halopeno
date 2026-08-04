"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { SectionHeading } from "@/components/storefront/section-heading";
import { FoodImage } from "@/components/storefront/food-image";
import { Reveal } from "@/components/storefront/reveal";

interface FlashDeal {
  id: string;
  title: string;
  banner: string | null;
  discountValue: number;
  endsAt: string;
}

function useCountdown(endsAt: string) {
  const [left, setLeft] = React.useState("");
  React.useEffect(() => {
    const tick = () => {
      const ms = new Date(endsAt).getTime() - Date.now();
      if (ms <= 0) {
        setLeft("Ended");
        return;
      }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);
  return left;
}

function DealCard({ deal }: { deal: FlashDeal }) {
  const left = useCountdown(deal.endsAt);
  return (
    <div className="overflow-hidden rounded-[28px] bg-card shadow-soft">
      <div className="aspect-[16/9] bg-secondary/40">
        {deal.banner ? (
          <FoodImage src={deal.banner} alt={deal.title} containerClassName="size-full" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center font-display text-3xl font-bold text-primary/40">
            {deal.discountValue}% OFF
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">{deal.discountValue}% off · ends in {left}</p>
        <h3 className="mt-1 font-display text-xl font-semibold text-brown">{deal.title}</h3>
        <Link href="/shop" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          Shop the deal
        </Link>
      </div>
    </div>
  );
}

export function FlashDealsSection() {
  const [deals, setDeals] = React.useState<FlashDeal[]>([]);
  React.useEffect(() => {
    api
      .get<{ data: FlashDeal[] }>("/storefront/flash-deals")
      .then((res) => setDeals(res.data ?? []))
      .catch(() => undefined);
  }, []);
  if (!deals.length) return null;
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
      <Reveal>
        <SectionHeading eyebrow="Limited time" title="Flash Deals" align="left" />
      </Reveal>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {deals.map((deal, i) => (
          <Reveal key={deal.id} delay={0.06 * i}>
            <DealCard deal={deal} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
