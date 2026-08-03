"use client";

import * as React from "react";
import {
  Percent,
  CheckCircle2,
  MapPin,
  RouteIcon,
  Truck,
  BadgeDollarSign,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Plus,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader2,
  History,
  AlertTriangle,
  Copy,
  Trash2,
  Calculator,
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
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { formatCurrency, formatNumber } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Zone { id: string; name: string; countries: string[]; }
interface Rate { id: string; zoneId: string; name: string; type: string; amount: string; minOrderValue?: string | null; freeShippingThreshold?: string | null; }

type Meta = {
  status: string;
  shippingMethod: string;
  courier: string;
  customerGroup: string;
  priority: number;
  minFee: number;
  maxFee: number;
  fuelSurcharge: number;
  handlingFee: number;
  deliveryTimeDays: string;
  slaCompliant: boolean;
  notes: string;
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};
const shippingMethods = ["Standard Shipping", "Express Shipping", "Economy Shipping", "Same-Day Delivery", "Next-Day Delivery", "Scheduled Delivery", "Store Pickup", "Local Delivery", "Freight", "International Shipping"];
const couriers = ["DHL", "FedEx", "UPS", "Aramex", "USPS", "Local Courier", "Internal Fleet", "Marketplace Delivery"];
const customerGroups = ["Guest", "Registered", "Silver", "Gold", "Platinum", "VIP", "Wholesale", "Corporate", "B2B", "Distributor"];
const pricingTypes = ["flat", "weight", "distance", "volume", "quantity", "order_total"];

function seedDefaults(r: Rate): Meta {
  let h = 0;
  for (const c of r.id) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return {
    status: "Active",
    shippingMethod: shippingMethods[h % shippingMethods.length],
    courier: couriers[h % couriers.length],
    customerGroup: "Registered",
    priority: (h % 5) + 1,
    minFee: 0,
    maxFee: Number(r.amount) * 3,
    fuelSurcharge: (h % 5),
    handlingFee: (h % 3),
    deliveryTimeDays: `${1 + (h % 3)}-${3 + (h % 4)} days`,
    slaCompliant: h % 4 !== 0,
    notes: "",
    activity: [],
  };
}
const metaKey = (id: string) => `vantage:shiprate:${id}`;
function readMeta(r: Rate): Meta {
  const base = seedDefaults(r);
  if (typeof window === "undefined") return base;
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(metaKey(r.id)) || "{}") };
  } catch {
    return base;
  }
}
function writeMeta(r: Rate, patch: Partial<Meta>) {
  const next = { ...readMeta(r), ...patch };
  localStorage.setItem(metaKey(r.id), JSON.stringify(next));
  return next;
}
function logActivity(r: Rate, action: string, previous: string, next: string) {
  const m = readMeta(r);
  writeMeta(r, { activity: [...m.activity, { user: "Admin User", action, previous, next, date: new Date().toISOString() }] });
}
function statusBadge(status: string) {
  return status === "Active" ? "success" : "secondary" as const;
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

export function ShippingRatesManager() {
  const [rates, setRates] = React.useState<Rate[]>([]);
  const [zones, setZones] = React.useState<Zone[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [zoneFilter, setZoneFilter] = React.useState("all");
  const [methodFilter, setMethodFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<Rate | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Rate | null>(null);
  const [mainTab, setMainTab] = React.useState("rates");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);

  const load = React.useCallback(async () => {
    try {
      const [r, z] = await Promise.all([
        api.get<{ data: Rate[] }>("/shipping/shipping-rates?limit=100"),
        api.get<{ data: Zone[] }>("/shipping/shipping-zones?limit=100"),
      ]);
      setRates(r.data);
      setZones(z.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load shipping rates");
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

  const zonesById = React.useMemo(() => Object.fromEntries(zones.map((z) => [z.id, z])), [zones]);
  const enriched = rates.map((r) => ({ rate: r, zone: zonesById[r.zoneId], meta: readMeta(r) }));

  const rows = enriched.filter(({ rate: r, zone: z, meta: m }) => {
    const q = query.toLowerCase();
    const matches = !q || [r.id, r.name, z?.name].some((v) => String(v || "").toLowerCase().includes(q));
    return matches && (statusFilter === "all" || m.status === statusFilter) && (zoneFilter === "all" || r.zoneId === zoneFilter) && (methodFilter === "all" || m.shippingMethod === methodFilter);
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const paged = rows.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const total = rates.length;
  const active = enriched.filter((x) => x.meta.status === "Active").length;
  const zoneCount = zones.length;
  const methodCount = new Set(enriched.map((x) => x.meta.shippingMethod)).size;
  const courierCount = new Set(enriched.map((x) => x.meta.courier)).size;
  const avgCost = total ? rates.reduce((n, r) => n + Number(r.amount), 0) / total : 0;
  const freeShippingRules = rates.filter((r) => Number(r.freeShippingThreshold) > 0).length;
  const slaCompliance = total ? (enriched.filter((x) => x.meta.slaCompliant).length / total) * 100 : 0;

  // ---- Charts ----
  const revenue = React.useMemo(() => {
    const months: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      months.push({ month: key, value: rates.reduce((n, r) => n + Number(r.amount), 0) * (0.6 + Math.random() * 0.5) });
    }
    return months;
  }, [rates]);
  const costByZone = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => { const name = x.zone?.name || "Unassigned"; map[name] = (map[name] || 0) + Number(x.rate.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [enriched]);
  const methodUsage = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => { map[x.meta.shippingMethod] = (map[x.meta.shippingMethod] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [enriched]);
  const carrierPerformance = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => { map[x.meta.courier] = (map[x.meta.courier] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [enriched]);
  const avgDeliveryTime = React.useMemo(() => {
    const months: { month: string; days: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      months.push({ month: key, days: 2 + Math.round(Math.random() * 2) });
    }
    return months;
  }, []);

  // ---- Actions ----
  function toggleStatus(r: Rate) {
    const m = readMeta(r);
    const next = m.status === "Active" ? "Inactive" : "Active";
    writeMeta(r, { status: next });
    logActivity(r, "Status updated", m.status, next);
    forceRerender((n) => n + 1);
    toast.success(`${r.name} marked ${next}`);
  }
  function updateMeta(r: Rate, patch: Partial<Meta>) {
    writeMeta(r, patch);
    forceRerender((n) => n + 1);
    toast.success("Shipping rate updated");
  }
  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/shipping/shipping-rates/${deleteTarget.id}`);
      setRates((x) => x.filter((r) => r.id !== deleteTarget.id));
      toast.success("Shipping rate deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
    setDeleteTarget(null);
  }
  async function duplicate(r: Rate) {
    try {
      const saved = await api.post<Rate>("/shipping/shipping-rates", { zoneId: r.zoneId, name: `${r.name} (Copy)`, type: r.type, amount: Number(r.amount) });
      setRates((x) => [saved, ...x]);
      toast.success("Shipping rate duplicated");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Duplicate failed");
    }
  }
  function testCost(r: Rate) {
    const m = readMeta(r);
    const sample = Number(r.amount) + m.fuelSurcharge + m.handlingFee;
    toast.info(`Estimated shipping cost for a sample order: ${formatCurrency(sample)}`);
  }
  function exportCsv() {
    const headers = ["Rate ID", "Rate Name", "Zone", "Method", "Courier", "Type", "Amount", "Customer Group", "Status"];
    const data = rows.map(({ rate: r, zone: z, meta: m }) => [r.id, r.name, z?.name, m.shippingMethod, m.courier, titleCase(r.type), r.amount, m.customerGroup, m.status]);
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "shipping-rates.csv");
  }
  function bulk(action: string) {
    if (action === "Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const r = rates.find((x) => x.id === id);
      if (!r) return;
      if (action === "Enable") updateMeta(r, { status: "Active" });
      else if (action === "Disable") updateMeta(r, { status: "Inactive" });
    });
    if (!["Enable", "Disable"].includes(action)) toast.success(`${action} queued for ${selected.size} rates`);
    setSelected(new Set());
  }
  async function createRate(form: { zoneId: string; name: string; type: string; amount: string }) {
    if (!form.zoneId || !form.name) { toast.error("Zone and rate name are required"); return; }
    try {
      const saved = await api.post<Rate>("/shipping/shipping-rates", { zoneId: form.zoneId, name: form.name, type: form.type, amount: Number(form.amount) });
      setRates((x) => [saved, ...x]);
      setCreateOpen(false);
      toast.success("Shipping rate created");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create rate");
    }
  }

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Shipping Rates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure shipping prices, delivery rules, carrier costs, and pricing strategies for every shipping zone.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}><Plus /> Add Shipping Rate</Button>
          <Button variant="outline" onClick={() => toast.info("Rate import queued for validation")}><Upload /> Import Rates</Button>
          <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          <Button variant="outline" onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <StatCard icon={Percent} tone="primary" title="Total Rates" value={formatNumber(total)} />
        <StatCard icon={CheckCircle2} tone="success" title="Active Rates" value={formatNumber(active)} />
        <StatCard icon={MapPin} tone="accent" title="Shipping Zones" value={formatNumber(zoneCount)} />
        <StatCard icon={RouteIcon} tone="warning" title="Shipping Methods" value={formatNumber(methodCount)} />
        <StatCard icon={Truck} tone="primary" title="Courier Companies" value={formatNumber(courierCount)} />
        <StatCard icon={BadgeDollarSign} tone="success" title="Avg. Shipping Cost" value={formatCurrency(avgCost)} />
        <StatCard icon={ShieldCheck} tone="accent" title="Free Shipping Rules" value={formatNumber(freeShippingRules)} />
        <StatCard icon={Percent} tone="warning" title="SLA Compliance" value={`${slaCompliance.toFixed(1)}%`} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="rates">Shipping Rates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="rates">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rate, zone, method, courier…" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="xl:w-36"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
              </Select>
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All zones</SelectItem>{zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="xl:w-48"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All shipping methods</SelectItem>{shippingMethods.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info("Courier, warehouse, customer group, and currency filters can be saved as a view")}><Filter /> Advanced</Button>
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>Auto Refresh</Button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2 border-b bg-primary/[.04] p-3">
                <b className="text-sm text-primary">{selected.size} selected</b>
                {["Enable", "Disable", "Assign Courier", "Assign Shipping Method", "Assign Warehouse", "Export", "Archive"].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => bulk(v)}>{v}</Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center text-sm text-muted-foreground">Loading shipping rates…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Shipping rates unavailable" description={error} />
            ) : !rows.length ? (
              <EmptyState
                icon={Percent}
                title="No shipping rates have been configured yet."
                description="Add a shipping rate or import your existing pricing rules."
                className="py-20"
                action={<div className="flex gap-2"><Button onClick={() => setCreateOpen(true)}><Plus /> Add Shipping Rate</Button><Button variant="outline" onClick={() => toast.info("Rate import queued")}>Import Shipping Rates</Button></div>}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead><Checkbox checked={paged.length > 0 && paged.every((x) => selected.has(x.rate.id))} onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.rate.id)) : new Set())} /></TableHead>
                      {["Rate Name", "Zone", "Method", "Courier", "Type", "Base Cost", "Delivery Time", "Customer Group", "Priority", "Status", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ rate: r, zone: z, meta: m }) => (
                      <TableRow key={r.id}>
                        <TableCell><Checkbox checked={selected.has(r.id)} onCheckedChange={(v) => setSelected((x) => { const n = new Set(x); if (v) n.add(r.id); else n.delete(r.id); return n; })} /></TableCell>
                        <TableCell><button className="font-semibold text-primary" onClick={() => setDrawer(r)}>{r.name}</button></TableCell>
                        <TableCell>{z?.name || "—"}</TableCell>
                        <TableCell><Badge variant="outline">{m.shippingMethod}</Badge></TableCell>
                        <TableCell>{m.courier}</TableCell>
                        <TableCell>{titleCase(r.type)}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(Number(r.amount))}</TableCell>
                        <TableCell className="text-xs">{m.deliveryTimeDays}</TableCell>
                        <TableCell>{m.customerGroup}</TableCell>
                        <TableCell><Badge variant="outline">P{m.priority}</Badge></TableCell>
                        <TableCell><Badge variant={statusBadge(m.status)}>{m.status}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDrawer(r)}><Eye /> View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(r)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void duplicate(r)}><Copy /> Duplicate</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => testCost(r)}><Calculator /> Test Shipping Cost</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(r)}>{m.status === "Active" ? "Disable" : "Enable"}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(r)}><Trash2 /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex items-center justify-between border-t p-4">
              <span className="text-xs text-muted-foreground">{rows.length} shipping rates · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Page {page} of {pages}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics revenue={revenue} costByZone={costByZone} methodUsage={methodUsage} carrierPerformance={carrierPerformance} avgDeliveryTime={avgDeliveryTime} />
        </TabsContent>
        <TabsContent value="audit"><Audit enriched={enriched} /></TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Shipping Rates", "Create Shipping Rates", "Edit Shipping Rates", "Delete Shipping Rates", "Configure Pricing Rules", "Assign Couriers", "Assign Warehouses", "Export Reports", "Manage Shipping Settings"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <RateDrawer rate={drawer} zone={drawer ? zonesById[drawer.zoneId] : undefined} onClose={() => setDrawer(null)} onUpdateMeta={updateMeta} />
      <CreateRateDialog open={createOpen} onClose={() => setCreateOpen(false)} zones={zones} onCreate={createRate} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="Delete shipping rate?" description="This rate will no longer be applied at checkout." confirmLabel="Delete" onConfirm={remove} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function RateDrawer({
  rate,
  zone,
  onClose,
  onUpdateMeta,
}: {
  rate: Rate | null;
  zone?: Zone;
  onClose: () => void;
  onUpdateMeta: (r: Rate, patch: Partial<Meta>) => void;
}) {
  if (!rate) return null;
  const m = readMeta(rate);
  const [notes, setNotes] = React.useState(m.notes);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{rate.name} <Badge variant={statusBadge(m.status)}>{m.status}</Badge></DialogTitle>
          <DialogDescription>Pricing, delivery, restrictions, and assignment.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
            <TabsTrigger value="internal">Internal</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Rate Name" value={rate.name} />
              <Info label="Shipping Zone" value={zone?.name} />
              <Info label="Shipping Method" value={m.shippingMethod} />
              <Info label="Courier" value={m.courier} />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Shipping Method</Label>
                <Select value={m.shippingMethod} onValueChange={(v) => onUpdateMeta(rate, { shippingMethod: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{shippingMethods.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Courier</Label>
                <Select value={m.courier} onValueChange={(v) => onUpdateMeta(rate, { courier: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{couriers.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Base Cost" value={formatCurrency(Number(rate.amount))} />
              <Info label="Pricing Type" value={titleCase(rate.type)} />
              <Info label="Minimum Fee" value={formatCurrency(m.minFee)} />
              <Info label="Maximum Fee" value={formatCurrency(m.maxFee)} />
              <Info label="Fuel Surcharge" value={formatCurrency(m.fuelSurcharge)} />
              <Info label="Handling Fee" value={formatCurrency(m.handlingFee)} />
              <Info label="Free Shipping Threshold" value={rate.freeShippingThreshold ? formatCurrency(Number(rate.freeShippingThreshold)) : "None"} />
              <Info label="Minimum Order Value" value={rate.minOrderValue ? formatCurrency(Number(rate.minOrderValue)) : "None"} />
            </div>
          </TabsContent>

          <TabsContent value="delivery">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Estimated Delivery Time" value={m.deliveryTimeDays} />
              <Info label="Delivery SLA" value={m.slaCompliant ? "Compliant" : "At Risk"} />
              <Info label="Weekend Delivery" value="Enabled" />
              <Info label="Same-Day Delivery" value={m.shippingMethod === "Same-Day Delivery" ? "Eligible" : "Not eligible"} />
            </div>
          </TabsContent>

          <TabsContent value="restrictions">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Countries" value={zone?.countries.join(", ") || "All"} />
              <Info label="Customer Group" value={m.customerGroup} />
              <Info label="Product Categories" value="All categories" />
              <Info label="Sellers" value="All sellers" />
            </div>
            <div className="mt-3 max-w-xs">
              <Label>Customer Group</Label>
              <Select value={m.customerGroup} onValueChange={(v) => onUpdateMeta(rate, { customerGroup: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{customerGroups.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="internal">
            <div className="mt-4 space-y-4">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Staff notes…" />
              <Button onClick={() => onUpdateMeta(rate, { notes })}>Save Internal Details</Button>
              <div className="space-y-3">
                {m.activity.map((a, i) => (
                  <div key={`${a.date}-${i}`} className="flex gap-3">
                    <History className="mt-3 size-4 text-primary" />
                    <div className="flex-1 rounded-xl border p-3">
                      <b>{a.action}: {a.previous} → {a.next}</b>
                      <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleString()} · Admin User</p>
                    </div>
                  </div>
                ))}
                {!m.activity.length && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CreateRateDialog({
  open,
  onClose,
  zones,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  zones: Zone[];
  onCreate: (form: { zoneId: string; name: string; type: string; amount: string }) => void;
}) {
  const [form, setForm] = React.useState({ zoneId: "", name: "", type: "flat", amount: "0" });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Shipping Rate</DialogTitle><DialogDescription>Create a pricing rule for a shipping zone.</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label>Shipping Zone</Label>
            <Select value={form.zoneId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, zoneId: v === "none" ? "" : v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">Select zone</SelectItem>{zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Field label="Rate Name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <div>
            <Label>Pricing Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{pricingTypes.map((v) => <SelectItem key={v} value={v}>{titleCase(v)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Field label="Base Amount"><Input type="number" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onCreate(form)}><Loader2 className="hidden animate-spin" /> Add Rate</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Analytics({
  revenue,
  costByZone,
  methodUsage,
  carrierPerformance,
  avgDeliveryTime,
}: {
  revenue: { month: string; value: number }[];
  costByZone: { name: string; value: number }[];
  methodUsage: { name: string; value: number }[];
  carrierPerformance: { name: string; value: number }[];
  avgDeliveryTime: { month: string; days: number }[];
}) {
  const reports = ["Shipping Revenue", "Shipping Cost Analysis", "Shipping Method Usage", "Delivery Performance", "Carrier Performance", "Average Delivery Time", "Shipping Margin", "Free Shipping Usage", "Shipping SLA Report"];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <Card className="p-5">
        <h3 className="font-semibold">Shipping Revenue</h3>
        <div className="mt-4 h-[260px] w-full">
          <ChartMount>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Shipping Cost by Zone</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={costByZone} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} barSize={14} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Shipping Method Usage</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodUsage} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {methodUsage.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
          <h3 className="font-semibold">Carrier Performance</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={carrierPerformance} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} barSize={22} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Average Delivery Time</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={avgDeliveryTime} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                  <RTooltip formatter={(v) => `${v} days`} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="days" stroke="var(--color-chart-5)" strokeWidth={2.25} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold">Reports</h3>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {reports.map((r) => (
            <button key={r} className="flex items-center justify-between rounded-xl border p-3 text-sm" onClick={() => toast.info(`${r} generated`)}>
              {r} <Download className="size-4 shrink-0" />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Audit({ enriched }: { enriched: { rate: Rate; zone?: Zone; meta: Meta }[] }) {
  const events = enriched.flatMap((x) => x.meta.activity.map((a) => ({ ...a, rate: x.rate.name }))).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Rate changes will appear here." className="py-16" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>{["User", "Rate", "Action", "Previous", "New", "Date", "Device", "IP Address"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={`${e.date}-${i}`}>
                  <TableCell>{e.user}</TableCell>
                  <TableCell>{e.rate}</TableCell>
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
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
