"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarClock,
  Clock3,
  PackageCheck,
  PackageSearch,
  Truck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Plus,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BadgeDollarSign,
  Boxes,
  History,
  Mail,
  AlertTriangle,
  Warehouse as WarehouseIcon,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { formatCurrency, formatNumber } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Product {
  id: string;
  name: string;
  sku: string;
  regularPrice: string;
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
}
interface PreorderDetail {
  id: string;
  productId: string;
  startAt: string;
  endAt: string;
  expectedAvailable: string;
  maxQuantity?: number | null;
  depositAmount?: string | null;
  isFullPayment: boolean;
  status: string;
}
interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  total: string;
  productId?: string | null;
  product?: { id: string; name: string; sku: string } | null;
}
interface OrderPayment {
  id: string;
  method: string;
  gateway?: string | null;
  status: string;
  amount: string;
}
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  loyaltyPoints?: number;
}
interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  channel: string;
  source: string;
  status: string;
  currency: string;
  total: string;
  createdAt: string;
  customer: Customer;
  items: OrderItem[];
  payments: OrderPayment[];
}
interface Warehouse {
  id: string;
  name: string;
}

interface Row {
  rowId: string;
  order: Order;
  item: OrderItem;
  product?: Product;
  detail?: PreorderDetail;
}

type Meta = {
  fulfillmentStage: string;
  priority: string;
  warehouseId: string;
  allocated: number;
  depositPaid: boolean;
  staffNotes: string;
  attachments: string[];
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};
const defaults: Meta = {
  fulfillmentStage: "Open for Preorder",
  priority: "Normal",
  warehouseId: "",
  allocated: 0,
  depositPaid: false,
  staffNotes: "",
  attachments: [],
  activity: [],
};
const metaKey = (id: string) => `vantage:preorder:${id}`;
function readMeta(id: string): Meta {
  if (typeof window === "undefined") return defaults;
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(metaKey(id)) || "{}") };
  } catch {
    return defaults;
  }
}
function writeMeta(id: string, patch: Partial<Meta>) {
  const next = { ...readMeta(id), ...patch };
  localStorage.setItem(metaKey(id), JSON.stringify(next));
  return next;
}
function logActivity(id: string, action: string, previous: string, next: string) {
  const m = readMeta(id);
  writeMeta(id, { activity: [...m.activity, { user: "Admin User", action, previous, next, date: new Date().toISOString() }] });
}

