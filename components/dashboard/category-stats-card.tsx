"use client";

import { FolderTree } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { formatCompact, formatNumber } from "@/lib/utils";
import { categories as mockCategories } from "@/lib/mock-data";

const DOT_COLORS = ["#6C5CE7", "#00B894", "#F59E0B", "#3B82F6", "#EF4444", "#EC4899", "#22C55E", "#0EA5E9"];

interface CategoryStatsCardProps {
  topCategories?: { id: string; name: string; revenue: number; productCount: number }[];
}

export function CategoryStatsCard({ topCategories }: CategoryStatsCardProps = {}) {
  const { t } = useI18n();
  const source = topCategories ?? mockCategories.map((c) => ({ id: c.id, name: c.name, revenue: c.revenue, productCount: c.productCount }));
  const top = [...source].sort((a, b) => b.revenue - a.revenue).slice(0, 3);
  const productsTracked = source.reduce((sum, c) => sum + c.productCount, 0);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[11px] bg-primary/10 text-primary">
            <FolderTree className="size-[19px]" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("dashboard.categories.title")}</p>
            <p className="font-display text-xl font-bold">{formatNumber(productsTracked)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {t("dashboard.categories.topThree")}
        </p>
        {top.map((cat, i) => (
          <div key={cat.id} className="flex items-center gap-2.5">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-sm"
              style={{ backgroundColor: `${DOT_COLORS[i % DOT_COLORS.length]}1A` }}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }}
              />
            </span>
            <span className="flex-1 truncate text-sm font-medium">{cat.name}</span>
            <span className="text-xs font-semibold text-muted-foreground">{formatCompact(cat.revenue)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
