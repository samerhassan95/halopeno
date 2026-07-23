"use client";

import { PackageCheck } from "lucide-react";
import { StatCard } from "./stat-card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n/context";
import { formatNumber } from "@/lib/utils";
import {
  totalProducts,
  inHouseProductCount,
  sellerProductCount,
  activeProductCount,
  outOfStockCount,
} from "@/lib/mock-data";

interface ProductStatsCardProps {
  total?: number;
  active?: number;
  outOfStock?: number;
}

export function ProductStatsCard({
  total,
  active,
  outOfStock,
}: ProductStatsCardProps = {}) {
  const { t } = useI18n();
  const total_ = total ?? totalProducts;
  const active_ = active ?? activeProductCount;
  const outOfStock_ = outOfStock ?? outOfStockCount;
  const activePct = total_ ? Math.round((active_ / total_) * 100) : 0;

  return (
    <StatCard
      icon={PackageCheck}
      tone="success"
      title={t("dashboard.products.title")}
      value={formatNumber(total_)}
      trend={5.1}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("dashboard.products.inHouse")}</span>
          <span className="font-semibold">{formatNumber(inHouseProductCount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("dashboard.products.seller")}</span>
          <span className="font-semibold">{formatNumber(sellerProductCount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("dashboard.products.active")}</span>
          <span className="font-semibold text-success">{formatNumber(active_)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("dashboard.products.outOfStock")}</span>
          <span className="font-semibold text-destructive">{formatNumber(outOfStock_)}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{t("dashboard.products.active")}</span>
          <span>{activePct}%</span>
        </div>
        <Progress value={activePct} indicatorClassName="bg-success" />
      </div>
    </StatCard>
  );
}