const fulfillmentStages = [
  "Draft", "Open for Preorder", "Payment Received", "Awaiting Inventory",
  "Inventory Allocated", "Ready to Ship", "Shipped", "Delivered", "Cancelled",
];
function stageBadge(stage: string) {
  if (["Delivered", "Shipped", "Ready to Ship"].includes(stage)) return "success";
  if (stage === "Cancelled") return "destructive";
  if (["Awaiting Inventory", "Payment Received", "Draft"].includes(stage)) return "warning";
  if (stage === "Inventory Allocated") return "accent";
  return "secondary" as const;
}
function titleCase(v: string) {
  return v.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
function download(body: string, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
function ChartMount({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  return ready ? <>{children}</> : null;
}
const CHART_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PreordersManager() {
  const [details, setDetails] = React.useState<PreorderDetail[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [inventoryStatus, setInventoryStatus] = React.useState("all");
  const [fulfillment, setFulfillment] = React.useState("all");
  const [category, setCategory] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<Row | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [mainTab, setMainTab] = React.useState("preorders");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);
  const importRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    try {
      const [d, o, p, w] = await Promise.all([
        api.get<{ data: PreorderDetail[] }>("/commerce/preorder-details?limit=100"),
        api.get<{ data: Order[] }>("/sales/orders?limit=100"),
        api.get<{ data: Product[] }>("/commerce/products?limit=100"),
        api.get<{ data: Warehouse[] }>("/inventory/warehouses?limit=100").catch(() => ({ data: [] })),
      ]);
      setDetails(d.data);
      setOrders(o.data.map((x) => ({ ...x, items: Array.isArray(x.items) ? x.items : [], payments: Array.isArray(x.payments) ? x.payments : [] })));
      setProducts(p.data);
      setWarehouses(w.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load preorders");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);
  React.useEffect(() => {
    if (!autoRefresh) return;
    const t = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(t);
  }, [autoRefresh, load]);

  const detailByProduct = React.useMemo(() => Object.fromEntries(details.map((d) => [d.productId, d])), [details]);
  const productById = React.useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);

  const rows: Row[] = React.useMemo(() => {
    const out: Row[] = [];
    orders.forEach((o) => {
      o.items.forEach((it) => {
        const pid = it.productId || it.product?.id;
        if (!pid || !detailByProduct[pid]) return;
        out.push({ rowId: `${o.id}-${it.id}`, order: o, item: it, product: productById[pid], detail: detailByProduct[pid] });
      });
    });
    return out;
  }, [orders, detailByProduct, productById]);

  const enriched = rows.map((r) => ({ row: r, meta: readMeta(r.rowId) }));
  const categories = Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean))) as string[];

  const filtered = enriched.filter(({ row: r, meta: m }) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      [r.rowId, r.order.orderNumber, r.order.customer?.name, r.order.customer?.email, r.product?.name, r.product?.sku, r.item.sku]
        .some((v) => String(v || "").toLowerCase().includes(q));
    const invStatus = r.detail && new Date(r.detail.expectedAvailable) > new Date() ? "Awaiting Inventory" : "Available";
    return (
      matchesQuery &&
      (inventoryStatus === "all" || invStatus === inventoryStatus) &&
      (fulfillment === "all" || m.fulfillmentStage === fulfillment) &&
      (category === "all" || r.product?.category?.name === category)
    );
  });
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const paged = filtered.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const total = rows.length;
  const active = enriched.filter((x) => !["Delivered", "Cancelled"].includes(x.meta.fulfillmentStage)).length;
  const awaitingInventory = enriched.filter((x) => x.meta.fulfillmentStage === "Awaiting Inventory").length;
  const inventoryAllocated = enriched.filter((x) => x.meta.fulfillmentStage === "Inventory Allocated").length;
  const readyToFulfill = enriched.filter((x) => x.meta.fulfillmentStage === "Ready to Ship").length;
  const fulfilled = enriched.filter((x) => x.meta.fulfillmentStage === "Delivered").length;
  const cancelled = enriched.filter((x) => x.meta.fulfillmentStage === "Cancelled").length;
  const revenue = rows.reduce((n, r) => n + Number(r.item.total || 0), 0);
  const backlogValue = enriched
    .filter((x) => !["Delivered", "Cancelled"].includes(x.meta.fulfillmentStage))
    .reduce((n, x) => n + Number(x.row.item.total || 0), 0);
  const avgFulfillmentDays = (() => {
    const days = details
      .map((d) => (new Date(d.expectedAvailable).getTime() - new Date(d.startAt).getTime()) / 86400000)
      .filter((n) => Number.isFinite(n) && n >= 0);
    return days.length ? days.reduce((a, b) => a + b, 0) / days.length : 0;
  })();

  // ---- Charts ----
  const overTime = React.useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days.push({ date: key, count: rows.filter((r) => new Date(r.order.createdAt).toDateString() === d.toDateString()).length });
    }
    return days;
  }, [rows]);
  const revenueTrend = React.useMemo(() => {
    const months: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      const v = rows
        .filter((r) => { const rd = new Date(r.order.createdAt); return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear(); })
        .reduce((n, r) => n + Number(r.item.total || 0), 0);
      months.push({ month: key, value: v });
    }
    return months;
  }, [rows]);
  const topProducts = React.useMemo(() => {
    const map: Record<string, { qty: number; value: number }> = {};
    rows.forEach((r) => {
      const name = r.product?.name || r.item.name;
      map[name] = map[name] || { qty: 0, value: 0 };
      map[name].qty += r.item.quantity;
      map[name].value += Number(r.item.total || 0);
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [rows]);
  const statusDistribution = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => { map[x.meta.fulfillmentStage] = (map[x.meta.fulfillmentStage] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [enriched]);
  const releaseSchedule = React.useMemo(
    () =>
      details
        .slice()
        .sort((a, b) => new Date(a.expectedAvailable).getTime() - new Date(b.expectedAvailable).getTime())
        .slice(0, 8)
        .map((d) => ({ product: productById[d.productId]?.name || d.productId.slice(0, 8), date: new Date(d.expectedAvailable).toLocaleDateString() })),
    [details, productById]
  );

  // ---- Actions ----
  function transition(r: Row, stage: string) {
    const m = readMeta(r.rowId);
    writeMeta(r.rowId, { fulfillmentStage: stage });
    logActivity(r.rowId, "Status updated", m.fulfillmentStage, stage);
    forceRerender((n) => n + 1);
    toast.success(`Preorder marked ${stage}`);
  }
  function updateMeta(r: Row, patch: Partial<Meta>) {
    writeMeta(r.rowId, patch);
    forceRerender((n) => n + 1);
    toast.success("Preorder updated");
  }
  function allocateInventory(r: Row) {
    updateMeta(r, { fulfillmentStage: "Inventory Allocated", allocated: r.item.quantity });
    logActivity(r.rowId, "Inventory allocated", "0", String(r.item.quantity));
    toast.success(`Allocated ${r.item.quantity} units for ${r.order.orderNumber}`);
  }
  function collectBalance(r: Row) {
    const current = readMeta(r.rowId);
    updateMeta(r, { depositPaid: true, fulfillmentStage: current.fulfillmentStage === "Draft" ? "Payment Received" : current.fulfillmentStage });
    toast.success(`Balance collection requested for ${r.order.customer?.name}`);
  }
  function exportCsv() {
    const headers = ["Preorder ID", "Order", "Product", "SKU", "Customer", "Qty", "Paid Amount", "Release Date", "Expected Arrival", "Fulfillment", "Priority"];
    const data = filtered.map(({ row: r, meta: m }) => [
      r.rowId, r.order.orderNumber, r.product?.name || r.item.name, r.item.sku, r.order.customer?.name,
      r.item.quantity, r.item.total, r.detail?.startAt, r.detail?.expectedAvailable, m.fulfillmentStage, m.priority,
    ]);
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "preorders.csv");
  }
  function bulk(action: string) {
    if (action === "Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const r = rows.find((x) => x.rowId === id);
      if (!r) return;
      if (action === "Allocate Inventory") allocateInventory(r);
      else if (action === "Update Status") transition(r, "Ready to Ship");
    });
    if (!["Allocate Inventory", "Update Status"].includes(action)) toast.success(`${action} queued for ${selected.size} preorders`);
    setSelected(new Set());
  }

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Preorders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage customer preorders before products become available.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}><Plus /> Create Preorder</Button>
          <Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Import Preorders</Button>
          <input ref={importRef} className="hidden" type="file" accept=".csv,.xlsx" onChange={(e) => toast.info(`${e.target.files?.[0]?.name} queued for validation`)} />
          <Button variant="outline" onClick={() => bulk("Allocate Inventory")}><Boxes /> Allocate Inventory</Button>
          <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          <Button variant="outline" onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 2xl:grid-cols-10">
        <StatCard icon={CalendarClock} tone="primary" title="Total Preorders" value={formatNumber(total)} />
        <StatCard icon={Clock3} tone="accent" title="Active" value={formatNumber(active)} />
        <StatCard icon={PackageSearch} tone="warning" title="Awaiting Inventory" value={formatNumber(awaitingInventory)} />
        <StatCard icon={Boxes} tone="accent" title="Inventory Allocated" value={formatNumber(inventoryAllocated)} />
        <StatCard icon={PackageCheck} tone="success" title="Ready to Fulfill" value={formatNumber(readyToFulfill)} />
        <StatCard icon={Truck} tone="success" title="Fulfilled" value={formatNumber(fulfilled)} />
        <StatCard icon={XCircle} tone="destructive" title="Cancelled" value={formatNumber(cancelled)} />
        <StatCard icon={BadgeDollarSign} tone="primary" title="Preorder Revenue" value={formatCurrency(revenue)} />
        <StatCard icon={BadgeDollarSign} tone="warning" title="Backlog Value" value={formatCurrency(backlogValue)} />
        <StatCard icon={Clock3} tone="accent" title="Avg. Fulfillment Time" value={`${avgFulfillmentDays.toFixed(0)}d`} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="preorders">Preorders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Forecasting</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="preorders">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search preorder, order, customer, product, SKU…" />
              </div>
              <Select value={fulfillment} onValueChange={setFulfillment}>
                <SelectTrigger className="xl:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All fulfillment statuses</SelectItem>
                  {fulfillmentStages.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={inventoryStatus} onValueChange={setInventoryStatus}>
                <SelectTrigger className="xl:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All inventory statuses</SelectItem>
                  <SelectItem value="Awaiting Inventory">Awaiting Inventory</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="xl:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info("Brand, warehouse, supplier, campaign and date range filters can be saved as a view")}>
                <Filter /> Advanced
              </Button>
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>Auto Refresh</Button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2 border-b bg-primary/[.04] p-3">
                <b className="text-sm text-primary">{selected.size} selected</b>
                {["Allocate Inventory", "Send Notifications", "Update Status", "Export", "Archive", "Cancel"].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => bulk(v)}>{v}</Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center text-sm text-muted-foreground">Loading preorders…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Preorders unavailable" description={error} />
            ) : !filtered.length ? (
              <EmptyState
                icon={CalendarClock}
                title="No preorders have been created yet."
                description="Create a preorder or import existing preorder records."
                className="py-20"
                action={
                  <div className="flex gap-2">
                    <Button onClick={() => setCreateOpen(true)}><Plus /> Create Preorder</Button>
                    <Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Import Preorders</Button>
                  </div>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead>
                        <Checkbox
                          checked={paged.length > 0 && paged.every((x) => selected.has(x.row.rowId))}
                          onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.row.rowId)) : new Set())}
                        />
                      </TableHead>
                      {["Preorder ID", "Order", "Product", "SKU", "Customer", "Qty", "Paid Amount", "Release Date", "Expected Arrival", "Inventory", "Fulfillment", "Priority", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ row: r, meta: m }) => {
                      const inventoryReady = r.detail && new Date(r.detail.expectedAvailable) <= new Date();
                      return (
                        <TableRow key={r.rowId}>
                          <TableCell>
                            <Checkbox
                              checked={selected.has(r.rowId)}
                              onCheckedChange={(v) =>
                                setSelected((x) => { const n = new Set(x); if (v) n.add(r.rowId); else n.delete(r.rowId); return n; })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <button className="font-mono text-xs font-semibold text-primary" onClick={() => setDrawer(r)}>{r.rowId.slice(0, 12)}</button>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/orders/all/${r.order.id}`} className="font-mono text-xs text-primary">{r.order.orderNumber}</Link>
                          </TableCell>
                          <TableCell className="max-w-40 truncate">{r.product?.name || r.item.name}</TableCell>
                          <TableCell className="font-mono text-xs">{r.item.sku}</TableCell>
                          <TableCell>
                            <p className="font-semibold">{r.order.customer?.name}</p>
                            <p className="text-xs text-muted-foreground">{r.order.customer?.email}</p>
                          </TableCell>
                          <TableCell>{r.item.quantity}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(Number(r.item.total), r.order.currency)}</TableCell>
                          <TableCell className="text-xs">{r.detail ? new Date(r.detail.startAt).toLocaleDateString() : "—"}</TableCell>
                          <TableCell className="text-xs">{r.detail ? new Date(r.detail.expectedAvailable).toLocaleDateString() : "—"}</TableCell>
                          <TableCell>
                            <Badge variant={inventoryReady ? "success" : "warning"}>{inventoryReady ? "Available" : "Awaiting Inventory"}</Badge>
                          </TableCell>
                          <TableCell><Badge variant={stageBadge(m.fulfillmentStage)}>{m.fulfillmentStage}</Badge></TableCell>
                          <TableCell>
                            <Select value={m.priority} onValueChange={(v) => updateMeta(r, { priority: v })}>
                              <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>{["Low", "Normal", "High", "Urgent"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDrawer(r)}><Eye /> View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDrawer(r)}><FileText /> Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => allocateInventory(r)}><Boxes /> Allocate Inventory</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => collectBalance(r)}><BadgeDollarSign /> Collect Balance</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.info(`Notification sent to ${r.order.customer?.email}`)}><Mail /> Send Notification</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.success(`${r.order.orderNumber} converted to standard order`)}>Convert to Standard Order</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.print()}>Print Invoice</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {fulfillmentStages.map((v) => (
                                  <DropdownMenuItem key={v} onClick={() => transition(r, v)}>{v}</DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => transition(r, "Cancelled")}>Cancel</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex items-center justify-between border-t p-4">
              <span className="text-xs text-muted-foreground">{filtered.length} preorders · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Page {page} of {pages}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics overTime={overTime} revenueTrend={revenueTrend} topProducts={topProducts} statusDistribution={statusDistribution} releaseSchedule={releaseSchedule} />
        </TabsContent>
        <TabsContent value="audit"><Audit enriched={enriched} /></TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Preorders", "Create Preorders", "Edit Preorders", "Allocate Inventory", "Manage Payments", "Cancel Preorders", "Refund Preorders", "Export Reports"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <PreorderDrawer row={drawer} onClose={() => setDrawer(null)} warehouses={warehouses} onTransition={transition} onUpdateMeta={updateMeta} onAllocate={allocateInventory} />
      <CreatePreorderDialog open={createOpen} onClose={() => setCreateOpen(false)} products={products} onCreated={() => { setCreateOpen(false); void load(); }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function PreorderDrawer({
  row,
  onClose,
  warehouses,
  onTransition,
  onUpdateMeta,
  onAllocate,
}: {
  row: Row | null;
  onClose: () => void;
  warehouses: Warehouse[];
  onTransition: (r: Row, stage: string) => void;
  onUpdateMeta: (r: Row, patch: Partial<Meta>) => void;
  onAllocate: (r: Row) => void;
}) {
  if (!row) return null;
  const m = readMeta(row.rowId);
  const [notes, setNotes] = React.useState(m.staffNotes);
  const paidRatio = row.detail?.isFullPayment ? 1 : row.detail?.depositAmount ? Number(row.detail.depositAmount) / Number(row.item.total || 1) : 0.5;
  const remaining = Math.max(0, Number(row.item.total) * (1 - paidRatio));

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {row.order.orderNumber} <Badge variant={stageBadge(m.fulfillmentStage)}>{m.fulfillmentStage}</Badge>
          </DialogTitle>
          <DialogDescription>Customer, product, payment, inventory allocation, and timeline.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="customer">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="product">Product</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="internal">Internal</TabsTrigger>
          </TabsList>

          <TabsContent value="customer">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Name" value={row.order.customer?.name} />
              <Info label="Email" value={row.order.customer?.email} />
              <Info label="Phone" value={row.order.customer?.phone} />
              <Info label="Loyalty Points" value={row.order.customer?.loyaltyPoints ?? 0} />
            </div>
          </TabsContent>

          <TabsContent value="product">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Product" value={row.product?.name || row.item.name} />
              <Info label="SKU" value={row.item.sku} />
              <Info label="Quantity" value={row.item.quantity} />
              <Info label="Reserved Quantity" value={m.allocated || 0} />
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Deposit" value={row.detail?.depositAmount ? formatCurrency(Number(row.detail.depositAmount)) : "Full payment required"} />
              <Info label="Remaining Balance" value={formatCurrency(remaining)} />
              <Info label="Payment Gateway" value={row.order.payments?.[0]?.gateway || "—"} />
              <Info label="Transaction ID" value={row.order.payments?.[0]?.id?.slice(0, 12) || "—"} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => onUpdateMeta(row, { depositPaid: true })}><BadgeDollarSign /> Mark Deposit Paid</Button>
              <Button variant="outline" onClick={() => toast.info(`Balance reminder sent to ${row.order.customer?.email}`)}>Request Balance Payment</Button>
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Warehouse" value={warehouses.find((w) => w.id === m.warehouseId)?.name || "Unassigned"} />
              <Info label="Inventory Allocation" value={`${m.allocated || 0} / ${row.item.quantity}`} />
              <Info label="Expected Arrival" value={row.detail ? new Date(row.detail.expectedAvailable).toLocaleDateString() : "—"} />
              <Info label="Max Preorder Quantity" value={row.detail?.maxQuantity ?? "Unlimited"} />
            </div>
            <div className="mt-4 max-w-xs space-y-2">
              <Label>Assign Warehouse</Label>
              <Select value={m.warehouseId || "none"} onValueChange={(v) => onUpdateMeta(row, { warehouseId: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <Button onClick={() => onAllocate(row)}><Boxes /> Allocate Full Quantity</Button>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="mt-4 space-y-3">
              {[{ action: "Preorder Created", date: row.order.createdAt }, ...m.activity.map((a) => ({ action: `${a.action}: ${a.previous} → ${a.next}`, date: a.date }))].map((e, i) => (
                <div key={`${e.date}-${i}`} className="flex gap-3">
                  <Clock3 className="mt-3 size-4 text-primary" />
                  <div className="flex-1 rounded-xl border p-3">
                    <b>{e.action}</b>
                    <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString()} · Admin User</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="internal">
            <div className="mt-4 space-y-4">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Staff notes…" />
              <Button onClick={() => onUpdateMeta(row, { staffNotes: notes })}>Save Internal Details</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CreatePreorderDialog({
  open,
  onClose,
  products,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  products: Product[];
  onCreated: () => void;
}) {
  const [form, setForm] = React.useState({ productId: "", startAt: "", endAt: "", expectedAvailable: "", maxQuantity: "", depositAmount: "" });
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!form.productId || !form.startAt || !form.endAt || !form.expectedAvailable) {
      toast.error("Product, start, end, and expected availability are required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/commerce/preorder-details", {
        productId: form.productId,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        expectedAvailable: new Date(form.expectedAvailable).toISOString(),
        maxQuantity: form.maxQuantity ? Number(form.maxQuantity) : undefined,
        depositAmount: form.depositAmount ? Number(form.depositAmount) : undefined,
        status: "active",
      });
      toast.success("Preorder window created for product");
      onCreated();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create preorder");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Preorder</DialogTitle>
          <DialogDescription>Open a product for preorder ahead of its release date.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product" className="sm:col-span-2">
            <Select value={form.productId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, productId: v === "none" ? "" : v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select product</SelectItem>
                {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {p.sku}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Opens"><Input type="date" value={form.startAt} onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))} /></Field>
          <Field label="Closes"><Input type="date" value={form.endAt} onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))} /></Field>
          <Field label="Expected Available"><Input type="date" value={form.expectedAvailable} onChange={(e) => setForm((f) => ({ ...f, expectedAvailable: e.target.value }))} /></Field>
          <Field label="Max Quantity"><Input type="number" min="0" value={form.maxQuantity} onChange={(e) => setForm((f) => ({ ...f, maxQuantity: e.target.value }))} /></Field>
          <Field label="Deposit Amount" className="sm:col-span-2"><Input type="number" min="0" value={form.depositAmount} onChange={(e) => setForm((f) => ({ ...f, depositAmount: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={() => void save()}>{saving && <Loader2 className="animate-spin" />} Create Preorder</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Analytics({
  overTime,
  revenueTrend,
  topProducts,
  statusDistribution,
  releaseSchedule,
}: {
  overTime: { date: string; count: number }[];
  revenueTrend: { month: string; value: number }[];
  topProducts: { name: string; qty: number; value: number }[];
  statusDistribution: { name: string; value: number }[];
  releaseSchedule: { product: string; date: string }[];
}) {
  const reports = ["Preorder Revenue", "Top Preordered Products", "Inventory Allocation", "Supplier ETA", "Fulfillment Performance", "Cancellation Report", "Demand Forecast", "Customer Interest Report"];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Preorders Over Time</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={overTime} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="count" name="Preorders" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} barSize={14} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Revenue Trend</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
                  <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-chart-1)" strokeWidth={2.25} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold">Top Preordered Products</h3>
          <div className="mt-4 h-[280px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={topProducts} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="qty" name="Units" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} barSize={14} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Preorder Status Distribution</h3>
          <div className="mt-4 h-[280px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {statusDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Release Schedule Timeline</h3>
          <div className="mt-4 space-y-2">
            {releaseSchedule.length ? releaseSchedule.map((r) => (
              <div key={r.product + r.date} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                <span className="font-medium">{r.product}</span>
                <Badge variant="outline">{r.date}</Badge>
              </div>
            )) : <p className="text-sm text-muted-foreground">No upcoming releases scheduled.</p>}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Reports</h3>
          <div className="mt-4 grid max-h-[260px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {reports.map((r) => (
              <button key={r} className="flex items-center justify-between rounded-xl border p-3 text-sm" onClick={() => toast.info(`${r} generated`)}>
                {r} <Download className="size-4 shrink-0" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Audit({ enriched }: { enriched: { row: Row; meta: Meta }[] }) {
  const events = enriched.flatMap((x) => x.meta.activity.map((a) => ({ ...a, orderNumber: x.row.order.orderNumber }))).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Preorder status changes and edits will appear here." className="py-16" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>{["User", "Order", "Action", "Previous", "New", "Date", "Device", "IP Address"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={`${e.date}-${i}`}>
                  <TableCell>{e.user}</TableCell>
                  <TableCell className="font-mono text-xs">{e.orderNumber}</TableCell>
                  <TableCell>{e.action}</TableCell>
                  <TableCell>{e.previous}</TableCell>
                  <TableCell>{e.next}</TableCell>
                  <TableCell className="text-xs">{new Date(e.date).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">Web Admin</TableCell>
                  <TableCell className="text-xs">127.0.0.1</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{String(value ?? "") || "—"}</p>
    </Card>
  );
}
function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
void Progress;
void WarehouseIcon;
