"use client";

import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  Loader2,
  Truck,
  PackageCheck,
  XCircle,
  Undo2,
  ReceiptText,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n/context";
import { cn, formatNumber } from "@/lib/utils";
import { orderStatusCounts, totalOrderCount } from "@/lib/mock-data";
import type { OrderStatus } from "@/types";

const statusMeta: Record<OrderStatus, { icon: typeof Clock; tone: string; bar: string }> = {
  pending: { icon: Clock, tone: "text-warning bg-warning/10", bar: "bg-warning" },
  confirmed: { icon: CheckCircle2, tone: "text-primary bg-primary/10", bar: "bg-primary" },
  processing: { icon: Loader2, tone: "text-accent bg-accent/10", bar: "bg-accent" },
  shipped: { icon: Truck, tone: "text-primary bg-primary/10", bar: "bg-primary" },
  delivered: { icon: PackageCheck, tone: "text-success bg-success/10", bar: "bg-success" },
  cancelled: { icon: XCircle, tone: "text-destructive bg-destructive/10", bar: "bg-destructive" },
  returned: { icon: Undo2, tone: "text-warning bg-warning/10", bar: "bg-warning" },
  refunded: { icon: ReceiptText, tone: "text-destructive bg-destructive/10", bar: "bg-destructive" },
};

const statuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
];

interface OrdersOverviewProps {
  statusCounts?: Record<OrderStatus, number>;
  total?: number;
  fulfillmentRate?: number;
  inHouseOrders?: number;
  sellerOrders?: number;
}

export function OrdersOverview({
  statusCounts,
  total,
  fulfillmentRate: fulfillmentRateProp,
  inHouseOrders: inHouseOrdersProp,
  sellerOrders: sellerOrdersProp,
}: OrdersOverviewProps = {}) {
  const { t } = useI18n();
  const counts = statusCounts ?? orderStatusCounts;
  const totalOrders = total ?? totalOrderCount;
  const inHouseOrders = inHouseOrdersProp ?? Math.round(totalOrders * 0.46);
  const sellerOrders = sellerOrdersProp ?? totalOrders - inHouseOrders;
  const fulfillmentRate =
    fulfillmentRateProp ?? Math.round(((counts.delivered + counts.shipped) / totalOrders) * 100);

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 pb-4">
        <div>
          <CardTitle>{t("dashboard.orders.title")}</CardTitle>
          <CardDescription className="mt-1">{t("dashboard.orders.subtitle")}</CardDescription>
        </div>
        <Badge variant="success" className="gap-1 py-1">
          <ArrowUpRight className="size-3" />
          {fulfillmentRate}% {t("dashboard.orders.fulfillmentRate")}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-[12px] bg-secondary/50 p-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("dashboard.orders.title")}</p>
            <p className="font-display text-2xl font-bold">{formatNumber(totalOrders)}</p>
            <p className="mt-1 text-xs text-success">+7.2% {t("dashboard.orders.vsPrevious")}</p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-muted-foreground">{t("dashboard.orders.inHouse")}</p>
              <p className="text-base font-semibold">{formatNumber(inHouseOrders)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("dashboard.orders.seller")}</p>
              <p className="text-base font-semibold">{formatNumber(sellerOrders)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {statuses.map((status) => {
            const meta = statusMeta[status];
            const count = counts[status];
            const pct = totalOrders ? Math.round((count / totalOrders) * 100) : 0;
            return (
              <Link
                key={status}
                href={`/admin/orders/all?status=${status}`}
                className="group flex items-center gap-3 rounded-[10px] border border-transparent p-2.5 transition-colors hover:border-border hover:bg-secondary/50"
              >
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px]", meta.tone)}>
                  <meta.icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{t(`dashboard.orders.${status}`)}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatNumber(count)} · {pct}%
                    </span>
                  </div>
                  <Progress value={pct} className="mt-1.5 h-1" indicatorClassName={meta.bar} />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
