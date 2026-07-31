"use client";

import * as React from "react";
import { use } from "react";
import { api, ApiError } from "@/lib/api/client";
import { EmptyState } from "@/components/common/empty-state";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { WholesaleProductForm } from "@/components/wholesale/wholesale-product-form";
import type { WholesaleConfig } from "@/components/wholesale/types";

interface ProductResponse {
  id: string; name: string; slug: string; sku: string; barcode?: string | null; status: string; shortDescription?: string | null; description?: string | null;
  categoryId?: string | null; brandId?: string | null; regularPrice: string; wholesalePrice?: string | null; stock: number; reservedStock: number; reorderLevel: number;
  shippingClass?: string | null; taxClassId?: string | null; metaTitle?: string | null; metaDescription?: string | null; wholesaleConfig?: Partial<WholesaleConfig> | null;
  images?: { id: string; url: string }[];
}

export default function EditWholesaleProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = React.useState<ProductResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { let cancelled = false; api.get<ProductResponse>(`/commerce/products/${id}`).then((result) => !cancelled && setProduct(result)).catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : "Unable to load product")).finally(() => !cancelled && setLoading(false)); return () => { cancelled = true; }; }, [id]);
  if (loading) return <TableSkeleton rows={8} cols={2} />;
  if (!product || error) return <EmptyState title="Wholesale product not found" description={error ?? "This product is no longer available."} />;
  return <WholesaleProductForm initialProduct={product} />;
}
