"use client";

import * as React from "react";
import { WifiOff, DollarSign, Wallet, TrendingUp, Gauge, ShoppingCart, UserPlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { ReportHeader } from "@/components/reports/report-header";
import { CardSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useReport, type ReportRange } from "@/lib/hooks/use-report";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface MarketingAnalytics {
  kpis: { campaignRevenue: number; marketingCost: number; roi: number; roas: number; conversions: number; customerAcquisitionCost: number };
  revenueByChannel: { channel: string; revenue: number }[];
  campaignPerformance: { id: string; name: string; revenue: number; spend: number; budget: number; status: string }[];
  attributionSources: { type: string; revenue: number }[];
  funnel: { checkoutStarted: number; orders: number; paidOrders: number };
}

function titleCase(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function MarketingAnalyticsPage() {
  const [range, setRange] = React.useState<ReportRange>("30d");
  const { data, loading, error, refetch } = useReport<MarketingAnalytics>("/reports/marketing", range);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <ReportHeader title="Marketing Analytics" subtitle="Campaign ROI, ROAS, revenue by channel and conversion funnel" range={range} onRangeChange={setRange} onRefresh={refetch} />

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
            <StatCard icon={DollarSign} tone="success" title="Campaign revenue" value={formatCurrency(data.kpis.campaignRevenue)} />
            <StatCard icon={Wallet} tone="warning" title="Marketing cost" value={formatCurrency(data.kpis.marketingCost)} />
            <StatCard icon={TrendingUp} tone="primary" title="ROI" value={`${data.kpis.roi}%`} />
            <StatCard icon={Gauge} tone="accent" title="ROAS" value={`${data.kpis.roas}x`} />
            <StatCard icon={ShoppingCart} tone="success" title="Conversions (paid orders)" value={formatNumber(data.kpis.conversions)} />
            <StatCard icon={UserPlus} tone="destructive" title="Customer acquisition cost" value={formatCurrency(data.kpis.customerAcquisitionCost)} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Revenue by channel</CardTitle><CardDescription>Campaign revenue split across channels used</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {data.revenueByChannel.length === 0 ? <EmptyState title="No campaign revenue in this period" /> : data.revenueByChannel.map((c) => {
                  const max = Math.max(...data.revenueByChannel.map((x) => x.revenue), 1);
                  return (
                    <div key={c.channel}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="capitalize text-muted-foreground">{c.channel}</span>
                        <span className="font-medium">{formatCurrency(c.revenue)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(c.revenue / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Attribution by campaign type</CardTitle><CardDescription>Revenue grouped by campaign objective</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {data.attributionSources.length === 0 ? <EmptyState title="No campaign revenue in this period" /> : data.attributionSources.map((a) => (
                  <div key={a.type} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{titleCase(a.type)}</span>
                    <span className="font-medium">{formatCurrency(a.revenue)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Campaign performance</CardTitle></CardHeader>
            <CardContent className="p-0">
              {data.campaignPerformance.length === 0 ? <EmptyState title="No campaigns yet" className="py-16" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Status</TableHead><TableHead>Budget</TableHead><TableHead>Spend</TableHead><TableHead>Revenue</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.campaignPerformance.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="capitalize text-muted-foreground">{c.status}</TableCell>
                        <TableCell>{formatCurrency(c.budget)}</TableCell>
                        <TableCell>{formatCurrency(c.spend)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(c.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversion funnel</CardTitle>
              <CardDescription>
                Traffic and product-view instrumentation isn&apos;t wired up yet, so the funnel starts from checkout — the earliest stage this dataset can measure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Checkout started", value: data.funnel.checkoutStarted },
                { label: "Orders placed", value: data.funnel.orders },
                { label: "Orders paid", value: data.funnel.paidOrders },
              ].map((s, i, arr) => {
                const max = arr[0].value || 1;
                return (
                  <div key={s.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-medium">{formatNumber(s.value)}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (s.value / max) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
