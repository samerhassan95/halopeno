"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { SectionHeading } from "@/components/storefront/section-heading";
import { FoodImage } from "@/components/storefront/food-image";

export default function PreordersPage() {
  const [rows, setRows] = React.useState<any[]>([]);
  React.useEffect(() => {
    api.get<{ data: any[] }>("/storefront/preorders").then((res) => setRows(res.data ?? [])).catch(() => undefined);
  }, []);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
      <SectionHeading title="Preorders" eyebrow="Coming soon" description="Reserve products before they ship." />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <Link key={row.id} href={`/shop/${row.productSlug}`} className="overflow-hidden rounded-[28px] bg-card shadow-soft">
            <div className="aspect-[4/3]"><FoodImage src={row.image} alt={row.productName} containerClassName="size-full" className="size-full object-cover" /></div>
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold text-brown">{row.productName}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Expected {new Date(row.expectedAvailable).toLocaleDateString()}</p>
            </div>
          </Link>
        ))}
        {!rows.length ? <p className="text-sm text-muted-foreground">No active preorders.</p> : null}
      </div>
    </div>
  );
}
