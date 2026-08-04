"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Utensils } from "lucide-react";
import { MenuFilters, defaultFilters, type MenuFilterState } from "./menu-filters";
import { MenuToolbar, type SortOption } from "./menu-toolbar";
import { ProductListRow } from "./product-list-row";
import { ProductCard } from "../product-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "../ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import type { Product } from "@/types/storefront";

const PAGE_SIZE = 8;

function sortProducts(list: Product[], sort: SortOption): Product[] {
  const copy = [...list];
  switch (sort) {
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "newest":
      return copy.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    default:
      return copy.sort((a, b) => (b.ordersCount ?? 0) - (a.ordersCount ?? 0));
  }
}

export function MenuPageClient() {
  const searchParams = useSearchParams();
  const products = useCatalogStore((s) => s.products);

  const [filters, setFilters] = React.useState<MenuFilterState>(() => ({
    ...defaultFilters,
    categories: searchParams.get("category") ? [searchParams.get("category")!] : [],
  }));
  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const [sort, setSort] = React.useState<SortOption>("popularity");
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [page, setPage] = React.useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      if (filters.categories.length && !filters.categories.includes(p.categorySlug)) return false;
      if (filters.brands.length && (!p.brandSlug || !filters.brands.includes(p.brandSlug))) return false;
      if (p.price > filters.maxPrice) return false;
      if (filters.diets.length && !filters.diets.includes(p.diet)) return false;
      if (filters.spiceLevels.length && !filters.spiceLevels.includes(p.spiceLevel)) return false;
      if (filters.minRating && p.rating < filters.minRating) return false;
      if (filters.offersOnly && !p.oldPrice) return false;
      return true;
    });
  }, [search, filters, products]);

  const sorted = React.useMemo(() => sortProducts(filtered, sort), [filtered, sort]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  React.useEffect(() => setPage(1), [search, filters, sort]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-brown sm:text-4xl">Shop All Flavors</h1>
        <p className="mt-1 text-sm text-muted-foreground">Explore all six flavours and the complete tasting set.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-[28px] bg-card p-6 shadow-soft">
            <MenuFilters filters={filters} onChange={setFilters} />
          </div>
        </aside>

        <div>
          <MenuToolbar
            search={search}
            onSearchChange={setSearch}
            sort={sort}
            onSortChange={setSort}
            view={view}
            onViewChange={setView}
            resultCount={sorted.length}
            onOpenMobileFilters={() => setMobileFiltersOpen(true)}
          />

          <div className="mt-6">
            {paged.length === 0 ? (
              <EmptyState
                icon={Utensils}
                title="No products match your filters"
                description="Try widening your price range or clearing a few filters."
                className="rounded-[28px] bg-card py-16"
                action={
                  <Button variant="outline" onClick={() => setFilters(defaultFilters)}>
                    Clear filters
                  </Button>
                }
              />
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {paged.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {paged.map((p) => (
                  <ProductListRow key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    page === i + 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-[320px] max-w-[85vw] overflow-y-auto bg-background p-6 pt-14">
          <MenuFilters filters={filters} onChange={setFilters} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
