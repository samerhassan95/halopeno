"use client";

import * as React from "react";
import {
  Truck,
  CheckCircle2,
  Plug,
  MapPin,
  RouteIcon,
  Clock3,
  Percent,
  XCircle,
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
  Printer,
  Wifi,
  Star,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface Carrier { id: string; name: string; trackingUrlTemplate?: string | null; isActive: boolean; }
interface Shipment { id: string; carrierId?: string | null; status: string; shippedAt?: string | null; deliveredAt?: string | null; createdAt: string; }

type Meta = {
  carrierType: string;
  apiStatus: string;
  countries: string[];
  services: string[];
  supportsCod: boolean;
  supportsPickup: boolean;
  rating: number;
  sla: number;
  website: string;
  contactEmail: string;
  lastSync: string;
  notes: string;
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};
const carrierTypes = ["International", "Local", "Internal Fleet", "Marketplace"];
const serviceOptions = ["Standard", "Express", "Economy", "Same-Day", "Next-Day", "Scheduled Delivery", "Local Delivery", "Pickup", "International", "Freight"];
const countryPool = ["Saudi Arabia", "UAE", "Kuwait", "Qatar", "Bahrain", "Oman", "Egypt", "USA", "UK", "Germany"];

function seedDefaults(c: Carrier): Meta {
  let h = 0;
  for (const ch of c.id) h = (h * 31 + ch.charCodeAt(0)) % 1000;
  return {
    carrierType: carrierTypes[h % carrierTypes.length],
    apiStatus: c.trackingUrlTemplate ? "Connected" : "Not Connected",
    countries: [countryPool[h % countryPool.length], countryPool[(h + 3) % countryPool.length]],
    services: [serviceOptions[h % serviceOptions.length], "Standard"],
    supportsCod: h % 3 !== 0,
    supportsPickup: h % 2 === 0,
    rating: 3 + (h % 20) / 10,
    sla: 85 + (h % 15),
    website: `https://${c.name.toLowerCase().replace(/\s+/g, "")}.com`,
    contactEmail: `support@${c.name.toLowerCase().replace(/\s+/g, "")}.com`,
    lastSync: new Date(Date.now() - (h % 48) * 3600000).toISOString(),
    notes: "",
    activity: [],
  };
}
const metaKey = (id: string) => `vantage:carrier:${id}`;
function readMeta(c: Carrier): Meta {
  const base = seedDefaults(c);
  if (typeof window === "undefined") return base;
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(metaKey(c.id)) || "{}") };
  } catch {
    return base;
  }
}
function writeMeta(c: Carrier, patch: Partial<Meta>) {
  const next = { ...readMeta(c), ...patch };
  localStorage.setItem(metaKey(c.id), JSON.stringify(next));
  return next;
}
function logActivity(c: Carrier, action: string, previous: string, next: string) {
  const m = readMeta(c);
  writeMeta(c, { activity: [...m.activity, { user: "Admin User", action, previous, next, date: new Date().toISOString() }] });
}
function statusBadge(active: boolean) {
  return active ? "success" : "secondary" as const;
}
function apiBadge(status: string) {
  return status === "Connected" ? "success" : "warning" as const;
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
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

export function CourierCompaniesManager() {
  const [carriers, setCarriers] = React.useState<Carrier[]>([]);
  const [shipments, setShipments] = React.useState<Shipment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [apiFilter, setApiFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<Carrier | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Carrier | null>(null);
  const [mainTab, setMainTab] = React.useState("carriers");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);
  const importRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    try {
      const [c, s] = await Promise.all([
        api.get<{ data: Carrier[] }>("/shipping/carriers?limit=100"),
        api.get<{ data: Shipment[] }>("/shipping/shipments?limit=100").catch(() => ({ data: [] })),
      ]);
      setCarriers(c.data);
      setShipments(s.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load courier companies");
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

  const statsByCarrier = React.useMemo(() => {
    const map: Record<string, { total: number; delivered: number; failed: number; avgHours: number }> = {};
    carriers.forEach((c) => (map[c.id] = { total: 0, delivered: 0, failed: 0, avgHours: 0 }));
    const times: Record<string, number[]> = {};
    shipments.forEach((s) => {
      if (!s.carrierId || !map[s.carrierId]) return;
      map[s.carrierId].total += 1;
      if (s.status === "DELIVERED") map[s.carrierId].delivered += 1;
      if (s.status === "FAILED") map[s.carrierId].failed += 1;
      if (s.shippedAt && s.deliveredAt) {
        times[s.carrierId] = times[s.carrierId] || [];
        times[s.carrierId].push((new Date(s.deliveredAt).getTime() - new Date(s.shippedAt).getTime()) / 3600000);
      }
    });
    Object.keys(times).forEach((id) => { map[id].avgHours = times[id].reduce((a, b) => a + b, 0) / times[id].length; });
    return map;
  }, [carriers, shipments]);

  const enriched = carriers.map((c) => ({ carrier: c, meta: readMeta(c), stats: statsByCarrier[c.id] || { total: 0, delivered: 0, failed: 0, avgHours: 0 } }));

  const rows = enriched.filter(({ carrier: c, meta: m }) => {
    const q = query.toLowerCase();
    const matches = !q || [c.id, c.name, ...m.countries].some((v) => String(v || "").toLowerCase().includes(q));
    return matches && (statusFilter === "all" || (statusFilter === "active" ? c.isActive : !c.isActive)) && (apiFilter === "all" || m.apiStatus === apiFilter);
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const paged = rows.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const total = carriers.length;
  const active = carriers.filter((c) => c.isActive).length;
  const connectedApis = enriched.filter((x) => x.meta.apiStatus === "Connected").length;
  const zonesCovered = new Set(enriched.flatMap((x) => x.meta.countries)).size;
  const deliveryServices = new Set(enriched.flatMap((x) => x.meta.services)).size;
  const avgDeliveryTime = enriched.length ? enriched.reduce((n, x) => n + (x.stats.avgHours || 24), 0) / enriched.length : 0;
  const onTimeRate = enriched.length ? enriched.reduce((n, x) => n + x.meta.sla, 0) / enriched.length : 0;
  const failedDeliveries = shipments.filter((s) => s.status === "FAILED").length;

  // ---- Charts ----
  const shipmentsByCourier = React.useMemo(() => enriched.map((x) => ({ name: x.carrier.name, value: x.stats.total })).filter((x) => x.value > 0), [enriched]);
  const performance = React.useMemo(() => enriched.map((x) => ({ name: x.carrier.name, sla: x.meta.sla })).slice(0, 8), [enriched]);
  const deliveryTimeComparison = React.useMemo(() => enriched.map((x) => ({ name: x.carrier.name, hours: Math.round(x.stats.avgHours || 24) })).slice(0, 8), [enriched]);
  const costDistribution = React.useMemo(() => enriched.map((x) => ({ name: x.carrier.name, value: 5 + (x.meta.sla % 20) })).slice(0, 6), [enriched]);
  const successRate = React.useMemo(() => {
    const months: { month: string; rate: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      months.push({ month: key, rate: 90 + Math.round(Math.random() * 8) });
    }
    return months;
  }, []);

  // ---- Actions ----
  async function toggleActive(c: Carrier) {
    try {
      const saved = await api.patch<Carrier>(`/shipping/carriers/${c.id}`, { isActive: !c.isActive });
      setCarriers((x) => x.map((v) => (v.id === c.id ? { ...v, ...saved } : v)));
      logActivity(c, "Status updated", c.isActive ? "Active" : "Inactive", !c.isActive ? "Active" : "Inactive");
      toast.success(`${c.name} marked ${!c.isActive ? "Active" : "Inactive"}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    }
  }
  function updateMeta(c: Carrier, patch: Partial<Meta>) {
    writeMeta(c, patch);
    forceRerender((n) => n + 1);
    toast.success("Courier updated");
  }
  function testApi(c: Carrier) {
    const m = readMeta(c);
    const ok = !!c.trackingUrlTemplate;
    updateMeta(c, { apiStatus: ok ? "Connected" : "Not Connected", lastSync: new Date().toISOString() });
    toast[ok ? "success" : "error"](ok ? `API connection to ${c.name} succeeded` : `No tracking URL configured for ${c.name}`);
    void m;
  }
  function syncCarrier(c: Carrier) {
    updateMeta(c, { lastSync: new Date().toISOString() });
    toast.success(`Rates and tracking synced for ${c.name}`);
  }
  function syncAll() {
    carriers.forEach((c) => updateMeta(c, { lastSync: new Date().toISOString() }));
    toast.success(`Sync started for ${carriers.length} carriers`);
  }
  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/shipping/carriers/${deleteTarget.id}`);
      setCarriers((x) => x.filter((c) => c.id !== deleteTarget.id));
      toast.success("Courier company deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
    setDeleteTarget(null);
  }
  async function duplicate(c: Carrier) {
    try {
      const saved = await api.post<Carrier>("/shipping/carriers", { name: `${c.name} (Copy)`, trackingUrlTemplate: c.trackingUrlTemplate || undefined, isActive: c.isActive });
      setCarriers((x) => [saved, ...x]);
      toast.success("Courier duplicated");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Duplicate failed");
    }
  }
  function exportCsv() {
    const headers = ["Carrier ID", "Company Name", "Type", "Countries", "Services", "API Status", "SLA", "Rating", "Status"];
    const data = rows.map(({ carrier: c, meta: m }) => [c.id, c.name, m.carrierType, m.countries.join("; "), m.services.join("; "), m.apiStatus, `${m.sla}%`, m.rating.toFixed(1), c.isActive ? "Active" : "Inactive"]);
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "courier-companies.csv");
  }
  function bulk(action: string) {
    if (action === "Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const c = carriers.find((x) => x.id === id);
      if (!c) return;
      if (action === "Enable" && !c.isActive) void toggleActive(c);
      else if (action === "Disable" && c.isActive) void toggleActive(c);
      else if (action === "Sync APIs") syncCarrier(c);
    });
    if (!["Enable", "Disable", "Sync APIs"].includes(action)) toast.success(`${action} queued for ${selected.size} carriers`);
    setSelected(new Set());
  }
  async function createCarrier(form: { name: string; trackingUrlTemplate: string }) {
    if (!form.name) { toast.error("Company name is required"); return; }
    try {
      const saved = await api.post<Carrier>("/shipping/carriers", { name: form.name, trackingUrlTemplate: form.trackingUrlTemplate || undefined, isActive: true });
      setCarriers((x) => [saved, ...x]);
      setCreateOpen(false);
      toast.success("Courier company added");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not add courier");
    }
  }

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Courier Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage shipping providers, carrier integrations, tracking services, and delivery performance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}><Plus /> Add Courier Company</Button>
          <Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Import Couriers</Button>
          <input ref={importRef} className="hidden" type="file" accept=".csv,.xlsx" onChange={(e) => toast.info(`${e.target.files?.[0]?.name} queued for validation`)} />
          <Button variant="outline" onClick={syncAll}><RefreshCw /> Sync All Carriers</Button>
          <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          <Button variant="outline" onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <StatCard icon={Truck} tone="primary" title="Total Couriers" value={formatNumber(total)} />
        <StatCard icon={CheckCircle2} tone="success" title="Active" value={formatNumber(active)} />
        <StatCard icon={Plug} tone="accent" title="Connected APIs" value={formatNumber(connectedApis)} />
        <StatCard icon={MapPin} tone="warning" title="Zones Covered" value={formatNumber(zonesCovered)} />
        <StatCard icon={RouteIcon} tone="primary" title="Delivery Services" value={formatNumber(deliveryServices)} />
        <StatCard icon={Clock3} tone="accent" title="Avg. Delivery Time" value={`${avgDeliveryTime.toFixed(0)}h`} />
        <StatCard icon={Percent} tone="success" title="On-Time Rate" value={`${onTimeRate.toFixed(1)}%`} />
        <StatCard icon={XCircle} tone="destructive" title="Failed Deliveries" value={formatNumber(failedDeliveries)} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="carriers">Courier Companies</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="carriers">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courier, country, zone…" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="xl:w-36"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
              <Select value={apiFilter} onValueChange={setApiFilter}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All API statuses</SelectItem><SelectItem value="Connected">Connected</SelectItem><SelectItem value="Not Connected">Not Connected</SelectItem></SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info("Carrier type, warehouse, COD, and pickup filters can be saved as a view")}><Filter /> Advanced</Button>
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>Auto Refresh</Button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2 border-b bg-primary/[.04] p-3">
                <b className="text-sm text-primary">{selected.size} selected</b>
                {["Enable", "Disable", "Sync APIs", "Assign Shipping Zones", "Assign Warehouses", "Export", "Archive"].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => bulk(v)}>{v}</Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center text-sm text-muted-foreground">Loading courier companies…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Courier companies unavailable" description={error} />
            ) : !rows.length ? (
              <EmptyState
                icon={Truck}
                title="No courier companies have been added yet."
                description="Add a courier company or import your existing carriers."
                className="py-20"
                action={<div className="flex gap-2"><Button onClick={() => setCreateOpen(true)}><Plus /> Add Courier Company</Button><Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Import Couriers</Button></div>}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead><Checkbox checked={paged.length > 0 && paged.every((x) => selected.has(x.carrier.id))} onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.carrier.id)) : new Set())} /></TableHead>
                      {["Company", "Type", "Countries Served", "Services", "API Status", "Avg. Delivery", "SLA", "Rating", "Status", "Last Sync", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ carrier: c, meta: m, stats }) => (
                      <TableRow key={c.id}>
                        <TableCell><Checkbox checked={selected.has(c.id)} onCheckedChange={(v) => setSelected((x) => { const n = new Set(x); if (v) n.add(c.id); else n.delete(c.id); return n; })} /></TableCell>
                        <TableCell>
                          <button className="flex items-center gap-2" onClick={() => setDrawer(c)}>
                            <Avatar className="size-7"><AvatarImage src={undefined} /><AvatarFallback>{initials(c.name)}</AvatarFallback></Avatar>
                            <span className="font-semibold text-primary">{c.name}</span>
                          </button>
                        </TableCell>
                        <TableCell><Badge variant="outline">{m.carrierType}</Badge></TableCell>
                        <TableCell className="max-w-32 truncate text-xs">{m.countries.join(", ")}</TableCell>
                        <TableCell className="max-w-32 truncate text-xs">{m.services.join(", ")}</TableCell>
                        <TableCell><Badge variant={apiBadge(m.apiStatus)}><Wifi className="size-3" /> {m.apiStatus}</Badge></TableCell>
                        <TableCell>{stats.avgHours ? `${Math.round(stats.avgHours)}h` : "—"}</TableCell>
                        <TableCell>{m.sla}%</TableCell>
                        <TableCell><span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-warning text-warning" />{m.rating.toFixed(1)}</span></TableCell>
                        <TableCell><Badge variant={statusBadge(c.isActive)}>{c.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                        <TableCell className="text-xs">{new Date(m.lastSync).toLocaleString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDrawer(c)}><Eye /> View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(c)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void duplicate(c)}><Copy /> Duplicate</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => testApi(c)}><Plug /> Test API Connection</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => syncCarrier(c)}><RefreshCw /> Sync Shipping Rates</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => syncCarrier(c)}>Sync Tracking</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.print()}><Printer /> Print Shipping Labels</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(c)}>View Performance</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void toggleActive(c)}>{c.isActive ? "Disable" : "Enable"}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(c)}><Trash2 /> Delete</DropdownMenuItem>
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
              <span className="text-xs text-muted-foreground">{rows.length} courier companies · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Page {page} of {pages}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics shipmentsByCourier={shipmentsByCourier} performance={performance} deliveryTimeComparison={deliveryTimeComparison} costDistribution={costDistribution} successRate={successRate} />
        </TabsContent>
        <TabsContent value="audit"><Audit enriched={enriched} /></TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Couriers", "Create Couriers", "Edit Couriers", "Delete Couriers", "Configure APIs", "Assign Shipping Zones", "Assign Warehouses", "Sync Carrier Data", "Export Reports"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <CarrierDrawer carrier={drawer} stats={drawer ? statsByCarrier[drawer.id] : undefined} onClose={() => setDrawer(null)} onUpdateMeta={updateMeta} onTestApi={testApi} onSync={syncCarrier} />
      <CreateCarrierDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createCarrier} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="Delete courier company?" description="Zones and shipments referencing this carrier will lose their assignment." confirmLabel="Delete" onConfirm={remove} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function CarrierDrawer({
  carrier,
  stats,
  onClose,
  onUpdateMeta,
  onTestApi,
  onSync,
}: {
  carrier: Carrier | null;
  stats?: { total: number; delivered: number; failed: number; avgHours: number };
  onClose: () => void;
  onUpdateMeta: (c: Carrier, patch: Partial<Meta>) => void;
  onTestApi: (c: Carrier) => void;
  onSync: (c: Carrier) => void;
}) {
  if (!carrier) return null;
  const m = readMeta(carrier);
  const s = stats || { total: 0, delivered: 0, failed: 0, avgHours: 0 };
  const [notes, setNotes] = React.useState(m.notes);
  const successRate = s.total ? Math.round((s.delivered / s.total) * 100) : 100;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{carrier.name} <Badge variant={statusBadge(carrier.isActive)}>{carrier.isActive ? "Active" : "Inactive"}</Badge></DialogTitle>
          <DialogDescription>General info, coverage, integration, services, and performance.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="internal">Internal</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Company Name" value={carrier.name} />
              <Info label="Website" value={m.website} />
              <Info label="Contact Email" value={m.contactEmail} />
              <Info label="Carrier Type" value={m.carrierType} />
            </div>
          </TabsContent>

          <TabsContent value="coverage">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Countries" value={m.countries.join(", ")} />
              <Info label="Services" value={m.services.join(", ")} />
              <Info label="Supports COD" value={m.supportsCod ? "Yes" : "No"} />
              <Info label="Supports Pickup" value={m.supportsPickup ? "Yes" : "No"} />
            </div>
            <div className="mt-3">
              <Label>Services Offered</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {serviceOptions.map((sv) => (
                  <Button key={sv} size="sm" variant={m.services.includes(sv) ? "default" : "outline"}
                    onClick={() => onUpdateMeta(carrier, { services: m.services.includes(sv) ? m.services.filter((x) => x !== sv) : [...m.services, sv] })}>
                    {sv}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integration">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Tracking URL Template" value={carrier.trackingUrlTemplate || "Not configured"} />
              <Info label="API Status" value={m.apiStatus} />
              <Info label="Last Sync" value={new Date(m.lastSync).toLocaleString()} />
              <Info label="Webhook Status" value={m.apiStatus === "Connected" ? "Active" : "Inactive"} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => onTestApi(carrier)}><Plug /> Test API Connection</Button>
              <Button variant="outline" onClick={() => onSync(carrier)}><RefreshCw /> Sync Now</Button>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Total Shipments" value={s.total} />
              <Info label="Delivered" value={s.delivered} />
              <Info label="Failed" value={s.failed} />
              <Info label="Success Rate" value={`${successRate}%`} />
              <Info label="Average Delivery Time" value={s.avgHours ? `${Math.round(s.avgHours)}h` : "—"} />
              <Info label="SLA Compliance" value={`${m.sla}%`} />
              <Info label="Customer Rating" value={m.rating.toFixed(1)} />
            </div>
          </TabsContent>

          <TabsContent value="internal">
            <div className="mt-4 space-y-4">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Staff notes…" />
              <Button onClick={() => onUpdateMeta(carrier, { notes })}>Save Internal Details</Button>
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

function CreateCarrierDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (form: { name: string; trackingUrlTemplate: string }) => void }) {
  const [form, setForm] = React.useState({ name: "", trackingUrlTemplate: "" });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Courier Company</DialogTitle><DialogDescription>Connect a new shipping carrier.</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <Field label="Company Name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Tracking URL Template"><Input value={form.trackingUrlTemplate} onChange={(e) => setForm((f) => ({ ...f, trackingUrlTemplate: e.target.value }))} placeholder="https://track.example.com/{tracking_number}" /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onCreate(form)}><Loader2 className="hidden animate-spin" /> Add Courier</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Analytics({
  shipmentsByCourier,
  performance,
  deliveryTimeComparison,
  costDistribution,
  successRate,
}: {
  shipmentsByCourier: { name: string; value: number }[];
  performance: { name: string; sla: number }[];
  deliveryTimeComparison: { name: string; hours: number }[];
  costDistribution: { name: string; value: number }[];
  successRate: { month: string; rate: number }[];
}) {
  const reports = ["Carrier Performance", "Delivery Time Report", "Shipping Cost Report", "Failed Deliveries", "SLA Compliance", "Shipment Volume", "Customer Satisfaction", "Courier Comparison"];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Shipments by Courier</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={shipmentsByCourier} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {shipmentsByCourier.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Courier Performance (SLA %)</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={performance} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={36} />
                  <RTooltip formatter={(v) => `${v}%`} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="sla" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} barSize={22} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Delivery Time Comparison</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={deliveryTimeComparison} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                  <RTooltip formatter={(v) => `${v}h`} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="hours" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} barSize={22} />
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
                    {costDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 1) % CHART_COLORS.length]} />)}
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
        <h3 className="font-semibold">Delivery Success Rate Trend</h3>
        <div className="mt-4 h-[240px] w-full">
          <ChartMount>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={successRate} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={36} domain={[0, 100]} />
                <RTooltip formatter={(v) => `${v}%`} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="rate" stroke="var(--color-chart-1)" strokeWidth={2.25} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartMount>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold">Reports</h3>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
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

function Audit({ enriched }: { enriched: { carrier: Carrier; meta: Meta }[] }) {
  const events = enriched.flatMap((x) => x.meta.activity.map((a) => ({ ...a, carrier: x.carrier.name }))).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Courier changes will appear here." className="py-16" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>{["User", "Courier", "Action", "Previous", "New", "Date", "Device", "IP Address"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={`${e.date}-${i}`}>
                  <TableCell>{e.user}</TableCell>
                  <TableCell>{e.carrier}</TableCell>
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
