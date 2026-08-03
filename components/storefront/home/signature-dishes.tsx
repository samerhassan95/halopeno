"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "../section-heading";
import { ProductCard } from "../product-card";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import { Reveal } from "../reveal";
import { cmsNumber, cmsText, type SectionCmsData } from "@/lib/storefront/section-cms";

function sortProducts<T extends { id: string; name: string; price: number; bestSeller?: boolean }>(
  products: T[],
  sort: string
) {
  const next = [...products];
  if (sort === "best-selling") return next.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller));
  if (sort === "price-asc") return next.sort((a, b) => a.price - b.price);
  if (sort === "newest") return next.reverse();
  return next;
}

export function SignatureDishes({ data }: { data?: SectionCmsData } = {}) {
  const products = useCatalogStore((s) => s.products);
  const title = cmsText(data, "title", "Our Signature Flavors");
  const subtitle = cmsText(data, "subtitle", "");
  const viewAllText = cmsText(data, "viewAllText", "Shop all flavors");
  const viewAllLink = cmsText(data, "viewAllLink", "/shop");
  const limit = Math.max(2, cmsNumber(data, "limit", 5));
  const sort = cmsText(data, "sort", "featured");
  const sorted = sortProducts(products, sort).slice(0, limit);
  const [featured, ...rest] = sorted;

  if (!featured) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
        <Reveal>
          <SectionHeading title={title} description={subtitle || undefined} align="left" />
        </Reveal>
        <Reveal delay={0.1}>
          <Link href={viewAllLink} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            {viewAllText} <ArrowUpRight className="size-4" />
          </Link>
        </Reveal>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Reveal className="lg:row-span-2">
          <ProductCard product={featured} variant="featured" />
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2">
          {rest.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={0.1 * (i + 1)}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
