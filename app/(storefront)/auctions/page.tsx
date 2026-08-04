"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { SectionHeading } from "@/components/storefront/section-heading";
import { FoodImage } from "@/components/storefront/food-image";
import { Button } from "@/components/storefront/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomerAuth } from "@/lib/storefront/customer-auth";
import { formatMoney } from "@/lib/storefront/format";
import { toast } from "sonner";

interface AuctionRow {
  id: string;
  productName: string;
  productSlug: string;
  image: string;
  startingBid: number;
  currentBid: number;
  minIncrement: number;
  endAt: string;
}

export default function AuctionsPage() {
  const [rows, setRows] = React.useState<AuctionRow[]>([]);
  const { token, authHeaders, customer } = useCustomerAuth();
  const [amounts, setAmounts] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    api.get<{ data: AuctionRow[] }>("/storefront/auctions").then((res) => setRows(res.data ?? [])).catch(() => undefined);
  }, []);

  async function bid(auction: AuctionRow) {
    if (!customer || !token) {
      toast.error("Sign in to place a bid");
      return;
    }
    const amount = Number(amounts[auction.id] || auction.currentBid + auction.minIncrement);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/storefront/auctions/${auction.id}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Bid failed");
      toast.success("Bid placed");
      const refreshed = await api.get<{ data: AuctionRow[] }>("/storefront/auctions");
      setRows(refreshed.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bid failed");
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
      <SectionHeading title="Live Auctions" eyebrow="Bid to win" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={row.id} className="overflow-hidden rounded-[28px] bg-card shadow-soft">
            <Link href={`/shop/${row.productSlug}`}>
              <div className="aspect-[4/3]"><FoodImage src={row.image} alt={row.productName} containerClassName="size-full" className="size-full object-cover" /></div>
            </Link>
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold text-brown">{row.productName}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Current bid {formatMoney(row.currentBid)} · ends {new Date(row.endAt).toLocaleString()}</p>
              <div className="mt-3 flex gap-2">
                <Input
                  type="number"
                  className="h-10 rounded-xl"
                  placeholder={String(row.currentBid + row.minIncrement)}
                  value={amounts[row.id] ?? ""}
                  onChange={(e) => setAmounts((s) => ({ ...s, [row.id]: e.target.value }))}
                />
                <Button onClick={() => void bid(row)}>Bid</Button>
              </div>
            </div>
          </div>
        ))}
        {!rows.length ? <p className="text-sm text-muted-foreground sm:col-span-2">No active auctions right now.</p> : null}
      </div>
    </div>
  );
}
