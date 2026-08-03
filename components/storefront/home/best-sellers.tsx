"use client";

import { SectionHeading } from "../section-heading";
import { ProductCard } from "../product-card";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import { Reveal } from "../reveal";
import { cmsNumber, cmsText, type SectionCmsData } from "@/lib/storefront/section-cms";

export function BestSellers({ data }: { data?: SectionCmsData } = {}) {
  const products = useCatalogStore((s) => s.products);
  const title = cmsText(data, "title", "Most Loved by Our Customers");
  const limit = Math.max(2, cmsNumber(data, "limit", 4));
  const bestSellers = products.filter((p) => p.bestSeller);
  const display = (bestSellers.length ? bestSellers : products).slice(0, limit);

  return (
    <section className="bg-secondary/40 py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <Reveal>
          <SectionHeading title={title} />
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {display.map((p) => (
              <ProductCard key={p.id} product={p} variant="compact" />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
