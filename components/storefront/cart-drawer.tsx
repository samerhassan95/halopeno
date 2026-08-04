"use client";

import * as React from "react";
import Link from "next/link";
import { X, Trash2, ShoppingBag, Tag, Sparkles, CheckCircle2, Truck } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { QuantityStepper } from "./quantity-stepper";
import { FoodImage } from "./food-image";
import { Input } from "@/components/ui/input";
import {
  useCartStore,
  cartSubtotal,
  lineTotal,
} from "@/lib/storefront/store/cart-store";
import { useCommerceConfigStore } from "@/lib/storefront/store/commerce-config-store";
import { cn } from "@/lib/utils";
import { formatSAR } from "@/lib/storefront/format";
import { toast } from "sonner";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";

export function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, removeItem, updateQty, coupon, applyCoupon, removeCoupon } =
    useCartStore();
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

  const recommended = products.filter((p) => !items.some((i) => i.productId === p.id)).slice(0, 3);

  async function handleApplyCoupon() {
    if (!code.trim()) return;
    const ok = await applyCoupon(code);
    if (ok) toast.success(`Coupon ${code.toUpperCase()} applied`);
    else toast.error("That coupon code isn't valid");
    setCode("");
  }

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(o) => !o && closeDrawer()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="storefront-theme flex w-full max-w-md flex-col bg-card p-0 shadow-[-24px_0_70px_-36px_rgba(18,75,45,0.5)] sm:max-w-[520px]"
      >
        <div className="flex items-center justify-between border-b border-primary/10 px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-brown">Your Cart</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"} ready to order
            </p>
          </div>
          <button onClick={closeDrawer} className="rounded-full border border-primary/10 p-2.5 text-primary transition-colors hover:bg-secondary" aria-label="Close cart">
            <X className="size-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <ShoppingBag className="size-7" />
            </div>
            <p className="font-display text-lg font-semibold text-brown">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Add a jar of your favorite flavor to get started.</p>
            <Button asChild onClick={closeDrawer}>
              <Link href="/shop">Browse Shop</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="border-b border-primary/10 bg-secondary/55 px-5 py-4 sm:px-6">
              {remaining > 0 ? (
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="size-4 text-primary" />
                  <p>Add <span className="font-semibold text-primary">{formatSAR(remaining)}</span> more for free delivery</p>
                </div>
              ) : (
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary">
                  <CheckCircle2 className="size-4" /> Free delivery unlocked
                </p>
              )}
              <div className="h-2 overflow-hidden rounded-full border border-primary/10 bg-card">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto scrollbar-thin px-5 py-5 sm:px-6">
              {items.map((item) => (
                <div key={item.lineId} className="flex gap-3 rounded-[20px] border border-primary/10 bg-background p-3.5">
                  <FoodImage
                    src={item.image}
                    alt={item.name}
                    containerClassName="size-20 shrink-0 overflow-hidden rounded-2xl bg-secondary/40"
                    className="size-20 rounded-2xl object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-display text-sm font-semibold text-brown">{item.name}</p>
                      <button onClick={() => removeItem(item.lineId)} className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${item.name}`}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.variationLabel} / {item.spiceLevel.replace("-", " ")}
                      {item.addons.length > 0 && ` / +${item.addons.map((a) => a.label).join(", ")}`}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <QuantityStepper qty={item.qty} onChange={(q) => updateQty(item.lineId, q)} size="sm" />
                      <span className="font-semibold text-brown">{formatSAR(lineTotal(item))}</span>
                    </div>
                  </div>
                </div>
              ))}

              {recommended.length > 0 && (
                <div className="pt-2">
                  <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-brown">
                    <Sparkles className="size-4 text-accent" /> You may also like
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {recommended.map((p) => (
                      <Link
                        key={p.id}
                        href={`/shop/${p.slug}`}
                        onClick={closeDrawer}
                        className="min-w-0 rounded-[16px] border border-primary/10 bg-background p-2 text-center transition-transform hover:-translate-y-0.5"
                      >
                        <FoodImage src={p.image} alt={p.name} containerClassName="mb-2 aspect-square overflow-hidden rounded-xl bg-secondary/40" className="aspect-square rounded-xl object-contain" />
                        <p className="truncate text-xs font-semibold text-brown">{p.name}</p>
                        <p className="mt-0.5 text-xs font-semibold text-primary">{formatSAR(p.price)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-primary/10 bg-background px-5 py-4 sm:px-6">
              <div>
                <label htmlFor="cart-coupon" className="mb-1.5 block text-xs font-semibold text-brown">Coupon code</label>
                <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="cart-coupon"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter code"
                    className="h-10 rounded-full ps-9"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-10 shrink-0" onClick={handleApplyCoupon}>
                  Apply
                </Button>
                </div>
              </div>
              {coupon && (
                <div className="flex items-center justify-between rounded-xl bg-accent/10 px-3 py-2 text-sm">
                  <span className="font-medium text-olive-dark">
                    {coupon.code} applied (-{coupon.discountPct}%)
                  </span>
                  <button onClick={removeCoupon} className="text-muted-foreground hover:text-destructive">
                    <X className="size-3.5" />
                  </button>
                </div>
              )}

              <div className="space-y-2 rounded-[18px] bg-card p-4 text-sm shadow-soft">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatSAR(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-olive-dark">
                    <span>Discount</span>
                    <span>-{formatSAR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery fee</span>
                  <span className={cn(deliveryFee === 0 && "text-accent")}>
                    {deliveryFee === 0 ? "Free" : formatSAR(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>{formatSAR(tax)}</span>
                </div>
                <div className="flex justify-between border-t border-primary/10 pt-2.5 font-display text-lg font-bold text-brown">
                  <span>Total</span>
                  <span>{formatSAR(total)}</span>
                </div>
              </div>

              <Button className="w-full" size="lg" asChild onClick={closeDrawer}>
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
