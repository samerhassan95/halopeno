"use client";

import * as React from "react";
import { use } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { FoodImage } from "@/components/storefront/food-image";
import { formatMoney } from "@/lib/storefront/format";

export default function SellerShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    api.get<{ data: any }>(`/storefront/sellers/${id}`).then((res) => setData(res.data)).catch(() => undefined);
  }, [id]);

  if (!data) return <div className="px-4 py-20 text-center text-muted-foreground">Loading seller…</div>;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="font-display text-3xl font-semibold text-brown">{data.storeName}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Seller rating {data.rating || "New"}</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {data.products?.map((p: any) => (
          <Link key={p.id} href={`/shop/${p.slug}`} className="overflow-hidden rounded-[24px] bg-card shadow-soft">
            <div className="aspect-square"><FoodImage src={p.image} alt={p.name} containerClassName="size-full" className="size-full object-cover" /></div>
            <div className="p-4">
              <p className="font-medium text-brown">{p.name}</p>
              <p className="text-sm text-muted-foreground">{formatMoney(p.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
