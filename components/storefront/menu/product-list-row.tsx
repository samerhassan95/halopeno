"use client";

import Link from "next/link";
import { Scale, Flame, ShoppingBag } from "lucide-react";
import { FoodImage } from "../food-image";
import { RatingStars } from "../rating-stars";
import { DietMark, Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { QuantityStepper } from "../quantity-stepper";
import { categoryEmoji } from "@/lib/storefront/data/categories";
import { useCartStore } from "@/lib/storefront/store/cart-store";
import { formatSAR } from "@/lib/storefront/format";
import { useStorefrontI18n, localizedName, localizedDescription } from "@/lib/storefront/i18n/context";
import type { Product } from "@/types/storefront";
import { toast } from "sonner";

const spiceCount: Record<string, number> = { mild: 1, medium: 2, hot: 3, "extra-hot": 4 };

export function ProductListRow({ product }: { product: Product }) {
  const { items, addItem, updateQty } = useCartStore();
  const { locale } = useStorefrontI18n();
  const name = localizedName(product, locale);
  const description = localizedDescription(product, locale);
  const variation = product.variations[0];
  const lineId = `${product.id}-${variation?.id ?? "regular"}-${product.spiceLevel}-`;
  const cartLine = items.find((i) => i.lineId === lineId);

  function handleAdd() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      unitPrice: product.price + (variation?.priceDelta ?? 0),
      basePrice: product.price,
      variationId: variation?.id ?? "regular",
      variationLabel: variation?.label ?? "Regular",
      spiceLevel: product.spiceLevel,
      addons: [],
      qty: 1,
    });
    toast.success(`${name} added to cart`);
  }

  return (
    <div className="flex gap-4 rounded-[24px] bg-card p-4 shadow-soft">
      <Link href={`/shop/${product.slug}`} className="relative size-28 shrink-0 overflow-hidden rounded-2xl">
        <FoodImage
          src={product.image}
          alt={name}
          emoji={categoryEmoji[product.categorySlug]}
          containerClassName="size-full"
          className="size-full object-contain"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <DietMark diet={product.diet} />
              {product.bestSeller && <Badge variant="bestseller">Best Seller</Badge>}
            </div>
            <Link href={`/shop/${product.slug}`}>
              <h3 className="truncate font-display text-lg font-semibold text-brown">{name}</h3>
            </Link>
            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <span className="shrink-0 rounded-full bg-secondary px-3 py-1.5 font-display font-semibold text-brown">
            {formatSAR(product.price)}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
          <RatingStars rating={product.rating} size={12} />
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Scale className="size-3.5" /> {product.weight}
          </span>
          <span className="flex items-center gap-0.5 text-gold">
            {Array.from({ length: spiceCount[product.spiceLevel] }).map((_, i) => (
              <Flame key={i} className="size-3 fill-current" />
            ))}
          </span>
          <div className="ms-auto">
            {cartLine ? (
              <QuantityStepper qty={cartLine.qty} onChange={(q) => updateQty(cartLine.lineId, q)} size="sm" />
            ) : (
              <Button size="sm" className="gap-1.5" onClick={handleAdd}>
                <ShoppingBag className="size-3.5" /> Add
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
