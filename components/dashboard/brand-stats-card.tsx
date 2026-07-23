"use client";

import { Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { formatCompact, formatNumber } from "@/lib/utils";
import { brands as mockBrands } from "@/lib/mock-data";

interface BrandStatsCardProps {
  topBrands?: { id: string; name: string; revenue: number }[];
}

export function BrandStatsCard({ topBrands }: BrandStatsCardProps = {}) {
  const { t } = useI18n();
  const source = topBrands ?? mockBrands.map((b) => ({ id: b.id, name: b.name, revenue: b.revenue }));
  const top = [...source].sort((a, b) => b.revenue - a.revenue).slice(0, 3);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-[11px] bg-accent/10 text-accent">
          <Tag className="size-[19px]" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("dashboard.brands.title")}</p>
          <p className="font-display text-xl font-bold">{formatNumber(source.length)}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {t("dashboard.brands.topThree")}
        </p>
        {top.map((brand) => (
          <div key={brand.id} className="flex items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
              {brand.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="flex-1 truncate text-sm font-medium">{brand.name}</span>
            <span className="text-xs font-semibold text-muted-foreground">{formatCompact(brand.revenue)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
