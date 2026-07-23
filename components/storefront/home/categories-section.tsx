"use client";

import { SectionHeading } from "../section-heading";
import { CategoryCard } from "../category-card";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import { Reveal } from "../reveal";

export function CategoriesSection() {
  const categories = useCatalogStore((s) => s.categories);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
      <Reveal>
        <SectionHeading eyebrow="What are you craving?" title="Explore Our Menu" />
      </Reveal>
      <Reveal delay={0.1}>
        <div className="scrollbar-thin mt-10 flex gap-6 overflow-x-auto px-1 pb-2 sm:justify-center sm:gap-8">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
