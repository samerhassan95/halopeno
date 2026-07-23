"use client";

import {
  ShoppingCart,
  DollarSign,
  Receipt,
  TrendingUp,
  Undo2,
  Percent,
  PackageX,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { cn, formatCompact } from "@/lib/utils";
import { totalOrderCount } from "@/lib/mock-data";
import { lowStockProducts } from "@/lib/mock-data";

interface Tile {
  icon: LucideIcon;
  tone: string;
  label: string;
  value: string;
  trend: number;
}

interface MiniStatRowProps {
  totalOrders?: number;
  netRevenue?: number;
  avgOrderValue?: number;
  refundRate?: number;
  lowStock?: number;
}

export function MiniStatRow({
  totalOrders,
  netRevenue,
  avgOrderValue,
  refundRate,
  lowStock,
}: MiniStatRowProps = {}) {
  const { t } = useI18n();

  const tiles: Tile[] = [
    { icon: ShoppingCart, tone: "text-primary bg-primary/10", label: t("dashboard.extra.totalOrders"), value: formatCompact(totalOrders ?? totalOrderCount), trend: 6.2 },
    { icon: DollarSign, tone: "text-success bg-success/10", label: t("dashboard.extra.netRevenue"), value: `$${formatCompact(netRevenue ?? 2148600)}`, trend: 9.8 },
    { icon: Receipt, tone: "text-accent bg-accent/10", label: t("dashboard.extra.aov"), value: `$${(avgOrderValue ?? 68.4).toFixed(2)}`, trend: 3.1 },
    { icon: TrendingUp, tone: "text-primary bg-primary/10", label: t("dashboard.extra.conversion"), value: "3.24%", trend: 1.4 },
    { icon: Undo2, tone: "text-destructive bg-destructive/10", label: t("dashboard.extra.refundRate"), value: `${refundRate ?? 1.8}%`, trend: -0.6 },
    { icon: Percent, tone: "text-warning bg-warning/10", label: "Commission", value: `$${formatCompact(184200)}`, trend: 4.7 },
    { icon: PackageX, tone: "text-destructive bg-destructive/10", label: "Low Stock", value: String(lowStock ?? lowStockProducts.length * 3), trend: -12.5 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {tiles.map((tile) => (
        <Card key={tile.label} className="flex items-center gap-3 p-4">
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px]", tile.tone)}>
            <tile.icon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="line-clamp-1 text-[11px] leading-tight text-muted-foreground" title={tile.label}>
              {tile.label}
            </p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-[15px] font-bold leading-tight">{tile.value}</p>
              <span className={cn("text-[10px] font-semibold", tile.trend >= 0 ? "text-success" : "text-destructive")}>
                {tile.trend >= 0 ? "+" : ""}
                {tile.trend}%
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
