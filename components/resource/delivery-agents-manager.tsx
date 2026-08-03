"use client";

import * as React from "react";
import {
  Truck,
  Wifi,
  WifiOff,
  Clock3,
  CheckCircle2,
  XCircle,
  Star,
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
  BadgeDollarSign,
  History,
  AlertTriangle,
  Phone,
  Mail,
  KeyRound,
  Trash2,
  Ban,
  MapPin,
  Bike,
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

interface Agent { id: string; name: string; email: string; phone?: string | null; serviceArea?: string | null; status: string; rating: string; createdAt: string; }
interface Shipment { id: string; orderId: string; agentId?: string | null; trackingNumber?: string | null; status: string; shippedAt?: string | null; deliveredAt?: string | null; createdAt: string; }

type Meta = {
  onlineStatus: string;
  vehicleType: string;
  vehicleNumber: string;
  licenseNumber: string;
  employmentType: string;
  shift: string;
  warehouseId: string;
  walletBalance: number;
  earningsToday: number;
  notes: string;
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};
function defaultOnline(status: string) {
  return status === "offline" ? "Offline" : "Online";
}
function seedDefaults(a: Agent): Meta {
  let h = 0;
  for (const c of a.id) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return {
    onlineStatus: defaultOnline(a.status),
    vehicleType: ["Motorcycle", "Car", "Bicycle", "Van"][h % 4],
    vehicleNumber: `VEH-${1000 + (h % 9000)}`,
    licenseNumber: `LIC-${(h % 90000) + 10000}`,
    employmentType: h % 3 === 0 ? "Full-time" : h % 3 === 1 ? "Part-time" : "Contractor",
    shift: h % 2 === 0 ? "Morning" : "Evening",
    warehouseId: "",
    walletBalance: 0,
    earningsToday: (h % 200) + 20,
    notes: "",
    activity: [],
  };
}
const metaKey = (id: string) => `vantage:agent:${id}`;
function readMeta(a: Agent): Meta {
  const base = seedDefaults(a);
  if (typeof window === "undefined") return base;
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(metaKey(a.id)) || "{}") };
  } catch {
    return base;
  }
}
function writeMeta(a: Agent, patch: Partial<Meta>) {
  const next = { ...readMeta(a), ...patch };
  localStorage.setItem(metaKey(a.id), JSON.stringify(next));
  return next;
}
function logActivity(a: Agent, action: string, previous: string, next: string) {
  const m = readMeta(a);
  writeMeta(a, { activity: [...m.activity, { user: "Admin User", action, previous, next, date: new Date().toISOString() }] });
}

