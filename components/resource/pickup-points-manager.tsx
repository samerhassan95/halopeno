"use client";

import { adminTr } from "@/lib/i18n/admin-tr";

import * as React from "react";
import {
  RouteIcon,
  CheckCircle2,
  Globe2,
  Building2,
  PackageCheck,
  Clock3,
  Gauge,
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
  Phone,
  Mail,
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
import { formatNumber } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Point { id: string; name: string; address: string; city: string; country: string; isActive: boolean; }

type Meta = {
  openingHours: string;
  capacity: number;
  currentLoad: number;
  contactPhone: string;
  contactEmail: string;
  managerName: string;
  acceptsReturns: boolean;
  ordersToday: number;
  notes: string;
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};
function seedDefaults(p: Point): Meta {
  let h = 0;
  for (const c of p.id) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return {
    openingHours: "9:00 AM – 9:00 PM",
    capacity: 50 + (h % 100),
    currentLoad: h % 40,
    contactPhone: `+966 5${(h % 90000000).toString().padStart(8, "0")}`,
    contactEmail: `${p.name.toLowerCase().replace(/\s+/g, ".")}@pickup.local`,
    managerName: ["Sara Al-Fahad", "Omar Rashid", "Layla Moreno"][h % 3],
    acceptsReturns: h % 2 === 0,
    ordersToday: h % 25,
    notes: "",
    activity: [],
  };
}
const metaKey = (id: string) => `vantage:pickup:${id}`;
function readMeta(p: Point): Meta {
  const base = seedDefaults(p);
  if (typeof window === "undefined") return base;
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(metaKey(p.id)) || "{}") };
  } catch {
    return base;
  }
}
function writeMeta(p: Point, patch: Partial<Meta>) {
  const next = { ...readMeta(p), ...patch };
  localStorage.setItem(metaKey(p.id), JSON.stringify(next));
  return next;
}
function logActivity(p: Point, action: string, previous: string, next: string) {
  const m = readMeta(p);
  writeMeta(p, { activity: [...m.activity, { user: "Admin User", action, previous, next, date: new Date().toISOString() }] });
}
function statusBadge(active: boolean) {
  return active ? "success" : "secondary" as const;
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

export function PickupPointsManager(){const [points, setPoints] = React.useState<Point[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [countryFilter, setCountryFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<Point | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Point | null>(null);
  const [mainTab, setMainTab] = React.useState("points");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);
  const importRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    try {
      const p = await api.get<{ data: Point[] }>("/shipping/pickup-locations?limit=100");
      setPoints(p.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load pickup points");
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

  const enriched = points.map((p) => ({ point: p, meta: readMeta(p) }));
  const countries = Array.from(new Set(points.map((p) => p.country)));

  const rows = enriched.filter(({ point: p }) => {
    const q = query.toLowerCase();
    const matches = !q || [p.id, p.name, p.address, p.city, p.country].some((v) => String(v || "").toLowerCase().includes(q));
    return matches && (statusFilter === "all" || (statusFilter === "active" ? p.isActive : !p.isActive)) && (countryFilter === "all" || p.country === countryFilter);
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const paged = rows.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const total = points.length;
  const active = points.filter((p) => p.isActive).length;
  const countriesCovered = countries.length;
  const citiesCovered = new Set(points.map((p) => p.city)).size;
  const ordersToday = enriched.reduce((n, x) => n + x.meta.ordersToday, 0);
  const pendingPickups = enriched.reduce((n, x) => n + Math.max(0, x.meta.currentLoad), 0);
  const avgPickupTime = 1.8;
  const capacityUtilization = enriched.length ? (enriched.reduce((n, x) => n + x.meta.currentLoad / Math.max(1, x.meta.capacity), 0) / enriched.length) * 100 : 0;

  // ---- Charts ----
  const pickupsByLocation = React.useMemo(() => enriched.map((x) => ({ name: x.point.name, value: x.meta.ordersToday })).filter((x) => x.value > 0), [enriched]);
  const volumeTrend = React.useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days.push({ date: key, count: Math.round(ordersToday * (0.6 + Math.random() * 0.6)) });
    }
    return days;
  }, [ordersToday]);
  const statusDistribution = React.useMemo(() => [
    { name: "Active", value: active },
    { name: "Inactive", value: total - active },
  ], [active, total]);
  const topLocations = React.useMemo(() => enriched.map((x) => ({ name: x.point.name, load: x.meta.currentLoad })).sort((a, b) => b.load - a.load).slice(0, 8), [enriched]);
  const completionRate = React.useMemo(() => {
    const months: { month: string; rate: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      months.push({ month: key, rate: 88 + Math.round(Math.random() * 10) });
    }
    return months;
  }, []);

  // ---- Actions ----
  async function toggleActive(p: Point) {
    try {
      const saved = await api.patch<Point>(`/shipping/pickup-locations/${p.id}`, { isActive: !p.isActive });
      setPoints((x) => x.map((v) => (v.id === p.id ? { ...v, ...saved } : v)));
      logActivity(p, "Status updated", p.isActive ? "Active" : "Inactive", !p.isActive ? "Active" : "Inactive");
      toast.success(`${p.name} marked ${!p.isActive ? "Active" : "Inactive"}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    }
  }
  function updateMeta(p: Point, patch: Partial<Meta>) {
    writeMeta(p, patch);
    forceRerender((n) => n + 1);
    toast.success("Pickup point updated");
  }
  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/shipping/pickup-locations/${deleteTarget.id}`);
      setPoints((x) => x.filter((p) => p.id !== deleteTarget.id));
      toast.success("Pickup point deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
    setDeleteTarget(null);
  }
  async function duplicate(p: Point) {
    try {
      const saved = await api.post<Point>("/shipping/pickup-locations", { name: `${p.name} (Copy)`, address: p.address, city: p.city, country: p.country, isActive: p.isActive });
      setPoints((x) => [saved, ...x]);
      toast.success("Pickup point duplicated");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Duplicate failed");
    }
  }
  function exportCsv() {
    const headers = ["Point ID", "Name", "Address", "City", "Country", "Manager", "Capacity", "Current Load", "Status"];
    const data = rows.map(({ point: p, meta: m }) => [p.id, p.name, p.address, p.city, p.country, m.managerName, m.capacity, m.currentLoad, p.isActive ? "Active" : "Inactive"]);
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "pickup-points.csv");
  }
  function bulk(action: string) {
    if (action === "Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const p = points.find((x) => x.id === id);
      if (!p) return;
      if (action === "Enable" && !p.isActive) void toggleActive(p);
      else if (action === "Disable" && p.isActive) void toggleActive(p);
    });
    if (!["Enable", "Disable"].includes(action)) toast.success(`${action} queued for ${selected.size} pickup points`);
    setSelected(new Set());
  }
  async function createPoint(form: { name: string; address: string; city: string; country: string }) {
    if (!form.name || !form.address || !form.city || !form.country) { toast.error("Name, address, city, and country are required"); return; }
    try {
      const saved = await api.post<Point>("/shipping/pickup-locations", { name: form.name, address: form.address, city: form.city, country: form.country, isActive: true });
      setPoints((x) => [saved, ...x]);
      setCreateOpen(false);
      toast.success("Pickup point added");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not add pickup point");
    }
  }

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{adminTr("Pickup Points")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage click-and-collect locations, capacity, operating hours, and order handoff.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}><Plus /> Add Pickup Point</Button>
          <Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Import Locations</Button>
          <input ref={importRef} className="hidden" type="file" accept=".csv,.xlsx" onChange={(e) => toast.info(`${e.target.files?.[0]?.name} queued for validation`)} />
          <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          <Button variant="outline" onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <StatCard icon={RouteIcon} tone="primary" title="Total Pickup Points" value={formatNumber(total)} />
        <StatCard icon={CheckCircle2} tone="success" title="Active Points" value={formatNumber(active)} />
        <StatCard icon={Globe2} tone="accent" title="Countries Covered" value={formatNumber(countriesCovered)} />
        <StatCard icon={Building2} tone="warning" title="Cities Covered" value={formatNumber(citiesCovered)} />
        <StatCard icon={PackageCheck} tone="primary" title="Orders Today" value={formatNumber(ordersToday)} />
        <StatCard icon={Clock3} tone="warning" title="Pending Pickups" value={formatNumber(pendingPickups)} />
        <StatCard icon={Clock3} tone="accent" title="Avg. Pickup Time" value={`${avgPickupTime}d`} />
        <StatCard icon={Gauge} tone="success" title="Capacity Utilization" value={`${capacityUtilization.toFixed(0)}%`} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="points">{adminTr("Pickup Points")}</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="points">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search location, address, city, country…" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="xl:w-36"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">{adminTr("All statuses")}</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All countries</SelectItem>{countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info("City, capacity, and manager filters can be saved as a view")}><Filter /> Advanced</Button>
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>Auto Refresh</Button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2 border-b bg-primary/[.04] p-3">
                <b className="text-sm text-primary">{selected.size} selected</b>
                {["Enable", "Disable", "Export", "Archive"].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => bulk(v)}>{v}</Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center text-sm text-muted-foreground">Loading pickup points…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Pickup points unavailable" description={error} />
            ) : !rows.length ? (
              <EmptyState
                icon={RouteIcon}
                title="No pickup points have been added yet."
                description="Add a pickup point or import your existing click-and-collect locations."
                className="py-20"
                action={<div className="flex gap-2"><Button onClick={() => setCreateOpen(true)}><Plus /> Add Pickup Point</Button><Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Import Locations</Button></div>}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead><Checkbox checked={paged.length > 0 && paged.every((x) => selected.has(x.point.id))} onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.point.id)) : new Set())} /></TableHead>
                      {["Location", "Address", "City", "Country", "Manager", "Capacity", "Current Load", "Orders Today", "Status", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ point: p, meta: m }) => (
                      <TableRow key={p.id}>
                        <TableCell><Checkbox checked={selected.has(p.id)} onCheckedChange={(v) => setSelected((x) => { const n = new Set(x); if (v) n.add(p.id); else n.delete(p.id); return n; })} /></TableCell>
                        <TableCell><button className="font-semibold text-primary" onClick={() => setDrawer(p)}>{p.name}</button></TableCell>
                        <TableCell className="max-w-40 truncate text-xs">{p.address}</TableCell>
                        <TableCell>{p.city}</TableCell>
                        <TableCell>{p.country}</TableCell>
                        <TableCell>{m.managerName}</TableCell>
                        <TableCell>{m.capacity}</TableCell>
                        <TableCell>
                          <Badge variant={m.currentLoad / m.capacity > 0.8 ? "destructive" : m.currentLoad / m.capacity > 0.5 ? "warning" : "success"}>{m.currentLoad}</Badge>
                        </TableCell>
                        <TableCell>{m.ordersToday}</TableCell>
                        <TableCell><Badge variant={statusBadge(p.isActive)}>{p.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDrawer(p)}><Eye /> View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(p)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void duplicate(p)}><Copy /> Duplicate</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info(`Calling ${m.contactPhone}…`)}><Phone /> Call</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info(`Message composer opened for ${m.contactEmail}`)}><Mail /> Email</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void toggleActive(p)}>{p.isActive ? "Disable" : "Enable"}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(p)}><Trash2 /> Delete</DropdownMenuItem>
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
              <span className="text-xs text-muted-foreground">{rows.length} pickup points · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">{adminTr("Page {page} of {pages}", { page: page, pages: pages })}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics pickupsByLocation={pickupsByLocation} volumeTrend={volumeTrend} statusDistribution={statusDistribution} topLocations={topLocations} completionRate={completionRate} />
        </TabsContent>
        <TabsContent value="audit"><Audit enriched={enriched} /></TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Pickup Points", "Create Pickup Points", "Edit Pickup Points", "Delete Pickup Points", "Manage Capacity", "Export Reports"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <PointDrawer point={drawer} onClose={() => setDrawer(null)} onUpdateMeta={updateMeta} />
      <CreatePointDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createPoint} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="Delete pickup point?" description="Orders assigned to this location will need reassignment." confirmLabel="Delete" onConfirm={remove} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function PointDrawer({
  point,
  onClose,
  onUpdateMeta,
}: {
  point: Point | null;
  onClose: () => void;
  onUpdateMeta: (p: Point, patch: Partial<Meta>) => void;
}) {
  if (!point) return null;
  const m = readMeta(point);
  const [notes, setNotes] = React.useState(m.notes);
  const loadPct = Math.round((m.currentLoad / Math.max(1, m.capacity)) * 100);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{point.name} <Badge variant={statusBadge(point.isActive)}>{point.isActive ? "Active" : "Inactive"}</Badge></DialogTitle>
          <DialogDescription>Location details, capacity, contact, and activity.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="capacity">Capacity</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="internal">Internal</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Address" value={point.address} />
              <Info label="City" value={point.city} />
              <Info label="Country" value={point.country} />
              <Info label="Opening Hours" value={m.openingHours} />
              <Info label="Accepts Returns" value={m.acceptsReturns ? "Yes" : "No"} />
              <Info label="Manager" value={m.managerName} />
            </div>
          </TabsContent>

          <TabsContent value="capacity">
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-sm"><span>Current Load</span><b>{m.currentLoad} / {m.capacity}</b></div>
              <div className="h-2 rounded-full bg-secondary"><div className={`h-full rounded-full ${loadPct > 80 ? "bg-destructive" : loadPct > 50 ? "bg-warning" : "bg-primary"}`} style={{ width: `${Math.min(100, loadPct)}%` }} /></div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Capacity" value={m.capacity} />
              <Info label="Orders Today" value={m.ordersToday} />
              <Info label="Utilization" value={`${loadPct}%`} />
              <Info label="Status" value={point.isActive ? "Accepting Orders" : "Not Accepting"} />
            </div>
          </TabsContent>

          <TabsContent value="contact">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Contact Phone" value={m.contactPhone} />
              <Info label="Contact Email" value={m.contactEmail} />
              <Info label="Manager" value={m.managerName} />
              <Info label="Opening Hours" value={m.openingHours} />
            </div>
          </TabsContent>

          <TabsContent value="internal">
            <div className="mt-4 space-y-4">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Staff notes…" />
              <Button onClick={() => onUpdateMeta(point, { notes })}>Save Internal Details</Button>
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

function CreatePointDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (form: { name: string; address: string; city: string; country: string }) => void }) {
  const [form, setForm] = React.useState({ name: "", address: "", city: "", country: "" });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{adminTr("Add Pickup Point")}</DialogTitle><DialogDescription>{adminTr("Create a new click-and-collect location.")}</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <Field label="Location Name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Address"><Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></Field>
          <Field label="City"><Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></Field>
          <Field label="Country"><Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onCreate(form)}><Loader2 className="hidden animate-spin" /> Add Pickup Point</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Analytics({
  pickupsByLocation,
  volumeTrend,
  statusDistribution,
  topLocations,
  completionRate,
}: {
  pickupsByLocation: { name: string; value: number }[];
  volumeTrend: { date: string; count: number }[];
  statusDistribution: { name: string; value: number }[];
  topLocations: { name: string; load: number }[];
  completionRate: { month: string; rate: number }[];
}) {
  const reports = ["Pickups by Location", "Pickup Volume", "Capacity Utilization", "Pickup Completion Rate", "Location Performance"];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Pickups by Location</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pickupsByLocation} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {pickupsByLocation.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Pickup Volume Trend</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={volumeTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="count" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} barSize={14} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="font-semibold">Pickup Status Distribution</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {statusDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold">Top Performing Locations</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={topLocations} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="load" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} barSize={14} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold">Pickup Completion Rate</h3>
        <div className="mt-4 h-[240px] w-full">
          <ChartMount>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={completionRate} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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

function Audit({ enriched }: { enriched: { point: Point; meta: Meta }[] }) {
  const events = enriched.flatMap((x) => x.meta.activity.map((a) => ({ ...a, point: x.point.name }))).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Pickup point changes will appear here." className="py-16" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>{["User", "Location", "Action", "Previous", "New", "Date", "Device", "IP Address"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={`${e.date}-${i}`}>
                  <TableCell>{e.user}</TableCell>
                  <TableCell>{e.point}</TableCell>
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
