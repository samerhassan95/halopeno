"use client";

import * as React from "react";
import { WifiOff, Landmark, Undo2, Scale, Receipt, ShieldOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { ReportHeader } from "@/components/reports/report-header";
import { CardSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useReport, type ReportRange } from "@/lib/hooks/use-report";
import { formatCurrency } from "@/lib/utils";

interface TaxReport {
  kpis: { taxCollected: number; taxRefunded: number; netTaxLiability: number; taxableSales: number; exemptSales: number };
  byClass: { id: string; name: string; tax: number; sales: number }[];
  byCountry: { country: string; tax: number; sales: number }[];
  bySeller: { id: string; name: string; tax: number }[];
  transactions: { orderId: string; orderNumber: string; date: string; taxableAmount: number; taxAmount: number; status: string }[];
}

export default function TaxReportPage() {
  const [range, setRange] = React.useState<ReportRange>("30d");
  const { data, loading, error, refetch } = useReport<TaxReport>("/reports/tax", range);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <ReportHeader title="Tax Summary" subtitle="Tax collected, refunded and net liability by class, country and seller" range={range} onRangeChange={setRange} onRefresh={refetch} />

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
            <StatCard icon={Landmark} tone="primary" title="Tax collected" value={formatCurrency(data.kpis.taxCollected)} />
            <StatCard icon={Undo2} tone="destructive" title="Tax refunded" value={formatCurrency(data.kpis.taxRefunded)} />
            <StatCard icon={Scale} tone="success" title="Net tax liability" value={formatCurrency(data.kpis.netTaxLiability)} />
            <StatCard icon={Receipt} tone="accent" title="Taxable sales" value={formatCurrency(data.kpis.taxableSales)} />
            <StatCard icon={ShieldOff} tone="warning" title="Tax-exempt sales" value={formatCurrency(data.kpis.exemptSales)} />
          </div>

          <Card>
            <CardHeader><CardTitle>Tax breakdown</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="class" className="w-full">
                <TabsList className="mx-5 mt-2">
                  <TabsTrigger value="class">By class</TabsTrigger>
                  <TabsTrigger value="country">By country</TabsTrigger>
                  <TabsTrigger value="seller">By seller</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>
                <TabsContent value="class">
                  {data.byClass.length === 0 ? <EmptyState title="No taxable sales in this period" /> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Tax class</TableHead><TableHead>Taxable sales</TableHead><TableHead>Tax collected</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {data.byClass.map((c) => (
                          <TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{formatCurrency(c.sales)}</TableCell><TableCell>{formatCurrency(c.tax)}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
                <TabsContent value="country">
                  {data.byCountry.length === 0 ? <EmptyState title="No taxable sales in this period" /> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Country</TableHead><TableHead>Taxable sales</TableHead><TableHead>Tax collected</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {data.byCountry.map((c) => (
                          <TableRow key={c.country}><TableCell className="font-medium">{c.country}</TableCell><TableCell>{formatCurrency(c.sales)}</TableCell><TableCell>{formatCurrency(c.tax)}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
                <TabsContent value="seller">
                  {data.bySeller.length === 0 ? <EmptyState title="No seller tax collected in this period" /> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Seller</TableHead><TableHead>Tax collected</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {data.bySeller.map((s) => (
                          <TableRow key={s.id}><TableCell className="font-medium">{s.name}</TableCell><TableCell>{formatCurrency(s.tax)}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
                <TabsContent value="transactions">
                  {data.transactions.length === 0 ? <EmptyState title="No taxed transactions in this period" /> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Date</TableHead><TableHead>Taxable amount</TableHead><TableHead>Tax amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {data.transactions.map((t) => (
                          <TableRow key={t.orderId}>
                            <TableCell className="font-medium">{t.orderNumber}</TableCell>
                            <TableCell className="text-muted-foreground">{new Date(t.date).toLocaleDateString()}</TableCell>
                            <TableCell>{formatCurrency(t.taxableAmount)}</TableCell>
                            <TableCell>{formatCurrency(t.taxAmount)}</TableCell>
                            <TableCell><Badge variant="secondary">{t.status.toLowerCase()}</Badge></TableCell>
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
