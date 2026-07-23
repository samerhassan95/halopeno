"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Wand2, Play, Save } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "sonner";

type Source = "sales" | "products" | "sellers" | "customers" | "tax";

const SOURCES: { value: Source; label: string; endpoint: string }[] = [
  { value: "sales", label: "Sales (Orders)", endpoint: "/reports/sales" },
  { value: "products", label: "Products", endpoint: "/reports/products" },
  { value: "sellers", label: "Sellers", endpoint: "/reports/sellers" },
  { value: "customers", label: "Customers", endpoint: "/reports/customers" },
  { value: "tax", label: "Tax", endpoint: "/reports/tax" },
];

interface DimensionConfig {
  value: string;
  label: string;
  arrayKey: string;
  labelKey: string;
  metrics: { value: string; label: string; key: string; currency?: boolean }[];
}

const DIMENSIONS: Record<Source, DimensionConfig[]> = {
  sales: [
    { value: "product", label: "Product", arrayKey: "byProduct", labelKey: "name", metrics: [
      { value: "grossSales", label: "Gross sales", key: "grossSales", currency: true },
      { value: "netSales", label: "Net sales", key: "netSales", currency: true },
      { value: "qtySold", label: "Qty sold", key: "qtySold" },
      { value: "profit", label: "Profit", key: "profit", currency: true },
    ] },
    { value: "category", label: "Category", arrayKey: "byCategory", labelKey: "name", metrics: [
      { value: "revenue", label: "Revenue", key: "revenue", currency: true },
      { value: "qty", label: "Qty sold", key: "qty" },
    ] },
    { value: "seller", label: "Seller", arrayKey: "bySeller", labelKey: "name", metrics: [
      { value: "revenue", label: "Revenue", key: "revenue", currency: true },
      { value: "orders", label: "Orders", key: "orders" },
    ] },
    { value: "channel", label: "Channel", arrayKey: "salesByChannel", labelKey: "channel", metrics: [
      { value: "revenue", label: "Revenue", key: "revenue", currency: true },
      { value: "orders", label: "Orders", key: "orders" },
    ] },
    { value: "country", label: "Country", arrayKey: "salesByCountry", labelKey: "country", metrics: [
      { value: "revenue", label: "Revenue", key: "revenue", currency: true },
    ] },
    { value: "paymentMethod", label: "Payment method", arrayKey: "salesByPaymentMethod", labelKey: "method", metrics: [
      { value: "revenue", label: "Revenue", key: "revenue", currency: true },
      { value: "count", label: "Order count", key: "count" },
    ] },
  ],
  products: [
    { value: "bestSelling", label: "Best selling products", arrayKey: "bestSelling", labelKey: "name", metrics: [
      { value: "revenue", label: "Revenue", key: "revenue", currency: true },
      { value: "unitsSold", label: "Units sold", key: "unitsSold" },
      { value: "profit", label: "Profit", key: "profit", currency: true },
    ] },
    { value: "profitability", label: "Profitability", arrayKey: "profitability", labelKey: "name", metrics: [
      { value: "profit", label: "Profit", key: "profit", currency: true },
      { value: "marginPct", label: "Margin %", key: "marginPct" },
    ] },
  ],
  sellers: [
    { value: "bySeller", label: "Seller", arrayKey: "bySeller", labelKey: "name", metrics: [
      { value: "sales", label: "Sales", key: "sales", currency: true },
      { value: "commission", label: "Commission", key: "commission", currency: true },
      { value: "orders", label: "Orders", key: "orders" },
    ] },
  ],
  customers: [
    { value: "segments", label: "Segment", arrayKey: "segments", labelKey: "label", metrics: [
      { value: "customers", label: "Customers", key: "customers" },
    ] },
    { value: "locations", label: "Country", arrayKey: "locations", labelKey: "country", metrics: [
      { value: "customers", label: "Customers", key: "customers" },
      { value: "revenue", label: "Revenue", key: "revenue", currency: true },
    ] },
  ],
  tax: [
    { value: "byClass", label: "Tax class", arrayKey: "byClass", labelKey: "name", metrics: [
      { value: "tax", label: "Tax collected", key: "tax", currency: true },
      { value: "sales", label: "Taxable sales", key: "sales", currency: true },
    ] },
    { value: "byCountry", label: "Country", arrayKey: "byCountry", labelKey: "country", metrics: [
      { value: "tax", label: "Tax collected", key: "tax", currency: true },
    ] },
  ],
};

