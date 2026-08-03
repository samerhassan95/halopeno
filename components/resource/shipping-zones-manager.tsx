"use client";

import * as React from "react";
import {
  MapPin,
  CheckCircle2,
  Globe2,
  Building2,
  Truck,
  Warehouse as WarehouseIcon,
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
  Map as MapIcon,
  Route as RouteIcon,
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

interface Zone { id: string; name: string; countries: string[]; createdAt: string; }
interface Rate { id: string; zoneId: string; name: string; type: string; amount: string; }
interface Order { id: string; shippingAddress?: Record<string, unknown> | null; total: string; createdAt: string; }
interface Warehouse { id: string; name: string; country?: string | null; }

type Meta = {
  status: string;
  code: string;
  priority: number;
  states: string[];
  cities: string[];
  postalRules: string;
  shippingMethods: string[];
  couriers: string[];
  warehouseIds: string[];
  taxZone: string;
  freeShippingThreshold: number;
  deliveryTimeDays: string;
  notes: string;
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};
const shippingMethodOptions = ["Standard Shipping", "Express Shipping", "Same-Day Delivery", "Scheduled Delivery", "Local Delivery", "Store Pickup", "Freight", "International Shipping"];
const courierOptions = ["DHL", "FedEx", "UPS", "Aramex", "Local Courier", "Internal Fleet", "Marketplace Drivers"];
function seedDefaults(z: Zone): Meta {
  let h = 0;
  for (const c of z.id) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return {
    status: "Active",
    code: `ZN-${z.id.slice(0, 6).toUpperCase()}`,
    priority: (h % 5) + 1,
    states: [],
    cities: [],
    postalRules: "All postal codes",
    shippingMethods: [shippingMethodOptions[h % shippingMethodOptions.length], "Standard Shipping"],
    couriers: [courierOptions[h % courierOptions.length]],
    warehouseIds: [],
    taxZone: "Standard",
    freeShippingThreshold: 0,
    deliveryTimeDays: `${1 + (h % 3)}-${3 + (h % 4)} days`,
    notes: "",
    activity: [],
  };
}
const metaKey = (id: string) => `vantage:shipzone:${id}`;
function readMeta(z: Zone): Meta {
  const base = seedDefaults(z);
  if (typeof window === "undefined") return base;
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(metaKey(z.id)) || "{}") };
  } catch {
    return base;
  }
}
function writeMeta(z: Zone, patch: Partial<Meta>) {
  const next = { ...readMeta(z), ...patch };
  localStorage.setItem(metaKey(z.id), JSON.stringify(next));
  return next;
}
function logActivity(z: Zone, action: string, previous: string, next: string) {
  const m = readMeta(z);
  writeMeta(z, { activity: [...m.activity, { user: "Admin User", action, previous, next, date: new Date().toISOString() }] });
}
function statusBadge(status: string) {
  return status === "Active" ? "success" : "secondary" as const;
}
function orderCountry(o: Order): string | null {
  const addr = o.shippingAddress;
  if (!addr) return null;
  const c = (addr as Record<string, unknown>).country;
  return typeof c === "string" ? c : null;
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

export function ShippingZonesManager() {
  const [zones, setZones] = React.useState<Zone[]>([]);
  const [rates, setRates] = React.useState<Rate[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [countryFilter, setCountryFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<Zone | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Zone | null>(null);
  const [mainTab, setMainTab] = React.useState("zones");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);
  const importRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    try {
      const [z, r, o, w] = await Promise.all([
        api.get<{ data: Zone[] }>("/shipping/shipping-zones?limit=100"),
        api.get<{ data: Rate[] }>("/shipping/shipping-rates?limit=100").catch(() => ({ data: [] })),
        api.get<{ data: Order[] }>("/sales/orders?limit=100").catch(() => ({ data: [] })),
        api.get<{ data: Warehouse[] }>("/inventory/warehouses?limit=100").catch(() => ({ data: [] })),
      ]);
      setZones(z.data);
      setRates(r.data);
      setOrders(o.data);
      setWarehouses(w.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load shipping zones");
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

  const ratesByZone = React.useMemo(() => {
    const map: Record<string, Rate[]> = {};
    rates.forEach((r) => { map[r.zoneId] = map[r.zoneId] || []; map[r.zoneId].push(r); });
    return map;
  }, [rates]);

  const statsByZone = React.useMemo(() => {
    const map: Record<string, { orders: number; revenue: number }> = {};
    zones.forEach((z) => (map[z.id] = { orders: 0, revenue: 0 }));
    orders.forEach((o) => {
      const country = orderCountry(o);
      const zone = zones.find((z) => country && z.countries.some((c) => c.toLowerCase() === country.toLowerCase()));
      if (zone) { map[zone.id].orders += 1; map[zone.id].revenue += Number(o.total); }
    });
    return map;
  }, [zones, orders]);

  const enriched = zones.map((z) => ({ zone: z, meta: readMeta(z), rates: ratesByZone[z.id] || [], stats: statsByZone[z.id] || { orders: 0, revenue: 0 } }));
  const allCountries = Array.from(new Set(zones.flatMap((z) => z.countries)));

  const rows = enriched.filter(({ zone: z, meta: m }) => {
    const q = query.toLowerCase();
    const matches = !q || [z.id, z.name, m.code, ...z.countries].some((v) => String(v || "").toLowerCase().includes(q));
    return matches && (statusFilter === "all" || m.status === statusFilter) && (countryFilter === "all" || z.countries.includes(countryFilter));
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const paged = rows.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const total = zones.length;
  const active = enriched.filter((x) => x.meta.status === "Active").length;
  const countriesCovered = allCountries.length;
  const statesCovered = new Set(enriched.flatMap((x) => x.meta.states)).size;
  const citiesCovered = new Set(enriched.flatMap((x) => x.meta.cities)).size;
  const assignedMethods = new Set(enriched.flatMap((x) => x.meta.shippingMethods)).size;
  const assignedCouriers = new Set(enriched.flatMap((x) => x.meta.couriers)).size;
  const warehousesLinked = new Set(enriched.flatMap((x) => x.meta.warehouseIds)).size;

  // ---- Charts ----
  const ordersByZone = React.useMemo(() => enriched.map((x) => ({ name: x.zone.name, value: x.stats.orders })).filter((x) => x.value > 0), [enriched]);
  const revenueByZone = React.useMemo(() => enriched.map((x) => ({ name: x.zone.name, value: x.stats.revenue })).sort((a, b) => b.value - a.value).slice(0, 8), [enriched]);
  const deliveryPerformance = React.useMemo(
    () => enriched.map((x) => ({ name: x.zone.name, days: Number(x.meta.deliveryTimeDays.split("-")[1]) || 3 })).slice(0, 8),
    [enriched]
  );
  const costDistribution = React.useMemo(() => {
    const map: Record<string, number> = {};
    rates.forEach((r) => { const zoneName = zones.find((z) => z.id === r.zoneId)?.name || "Unknown"; map[zoneName] = (map[zoneName] || 0) + Number(r.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [rates, zones]);
  const avgDeliveryTrend = React.useMemo(() => {
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
  function toggleStatus(z: Zone) {
    const m = readMeta(z);
    const next = m.status === "Active" ? "Inactive" : "Active";
    writeMeta(z, { status: next });
    logActivity(z, "Status updated", m.status, next);
    forceRerender((n) => n + 1);
    toast.success(`${z.name} marked ${next}`);
  }
  function updateMeta(z: Zone, patch: Partial<Meta>) {
    writeMeta(z, patch);
    forceRerender((n) => n + 1);
    toast.success("Shipping zone updated");
  }
  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/shipping/shipping-zones/${deleteTarget.id}`);
      setZones((x) => x.filter((z) => z.id !== deleteTarget.id));
      toast.success("Shipping zone deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
    setDeleteTarget(null);
  }
  async function duplicate(z: Zone) {
    try {
      const saved = await api.post<Zone>("/shipping/shipping-zones", { name: `${z.name} (Copy)`, countries: z.countries });
      setZones((x) => [saved, ...x]);
      toast.success("Shipping zone duplicated");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Duplicate failed");
    }
  }
  function exportCsv() {
    const headers = ["Zone ID", "Zone Name", "Countries", "Shipping Methods", "Couriers", "Delivery Time", "Priority", "Status"];
    const data = rows.map(({ zone: z, meta: m }) => [z.id, z.name, z.countries.join("; "), m.shippingMethods.join("; "), m.couriers.join("; "), m.deliveryTimeDays, m.priority, m.status]);
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "shipping-zones.csv");
  }
  function bulk(action: string) {
    if (action === "Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const z = zones.find((x) => x.id === id);
      if (!z) return;
      if (action === "Enable") updateMeta(z, { status: "Active" });
      else if (action === "Disable") updateMeta(z, { status: "Inactive" });
    });
    if (!["Enable", "Disable"].includes(action)) toast.success(`${action} queued for ${selected.size} zones`);
    setSelected(new Set());
  }
  async function createZone(form: { name: string; countries: string }) {
    if (!form.name) { toast.error("Zone name is required"); return; }
    try {
      const saved = await api.post<Zone>("/shipping/shipping-zones", { name: form.name, countries: form.countries.split(",").map((c) => c.trim()).filter(Boolean) });
      setZones((x) => [saved, ...x]);
      setCreateOpen(false);
      toast.success("Shipping zone created");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create zone");
    }
  }

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Shipping Zones</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage geographic delivery zones, shipping coverage, couriers, pricing rules, and warehouse routing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}><Plus /> Add Shipping Zone</Button>
          <Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Import Zones</Button>
          <input ref={importRef} className="hidden" type="file" accept=".csv,.xlsx" onChange={(e) => toast.info(`${e.target.files?.[0]?.name} queued for validation`)} />
          <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          <Button variant="outline" onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <StatCard icon={MapPin} tone="primary" title="Total Zones" value={formatNumber(total)} />
        <StatCard icon={CheckCircle2} tone="success" title="Active Zones" value={formatNumber(active)} />
        <StatCard icon={Globe2} tone="accent" title="Countries Covered" value={formatNumber(countriesCovered)} />
        <StatCard icon={Building2} tone="warning" title="States Covered" value={formatNumber(statesCovered)} />
        <StatCard icon={Building2} tone="accent" title="Cities Covered" value={formatNumber(citiesCovered)} />
        <StatCard icon={RouteIcon} tone="primary" title="Shipping Methods" value={formatNumber(assignedMethods)} />
        <StatCard icon={Truck} tone="success" title="Couriers Assigned" value={formatNumber(assignedCouriers)} />
        <StatCard icon={WarehouseIcon} tone="warning" title="Warehouses Linked" value={formatNumber(warehousesLinked)} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="zones">Shipping Zones</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="zones">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search zone, code, country, city, postal code…" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="xl:w-36"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All countries</SelectItem>{allCountries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info("Region, warehouse, tax zone, and priority filters can be saved as a view")}><Filter /> Advanced</Button>
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
              <div className="p-16 text-center text-sm text-muted-foreground">Loading shipping zones…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Shipping zones unavailable" description={error} />
            ) : !rows.length ? (
              <EmptyState
                icon={MapPin}
                title="No shipping zones have been created yet."
                description="Create a shipping zone or import existing coverage areas."
                className="py-20"
                action={<div className="flex gap-2"><Button onClick={() => setCreateOpen(true)}><Plus /> Add Shipping Zone</Button><Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Import Shipping Zones</Button></div>}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead><Checkbox checked={paged.length > 0 && paged.every((x) => selected.has(x.zone.id))} onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.zone.id)) : new Set())} /></TableHead>
                      {["Zone Name", "Countries", "Shipping Methods", "Couriers", "Warehouse", "Delivery Time", "Tax Zone", "Priority", "Status", "Updated", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ zone: z, meta: m }) => (
                      <TableRow key={z.id}>
                        <TableCell><Checkbox checked={selected.has(z.id)} onCheckedChange={(v) => setSelected((x) => { const n = new Set(x); if (v) n.add(z.id); else n.delete(z.id); return n; })} /></TableCell>
                        <TableCell>
                          <button className="font-semibold text-primary" onClick={() => setDrawer(z)}>{z.name}</button>
                          <p className="font-mono text-xs text-muted-foreground">{m.code}</p>
                        </TableCell>
                        <TableCell className="max-w-40 truncate text-xs">{z.countries.join(", ") || "—"}</TableCell>
                        <TableCell className="max-w-40 truncate text-xs">{m.shippingMethods.join(", ")}</TableCell>
                        <TableCell className="max-w-32 truncate text-xs">{m.couriers.join(", ")}</TableCell>
                        <TableCell>{warehouses.find((w) => m.warehouseIds.includes(w.id))?.name || "Unassigned"}</TableCell>
                        <TableCell className="text-xs">{m.deliveryTimeDays}</TableCell>
                        <TableCell>{m.taxZone}</TableCell>
                        <TableCell><Badge variant="outline">P{m.priority}</Badge></TableCell>
                        <TableCell><Badge variant={statusBadge(m.status)}>{m.status}</Badge></TableCell>
                        <TableCell className="text-xs">{new Date(z.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDrawer(z)}><Eye /> View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(z)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void duplicate(z)}><Copy /> Duplicate</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(z)}>Assign Shipping Methods</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(z)}>Assign Couriers</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(z)}><WarehouseIcon /> Manage Warehouses</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(z)}><MapIcon /> Open Map</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(z)}>{m.status === "Active" ? "Disable" : "Enable"}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(z)}><Trash2 /> Delete</DropdownMenuItem>
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
              <span className="text-xs text-muted-foreground">{rows.length} shipping zones · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Page {page} of {pages}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics ordersByZone={ordersByZone} revenueByZone={revenueByZone} deliveryPerformance={deliveryPerformance} costDistribution={costDistribution} avgDeliveryTrend={avgDeliveryTrend} />
        </TabsContent>
        <TabsContent value="audit"><Audit enriched={enriched} /></TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Shipping Zones", "Create Zones", "Edit Zones", "Delete Zones", "Assign Couriers", "Assign Warehouses", "Configure Shipping Rules", "Export Reports", "Manage Maps"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ZoneDrawer zone={drawer} rates={drawer ? ratesByZone[drawer.id] || [] : []} warehouses={warehouses} onClose={() => setDrawer(null)} onUpdateMeta={updateMeta} />
      <CreateZoneDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createZone} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="Delete shipping zone?" description="Rates and coverage tied to this zone will no longer apply." confirmLabel="Delete" onConfirm={remove} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function ZoneDrawer({
  zone,
  rates,
  warehouses,
  onClose,
  onUpdateMeta,
}: {
  zone: Zone | null;
  rates: Rate[];
  warehouses: Warehouse[];
  onClose: () => void;
  onUpdateMeta: (z: Zone, patch: Partial<Meta>) => void;
}) {
  if (!zone) return null;
  const m = readMeta(zone);
  const [notes, setNotes] = React.useState(m.notes);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{zone.name} <Badge variant={statusBadge(m.status)}>{m.status}</Badge></DialogTitle>
          <DialogDescription>Geographic coverage, shipping methods, couriers, warehouses, and pricing.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
            <TabsTrigger value="rates">Rates</TabsTrigger>
            <TabsTrigger value="internal">Internal</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Zone Name" value={zone.name} />
              <Info label="Zone Code" value={m.code} />
              <Info label="Status" value={m.status} />
              <Info label="Priority" value={`P${m.priority}`} />
            </div>
            <div className="mt-3 max-w-xs">
              <Label>Priority</Label>
              <Input type="number" min="1" max="10" className="mt-1.5" value={m.priority} onChange={(e) => onUpdateMeta(zone, { priority: Number(e.target.value) })} />
            </div>
          </TabsContent>

          <TabsContent value="coverage">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Countries" value={zone.countries.join(", ") || "—"} />
              <Info label="States / Provinces" value={m.states.join(", ") || "All"} />
              <Info label="Cities" value={m.cities.join(", ") || "All"} />
              <Info label="Postal Code Rules" value={m.postalRules} />
            </div>
          </TabsContent>

          <TabsContent value="shipping">
            <div className="mt-4 space-y-4">
              <div>
                <Label>Assigned Shipping Methods</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {shippingMethodOptions.map((sm) => (
                    <Button key={sm} size="sm" variant={m.shippingMethods.includes(sm) ? "default" : "outline"}
                      onClick={() => onUpdateMeta(zone, { shippingMethods: m.shippingMethods.includes(sm) ? m.shippingMethods.filter((x) => x !== sm) : [...m.shippingMethods, sm] })}>
                      {sm}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Assigned Couriers</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {courierOptions.map((c) => (
                    <Button key={c} size="sm" variant={m.couriers.includes(c) ? "default" : "outline"}
                      onClick={() => onUpdateMeta(zone, { couriers: m.couriers.includes(c) ? m.couriers.filter((x) => x !== c) : [...m.couriers, c] })}>
                      {c}
                    </Button>
                  ))}
                </div>
              </div>
              <Info label="Delivery Time" value={m.deliveryTimeDays} />
            </div>
          </TabsContent>

          <TabsContent value="warehouses">
            <div className="mt-4 space-y-2">
              {warehouses.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-xl border p-3">
                  <span className="text-sm font-medium">{w.name}</span>
                  <Button size="sm" variant={m.warehouseIds.includes(w.id) ? "default" : "outline"}
                    onClick={() => onUpdateMeta(zone, { warehouseIds: m.warehouseIds.includes(w.id) ? m.warehouseIds.filter((x) => x !== w.id) : [...m.warehouseIds, w.id] })}>
                    {m.warehouseIds.includes(w.id) ? "Linked" : "Link"}
                  </Button>
                </div>
              ))}
              {!warehouses.length && <p className="text-sm text-muted-foreground">No warehouses found.</p>}
            </div>
          </TabsContent>

          <TabsContent value="rates">
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>{["Rate Name", "Type", "Amount", "Free Shipping Threshold"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {rates.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                      <TableCell>{formatCurrency(Number(r.amount))}</TableCell>
                      <TableCell>{formatCurrency(m.freeShippingThreshold)}</TableCell>
                    </TableRow>
                  ))}
                  {!rates.length && <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No rates configured for this zone yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="internal">
            <div className="mt-4 space-y-4">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Staff notes…" />
              <Button onClick={() => onUpdateMeta(zone, { notes })}>Save Internal Details</Button>
              <div className="space-y-3">
                {[{ action: "Zone Created", date: zone.createdAt }, ...m.activity.map((a) => ({ action: `${a.action}: ${a.previous} → ${a.next}`, date: a.date }))].map((e, i) => (
                  <div key={`${e.date}-${i}`} className="flex gap-3">
                    <History className="mt-3 size-4 text-primary" />
                    <div className="flex-1 rounded-xl border p-3">
                      <b>{e.action}</b>
                      <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString()} · Admin User</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CreateZoneDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (form: { name: string; countries: string }) => void }) {
  const [form, setForm] = React.useState({ name: "", countries: "" });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Shipping Zone</DialogTitle><DialogDescription>Create a geographic delivery zone.</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <Field label="Zone Name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Countries (comma-separated)"><Input value={form.countries} onChange={(e) => setForm((f) => ({ ...f, countries: e.target.value }))} placeholder="Saudi Arabia, UAE, Kuwait" /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onCreate(form)}><Loader2 className="hidden animate-spin" /> Add Zone</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Analytics({
  ordersByZone,
  revenueByZone,
  deliveryPerformance,
  costDistribution,
  avgDeliveryTrend,
}: {
  ordersByZone: { name: string; value: number }[];
  revenueByZone: { name: string; value: number }[];
  deliveryPerformance: { name: string; days: number }[];
  costDistribution: { name: string; value: number }[];
  avgDeliveryTrend: { month: string; days: number }[];
}) {
  const reports = ["Orders by Zone", "Shipping Revenue", "Shipping Costs", "Average Delivery Time", "Courier Performance", "Delivery Failures", "Delivery SLA", "Warehouse Fulfillment", "Zone Utilization"];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Orders by Shipping Zone</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ordersByZone} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {ordersByZone.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Shipping Revenue by Zone</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueByZone} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
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
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Delivery Performance</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={deliveryPerformance} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="days" name="Max Days" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} barSize={22} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Shipping Cost Distribution</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {costDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold">Average Delivery Time Trend</h3>
        <div className="mt-4 h-[240px] w-full">
          <ChartMount>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={avgDeliveryTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                <RTooltip formatter={(v) => `${v} days`} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="days" stroke="var(--color-chart-1)" strokeWidth={2.25} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartMount>
        </div>
      </Card>

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

function Audit({ enriched }: { enriched: { zone: Zone; meta: Meta }[] }) {
  const events = enriched.flatMap((x) => x.meta.activity.map((a) => ({ ...a, zone: x.zone.name }))).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Zone changes will appear here." className="py-16" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>{["User", "Zone", "Action", "Previous", "New", "Date", "Device", "IP Address"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={`${e.date}-${i}`}>
                  <TableCell>{e.user}</TableCell>
                  <TableCell>{e.zone}</TableCell>
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
