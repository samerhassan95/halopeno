import { API_URL } from "@/lib/api/client";
import { blogPosts as fallbackPosts } from "@/lib/storefront/data/blog";
import { offers as fallbackOffers } from "@/lib/storefront/data/offers";
import type { BlogPost, Offer } from "@/types/storefront";

const COLORS: Offer["color"][] = ["orange", "olive", "brown"];

export async function fetchStorefrontBlogPosts(limit = 24): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_URL}/storefront/blog-posts?limit=${limit}`, { cache: "no-store" });
    if (!res.ok) return fallbackPosts;
    const json = await res.json();
    const data = (json.data ?? []) as BlogPost[];
    return data.length ? data : fallbackPosts;
  } catch {
    return fallbackPosts;
  }
}

export async function fetchStorefrontBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_URL}/storefront/blog-posts/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return fallbackPosts.find((p) => p.slug === slug) ?? null;
    const json = await res.json();
    return (json.data as BlogPost | null) ?? fallbackPosts.find((p) => p.slug === slug) ?? null;
  } catch {
    return fallbackPosts.find((p) => p.slug === slug) ?? null;
  }
}

export async function fetchStorefrontOffers(): Promise<Offer[]> {
  try {
    const [promoRes, couponRes] = await Promise.all([
      fetch(`${API_URL}/storefront/promotions`, { cache: "no-store" }),
      fetch(`${API_URL}/storefront/coupons`, { cache: "no-store" }),
    ]);
    const promotions = promoRes.ok ? ((await promoRes.json()).data ?? []) : [];
    const coupons = couponRes.ok ? ((await couponRes.json()).data ?? []) : [];

    const fromPromotions: Offer[] = promotions.map(
      (
        promo: {
          id: string;
          name: string;
          type: string;
          discountValue: string | number | null;
          endsAt: string | null;
        },
        index: number
      ) => {
        const value = promo.discountValue == null ? null : Number(promo.discountValue);
        const discountLabel =
          value == null
            ? promo.type.toUpperCase()
            : promo.type.toLowerCase().includes("percent")
              ? `${value}% OFF`
              : `SAR ${value} OFF`;
        return {
          id: promo.id,
          title: promo.name,
          description: `Active promotion from the admin marketing center.`,
          image: "",
          discountLabel,
          code: promo.type.replace(/\s+/g, "").toUpperCase().slice(0, 12),
          expiresAt: promo.endsAt ?? new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
          color: COLORS[index % COLORS.length],
        };
      }
    );

    const fromCoupons: Offer[] = coupons.map(
      (
        coupon: {
          id: string;
          code: string;
          discountType: string;
          discountValue: number;
          expiresAt: string | null;
        },
        index: number
      ) => ({
        id: coupon.id,
        title: `Coupon ${coupon.code}`,
        description: "Use this code at checkout to unlock your discount.",
        image: "",
        discountLabel:
          coupon.discountType === "PERCENTAGE"
            ? `${coupon.discountValue}% OFF`
            : coupon.discountType === "FREE_SHIPPING"
              ? "FREE DELIVERY"
              : `SAR ${coupon.discountValue} OFF`,
        code: coupon.code,
        expiresAt: coupon.expiresAt
          ? coupon.expiresAt.slice(0, 10)
          : new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
        color: COLORS[(index + 1) % COLORS.length],
      })
    );

    const merged = [...fromPromotions, ...fromCoupons];
    return merged.length ? merged : fallbackOffers;
  } catch {
    return fallbackOffers;
  }
}

export type NavLink = { label: string; href: string };

export async function fetchStorefrontMenu(location: string, fallback: NavLink[]): Promise<NavLink[]> {
  try {
    const res = await fetch(`${API_URL}/storefront/menus?location=${encodeURIComponent(location)}`, {
      cache: "no-store",
    });
    if (!res.ok) return fallback;
    const json = await res.json();
    const menu = (json.data ?? [])[0] as { itemsJson?: unknown } | undefined;
    const items = Array.isArray(menu?.itemsJson) ? menu!.itemsJson : [];
    const links = items
      .map((item: { label?: string; title?: string; href?: string; url?: string }) => ({
        label: String(item.label ?? item.title ?? "").trim(),
        href: String(item.href ?? item.url ?? "").trim() || "/",
      }))
      .filter((item: NavLink) => item.label);
    return links.length ? links : fallback;
  } catch {
    return fallback;
  }
}

export async function fetchHeaderConfig<T extends object>(fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}/storefront/header`, { cache: "no-store" });
    if (!res.ok) return fallback;
    const json = await res.json();
    return { ...fallback, ...(json.value as Partial<T> | null) };
  } catch {
    return fallback;
  }
}

export async function fetchFooterConfig<T extends object>(fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}/storefront/footer`, { cache: "no-store" });
    if (!res.ok) return fallback;
    const json = await res.json();
    return { ...fallback, ...(json.value as Partial<T> | null) };
  } catch {
    return fallback;
  }
}
