"use client";

import * as React from "react";
import { WifiOff, Store, DollarSign, HandCoins, Undo2, XCircle, Star } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { ReportHeader } from "@/components/reports/report-header";
import { CardSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useReport, type ReportRange } from "@/lib/hooks/use-report";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface SellerRow {
  id: string; name: string; status: string; sales: number; orders: number;
  commission: number; refundRate: number; cancellationRate: number; rating: number;
}
interface SellersReport {
  kpis: {
    totalSellerSales: number; sellerOrders: number; commissionEarned: number;
    refundRate: number; cancellationRate: number; avgRating: number; activeSellers: number;
  };
  bySeller: SellerRow[];
}

export default function SellersReportPage() {
  const [range, setRange] = React.useState<ReportRange>("30d");
  const { data, loading, error, refetch } = useReport<SellersReport>("/reports/sellers", range);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <ReportHeader title="Seller Performance" subtitle="Marketplace seller sales, commission, refunds and ratings" range={range} onRangeChange={setRange} onRefresh={refetch} />

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
            <StatCard icon={Store} tone="primary" title="Active sellers" value={formatNumber(data.kpis.activeSellers)} />
            <StatCard icon={DollarSign} tone="success" title="Seller sales" value={formatCurrency(data.kpis.totalSellerSales)} />
            <StatCard icon={HandCoins} tone="accent" title="Commission earned" value={formatCurrency(data.kpis.commissionEarned)} />
            <StatCard icon={Undo2} tone="warning" title="Avg. refund rate" value={`${data.kpis.refundRate}%`} />
            <StatCard icon={XCircle} tone="destructive" title="Avg. cancellation rate" value={`${data.kpis.cancellationRate}%`} />
            <StatCard icon={Star} tone="primary" title="Avg. rating" value={data.kpis.avgRating.toFixed(1)} />
          </div>

          <Card>
            <CardHeader><CardTitle>Seller performance</CardTitle></CardHeader>
            <CardContent className="p-0">
              {data.bySeller.length === 0 ? <EmptyState title="No seller orders in this period" className="py-16" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead><TableHead>Status</TableHead><TableHead>Orders</TableHead>
                      <TableHead>Sales</TableHead><TableHead>Commission</TableHead><TableHead>Refund rate</TableHead>
                      <TableHead>Cancellation rate</TableHead><TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.bySeller.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell><Badge variant={s.status === "APPROVED" ? "success" : "secondary"}>{s.status.toLowerCase()}</Badge></TableCell>
                        <TableCell>{formatNumber(s.orders)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(s.sales)}</TableCell>
                        <TableCell>{formatCurrency(s.commission)}</TableCell>
                        <TableCell className={s.refundRate > 5 ? "text-destructive" : ""}>{s.refundRate}%</TableCell>
                        <TableCell className={s.cancellationRate > 5 ? "text-destructive" : ""}>{s.cancellationRate}%</TableCell>
                        <TableCell>{s.rating.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
