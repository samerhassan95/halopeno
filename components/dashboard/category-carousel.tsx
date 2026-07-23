"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { cn, formatCompact, formatNumber } from "@/lib/utils";
import { categories as mockCategories } from "@/lib/mock-data";

const DOT_COLORS = ["#6C5CE7", "#00B894", "#F59E0B", "#3B82F6", "#EF4444", "#EC4899", "#22C55E", "#0EA5E9"];

export function CategoryCarousel({
  activeId,
  onSelect,
  categories: categoriesProp,
  totalProducts,
}: {
  activeId: string | null;
  onSelect: (id: string | null) => void;
  categories?: { id: string; name: string; revenue: number; productCount: number }[];
  totalProducts?: number;
}) {
  const { t } = useI18n();
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const categories =
    categoriesProp ??
    mockCategories.map((c) => ({ id: c.id, name: c.name, revenue: c.revenue, productCount: c.productCount }));
  const allCount = totalProducts ?? categories.reduce((a, c) => a + c.productCount, 0);

  const scrollBy = (amount: number) => {
    scrollerRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div className="relative flex items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        className="hidden shrink-0 sm:flex"
        onClick={() => scrollBy(-240)}
        aria-label="Scroll left"
      >
        <ChevronLeft className="size-4 rtl-flip" />
      </Button>

      <div ref={scrollerRef} className="scrollbar-thin flex flex-1 gap-3 overflow-x-auto scroll-smooth pb-1">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "flex min-w-[132px] shrink-0 flex-col items-center gap-2 rounded-[12px] border p-3 text-center transition-colors",
            activeId === null ? "border-primary bg-primary/[0.06]" : "border-border hover:bg-secondary/50"
          )}
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-lg">✨</span>
          <span className="text-xs font-semibold">{t("common.all")}</span>
          <span className="text-[10px] text-muted-foreground">
            {formatNumber(allCount)} {t("dashboard.topCategories.products")}
          </span>
        </button>

        {categories.map((cat, i) => {
          const active = activeId === cat.id;
          const color = DOT_COLORS[i % DOT_COLORS.length];
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                "flex min-w-[132px] shrink-0 flex-col items-center gap-2 rounded-[12px] border p-3 text-center transition-colors",
                active ? "border-primary bg-primary/[0.06]" : "border-border hover:bg-secondary/50"
              )}
            >
              <span
                className="flex size-11 items-center justify-center rounded-full text-sm font-bold"
                style={{ backgroundColor: `${color}1A`, color }}
              >
                {cat.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="truncate text-xs font-semibold">{cat.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {formatNumber(cat.productCount)} {t("dashboard.topCategories.products")}
              </span>
              <span className="text-[10px] font-semibold text-primary">
                {formatCompact(cat.revenue)} {t("dashboard.topCategories.sales")}
              </span>
            </button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="icon-sm"
        className="hidden shrink-0 sm:flex"
        onClick={() => scrollBy(240)}
        aria-label="Scroll right"
      >
        <ChevronRight className="size-4 rtl-flip" />
      </Button>
    </div>
  );
}
