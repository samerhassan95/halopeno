"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Flame, Scale, ShoppingBag } from "lucide-react";
import { FoodImage } from "./food-image";
import { RatingStars } from "./rating-stars";
import { QuantityStepper } from "./quantity-stepper";
import { DietMark, Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { categoryEmoji } from "@/lib/storefront/data/categories";
import { useCartStore } from "@/lib/storefront/store/cart-store";
import { useWishlistStore } from "@/lib/storefront/store/wishlist-store";
import { cn } from "@/lib/utils";
import { formatSAR } from "@/lib/storefront/format";
import { useStorefrontI18n, localizedName, localizedDescription } from "@/lib/storefront/i18n/context";
import type { Product } from "@/types/storefront";
import { toast } from "sonner";

const spiceCount: Record<string, number> = { mild: 1, medium: 2, hot: 3, "extra-hot": 4 };

export function ProductCard({
  product,
  variant = "default",
  showPrice = true,
  showRating = true,
  showWishlist = true,
  showAddToCart = true,
}: {
  product: Product;
  variant?: "default" | "featured" | "compact";
  showPrice?: boolean;
  showRating?: boolean;
  showWishlist?: boolean;
  showAddToCart?: boolean;
}) {
  const { items, addItem, updateQty } = useCartStore();
  const { isFavorite, toggle } = useWishlistStore();
  const { locale } = useStorefrontI18n();
  const favorite = isFavorite(product.id);
  const name = localizedName(product, locale);
  const description = localizedDescription(product, locale);

  const defaultVariation = product.variations[0];
  const lineId = `${product.id}-${defaultVariation?.id ?? "regular"}-${product.spiceLevel}-`;
  const cartLine = items.find((i) => i.lineId === lineId);

  function handleAdd() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      unitPrice: product.price + (defaultVariation?.priceDelta ?? 0),
      basePrice: product.price,
      variationId: defaultVariation?.id ?? "regular",
      variationLabel: defaultVariation?.label ?? "Regular",
      spiceLevel: product.spiceLevel,
      addons: [],
      qty: 1,
    });
    toast.success(`${name} added to cart`);
  }

  const discountPct = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  const isFeatured = variant === "featured";

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[24px] border border-primary/10 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-soft-lg",
        isFeatured && "sm:flex-row"
      )}
    >
      <Link
        href={`/shop/${product.slug}`}
        className={cn("relative block overflow-hidden bg-secondary/35", isFeatured ? "sm:w-1/2" : "aspect-square")}
      >
        <FoodImage
          src={product.image}
          alt={name}
          emoji={categoryEmoji[product.categorySlug]}
          containerClassName={cn("size-full", isFeatured && "sm:h-full sm:min-h-[280px]")}
          className="size-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.bestSeller && <Badge variant="bestseller">Best Seller</Badge>}
          {discountPct && <Badge variant="discount">-{discountPct}%</Badge>}
          {product.isNew && <Badge variant="new">New</Badge>}
        </div>
        {showWishlist ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggle(product.id);
            }}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur transition-transform hover:scale-110"
            aria-label="Toggle favorite"
          >
            <Heart className={cn("size-4", favorite && "fill-primary text-primary")} />
          </button>
        ) : null}
      </Link>

      <div className={cn("flex flex-1 flex-col gap-2.5 p-5", isFeatured && "sm:justify-center sm:p-7")}>
        <div className="flex items-center gap-2">
          <DietMark diet={product.diet} />
          <div className="flex items-center gap-0.5 text-gold">
            {Array.from({ length: spiceCount[product.spiceLevel] }).map((_, i) => (
              <Flame key={i} className="size-3 fill-current" />
            ))}
          </div>
          <span className="ms-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Scale className="size-3.5" /> {product.weight}
          </span>
        </div>

        <Link href={`/shop/${product.slug}`}>
          <h3 className={cn("font-display font-semibold text-brown", isFeatured ? "text-2xl" : "text-lg")}>
            {name}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>

        {showRating ? (
          <div className="flex items-center gap-1.5 text-sm">
            <RatingStars rating={product.rating} size={13} />
            <span className="font-medium text-foreground">{product.rating}</span>
            <span className="text-muted-foreground">({product.reviewCount})</span>
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-2">
          {showPrice ? (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg font-bold text-primary">
                {formatSAR(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-sm text-muted-foreground line-through">{formatSAR(product.oldPrice)}</span>
              )}
            </div>
          ) : (
            <span />
          )}

          {showAddToCart ? (
            cartLine ? (
              <QuantityStepper qty={cartLine.qty} onChange={(q) => updateQty(cartLine.lineId, q)} size="sm" />
            ) : (
              <Button size="icon" onClick={handleAdd} aria-label="Add to cart">
                <ShoppingBag className="size-4" />
              </Button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
