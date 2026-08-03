import type { Product } from "@/types/storefront";
import { cmsNumber, cmsText, type SectionCmsData } from "@/lib/storefront/section-cms";

export function selectSectionProducts(products: Product[], data?: SectionCmsData) {
  const source = cmsText(data, "productSource", "automatic");
  const sort = cmsText(data, "sort", "featured");
  const limit = Math.max(1, cmsNumber(data, "limit", 8));
  const collectionSlug = cmsText(data, "collectionSlug", "");
  const rawIds = data?.productIds;
  const productIds = Array.isArray(rawIds) ? rawIds.map(String) : [];

  let list = [...products];

  if (source === "manual" && productIds.length) {
    const byKey = new Map<string, Product>();
    for (const product of list) {
      byKey.set(product.id, product);
      byKey.set(product.slug, product);
    }
    list = productIds.map((id) => byKey.get(id)).filter((product): product is Product => Boolean(product));
  } else if (source === "collection" && collectionSlug) {
    list = list.filter(
      (product) =>
        product.categorySlug === collectionSlug ||
        product.slug.includes(collectionSlug) ||
        product.name.toLowerCase().includes(collectionSlug.toLowerCase())
    );
  } else if (sort === "best-selling") {
    list = list.filter((product) => product.bestSeller);
    if (!list.length) list = [...products];
  }

  if (source !== "manual") {
    if (sort === "best-selling") list = [...list].sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller));
    else if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "newest") list = [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew));
    else list = [...list].sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || b.rating - a.rating);
  }

  return list.slice(0, limit);
}

export function sectionCardFlags(data?: SectionCmsData) {
  return {
    showPrice: data?.showPrice !== false,
    showRating: data?.showRating !== false,
    showWishlist: data?.showWishlist !== false,
    showAddToCart: data?.showAddToCart !== false,
  };
}
