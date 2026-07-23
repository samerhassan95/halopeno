"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/storefront/menu/product-detail";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const products = useCatalogStore((s) => s.products);
  const product = products.find((p) => p.slug === slug);

  if (!product) notFound();

  return <ProductDetail product={product} />;
}
