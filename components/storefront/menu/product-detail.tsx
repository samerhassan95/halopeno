"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Flame,
  Heart,
  Share2,
  ShoppingBag,
  Minus,
  Plus,
  ChevronRight,
  BadgeCheck,
  ThumbsUp,
  Scale,
  Leaf,
  FlaskConical,
  Truck,
} from "lucide-react";
import { FoodImage } from "../food-image";
import { RatingStars } from "../rating-stars";
import { DietMark, Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ProductCard } from "../product-card";
import { categoryEmoji } from "@/lib/storefront/data/categories";
import { reviews as fallbackReviews } from "@/lib/storefront/data/reviews";
import { useCartStore } from "@/lib/storefront/store/cart-store";
import { useWishlistStore } from "@/lib/storefront/store/wishlist-store";
import { useCatalogStore, fetchProductReviews } from "@/lib/storefront/store/catalog-store";
import { cn } from "@/lib/utils";
import { formatSAR } from "@/lib/storefront/format";
import { api } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import {
  useStorefrontI18n,
  localizedName,
  localizedDescription,
  localizedLongDescription,
} from "@/lib/storefront/i18n/context";
import type { Product, Review, SpiceLevel } from "@/types/storefront";
import { toast } from "sonner";

const heatLabels: Record<SpiceLevel, string> = {
  mild: "Mild",
  medium: "Medium",
  hot: "Hot",
  "extra-hot": "Extra Hot",
};

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isFavorite, toggle } = useWishlistStore();
  const { locale } = useStorefrontI18n();
  const products = useCatalogStore((s) => s.products);
  const name = localizedName(product, locale);
  const description = localizedDescription(product, locale);
  const longDescription = localizedLongDescription(product, locale);

  const [liveReviews, setLiveReviews] = React.useState<Review[] | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    fetchProductReviews(product.id).then((res) => {
      if (!cancelled) setLiveReviews(res);
    });
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const [activeImage, setActiveImage] = React.useState(0);
  const [variationId, setVariationId] = React.useState(product.variations[0]?.id);
  const [addonIds, setAddonIds] = React.useState<string[]>([]);
  const [qty, setQty] = React.useState(1);
  const [note, setNote] = React.useState("");

  const variation = product.variations.find((v) => v.id === variationId);
  const selectedAddons = product.addons.filter((a) => addonIds.includes(a.id));
  const unitPrice = product.price + (variation?.priceDelta ?? 0) + selectedAddons.reduce((s, a) => s + a.price, 0);
  const total = unitPrice * qty;

  function toggleAddon(id: string) {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  function buildCartItem() {
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      unitPrice: product.price + (variation?.priceDelta ?? 0),
      basePrice: product.price,
      variationId: variation?.id ?? "regular",
      variationLabel: variation?.label ?? "Regular",
      spiceLevel: product.spiceLevel,
      addons: selectedAddons,
      qty,
      note: note || undefined,
    };
  }

  function handleAddToCart() {
    addItem(buildCartItem());
    toast.success(`${name} added to cart`);
  }

  function handleBuyNow() {
    addItem(buildCartItem());
    router.push("/checkout");
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: name, text: description }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href).catch(() => {});
      toast.success("Link copied to clipboard");
    }
  }

  const displayReviews = liveReviews && liveReviews.length ? liveReviews : fallbackReviews.slice(0, 2);

  const related = products.filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, 4);
  const frequentlyBought = products.filter((p) => p.id !== product.id).slice(0, 2);

  const favorite = isFavorite(product.id);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/shop" className="hover:text-primary">Shop</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-[32px] shadow-soft">
            <FoodImage
              src={product.gallery[activeImage] ?? product.image}
              alt={name}
              emoji={categoryEmoji[product.categorySlug]}
              containerClassName="size-full"
              className="size-full object-contain transition-transform duration-500 hover:scale-[1.03]"
            />
          </div>
          {product.gallery.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.gallery.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "size-16 shrink-0 overflow-hidden rounded-xl ring-2 transition-all",
                    activeImage === i ? "ring-primary" : "ring-transparent opacity-70"
                  )}
                >
                  <FoodImage src={img} alt="" containerClassName="size-full" className="size-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <DietMark diet={product.diet} />
            {product.bestSeller && <Badge variant="bestseller">Best Seller</Badge>}
            {product.oldPrice && (
              <Badge variant="discount">-{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%</Badge>
            )}
          </div>

          <h1 className="mt-3 font-display text-3xl font-semibold text-brown sm:text-4xl">{name}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <RatingStars rating={product.rating} />
            <span className="font-semibold text-brown">{product.rating}</span>
            <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Flame className="size-3.5" /> {heatLabels[product.spiceLevel]} heat
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Scale className="size-3.5" /> {product.weight}
            </span>
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{longDescription}</p>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-brown">{formatSAR(unitPrice)}</span>
            {product.oldPrice && (
              <span className="text-lg text-muted-foreground line-through">{formatSAR(product.oldPrice)}</span>
            )}
          </div>

          {product.variations.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-brown">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.variations.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariationId(v.id)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      variationId === v.id ? "border-primary bg-primary/10 text-primary" : "border-foreground/15 text-foreground/70"
                    )}
                  >
                    {v.label} {v.priceDelta > 0 && `+${formatSAR(v.priceDelta)}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-brown">Heat Level</p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Flame className="size-3.5" /> {heatLabels[product.spiceLevel]}
            </span>
          </div>

          {product.addons.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-brown">Add extras</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {product.addons.map((a) => (
                  <label
                    key={a.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                      addonIds.includes(a.id) ? "border-primary bg-primary/10 text-primary" : "border-foreground/15 text-foreground/70"
                    )}
                  >
                    <span>{a.label}</span>
                    <span className="flex items-center gap-1">
                      +{formatSAR(a.price)}
                      <input
                        type="checkbox"
                        checked={addonIds.includes(a.id)}
                        onChange={() => toggleAddon(a.id)}
                        className="sr-only"
                      />
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-brown">Add a note (optional)</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g. gift note, delivery instructions…"
              rows={2}
              className="w-full rounded-2xl border border-input bg-card px-4 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex self-start items-center rounded-full border border-foreground/10 bg-card">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex size-11 items-center justify-center" aria-label="Decrease">
                <Minus className="size-4" />
              </button>
              <span className="min-w-[2rem] text-center font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="flex size-11 items-center justify-center" aria-label="Increase">
                <Plus className="size-4" />
              </button>
            </div>
            <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
              <ShoppingBag className="size-4" /> Add to Cart · {formatSAR(total)}
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <Button size="lg" variant="dark" className="flex-1" onClick={handleBuyNow}>
              Buy Now
            </Button>
            <Button size="icon-sm" variant="outline" className="size-11" onClick={() => toggle(product.id)} aria-label="Favorite">
              <Heart className={cn("size-4", favorite && "fill-primary text-primary")} />
            </Button>
            <Button size="icon-sm" variant="outline" className="size-11" onClick={handleShare} aria-label="Share">
              <Share2 className="size-4" />
            </Button>
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Truck className="size-3.5 shrink-0" /> Estimated delivery: <span className="font-medium text-brown">Same-day dispatch, 1-2 business days</span>
          </p>
        </div>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-3">
        <div className="rounded-[28px] bg-card p-6 shadow-soft lg:col-span-2">
          <h2 className="font-display text-xl font-semibold text-brown">Ingredients</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.ingredients.map((ing) => (
              <span key={ing} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-brown">
                {ing}
              </span>
            ))}
          </div>
          {product.allergens.length > 0 && (
            <>
              <h3 className="mt-5 font-display text-sm font-semibold text-brown">Allergens</h3>
              <p className="mt-1 text-sm text-muted-foreground">{product.allergens.join(", ")}</p>
            </>
          )}
        </div>

        <div className="rounded-[28px] bg-card p-6 shadow-soft">
          <h2 className="font-display text-xl font-semibold text-brown">Product promise</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-accent">
                <Leaf className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-brown">100% natural</p>
                <p className="text-xs text-muted-foreground">Made with natural ingredients.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-accent">
                <FlaskConical className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-brown">No artificial preservatives</p>
                <p className="text-xs text-muted-foreground">Nothing artificial added.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <Heart className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-brown">Handcrafted in small batches</p>
                <p className="text-xs text-muted-foreground">Prepared with care in limited batches.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {frequentlyBought.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-brown">Frequently Bought Together</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {frequentlyBought.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-14">
        <h2 className="font-display text-2xl font-semibold text-brown">Customer Reviews</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {displayReviews.map((review) => (
            <div key={review.id} className="rounded-[24px] bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-gold text-xs font-semibold text-white">
                  {review.avatar}
                </span>
                <div>
                  <p className="flex items-center gap-1 text-sm font-semibold text-brown">
                    {review.customerName}
                    {review.verified && <BadgeCheck className="size-3.5 text-accent" />}
                  </p>
                  <RatingStars rating={review.rating} size={11} />
                </div>
              </div>
              <p className="mt-2.5 font-display text-sm font-semibold text-brown">{review.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
              <button className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
                <ThumbsUp className="size-3.5" /> Helpful ({review.helpfulCount})
              </button>
            </div>
          ))}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-brown">You May Also Like</h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} variant="compact" />
            ))}
          </div>
        </div>
      )}

      <ProductQuestions productId={product.id} />
    </div>
  );
}

function ProductQuestions({ productId }: { productId: string }) {
  const [items, setItems] = React.useState<Array<{ id: string; question: string; answer: string | null; customerName: string }>>([]);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [question, setQuestion] = React.useState("");
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    api
      .get<{ data: typeof items }>(`/storefront/products/${productId}/questions`)
      .then((res) => setItems(res.data ?? []))
      .catch(() => undefined);
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !email.trim()) return;
    setSending(true);
    try {
      const res = await api.post<{ ok: boolean; message?: string }>(`/storefront/products/${productId}/questions`, {
        name,
        email,
        question,
      });
      if (!res.ok) throw new Error(res.message || "Failed");
      toast.success("Question submitted — we'll answer soon.");
      setQuestion("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit question");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-14 rounded-[28px] bg-card p-6 shadow-soft sm:p-8">
      <h2 className="font-display text-2xl font-semibold text-brown">Questions & Answers</h2>
      <div className="mt-5 space-y-4">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold text-brown">Q: {item.question}</p>
              <p className="mt-2 text-sm text-muted-foreground">A: {item.answer}</p>
              <p className="mt-1 text-xs text-muted-foreground">Asked by {item.customerName}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No public answers yet. Be the first to ask.</p>
        )}
      </div>
      <form onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-2">
        <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
        <Input placeholder="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
        <textarea
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this product"
          rows={3}
          className="rounded-2xl border border-input bg-background px-4 py-2.5 text-sm sm:col-span-2"
        />
        <Button type="submit" disabled={sending} className="sm:col-span-2 sm:w-fit">
          {sending ? "Sending…" : "Submit question"}
        </Button>
      </form>
    </div>
  );
}
