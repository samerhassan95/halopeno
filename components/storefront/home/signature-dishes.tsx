"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "../section-heading";
import { ProductCard } from "../product-card";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import { Reveal } from "../reveal";
import { cmsText, type SectionCmsData } from "@/lib/storefront/section-cms";
import { sectionCardFlags, selectSectionProducts } from "@/lib/storefront/select-products";

export function SignatureDishes({ data }: { data?: SectionCmsData } = {}) {
  const products = useCatalogStore((s) => s.products);
  const title = cmsText(data, "title", "Our Signature Flavors");
  const subtitle = cmsText(data, "subtitle", "");
  const viewAllText = cmsText(data, "viewAllText", "Shop all flavors");
  const viewAllLink = cmsText(data, "viewAllLink", "/shop");
  const flags = sectionCardFlags(data);
  const sorted = selectSectionProducts(products, data);
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
          <ProductCard product={featured} variant="featured" {...flags} />
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2">
          {rest.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={0.1 * (i + 1)}>
              <ProductCard product={p} {...flags} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