export default function ReportBuilderPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [source, setSource] = React.useState<Source>("sales");
  const [dimension, setDimension] = React.useState(DIMENSIONS.sales[0].value);
  const [metric, setMetric] = React.useState(DIMENSIONS.sales[0].metrics[0].value);
  const [range, setRange] = React.useState<"7d" | "30d" | "90d" | "365d">("30d");
  const [rows, setRows] = React.useState<Record<string, unknown>[] | null>(null);
  const [running, setRunning] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const dimensionOptions = DIMENSIONS[source];
  const activeDimension = dimensionOptions.find((d) => d.value === dimension) ?? dimensionOptions[0];
  const activeMetric = activeDimension.metrics.find((m) => m.value === metric) ?? activeDimension.metrics[0];

  function handleSourceChange(next: Source) {
    setSource(next);
    setDimension(DIMENSIONS[next][0].value);
    setMetric(DIMENSIONS[next][0].metrics[0].value);
    setRows(null);
  }

  function handleDimensionChange(next: string) {
    setDimension(next);
    const config = dimensionOptions.find((d) => d.value === next);
    setMetric(config?.metrics[0].value ?? "");
    setRows(null);
  }

  async function runPreview() {
    setRunning(true);
    try {
      const endpoint = SOURCES.find((s) => s.value === source)!.endpoint;
      const res = await api.get<Record<string, unknown>>(`${endpoint}?range=${range}`);
      const arr = (res[activeDimension.arrayKey] as Record<string, unknown>[]) ?? [];
      setRows(arr);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to run report");
    } finally {
      setRunning(false);
    }
  }

  async function saveReport() {
    if (!name.trim()) {
      toast.error("Give your report a name first");
      return;
    }
    setSaving(true);
    try {
      await api.post("/analytics/saved-reports", {
        name,
        type: source,
        filters: { dimension, metric, range },
      });
      toast.success(`"${name}" saved to Report Center`);
      router.push("/admin/reports");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save report");
    } finally {
      setSaving(false);
    }
  }

  const chartData = (rows ?? []).map((r) => ({
    label: String(r[activeDimension.labelKey] ?? ""),
    value: Number(r[activeMetric.key] ?? 0),
  }));

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]">
          <Wand2 className="size-6 text-primary" /> Custom Report Builder
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Pick a data source, a dimension and a metric to build your own report</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Select what to measure and how to group it</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Report name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Top categories this quarter" />
            </div>

            <div className="space-y-1.5">
              <Label>Data source</Label>
              <Select value={source} onValueChange={(v) => handleSourceChange(v as Source)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Group by (dimension)</Label>
              <Select value={dimension} onValueChange={handleDimensionChange}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dimensionOptions.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Metric</Label>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activeDimension.metrics.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Date range</Label>
              <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="365d">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full gap-2" onClick={runPreview} disabled={running}>
              <Play className="size-4" /> {running ? "Running…" : "Run preview"}
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={saveReport} disabled={saving}>
              <Save className="size-4" /> {saving ? "Saving…" : "Save report"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {activeMetric.label} by {activeDimension.label.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!rows ? (
              <EmptyState title="Run the report to see a preview" description="Configure the fields on the left, then click Run preview." className="py-16" />
            ) : rows.length === 0 ? (
              <EmptyState title="No data for this configuration" className="py-16" />
            ) : (
              <div className="flex flex-col gap-6">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.slice(0, 15)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
                      <Tooltip
                        contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }}
                        formatter={(value) => [activeMetric.currency ? formatCurrency(Number(value)) : formatNumber(Number(value)), activeMetric.label]}
                      />
                      <Bar dataKey="value" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{activeDimension.label}</TableHead>
                      <TableHead>{activeMetric.label}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.label}</TableCell>
                        <TableCell>{activeMetric.currency ? formatCurrency(r.value) : formatNumber(r.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
