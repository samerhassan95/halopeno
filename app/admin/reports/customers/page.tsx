"use client";

import * as React from "react";
import { WifiOff, Users, UserPlus, Repeat, Wallet, TrendingDown, RefreshCcw } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ReportHeader } from "@/components/reports/report-header";
import { CardSkeleton } from "@/components/common/loading-skeleton";
import { useReport, type ReportRange } from "@/lib/hooks/use-report";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface CustomersReport {
  kpis: {
    totalCustomers: number; newCustomers: number; returningCustomers: number;
    lifetimeValue: number; repeatPurchaseRate: number; churnRate: number;
  };
  comparison: { newCustomersChangePct: number };
  acquisitionTrend: { date: string; count: number }[];
  segments: { label: string; customers: number }[];
  locations: { country: string; customers: number; revenue: number }[];
}

export default function CustomersReportPage() {
  const [range, setRange] = React.useState<ReportRange>("30d");
  const { data, loading, error, refetch } = useReport<CustomersReport>("/reports/customers", range);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <ReportHeader title="Customer Overview" subtitle="Acquisition, retention, lifetime value and segments" range={range} onRangeChange={setRange} onRefresh={refetch} />

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-[#92640a] dark:text-warning">
          <WifiOff className="size-4 shrink-0" />Live API unreachable ({error}) — showing no data.
        </div>
      )}

      {loading || !data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard icon={Users} tone="primary" title="Total customers" value={formatNumber(data.kpis.totalCustomers)} />
            <StatCard icon={UserPlus} tone="success" title="New customers" value={formatNumber(data.kpis.newCustomers)} trend={data.comparison.newCustomersChangePct} trendLabel="vs previous period" />
            <StatCard icon={Repeat} tone="accent" title="Returning customers" value={formatNumber(data.kpis.returningCustomers)} />
            <StatCard icon={Wallet} tone="warning" title="Lifetime value" value={formatCurrency(data.kpis.lifetimeValue)} />
            <StatCard icon={RefreshCcw} tone="primary" title="Repeat purchase rate" value={`${data.kpis.repeatPurchaseRate}%`} />
            <StatCard icon={TrendingDown} tone="destructive" title="Churn rate" value={`${data.kpis.churnRate}%`} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>New customer acquisition</CardTitle>
                <CardDescription>New sign-ups per day over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.acquisitionTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="acqFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={32} />
                      <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                      <Area type="monotone" dataKey="count" name="new customers" stroke="var(--color-chart-1)" strokeWidth={2.25} fill="url(#acqFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Customer segments</CardTitle><CardDescription>By lifetime order count</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {data.segments.map((s) => {
                  const max = Math.max(...data.segments.map((x) => x.customers), 1);
                  return (
                    <div key={s.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{s.label}</span>
                        <span className="font-medium">{formatNumber(s.customers)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(s.customers / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Customer locations</CardTitle><CardDescription>Top countries by customer count</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.locations.map((l) => (
                <div key={l.country} className="flex items-center justify-between rounded-[10px] border border-border p-3">
                  <span className="text-sm font-medium">{l.country}</span>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatNumber(l.customers)} {l.customers === 1 ? "customer" : "customers"}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(l.revenue)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
