"use client";

import * as React from "react";
import { WifiOff, DollarSign, Receipt, ShoppingCart, Percent, Tag, Undo2, Landmark, Truck } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { ReportHeader } from "@/components/reports/report-header";
import { CardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useReport, type ReportRange } from "@/lib/hooks/use-report";
import { formatCurrency, formatCompact, formatNumber } from "@/lib/utils";

function titleCase(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface SalesReport {
  kpis: {
    grossSales: number;
    netSales: number;
    orders: number;
    avgOrderValue: number;
    discounts: number;
    refunds: number;
    taxes: number;
    shippingRevenue: number;
  };
  comparison: {
    grossSalesChangePct: number;
    netSalesChangePct: number;
    ordersChangePct: number;
    avgOrderValueChangePct: number;
  };
  salesTrend: { date: string; gross: number; net: number; orders: number }[];
  salesByChannel: { channel: string; revenue: number; orders: number }[];
  salesByPaymentMethod: { method: string; revenue: number; count: number }[];
  salesByCountry: { country: string; revenue: number }[];
  byProduct: { productId: string; name: string; sku: string; qtySold: number; grossSales: number; discount: number; refund: number; netSales: number; profit: number }[];
  byCategory: { id: string; name: string; revenue: number; qty: number }[];
  bySeller: { id: string; name: string; revenue: number; orders: number }[];
}

export default function SalesReportPage() {
  const [range, setRange] = React.useState<ReportRange>("30d");
  const { data, loading, error, refetch } = useReport<SalesReport>("/reports/sales", range);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <ReportHeader
        title="Sales Overview"
        subtitle="Gross sales, net sales, orders and revenue trend across every channel"
        range={range}
        onRangeChange={setRange}
        onRefresh={refetch}
      />

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-[#92640a] dark:text-warning">
          <WifiOff className="size-4 shrink-0" />
          Live API unreachable ({error}) — showing no data.
        </div>
      )}

      {loading || !data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={DollarSign} tone="primary" title="Gross sales" value={formatCurrency(data.kpis.grossSales)} trend={data.comparison.grossSalesChangePct} trendLabel="vs previous period" />
            <StatCard icon={Receipt} tone="success" title="Net sales" value={formatCurrency(data.kpis.netSales)} trend={data.comparison.netSalesChangePct} trendLabel="vs previous period" />
            <StatCard icon={ShoppingCart} tone="accent" title="Orders" value={formatNumber(data.kpis.orders)} trend={data.comparison.ordersChangePct} trendLabel="vs previous period" />
            <StatCard icon={Percent} tone="warning" title="Avg. order value" value={formatCurrency(data.kpis.avgOrderValue)} trend={data.comparison.avgOrderValueChangePct} trendLabel="vs previous period" />
            <StatCard icon={Tag} tone="primary" title="Discounts" value={formatCurrency(data.kpis.discounts)} />
            <StatCard icon={Undo2} tone="destructive" title="Refunds" value={formatCurrency(data.kpis.refunds)} />
            <StatCard icon={Landmark} tone="accent" title="Taxes collected" value={formatCurrency(data.kpis.taxes)} />
            <StatCard icon={Truck} tone="success" title="Shipping revenue" value={formatCurrency(data.kpis.shippingRevenue)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales trend</CardTitle>
              <CardDescription>Gross vs net sales and order count over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.salesTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => formatCompact(v)} axisLine={false} tickLine={false} width={48} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip
                      contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }}
                      formatter={(value, name) => (name === "orders" ? [value, name] : [formatCurrency(Number(value)), name])}
                    />
                    <Bar yAxisId="right" dataKey="orders" name="orders" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} barSize={14} />
                    <Line yAxisId="left" type="monotone" dataKey="gross" name="gross" stroke="var(--color-chart-1)" strokeWidth={2.25} dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="net" name="net" stroke="var(--color-chart-4)" strokeWidth={2.25} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>Sales by channel</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.salesByChannel.map((c) => (
                  <div key={c.channel} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{c.channel.toLowerCase().replace("_", " ")}</span>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(c.revenue)}</p>
                      <p className="text-xs text-muted-foreground">{c.orders} orders</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Sales by payment method</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.salesByPaymentMethod.map((m) => (
                  <div key={m.method} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{titleCase(m.method)}</span>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(m.revenue)}</p>
                      <p className="text-xs text-muted-foreground">{m.count} orders</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Sales by country</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.salesByCountry.slice(0, 6).map((c) => (
                  <div key={c.country} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c.country}</span>
                    <p className="font-medium">{formatCurrency(c.revenue)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Sales breakdown</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="product" className="w-full">
                <TabsList className="mx-5 mt-2">
                  <TabsTrigger value="product">By Product</TabsTrigger>
                  <TabsTrigger value="category">By Category</TabsTrigger>
                  <TabsTrigger value="seller">By Seller</TabsTrigger>
                </TabsList>
                <TabsContent value="product">
                  {data.byProduct.length === 0 ? <EmptyState title="No sales in this period" /> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Qty sold</TableHead>
                          <TableHead>Gross sales</TableHead><TableHead>Discount</TableHead><TableHead>Refund</TableHead>
                          <TableHead>Net sales</TableHead><TableHead>Profit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.byProduct.slice(0, 20).map((p) => (
                          <TableRow key={p.productId}>
                            <TableCell className="max-w-[200px] truncate font-medium">{p.name}</TableCell>
                            <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                            <TableCell>{formatNumber(p.qtySold)}</TableCell>
                            <TableCell>{formatCurrency(p.grossSales)}</TableCell>
                            <TableCell>{formatCurrency(p.discount)}</TableCell>
                            <TableCell>{formatCurrency(p.refund)}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(p.netSales)}</TableCell>
                            <TableCell className={p.profit >= 0 ? "text-success" : "text-destructive"}>{formatCurrency(p.profit)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
                <TabsContent value="category">
                  {data.byCategory.length === 0 ? <EmptyState title="No sales in this period" /> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Qty sold</TableHead><TableHead>Revenue</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {data.byCategory.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>{formatNumber(c.qty)}</TableCell>
                            <TableCell>{formatCurrency(c.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
                <TabsContent value="seller">
                  {data.bySeller.length === 0 ? <EmptyState title="No sales in this period" /> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Seller</TableHead><TableHead>Orders</TableHead><TableHead>Revenue</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {data.bySeller.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell>{formatNumber(s.orders)}</TableCell>
                            <TableCell>{formatCurrency(s.revenue)}</TableCell>
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
