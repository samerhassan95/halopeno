"use client";

import { SectionHeading } from "../section-heading";
import { ProductCard } from "../product-card";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import { Reveal } from "../reveal";

export function BestSellers() {
  const products = useCatalogStore((s) => s.products);
  const bestSellers = products.filter((p) => p.bestSeller);
  const display = bestSellers.length ? bestSellers : products.slice(0, 4);

  return (
    <section className="bg-secondary/40 py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <Reveal>
          <SectionHeading title="Most Loved by Our Customers" />
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
