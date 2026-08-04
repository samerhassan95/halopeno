"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag, Trash2, Tag, X, Sparkles } from "lucide-react";
import { Button } from "@/components/storefront/ui/button";
import { QuantityStepper } from "@/components/storefront/quantity-stepper";
import { FoodImage } from "@/components/storefront/food-image";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/empty-state";
import {
  useCartStore,
  cartSubtotal,
  lineTotal,
} from "@/lib/storefront/store/cart-store";
import { useCommerceConfigStore } from "@/lib/storefront/store/commerce-config-store";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import { useStorefrontI18n } from "@/lib/storefront/i18n/context";
import { cn } from "@/lib/utils";
import { formatSAR } from "@/lib/storefront/format";
import { toast } from "sonner";

export default function CartPage() {
  const { t } = useStorefrontI18n();
  const { items, removeItem, updateQty, coupon, applyCoupon, removeCoupon } = useCartStore();
  const products = useCatalogStore((s) => s.products);
  const quote = useCommerceConfigStore((s) => s.quote);
  const refreshQuote = useCommerceConfigStore((s) => s.refreshQuote);
  const [code, setCode] = React.useState("");

  const subtotal = cartSubtotal(items);
  React.useEffect(() => {
    void refreshQuote(subtotal);
  }, [subtotal, refreshQuote]);

  const discount = coupon ? subtotal * (coupon.discountPct / 100) : 0;
  const deliveryFee =
    coupon?.freeShipping || subtotal >= quote.freeThreshold || subtotal === 0 ? 0 : quote.deliveryFee;
  const tax = (subtotal - discount) * quote.taxRate;
  const total = Math.max(0, subtotal - discount + deliveryFee + tax);
  const progress = Math.min(100, (subtotal / quote.freeThreshold) * 100);
  const remaining = Math.max(0, quote.freeThreshold - subtotal);
  const recommended = products.filter((p) => !items.some((i) => i.productId === p.id)).slice(0, 4);

  async function handleApplyCoupon() {
    if (!code.trim()) return;
    const ok = await applyCoupon(code);
    if (ok) toast.success(t("cart.couponApplied", { code: code.toUpperCase() }));
    else toast.error(t("cart.couponInvalid"));
    setCode("");
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EmptyState
          icon={ShoppingBag}
          title={t("cart.empty")}
          description={t("cart.emptyHint")}
          action={
            <Button asChild>
              <Link href="/shop">{t("cart.browseShop")}</Link>
            </Button>
          }
          className="rounded-[32px] bg-card py-20 shadow-soft"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="font-display text-3xl font-semibold text-brown sm:text-4xl">{t("cart.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(items.length === 1 ? "cart.itemsInCart" : "cart.itemsInCart_plural", { count: items.length })}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.lineId} className="flex gap-4 rounded-[24px] bg-card p-4 shadow-soft sm:p-5">
              <FoodImage
                src={item.image}
                alt={item.name}
                containerClassName="size-24 shrink-0 rounded-2xl sm:size-28"
                className="size-24 rounded-2xl sm:size-28"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-brown">{item.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.variationLabel} · {item.spiceLevel}
                    </p>
                    {item.addons.length > 0 && (
                      <p className="text-xs text-muted-foreground">+ {item.addons.map((a) => a.label).join(", ")}</p>
                    )}
                    {item.note && <p className="mt-1 text-xs italic text-muted-foreground">&quot;{item.note}&quot;</p>}
                  </div>
                  <button onClick={() => removeItem(item.lineId)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label={t("cart.remove")}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <QuantityStepper qty={item.qty} onChange={(q) => updateQty(item.lineId, q)} size="sm" />
                  <span className="font-display text-lg font-semibold text-brown">{formatSAR(lineTotal(item))}</span>
                </div>
              </div>
            </div>
          ))}

          {recommended.length > 0 && (
            <div className="rounded-[24px] bg-card p-5 shadow-soft">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-brown">
                <Sparkles className="size-4 text-primary" /> {t("cart.youMightLike")}
              </p>
              <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-1">
                {recommended.map((p) => (
                  <Link key={p.id} href={`/shop/${p.slug}`} className="w-32 shrink-0 rounded-2xl border border-border/70 p-2.5 text-center">
                    <FoodImage src={p.image} alt={p.name} containerClassName="mb-2 aspect-square rounded-xl" className="aspect-square rounded-xl" />
                    <p className="truncate text-xs font-medium">{p.name}</p>
                    <p className="text-xs font-semibold text-primary">{formatSAR(p.price)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-fit space-y-4 rounded-[28px] bg-card p-6 shadow-soft lg:sticky lg:top-28">
          <div>
            {remaining > 0 ? (
              <p className="mb-1.5 text-xs text-muted-foreground">
                {t("cart.addMoreFree", { amount: formatSAR(remaining) })}
              </p>
            ) : (
              <p className="mb-1.5 text-xs font-medium text-accent">{t("cart.freeUnlocked")}</p>
            )}
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("cart.couponPlaceholder")} className="h-10 rounded-full ps-9" />
            </div>
            <Button variant="outline" size="sm" className="h-10 shrink-0" onClick={handleApplyCoupon}>
              {t("cart.apply")}
            </Button>
          </div>
          {coupon && (
            <div className="flex items-center justify-between rounded-xl bg-accent/10 px-3 py-2 text-sm">
              <span className="font-medium text-olive-dark">{coupon.code} (-{coupon.discountPct}%)</span>
              <button onClick={removeCoupon} className="text-muted-foreground hover:text-destructive" aria-label={t("cart.removeCoupon")}>
                <X className="size-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{t("cart.subtotal")}</span>
              <span>{formatSAR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-olive-dark">
                <span>{t("cart.discount")}</span>
                <span>-{formatSAR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>{t("cart.delivery")}</span>
              <span className={cn(deliveryFee === 0 && "text-accent")}>{deliveryFee === 0 ? t("cart.deliveryFree") : formatSAR(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t("cart.tax")}</span>
              <span>{formatSAR(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-semibold text-brown">
              <span>{t("cart.total")}</span>
              <span>{formatSAR(total)}</span>
            </div>
          </div>

          <Button className="w-full" size="lg" asChild>
            <Link href="/checkout">{t("cart.checkout")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
