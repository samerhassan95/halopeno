"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { SectionHeading } from "@/components/storefront/section-heading";

export default function SellersPage() {
  const [rows, setRows] = React.useState<any[]>([]);
  React.useEffect(() => {
    api.get<{ data: any[] }>("/storefront/sellers").then((res) => setRows(res.data ?? [])).catch(() => undefined);
  }, []);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
      <SectionHeading title="Marketplace Sellers" eyebrow="Shops" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <Link key={row.id} href={`/sellers/${row.id}`} className="rounded-[28px] bg-card p-6 shadow-soft">
            <h3 className="font-display text-xl font-semibold text-brown">{row.storeName}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Rating {row.rating || "New"}</p>
          </Link>
        ))}
        {!rows.length ? <p className="text-sm text-muted-foreground">No approved sellers yet.</p> : null}
      </div>
    </div>
  );
}