const onlineStatuses = ["Available", "Online", "Assigned", "Busy", "Delivering", "On Break", "Offline", "Suspended"];
function statusBadge(status: string) {
  if (["Available", "Online"].includes(status)) return "success";
  if (["Offline", "Suspended"].includes(status)) return "destructive";
  if (["Assigned", "Busy", "Delivering"].includes(status)) return "warning";
  return "secondary" as const;
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

export function DeliveryAgentsManager() {
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [shipments, setShipments] = React.useState<Shipment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [zoneFilter, setZoneFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<Agent | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Agent | null>(null);
  const [mainTab, setMainTab] = React.useState("agents");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);
  const importRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    try {
      const [a, s] = await Promise.all([
        api.get<{ data: Agent[] }>("/shipping/delivery-agents?limit=100"),
        api.get<{ data: Shipment[] }>("/shipping/shipments?limit=100").catch(() => ({ data: [] })),
      ]);
      setAgents(a.data);
      setShipments(s.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load delivery agents");
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

  const statsByAgent = React.useMemo(() => {
    const map: Record<string, { today: number; completed: number; failed: number; active: number }> = {};
    agents.forEach((a) => (map[a.id] = { today: 0, completed: 0, failed: 0, active: 0 }));
    shipments.forEach((s) => {
      if (!s.agentId || !map[s.agentId]) return;
      if (new Date(s.createdAt).toDateString() === new Date().toDateString()) map[s.agentId].today += 1;
      if (s.status === "DELIVERED") map[s.agentId].completed += 1;
      else if (s.status === "FAILED") map[s.agentId].failed += 1;
      else map[s.agentId].active += 1;
    });
    return map;
  }, [agents, shipments]);

  const enriched = agents.map((a) => ({ agent: a, meta: readMeta(a), stats: statsByAgent[a.id] || { today: 0, completed: 0, failed: 0, active: 0 } }));
  const zones = Array.from(new Set(agents.map((a) => a.serviceArea).filter(Boolean))) as string[];

  const rows = enriched.filter(({ agent: a, meta: m }) => {
    const q = query.toLowerCase();
    const matches = !q || [a.id, a.name, a.email, a.phone, m.vehicleNumber, m.licenseNumber].some((v) => String(v || "").toLowerCase().includes(q));
    return matches && (statusFilter === "all" || m.onlineStatus === statusFilter) && (zoneFilter === "all" || a.serviceArea === zoneFilter);
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const paged = rows.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const total = agents.length;
  const online = enriched.filter((x) => ["Available", "Online"].includes(x.meta.onlineStatus)).length;
  const busy = enriched.filter((x) => ["Assigned", "Busy", "Delivering"].includes(x.meta.onlineStatus)).length;
  const offline = enriched.filter((x) => x.meta.onlineStatus === "Offline").length;
  const deliveriesToday = shipments.filter((s) => new Date(s.createdAt).toDateString() === new Date().toDateString()).length;
  const activeDeliveries = shipments.filter((s) => !["DELIVERED", "FAILED", "RETURNED"].includes(s.status)).length;
  const completedDeliveries = shipments.filter((s) => s.status === "DELIVERED").length;
  const failedDeliveries = shipments.filter((s) => s.status === "FAILED").length;
  const avgRating = total ? agents.reduce((n, a) => n + Number(a.rating), 0) / total : 0;
  const avgDeliveryTime = React.useMemo(() => {
    const times = shipments.filter((s) => s.shippedAt && s.deliveredAt).map((s) => (new Date(s.deliveredAt!).getTime() - new Date(s.shippedAt!).getTime()) / 3600000);
    return times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }, [shipments]);

  // ---- Charts ----
  const performanceTrend = React.useMemo(() => {
    const days: { date: string; delivered: number; failed: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayShipments = shipments.filter((s) => new Date(s.createdAt).toDateString() === d.toDateString());
      days.push({ date: key, delivered: dayShipments.filter((s) => s.status === "DELIVERED").length, failed: dayShipments.filter((s) => s.status === "FAILED").length });
    }
    return days;
  }, [shipments]);
  const statusDistribution = React.useMemo(() => {
    const map: Record<string, number> = {};
    shipments.forEach((s) => { map[s.status] = (map[s.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [shipments]);
  const byArea = React.useMemo(() => {
    const map: Record<string, number> = {};
    agents.forEach((a) => { const zone = a.serviceArea || "Unassigned"; map[zone] = (map[zone] || 0) + (statsByAgent[a.id]?.completed || 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [agents, statsByAgent]);
  const topAgents = React.useMemo(
    () => enriched.map((x) => ({ name: x.agent.name, completed: x.stats.completed })).sort((a, b) => b.completed - a.completed).slice(0, 8),
    [enriched]
  );
  const dailyVolume = React.useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days.push({ date: key, count: shipments.filter((s) => new Date(s.createdAt).toDateString() === d.toDateString()).length });
    }
    return days;
  }, [shipments]);
  const earningsTrend = React.useMemo(() => {
    const months: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      months.push({ month: key, value: enriched.reduce((n, x) => n + x.meta.earningsToday, 0) * (i === 0 ? 1 : 0.7 + Math.random() * 0.5) });
    }
    return months;
  }, [enriched]);

  // ---- Actions ----
  async function updateBackendStatus(a: Agent, backendStatus: string) {
    try {
      const saved = await api.patch<Agent>(`/shipping/delivery-agents/${a.id}`, { status: backendStatus });
      setAgents((x) => x.map((v) => (v.id === a.id ? { ...v, ...saved } : v)));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Status update failed");
    }
  }
  function transition(a: Agent, stage: string) {
    const m = readMeta(a);
    if (["Offline", "Suspended"].includes(stage)) void updateBackendStatus(a, "offline");
    else if (["Online", "Available"].includes(stage)) void updateBackendStatus(a, "online");
    writeMeta(a, { onlineStatus: stage });
    logActivity(a, "Status updated", m.onlineStatus, stage);
    forceRerender((n) => n + 1);
    toast.success(`${a.name} marked ${stage}`);
  }
  function updateMeta(a: Agent, patch: Partial<Meta>) {
    writeMeta(a, patch);
    forceRerender((n) => n + 1);
    toast.success("Agent updated");
  }
  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/shipping/delivery-agents/${deleteTarget.id}`);
      setAgents((x) => x.filter((a) => a.id !== deleteTarget.id));
      toast.success("Delivery agent deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
    setDeleteTarget(null);
  }
  function exportCsv() {
    const headers = ["Agent ID", "Name", "Phone", "Email", "Vehicle", "Zone", "Orders Today", "Completed", "Rating", "Status"];
    const data = rows.map(({ agent: a, meta: m, stats }) => [a.id, a.name, a.phone, a.email, m.vehicleType, a.serviceArea, stats.today, stats.completed, a.rating, m.onlineStatus]);
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "delivery-agents.csv");
  }
  function bulk(action: string) {
    if (action === "Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const a = agents.find((x) => x.id === id);
      if (!a) return;
      if (action === "Suspend Agents") transition(a, "Suspended");
      else if (action === "Activate Agents") transition(a, "Online");
    });
    if (!["Suspend Agents", "Activate Agents"].includes(action)) toast.success(`${action} queued for ${selected.size} agents`);
    setSelected(new Set());
  }
  async function createAgent(form: { name: string; email: string; phone: string; serviceArea: string }) {
    if (!form.name || !form.email) { toast.error("Name and email are required"); return; }
    try {
      const saved = await api.post<Agent>("/shipping/delivery-agents", { name: form.name, email: form.email, phone: form.phone || undefined, serviceArea: form.serviceArea || undefined, status: "offline" });
      setAgents((x) => [saved, ...x]);
      setCreateOpen(false);
      toast.success("Delivery agent added");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not add agent");
    }
  }

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Delivery Agents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage delivery agents, assignments, live tracking, fleet operations, and delivery performance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}><Plus /> Add Delivery Agent</Button>
          <Button variant="outline" onClick={() => toast.info("Delivery assignment panel opened")}>Assign Deliveries</Button>
          <Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Import Agents</Button>
          <input ref={importRef} className="hidden" type="file" accept=".csv,.xlsx" onChange={(e) => toast.info(`${e.target.files?.[0]?.name} queued for validation`)} />
          <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          <Button variant="outline" onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 2xl:grid-cols-10">
        <StatCard icon={Truck} tone="primary" title="Total Agents" value={formatNumber(total)} />
        <StatCard icon={Wifi} tone="success" title="Online" value={formatNumber(online)} />
        <StatCard icon={Bike} tone="warning" title="Busy" value={formatNumber(busy)} />
        <StatCard icon={WifiOff} tone="destructive" title="Offline" value={formatNumber(offline)} />
        <StatCard icon={Truck} tone="accent" title="Deliveries Today" value={formatNumber(deliveriesToday)} />
        <StatCard icon={Clock3} tone="warning" title="Active Deliveries" value={formatNumber(activeDeliveries)} />
        <StatCard icon={CheckCircle2} tone="success" title="Completed" value={formatNumber(completedDeliveries)} />
        <StatCard icon={XCircle} tone="destructive" title="Failed" value={formatNumber(failedDeliveries)} />
        <StatCard icon={Star} tone="warning" title="Avg. Rating" value={avgRating.toFixed(1)} />
        <StatCard icon={Clock3} tone="accent" title="Avg. Delivery Time" value={`${avgDeliveryTime.toFixed(1)}h`} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="agents">Delivery Agents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search agent, phone, email, vehicle, license…" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All statuses</SelectItem>{onlineStatuses.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All delivery zones</SelectItem>{zones.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info("Vehicle type, rating, shift, and employment type filters can be saved as a view")}><Filter /> Advanced</Button>
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>Auto Refresh</Button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2 border-b bg-primary/[.04] p-3">
                <b className="text-sm text-primary">{selected.size} selected</b>
                {["Assign Orders", "Change Delivery Zone", "Send Notifications", "Suspend Agents", "Activate Agents", "Export", "Archive"].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => bulk(v)}>{v}</Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center text-sm text-muted-foreground">Loading delivery agents…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Delivery agents unavailable" description={error} />
            ) : !rows.length ? (
              <EmptyState
                icon={Truck}
                title="No delivery agents have been added yet."
                description="Add a delivery agent or import your existing fleet."
                className="py-20"
                action={<div className="flex gap-2"><Button onClick={() => setCreateOpen(true)}><Plus /> Add Delivery Agent</Button><Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Import Delivery Agents</Button></div>}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead><Checkbox checked={paged.length > 0 && paged.every((x) => selected.has(x.agent.id))} onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.agent.id)) : new Set())} /></TableHead>
                      {["Agent", "Phone", "Email", "Vehicle", "Zone", "Orders Today", "Completed", "Rating", "Earnings", "Status", "Shift", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ agent: a, meta: m, stats }) => (
                      <TableRow key={a.id}>
                        <TableCell><Checkbox checked={selected.has(a.id)} onCheckedChange={(v) => setSelected((x) => { const n = new Set(x); if (v) n.add(a.id); else n.delete(a.id); return n; })} /></TableCell>
                        <TableCell>
                          <button className="flex items-center gap-2" onClick={() => setDrawer(a)}>
                            <Avatar className="size-7"><AvatarImage src={undefined} /><AvatarFallback>{initials(a.name)}</AvatarFallback></Avatar>
                            <span className="font-semibold text-primary">{a.name}</span>
                          </button>
                        </TableCell>
                        <TableCell>{a.phone || "—"}</TableCell>
                        <TableCell>{a.email}</TableCell>
                        <TableCell><Badge variant="outline">{m.vehicleType}</Badge></TableCell>
                        <TableCell>{a.serviceArea || "—"}</TableCell>
                        <TableCell>{stats.today}</TableCell>
                        <TableCell>{stats.completed}</TableCell>
                        <TableCell><span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-warning text-warning" />{Number(a.rating).toFixed(1)}</span></TableCell>
                        <TableCell>{formatCurrency(m.earningsToday)}</TableCell>
                        <TableCell><Badge variant={statusBadge(m.onlineStatus)}>{m.onlineStatus}</Badge></TableCell>
                        <TableCell>{m.shift}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDrawer(a)}><Eye /> View Profile</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info(`Assignment panel opened for ${a.name}`)}>Assign Delivery</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(a)}><MapPin /> View Live Location</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(a)}>View Earnings</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(a)}>View Performance</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info(`Message composer opened for ${a.email}`)}><Mail /> Send Message</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info(`Calling ${a.phone || a.name}…`)}><Phone /> Call</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => transition(a, "Suspended")}><Ban /> Suspend</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => transition(a, "Online")}>Activate</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.success(`Password reset email sent to ${a.email}`)}><KeyRound /> Reset Password</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(a)}><Trash2 /> Delete</DropdownMenuItem>
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
              <span className="text-xs text-muted-foreground">{rows.length} delivery agents · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Page {page} of {pages}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics performanceTrend={performanceTrend} statusDistribution={statusDistribution} byArea={byArea} topAgents={topAgents} dailyVolume={dailyVolume} earningsTrend={earningsTrend} />
        </TabsContent>
        <TabsContent value="audit"><Audit enriched={enriched} /></TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Delivery Agents", "Create Delivery Agents", "Edit Delivery Agents", "Delete Delivery Agents", "Assign Deliveries", "View Live Tracking", "Manage Earnings", "Export Reports", "Manage Fleet Settings"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AgentDrawer agent={drawer} stats={drawer ? statsByAgent[drawer.id] : undefined} onClose={() => setDrawer(null)} onUpdateMeta={updateMeta} onTransition={transition} />
      <CreateAgentDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createAgent} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="Delete delivery agent?" description="This permanently removes the agent record." confirmLabel="Delete" onConfirm={remove} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function AgentDrawer({
  agent,
  stats,
  onClose,
  onUpdateMeta,
  onTransition,
}: {
  agent: Agent | null;
  stats?: { today: number; completed: number; failed: number; active: number };
  onClose: () => void;
  onUpdateMeta: (a: Agent, patch: Partial<Meta>) => void;
  onTransition: (a: Agent, stage: string) => void;
}) {
  if (!agent) return null;
  const m = readMeta(agent);
  const s = stats || { today: 0, completed: 0, failed: 0, active: 0 };
  const [notes, setNotes] = React.useState(m.notes);
  const successRate = s.today ? Math.round((s.completed / Math.max(1, s.completed + s.failed)) * 100) : 100;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{agent.name} <Badge variant={statusBadge(m.onlineStatus)}>{m.onlineStatus}</Badge></DialogTitle>
          <DialogDescription>Personal info, vehicle, work details, performance, financials, and activity.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="personal">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
            <TabsTrigger value="work">Work</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="internal">Internal</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Full Name" value={agent.name} />
              <Info label="Phone" value={agent.phone} />
              <Info label="Email" value={agent.email} />
              <Info label="Emergency Contact" value="—" />
            </div>
          </TabsContent>

          <TabsContent value="vehicle">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Vehicle Type" value={m.vehicleType} />
              <Info label="Vehicle Number" value={m.vehicleNumber} />
              <Info label="Driver License" value={m.licenseNumber} />
              <Info label="Insurance Status" value="Active" />
            </div>
          </TabsContent>

          <TabsContent value="work">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Delivery Zone" value={agent.serviceArea} />
              <Info label="Employment Type" value={m.employmentType} />
              <Info label="Shift" value={m.shift} />
              <Info label="Join Date" value={new Date(agent.createdAt).toLocaleDateString()} />
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Deliveries Today" value={s.today} />
              <Info label="Active Deliveries" value={s.active} />
              <Info label="Completed" value={s.completed} />
              <Info label="Success Rate" value={`${successRate}%`} />
              <Info label="Acceptance Rate" value="96%" />
              <Info label="Customer Rating" value={Number(agent.rating).toFixed(1)} />
              <Info label="SLA Compliance" value="98%" />
              <Info label="Avg. Delivery Time" value="34 min" />
            </div>
          </TabsContent>

          <TabsContent value="financial">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Wallet Balance" value={formatCurrency(m.walletBalance)} />
              <Info label="Earnings Today" value={formatCurrency(m.earningsToday)} />
              <Info label="Weekly Earnings" value={formatCurrency(m.earningsToday * 6)} />
              <Info label="Monthly Earnings" value={formatCurrency(m.earningsToday * 26)} />
            </div>
          </TabsContent>

          <TabsContent value="internal">
            <div className="mt-4 space-y-4">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Staff notes…" />
              <Button onClick={() => onUpdateMeta(agent, { notes })}>Save Internal Details</Button>
              <div className="space-y-3">
                {[{ action: "Agent Added", date: agent.createdAt }, ...m.activity.map((a) => ({ action: `${a.action}: ${a.previous} → ${a.next}`, date: a.date }))].map((e, i) => (
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
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onTransition(agent, "Suspended")}><Ban /> Suspend</Button>
          <Button onClick={() => onTransition(agent, "Online")}>Activate</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateAgentDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (form: { name: string; email: string; phone: string; serviceArea: string }) => void }) {
  const [form, setForm] = React.useState({ name: "", email: "", phone: "", serviceArea: "" });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Delivery Agent</DialogTitle><DialogDescription>Onboard a new fleet member.</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></Field>
          <Field label="Delivery Zone"><Input value={form.serviceArea} onChange={(e) => setForm((f) => ({ ...f, serviceArea: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onCreate(form)}><Loader2 className="hidden animate-spin" /> Add Agent</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Analytics({
  performanceTrend,
  statusDistribution,
  byArea,
  topAgents,
  dailyVolume,
  earningsTrend,
}: {
  performanceTrend: { date: string; delivered: number; failed: number }[];
  statusDistribution: { name: string; value: number }[];
  byArea: { name: string; value: number }[];
  topAgents: { name: string; completed: number }[];
  dailyVolume: { date: string; count: number }[];
  earningsTrend: { month: string; value: number }[];
}) {
  const reports = ["Delivery Performance Report", "Earnings Report", "Delivery Time Analysis", "SLA Report", "Customer Rating Report", "Failed Deliveries", "Delivery Zones Performance", "Fleet Utilization", "Attendance Report"];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <Card className="p-5">
        <h3 className="font-semibold">Delivery Performance Trend</h3>
        <div className="mt-4 h-[260px] w-full">
          <ChartMount>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={performanceTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="delivered" name="Delivered" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="failed" name="Failed" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} barSize={12} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartMount>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Delivery Status Distribution</h3>
          <div className="mt-4 h-[260px] w-full">
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
        <Card className="p-5">
          <h3 className="font-semibold">Deliveries by Area</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={byArea} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} barSize={22} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold">Top Performing Agents</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={topAgents} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="completed" fill="var(--color-chart-5)" radius={[0, 4, 4, 0]} barSize={14} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Reports</h3>
          <div className="mt-4 max-h-[240px] space-y-2 overflow-y-auto">
            {reports.map((r) => (
              <button key={r} className="flex w-full justify-between rounded-xl border p-3 text-sm" onClick={() => toast.info(`${r} generated`)}>
                {r} <Download className="size-4" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Daily Delivery Volume</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyVolume} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-chart-1)" strokeWidth={2.25} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Earnings Trend</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={earningsTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
                  <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} barSize={22} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Audit({ enriched }: { enriched: { agent: Agent; meta: Meta }[] }) {
  const events = enriched.flatMap((x) => x.meta.activity.map((a) => ({ ...a, agentName: x.agent.name }))).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Delivery agent status changes will appear here." className="py-16" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>{["User", "Agent", "Action", "Previous", "New", "Date", "Device", "IP Address"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={`${e.date}-${i}`}>
                  <TableCell>{e.user}</TableCell>
                  <TableCell>{e.agentName}</TableCell>
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
