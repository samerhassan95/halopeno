"use client";

import * as React from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { salesByRange } from "@/lib/mock-data";
import { toast } from "sonner";

type RangeKey = "daily" | "weekly" | "monthly" | "yearly";

const seriesConfig = [
  { key: "revenue", color: "var(--color-chart-1)", labelKey: "revenue", type: "line", axis: "left" },
  { key: "orders", color: "var(--color-chart-5)", labelKey: "orders", type: "bar", axis: "right" },
  { key: "inHouseSales", color: "var(--color-chart-2)", labelKey: "inHouseSales", type: "line", axis: "left" },
  { key: "sellerSales", color: "var(--color-chart-3)", labelKey: "sellerSales", type: "line", axis: "left" },
  { key: "grossRevenue", color: "var(--color-chart-1)", labelKey: "grossRevenue", type: "line", axis: "left" },
  { key: "netRevenue", color: "var(--color-chart-4)", labelKey: "netRevenue", type: "line", axis: "left" },
  { key: "refunds", color: "var(--color-destructive)", labelKey: "refunds", type: "line", axis: "left" },
] as const;

const defaultHidden = new Set(["inHouseSales", "sellerSales", "grossRevenue", "refunds"]);

export function SalesChart() {
  const { t, locale } = useI18n();
  const [range, setRange] = React.useState<RangeKey>("daily");
  const [hidden, setHidden] = React.useState<Set<string>>(defaultHidden);

  const data = salesByRange[range].map((p) => ({
    ...p,
    label: new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      month: "short",
      day: range === "daily" || range === "weekly" ? "numeric" : undefined,
      year: range === "yearly" ? "numeric" : undefined,
    }).format(new Date(p.date)),
  }));

  const toggle = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 pb-4">
        <div>
          <CardTitle>{t("dashboard.chart.title")}</CardTitle>
          <CardDescription className="mt-1">{t("dashboard.chart.subtitle")}</CardDescription>
        </div>
        <CardAction className="flex flex-wrap items-center gap-2">
          <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <TabsList>
              <TabsTrigger value="daily">{t("dashboard.chart.daily")}</TabsTrigger>
              <TabsTrigger value="weekly">{t("dashboard.chart.weekly")}</TabsTrigger>
              <TabsTrigger value="monthly">{t("dashboard.chart.monthly")}</TabsTrigger>
              <TabsTrigger value="yearly">{t("dashboard.chart.yearly")}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("dashboard.chart.export")}
            onClick={() => toast.success("Chart exported as PNG")}
          >
            <Download className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={{ stroke: "var(--color-border)" }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickFormatter={(v) => formatCompact(v)}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                  boxShadow: "0 12px 32px hsl(220 40% 60% / 0.12)",
                }}
                labelStyle={{ color: "var(--color-foreground)", fontWeight: 600, marginBottom: 4 }}
                formatter={(value, name) => {
                  if (name === t("dashboard.chart.orders")) return [value, name];
                  return [formatCurrency(Number(value)), name];
                }}
              />
              <Legend
                onClick={(e) => toggle(e.dataKey as string)}
                wrapperStyle={{ fontSize: 12, cursor: "pointer", paddingTop: 12 }}
                formatter={(value) => <span className="text-foreground">{value}</span>}
              />
              {seriesConfig.map((s) =>
                s.type === "bar" ? (
                  <Bar
                    key={s.key}
                    yAxisId={s.axis}
                    dataKey={s.key}
                    name={t(`dashboard.chart.${s.labelKey}`)}
                    fill={s.color}
                    radius={[4, 4, 0, 0]}
                    barSize={16}
                    hide={hidden.has(s.key)}
                  />
                ) : (
                  <Line
                    key={s.key}
                    yAxisId={s.axis}
                    type="monotone"
                    dataKey={s.key}
                    name={t(`dashboard.chart.${s.labelKey}`)}
                    stroke={s.color}
                    strokeWidth={2.25}
                    dot={false}
                    activeDot={{ r: 4 }}
                    hide={hidden.has(s.key)}
                  />
                )
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
