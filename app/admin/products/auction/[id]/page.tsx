"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import { EmptyState } from "@/components/common/empty-state";
import { AuctionProductForm } from "@/components/auction/auction-product-form";
import type { AuctionDetailRow, AuctionProductRow } from "@/components/auction/types";

export default function EditAuctionProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = React.useState<AuctionProductRow | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    Promise.all([
      api.get<AuctionProductRow>(`/commerce/products/${id}`),
      api.get<{ data: AuctionDetailRow[] }>("/commerce/auction-details?limit=100"),
    ]).then(([item, auctions]) => setProduct({ ...item, auctionDetail: auctions.data.find((auction) => auction.productId === id) }))
      .catch((reason) => setError(reason instanceof ApiError ? reason.message : "Unable to load auction"));
  }, [id]);
  if (error) return <EmptyState title="Auction unavailable" description={error} />;
  if (!product) return <div className="py-20 text-center text-sm text-muted-foreground">Loading auction configuration…</div>;
  return <AuctionProductForm initialProduct={product} />;
}
