"use client";

import * as React from "react";
import { Wallet } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import { StatCard } from "./stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";
import { formatCurrency, formatCompact } from "@/lib/utils";
import {
  totalAllTimeSales,
  salesThisMonth,
  salesThisYear,
  inHouseSalesTotal,
  sellerSalesTotal,
  salesDaily,
} from "@/lib/mock-data";

const currencies = ["USD", "EUR", "GBP", "AED"];

export function SalesCard() {
  const { t } = useI18n();
  const [currency, setCurrency] = React.useState("USD");
  const chartData = salesDaily.slice(-8).map((p) => ({ v: p.revenue }));

  return (
    <StatCard
      icon={Wallet}
      tone="primary"
      title={t("dashboard.sales.title")}
      value={formatCurrency(totalAllTimeSales, currency)}
      trend={12.6}
      footer={
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="h-7 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-[10px] bg-primary/[0.07] px-3 py-2">
          <p className="text-[11px] text-muted-foreground">{t("dashboard.sales.thisMonth")}</p>
          <p className="text-sm font-bold text-primary">{formatCompact(salesThisMonth)}</p>
        </div>
        <div className="h-12 w-20 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2}>
              <Bar dataKey="v" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <p className="text-muted-foreground">{t("dashboard.sales.yearly")}</p>
          <p className="font-semibold">{formatCompact(salesThisYear)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t("dashboard.sales.inHouse")}</p>
          <p className="font-semibold">{formatCompact(inHouseSalesTotal)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t("dashboard.sales.seller")}</p>
          <p className="font-semibold">{formatCompact(sellerSalesTotal)}</p>
        </div>
      </div>
    </StatCard>
  );
}
