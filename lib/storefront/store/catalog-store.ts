"use client";

import { create } from "zustand";
import { api, ApiError } from "@/lib/api/client";
import { products as fallbackProducts, getProductBySlug as getFallbackBySlug } from "../data/products";
import { categories as fallbackCategories } from "../data/categories";
import { reviews as fallbackReviews } from "../data/reviews";
import type { Product, Category, Review } from "@/types/storefront";

interface BackendImage {
  url: string;
}
interface BackendVariant {
  id: string;
  sku: string;
  optionsJson: { size?: string } | null;
  price: string;
}
interface BackendReview {
  id: string;
  productId: string;
  customerId: string;
  rating: number;
  title: string | null;
  body: string | null;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
  customerName?: string;
}
interface BackendProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  regularPrice: string;
  salePrice: string | null;
  rating: string;
  reviewCount: number;
  status: string;
  categoryId: string | null;
  images: BackendImage[];
  variants: BackendVariant[];
  reviews?: BackendReview[];
}
interface BackendCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  status?: string;
}

function mapProduct(bp: BackendProduct, categorySlugById: Map<string, string>): Product {
  const meta = getFallbackBySlug(bp.slug);
  const regularPrice = Number(bp.regularPrice);
  const salePrice = bp.salePrice ? Number(bp.salePrice) : null;
  const price = salePrice ?? regularPrice;
  return {
    id: bp.id,
    slug: bp.slug,
    name: bp.name,
    nameAr: meta?.nameAr,
    description: bp.shortDescription ?? meta?.description ?? "",
    descriptionAr: meta?.descriptionAr,
    longDescription: bp.description ?? bp.shortDescription ?? meta?.longDescription ?? "",
    longDescriptionAr: meta?.longDescriptionAr,
    image: bp.images[0]?.url ?? meta?.image ?? "",
    gallery: bp.images.length ? bp.images.map((image) => image.url) : (meta?.gallery ?? []),
    categorySlug: (bp.categoryId && categorySlugById.get(bp.categoryId)) ?? meta?.categorySlug ?? "flavors",
    diet: meta?.diet ?? "veg",
    spiceLevel: meta?.spiceLevel ?? "medium",
    price,
    oldPrice: salePrice !== null ? regularPrice : undefined,
    rating: Number(bp.rating),
    reviewCount: bp.reviewCount,
    prepTime: meta?.prepTime ?? "20-25 min",
    weight: meta?.weight ?? "",
    bestSeller: meta?.bestSeller,
    isNew: meta?.isNew,
    ordersCount: meta?.ordersCount,
    ingredients: meta?.ingredients ?? [],
    allergens: meta?.allergens ?? [],
    variations: bp.variants.length
      ? bp.variants.map((v) => ({
          id: v.id,
          label: v.optionsJson?.size ?? "Regular",
          priceDelta: Math.round((Number(v.price) - price) * 100) / 100,
        }))
      : (meta?.variations ?? []),
    addons: meta?.addons ?? [],
    tags: meta?.tags ?? [],
  };
}

function mapReview(br: BackendReview): Review {
  const name = br.customerName ?? "Verified Customer";
  return {
    id: br.id,
    customerName: name,
    avatar: name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join(""),
    rating: br.rating,
    title: br.title ?? "",
    body: br.body ?? "",
    date: br.createdAt,
    verified: br.isVerified,
    helpfulCount: br.helpfulCount,
  };
}

interface CatalogState {
  products: Product[];
  categories: Category[];
  reviews: Review[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  source: "live" | "fallback";
  fetchCatalog: () => Promise<void>;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: fallbackProducts,
  categories: fallbackCategories,
  reviews: fallbackReviews,
  loading: false,
  loaded: false,
  error: null,
  source: "fallback",

  fetchCatalog: async () => {
    if (get().loading || get().loaded) return;
    set({ loading: true });
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get<{ data: BackendCategory[] }>("/commerce/categories?limit=100"),
        api.get<{ data: BackendProduct[] }>("/commerce/products?limit=200&sortBy=name&sortOrder=asc"),
      ]);

      const categoriesRaw = catRes.data.filter((c) => c.status !== "inactive");
      const productsRaw = prodRes.data.filter((p) => p.status === "PUBLISHED");

      // Keep local fallback only when the admin catalog is empty.
      if (productsRaw.length === 0) {
        set({ loading: false, loaded: true, source: "fallback", error: null });
        return;
      }

      const categorySlugById = new Map(categoriesRaw.map((c) => [c.id, c.slug] as const));
      const counts = new Map<string, number>();
      for (const p of productsRaw) {
        const slug = (p.categoryId && categorySlugById.get(p.categoryId)) ?? "uncategorized";
        counts.set(slug, (counts.get(slug) ?? 0) + 1);
      }

      const categories: Category[] = (categoriesRaw.length ? categoriesRaw : fallbackCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image,
      }))).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image ?? fallbackCategories.find((f) => f.slug === c.slug)?.image ?? "",
        itemCount: counts.get(c.slug) ?? 0,
      }));

      const products = productsRaw.map((p) => mapProduct(p, categorySlugById));

      set({ products, categories, loading: false, loaded: true, source: "live", error: null });

      try {
        const reviewRes = await api.get<{ data: BackendReview[] }>("/storefront/reviews?limit=8");
        if (reviewRes.data.length) {
          set({ reviews: reviewRes.data.map(mapReview) });
        }
      } catch {
        // keep fallback reviews
      }
    } catch (err) {
      set({
        loading: false,
        loaded: true,
        error: err instanceof ApiError ? err.message : "Unable to reach the API",
        source: "fallback",
      });
    }
  },
}));

export async function fetchProductReviews(productId: string): Promise<Review[]> {
  try {
    const res = await api.get<{ data: BackendReview[] }>(
      `/commerce/reviews?search=${encodeURIComponent(productId)}&limit=20`
    );
    const matching = res.data.filter((r) => r.productId === productId);
    if (!matching.length) return [];
    return matching.map(mapReview);
  } catch {
    return [];
  }
}
