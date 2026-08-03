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

const DESKTOP_COLS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

const MOBILE_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
};

export function SignatureDishes({ data }: { data?: SectionCmsData } = {}) {
  const products = useCatalogStore((s) => s.products);
  const title = cmsText(data, "title", "Our Signature Flavors");
  const subtitle = cmsText(data, "subtitle", "");
  const viewAllText = cmsText(data, "viewAllText", "Shop all flavors");
  const viewAllLink = cmsText(data, "viewAllLink", "/shop");
  const desktopColumns = Math.min(6, Math.max(2, cmsNumber(data, "desktopColumns", 4)));
  const mobileColumns = Math.min(2, Math.max(1, cmsNumber(data, "mobileColumns", 2)));
  const flags = sectionCardFlags(data);
  const sorted = selectSectionProducts(products, data);
  const useFeaturedLayout = desktopColumns <= 2 && sorted.length >= 2;
  const [featured, ...rest] = sorted;

  if (!featured) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
        <Reveal>
          <SectionHeading title={title} description={subtitle || undefined} align="left" />
        </Reveal>
        {viewAllText ? (
          <Reveal delay={0.1}>
            <Link href={viewAllLink} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {viewAllText} <ArrowUpRight className="size-4" />
            </Link>
          </Reveal>
        ) : null}
      </div>

      {useFeaturedLayout ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Reveal className="lg:row-span-2">
            <ProductCard product={featured} variant="featured" {...flags} />
          </Reveal>
          <div className={cn("grid gap-6", MOBILE_COLS[mobileColumns])}>
            {rest.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={0.1 * (i + 1)}>
                <ProductCard product={p} {...flags} />
              </Reveal>
            ))}
          </div>
        </div>
      ) : (
        <div className={cn("mt-10 grid gap-6", MOBILE_COLS[mobileColumns], DESKTOP_COLS[desktopColumns])}>
          {sorted.map((p, i) => (
            <Reveal key={p.id} delay={0.05 * i}>
              <ProductCard product={p} {...flags} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
