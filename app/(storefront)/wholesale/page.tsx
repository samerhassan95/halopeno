"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { SectionHeading } from "@/components/storefront/section-heading";
import { FoodImage } from "@/components/storefront/food-image";
import { formatMoney } from "@/lib/storefront/format";

export default function WholesalePage() {
  const [rows, setRows] = React.useState<any[]>([]);
  React.useEffect(() => {
    api.get<{ data: any[] }>("/storefront/wholesale").then((res) => setRows(res.data ?? [])).catch(() => undefined);
  }, []);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
      <SectionHeading title="Wholesale Catalog" eyebrow="B2B" description="Products configured with wholesale pricing in the admin dashboard." />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <Link key={row.id} href={`/shop/${row.slug}`} className="overflow-hidden rounded-[28px] bg-card shadow-soft">
            <div className="aspect-[4/3]"><FoodImage src={row.image} alt={row.name} containerClassName="size-full" className="size-full object-cover" /></div>
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold text-brown">{row.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Wholesale from {row.wholesalePrice != null ? formatMoney(row.wholesalePrice) : "tier pricing"}
              </p>
              {row.wholesaleConfig?.moq ? <p className="mt-1 text-xs text-muted-foreground">MOQ {row.wholesaleConfig.moq}</p> : null}
            </div>
          </Link>
        ))}
        {!rows.length ? <p className="text-sm text-muted-foreground">No wholesale products published yet.</p> : null}
      </div>
    </div>
  );
}
