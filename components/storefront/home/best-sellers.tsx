"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "../section-heading";
import { ProductCard } from "../product-card";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import { Reveal } from "../reveal";
import { cmsNumber, cmsText, type SectionCmsData } from "@/lib/storefront/section-cms";
import { sectionCardFlags, selectSectionProducts } from "@/lib/storefront/select-products";
import { cn } from "@/lib/utils";

const COL_CLASS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

export function BestSellers({ data }: { data?: SectionCmsData } = {}) {
  const products = useCatalogStore((s) => s.products);
  const title = cmsText(data, "title", "Most Loved by Our Customers");
  const subtitle = cmsText(data, "subtitle", "");
  const viewAllText = cmsText(data, "viewAllText", "");
  const viewAllLink = cmsText(data, "viewAllLink", "/shop");
  const desktopColumns = Math.min(6, Math.max(2, cmsNumber(data, "desktopColumns", 4)));
  const flags = sectionCardFlags(data);
  const display = selectSectionProducts(products, {
    ...data,
    sort: data?.sort ?? "best-selling",
  });

  return (
    <section className="bg-secondary/40 py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
          <Reveal>
            <SectionHeading title={title} description={subtitle || undefined} />
          </Reveal>
          {viewAllText ? (
            <Reveal delay={0.1}>
              <Link href={viewAllLink} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                {viewAllText} <ArrowUpRight className="size-4" />
              </Link>
            </Reveal>
          ) : null}
        </div>
        <Reveal delay={0.1}>
          <div className={cn("mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2", COL_CLASS[desktopColumns])}>
            {display.map((p) => (
              <ProductCard key={p.id} product={p} variant="compact" {...flags} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
