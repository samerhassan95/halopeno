"use client";

import { use, useEffect, useState } from "react";
import { ProductForm, type ProductFormValues } from "@/components/resource/product-form";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";

interface ProductImageResponse {
  id: string;
  url: string;
  altText: string | null;
  displayOrder: number;
}

interface ProductVariantResponse {
  id: string;
  sku: string;
  barcode: string | null;
  optionsJson: { label?: string } | null;
  price: string;
  stock: number;
  weight: string | null;
  image: string | null;
  status: string;
}

interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string | null;
  status: string;
  categoryId: string | null;
  brandId: string | null;
  shortDescription: string | null;
  description: string | null;
  regularPrice: string;
  salePrice: string | null;
  costPrice: string | null;
  wholesalePrice: string | null;
  stock: number;
  reservedStock: number;
  reorderLevel: number;
  warrantyInfo: string | null;
  returnEligible: boolean;
  shippingClass: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  images: ProductImageResponse[];
  variants: ProductVariantResponse[];
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ProductResponse>(`/commerce/products/${id}`)
      .then((res) => {
        if (!cancelled) setProduct(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load product");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Edit Product</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Update product details, images, and variations.</p>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={2} />
      ) : error || !product ? (
        <EmptyState title="Product not found" description={error ?? "This product could not be loaded."} />
      ) : (
        <ProductForm
          productId={product.id}
          initialValues={mapToFormValues(product)}
          initialImages={product.images.map((img) => ({
            id: img.id,
            url: img.url,
            altText: img.altText ?? "",
            displayOrder: img.displayOrder,
          }))}
          initialVariants={product.variants.map((v) => ({
            id: v.id,
            label: v.optionsJson?.label ?? v.sku,
            sku: v.sku,
            price: v.price,
            stock: String(v.stock),
            barcode: v.barcode ?? "",
            weight: v.weight ?? "",
            image: v.image ?? "",
            status: v.status,
          }))}
        />
      )}
    </div>
  );
}

function mapToFormValues(product: ProductResponse): Partial<ProductFormValues> {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    barcode: product.barcode ?? "",
    status: product.status,
    categoryId: product.categoryId ?? "",
    brandId: product.brandId ?? "",
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    regularPrice: product.regularPrice ?? "",
    salePrice: product.salePrice ?? "",
    costPrice: product.costPrice ?? "",
    wholesalePrice: product.wholesalePrice ?? "",
    stock: String(product.stock ?? 0),
    reservedStock: String(product.reservedStock ?? 0),
    reorderLevel: String(product.reorderLevel ?? 5),
    warrantyInfo: product.warrantyInfo ?? "",
    returnEligible: product.returnEligible,
    shippingClass: product.shippingClass ?? "",
    metaTitle: product.metaTitle ?? "",
    metaDescription: product.metaDescription ?? "",
  };
}
