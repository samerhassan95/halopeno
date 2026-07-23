"use client";

import * as React from "react";
import { WifiOff, Package, ShoppingBag, DollarSign, Star, Undo2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { ReportHeader } from "@/components/reports/report-header";
import { CardSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useReport, type ReportRange } from "@/lib/hooks/use-report";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface ProductRow {
  id: string; name: string; sku: string; category: string; seller: string;
  unitsSold: number; revenue: number; cost: number; profit: number; marginPct: number;
  rating: number; stock: number; returnedQty: number; returnRate: number;
}
interface ProductsReport {
  kpis: { totalProducts: number; unitsSold: number; revenue: number; avgRating: number; returnRate: number };
  bestSelling: ProductRow[];
  profitability: ProductRow[];
  returns: ProductRow[];
  lowPerforming: { id: string; name: string; sku: string; category: string; seller: string; stock: number; rating: number }[];
}

export default function ProductsReportPage() {
  const [range, setRange] = React.useState<ReportRange>("30d");
  const { data, loading, error, refetch } = useReport<ProductsReport>("/reports/products", range);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <ReportHeader title="Product Performance" subtitle="Units sold, revenue, profitability and returns by product" range={range} onRangeChange={setRange} onRefresh={refetch} />

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-[#92640a] dark:text-warning">
          <WifiOff className="size-4 shrink-0" />Live API unreachable ({error}) — showing no data.
        </div>
      )}

      {loading || !data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard icon={Package} tone="primary" title="Total products" value={formatNumber(data.kpis.totalProducts)} />
            <StatCard icon={ShoppingBag} tone="accent" title="Units sold" value={formatNumber(data.kpis.unitsSold)} />
            <StatCard icon={DollarSign} tone="success" title="Revenue" value={formatCurrency(data.kpis.revenue)} />
            <StatCard icon={Star} tone="warning" title="Avg. rating" value={data.kpis.avgRating.toFixed(1)} />
            <StatCard icon={Undo2} tone="destructive" title="Return rate" value={`${data.kpis.returnRate}%`} />
          </div>

          <Card>
            <CardHeader><CardTitle>Product breakdown</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="best" className="w-full">
                <TabsList className="mx-5 mt-2">
                  <TabsTrigger value="best">Best selling</TabsTrigger>
                  <TabsTrigger value="low">Low performing</TabsTrigger>
                  <TabsTrigger value="profit">Profitability</TabsTrigger>
                  <TabsTrigger value="returns">Returns</TabsTrigger>
                </TabsList>
                <TabsContent value="best">
                  {data.bestSelling.length === 0 ? <EmptyState title="No sales in this period" /> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead>Seller</TableHead><TableHead>Units sold</TableHead><TableHead>Revenue</TableHead><TableHead>Rating</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {data.bestSelling.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="max-w-[200px] truncate font-medium">{p.name}</TableCell>
                            <TableCell className="text-muted-foreground">{p.category}</TableCell>
                            <TableCell className="text-muted-foreground">{p.seller}</TableCell>
                            <TableCell>{formatNumber(p.unitsSold)}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(p.revenue)}</TableCell>
                            <TableCell>{p.rating.toFixed(1)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
                <TabsContent value="low">
                  {data.lowPerforming.length === 0 ? <EmptyState title="Every published product sold at least once" /> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead>Seller</TableHead><TableHead>Stock</TableHead><TableHead>Rating</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {data.lowPerforming.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="max-w-[200px] truncate font-medium">{p.name}</TableCell>
                            <TableCell className="text-muted-foreground">{p.category}</TableCell>
                            <TableCell className="text-muted-foreground">{p.seller}</TableCell>
                            <TableCell>{formatNumber(p.stock)}</TableCell>
                            <TableCell>{p.rating.toFixed(1)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
                <TabsContent value="profit">
                  {data.profitability.length === 0 ? <EmptyState title="No sales in this period" /> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Revenue</TableHead><TableHead>Cost</TableHead><TableHead>Profit</TableHead><TableHead>Margin</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {data.profitability.slice(0, 20).map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="max-w-[200px] truncate font-medium">{p.name}</TableCell>
                            <TableCell>{formatCurrency(p.revenue)}</TableCell>
                            <TableCell>{formatCurrency(p.cost)}</TableCell>
                            <TableCell className={p.profit >= 0 ? "text-success" : "text-destructive"}>{formatCurrency(p.profit)}</TableCell>
                            <TableCell>{p.marginPct}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
                <TabsContent value="returns">
                  {data.returns.length === 0 ? <EmptyState title="No returns in this period" /> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Units sold</TableHead><TableHead>Returned qty</TableHead><TableHead>Return rate</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {data.returns.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="max-w-[200px] truncate font-medium">{p.name}</TableCell>
                            <TableCell>{formatNumber(p.unitsSold)}</TableCell>
                            <TableCell>{formatNumber(p.returnedQty)}</TableCell>
                            <TableCell className="text-destructive">{p.returnRate}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
