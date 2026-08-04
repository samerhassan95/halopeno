"use client";

import { adminTr } from "@/lib/i18n/admin-tr";

import * as React from "react";
import {
  UsersRound,
  CheckCircle2,
  Users,
  Crown,
  Building2,
  Percent,
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
  Copy,
  Trash2,
  Tag,
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

interface Group { id: string; name: string; description?: string | null; discountPct?: string | null; createdAt: string; }
interface Customer { id: string; name: string; email: string; groupId?: string | null; createdAt: string; }
interface Order { id: string; customerId: string; total: string; createdAt: string; }

type Meta = {
  status: string;
  membershipLevel: string;
  pricingTier: string;
  taxClass: string;
  paymentMethods: string[];
  couponEligible: boolean;
  walletAccess: boolean;
  notes: string;
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};
function seedDefaults(g: Group): Meta {
  const name = g.name.toLowerCase();
  let level = "Registered";
  if (name.includes("vip")) level = "VIP";
  else if (name.includes("wholesale")) level = "Wholesale";
  else if (name.includes("gold")) level = "Gold";
  else if (name.includes("platinum")) level = "Platinum";
  else if (name.includes("silver")) level = "Silver";
  else if (name.includes("corp") || name.includes("b2b")) level = "Corporate";
  return {
    status: "Active",
    membershipLevel: level,
    pricingTier: Number(g.discountPct) > 0 ? "Discounted" : "Standard",
    taxClass: "Standard",
    paymentMethods: ["Card", "Bank Transfer"],
    couponEligible: true,
    walletAccess: true,
    notes: "",
    activity: [],
  };
}
const metaKey = (id: string) => `vantage:customer-group:${id}`;
function readMeta(g: Group): Meta {
  const base = seedDefaults(g);
  if (typeof window === "undefined") return base;
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(metaKey(g.id)) || "{}") };
  } catch {
    return base;
  }
}
function writeMeta(g: Group, patch: Partial<Meta>) {
  const next = { ...readMeta(g), ...patch };
  localStorage.setItem(metaKey(g.id), JSON.stringify(next));
  return next;
}
function logActivity(g: Group, action: string, previous: string, next: string) {
  const m = readMeta(g);
  writeMeta(g, { activity: [...m.activity, { user: "Admin User", action, previous, next, date: new Date().toISOString() }] });
}

const membershipLevels = ["Guest", "Registered", "Silver", "Gold", "Platinum", "VIP", "Wholesale", "Distributor", "Corporate", "Employee"];
function statusBadge(status: string) {
  return status === "Active" ? "success" : "secondary" as const;
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

export function CustomerGroupsManager(){const [groups, setGroups] = React.useState<Group[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [levelFilter, setLevelFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<Group | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Group | null>(null);
  const [mainTab, setMainTab] = React.useState("groups");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);
  const importRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    try {
      const [g, c, o] = await Promise.all([
        api.get<{ data: Group[] }>("/customers/customer-groups?limit=100"),
        api.get<{ data: Customer[] }>("/customers/customers?limit=100").catch(() => ({ data: [] })),
        api.get<{ data: Order[] }>("/sales/orders?limit=100").catch(() => ({ data: [] })),
      ]);
      setGroups(g.data);
      setCustomers(c.data);
      setOrders(o.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load customer groups");
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

  const statsByGroup = React.useMemo(() => {
    const map: Record<string, { customers: number; revenue: number; orders: number }> = {};
    groups.forEach((g) => (map[g.id] = { customers: 0, revenue: 0, orders: 0 }));
    const customerIdsByGroup: Record<string, Set<string>> = {};
    customers.forEach((c) => {
      if (!c.groupId || !map[c.groupId]) return;
      map[c.groupId].customers += 1;
      customerIdsByGroup[c.groupId] = customerIdsByGroup[c.groupId] || new Set();
      customerIdsByGroup[c.groupId].add(c.id);
    });
    orders.forEach((o) => {
      for (const gid of Object.keys(customerIdsByGroup)) {
        if (customerIdsByGroup[gid].has(o.customerId)) {
          map[gid].revenue += Number(o.total);
          map[gid].orders += 1;
          break;
        }
      }
    });
    return map;
  }, [groups, customers, orders]);

  const enriched = groups.map((g) => ({ group: g, meta: readMeta(g), stats: statsByGroup[g.id] || { customers: 0, revenue: 0, orders: 0 } }));

  const rows = enriched.filter(({ group: g, meta: m }) => {
    const q = query.toLowerCase();
    const matches = !q || [g.id, g.name, g.description].some((v) => String(v || "").toLowerCase().includes(q));
    return matches && (statusFilter === "all" || m.status === statusFilter) && (levelFilter === "all" || m.membershipLevel === levelFilter);
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const paged = rows.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const total = groups.length;
  const active = enriched.filter((x) => x.meta.status === "Active").length;
  const totalAssigned = customers.filter((c) => c.groupId).length;
  const vip = enriched.filter((x) => x.meta.membershipLevel === "VIP").reduce((n, x) => n + x.stats.customers, 0);
  const wholesale = enriched.filter((x) => x.meta.membershipLevel === "Wholesale").reduce((n, x) => n + x.stats.customers, 0);
  const b2b = enriched.filter((x) => x.meta.membershipLevel === "Corporate").reduce((n, x) => n + x.stats.customers, 0);
  const withDiscounts = groups.filter((g) => Number(g.discountPct) > 0).length;
  const avgLtv = totalAssigned ? enriched.reduce((n, x) => n + x.stats.revenue, 0) / totalAssigned : 0;

  // ---- Charts ----
  const distribution = React.useMemo(() => enriched.map((x) => ({ name: x.group.name, value: x.stats.customers })).filter((x) => x.value > 0), [enriched]);
  const revenueByGroup = React.useMemo(() => enriched.map((x) => ({ name: x.group.name, value: x.stats.revenue })).sort((a, b) => b.value - a.value).slice(0, 8), [enriched]);
  const growth = React.useMemo(() => {
    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      months.push({ month: key, count: customers.filter((c) => { const cd = new Date(c.createdAt); return c.groupId && cd <= d; }).length });
    }
    return months;
  }, [customers]);
  const aovByGroup = React.useMemo(
    () => enriched.map((x) => ({ name: x.group.name, aov: x.stats.orders ? x.stats.revenue / x.stats.orders : 0 })).filter((x) => x.aov > 0),
    [enriched]
  );
  const performance = React.useMemo(
    () => enriched.map((x) => ({ name: x.group.name, revenue: x.stats.revenue, customers: x.stats.customers })).sort((a, b) => b.revenue - a.revenue).slice(0, 6),
    [enriched]
  );

  // ---- Actions ----
  function updateMeta(g: Group, patch: Partial<Meta>) {
    writeMeta(g, patch);
    forceRerender((n) => n + 1);
    toast.success("Customer group updated");
  }
  function toggleStatus(g: Group) {
    const m = readMeta(g);
    const next = m.status === "Active" ? "Inactive" : "Active";
    writeMeta(g, { status: next });
    logActivity(g, "Status updated", m.status, next);
    forceRerender((n) => n + 1);
    toast.success(`${g.name} marked ${next}`);
  }
  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/customers/customer-groups/${deleteTarget.id}`);
      setGroups((x) => x.filter((g) => g.id !== deleteTarget.id));
      toast.success("Customer group deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
    setDeleteTarget(null);
  }
  async function duplicate(g: Group) {
    try {
      const saved = await api.post<Group>("/customers/customer-groups", { name: `${g.name} (Copy)`, description: g.description || undefined, discountPct: g.discountPct ? Number(g.discountPct) : undefined });
      setGroups((x) => [saved, ...x]);
      toast.success("Customer group duplicated");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Duplicate failed");
    }
  }
  function exportCsv() {
    const headers = ["Group ID", "Name", "Description", "Customer Count", "Discount %", "Membership Level", "Status"];
    const data = rows.map(({ group: g, meta: m, stats }) => [g.id, g.name, g.description, stats.customers, g.discountPct, m.membershipLevel, m.status]);
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "customer-groups.csv");
  }
  function bulk(action: string) {
    if (action === "Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const g = groups.find((x) => x.id === id);
      if (!g) return;
      if (action === "Activate") updateMeta(g, { status: "Active" });
      else if (action === "Deactivate") updateMeta(g, { status: "Inactive" });
    });
    if (!["Activate", "Deactivate"].includes(action)) toast.success(`${action} queued for ${selected.size} groups`);
    setSelected(new Set());
  }
  async function createGroup(form: { name: string; description: string; discountPct: string }) {
    if (!form.name) { toast.error("Group name is required"); return; }
    try {
      const saved = await api.post<Group>("/customers/customer-groups", { name: form.name, description: form.description || undefined, discountPct: form.discountPct ? Number(form.discountPct) : undefined });
      setGroups((x) => [saved, ...x]);
      setCreateOpen(false);
      toast.success("Customer group created");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create group");
    }
  }

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{adminTr("Customer Groups")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage customer segmentation, pricing tiers, discounts, permissions, and personalized shopping experiences.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}><Plus /> Add Customer Group</Button>
          <Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Import Groups</Button>
          <input ref={importRef} className="hidden" type="file" accept=".csv,.xlsx" onChange={(e) => toast.info(`${e.target.files?.[0]?.name} queued for validation`)} />
          <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          <Button variant="outline" onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <StatCard icon={UsersRound} tone="primary" title="Total Groups" value={formatNumber(total)} />
        <StatCard icon={CheckCircle2} tone="success" title="Active Groups" value={formatNumber(active)} />
        <StatCard icon={Users} tone="accent" title="Assigned Customers" value={formatNumber(totalAssigned)} />
        <StatCard icon={Crown} tone="warning" title="VIP Members" value={formatNumber(vip)} />
        <StatCard icon={Tag} tone="accent" title="Wholesale Customers" value={formatNumber(wholesale)} />
        <StatCard icon={Building2} tone="primary" title="B2B Companies" value={formatNumber(b2b)} />
        <StatCard icon={Percent} tone="warning" title="Groups w/ Discounts" value={formatNumber(withDiscounts)} />
        <StatCard icon={BadgeDollarSign} tone="success" title="Avg. Customer LTV" value={formatCurrency(avgLtv)} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="groups">{adminTr("Customer Groups")}</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="groups">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search group name, ID, description…" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="xl:w-36"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">{adminTr("All statuses")}</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All membership levels</SelectItem>{membershipLevels.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info("Pricing tier, tax class, country, and currency filters can be saved as a view")}><Filter /> Advanced</Button>
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>Auto Refresh</Button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2 border-b bg-primary/[.04] p-3">
                <b className="text-sm text-primary">{selected.size} selected</b>
                {["Activate", "Deactivate", "Assign Customers", "Change Pricing Tier", "Apply Discounts", "Export", "Archive"].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => bulk(v)}>{v}</Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center text-sm text-muted-foreground">Loading customer groups…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Customer groups unavailable" description={error} />
            ) : !rows.length ? (
              <EmptyState
                icon={UsersRound}
                title="No customer groups have been created yet."
                description={adminTr("Create a customer group or import existing segments.")}
                className="py-20"
                action={<div className="flex gap-2"><Button onClick={() => setCreateOpen(true)}><Plus /> Add Customer Group</Button><Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Import Customer Groups</Button></div>}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead><Checkbox checked={paged.length > 0 && paged.every((x) => selected.has(x.group.id))} onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.group.id)) : new Set())} /></TableHead>
                      {["Group Name", "Description", "Customers", "Pricing Tier", "Discount", "Membership Level", "Status", "Created", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ group: g, meta: m, stats }) => (
                      <TableRow key={g.id}>
                        <TableCell><Checkbox checked={selected.has(g.id)} onCheckedChange={(v) => setSelected((x) => { const n = new Set(x); if (v) n.add(g.id); else n.delete(g.id); return n; })} /></TableCell>
                        <TableCell><button className="font-semibold text-primary" onClick={() => setDrawer(g)}>{g.name}</button></TableCell>
                        <TableCell className="max-w-48 truncate text-xs text-muted-foreground">{g.description || "—"}</TableCell>
                        <TableCell>{stats.customers}</TableCell>
                        <TableCell><Badge variant="outline">{m.pricingTier}</Badge></TableCell>
                        <TableCell>{g.discountPct ? `${g.discountPct}%` : "—"}</TableCell>
                        <TableCell><Badge variant="accent">{m.membershipLevel}</Badge></TableCell>
                        <TableCell><Badge variant={statusBadge(m.status)}>{m.status}</Badge></TableCell>
                        <TableCell className="text-xs">{new Date(g.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDrawer(g)}><Eye /> View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(g)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void duplicate(g)}><Copy /> Duplicate</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info(`Viewing ${stats.customers} customers in ${g.name}`)}>View Customers</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(g)}>{adminTr("Manage Pricing")}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(g)}>Configure Permissions</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(g)}>{m.status === "Active" ? "Deactivate" : "Activate"}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(g)}><Trash2 /> Delete</DropdownMenuItem>
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
              <span className="text-xs text-muted-foreground">{rows.length} customer groups · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">{adminTr("Page {page} of {pages}", { page: page, pages: pages })}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics distribution={distribution} revenueByGroup={revenueByGroup} growth={growth} aovByGroup={aovByGroup} performance={performance} />
        </TabsContent>
        <TabsContent value="audit"><Audit enriched={enriched} /></TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Customer Groups", "Create Groups", "Edit Groups", "Delete Groups", "Assign Customers", "Manage Pricing", "Manage Permissions", "Export Reports", "Manage Membership Rules"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <GroupDrawer group={drawer} stats={drawer ? statsByGroup[drawer.id] : undefined} onClose={() => setDrawer(null)} onUpdateMeta={updateMeta} />
      <CreateGroupDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createGroup} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="Delete customer group?" description="Customers in this group will lose their group-based pricing and permissions." confirmLabel="Delete" onConfirm={remove} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function GroupDrawer({
  group,
  stats,
  onClose,
  onUpdateMeta,
}: {
  group: Group | null;
  stats?: { customers: number; revenue: number; orders: number };
  onClose: () => void;
  onUpdateMeta: (g: Group, patch: Partial<Meta>) => void;
}) {
  if (!group) return null;
  const m = readMeta(group);
  const s = stats || { customers: 0, revenue: 0, orders: 0 };
  const [notes, setNotes] = React.useState(m.notes);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{group.name} <Badge variant={statusBadge(m.status)}>{m.status}</Badge></DialogTitle>
          <DialogDescription>General info, customers, pricing, permissions, and analytics.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="internal">Internal</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Group Name" value={group.name} />
              <Info label="Description" value={group.description || "—"} />
              <Info label="Status" value={m.status} />
              <Info label="Membership Level" value={m.membershipLevel} />
            </div>
            <div className="mt-3 max-w-xs space-y-2">
              <Label>Membership Level</Label>
              <Select value={m.membershipLevel} onValueChange={(v) => onUpdateMeta(group, { membershipLevel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{membershipLevels.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="customers">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Assigned Customers" value={s.customers} />
              <Info label="Active Customers" value={s.customers} />
              <Info label="New Customers" value="0" />
              <Info label="Orders" value={s.orders} />
            </div>
          </TabsContent>

          <TabsContent value="pricing">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Pricing Tier" value={m.pricingTier} />
              <Info label="Discount" value={group.discountPct ? `${group.discountPct}%` : "None"} />
              <Info label="Tax Class" value={m.taxClass} />
              <Info label="Coupon Eligibility" value={m.couponEligible ? "Eligible" : "Not eligible"} />
            </div>
          </TabsContent>

          <TabsContent value="permissions">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Payment Methods" value={m.paymentMethods.join(", ")} />
              <Info label="Wallet Access" value={m.walletAccess ? "Enabled" : "Disabled"} />
              <Info label="Product Visibility" value="All products" />
              <Info label="CMS Access" value="Standard" />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Revenue" value={formatCurrency(s.revenue)} />
              <Info label="Average Order Value" value={formatCurrency(s.orders ? s.revenue / s.orders : 0)} />
              <Info label="Lifetime Value" value={formatCurrency(s.customers ? s.revenue / s.customers : 0)} />
              <Info label="Retention Rate" value="—" />
            </div>
          </TabsContent>

          <TabsContent value="internal">
            <div className="mt-4 space-y-4">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Staff notes…" />
              <Button onClick={() => onUpdateMeta(group, { notes })}>Save Internal Details</Button>
              <div className="space-y-3">
                {[{ action: "Group Created", date: group.createdAt }, ...m.activity.map((a) => ({ action: `${a.action}: ${a.previous} → ${a.next}`, date: a.date }))].map((e, i) => (
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

function CreateGroupDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (form: { name: string; description: string; discountPct: string }) => void }) {
  const [form, setForm] = React.useState({ name: "", description: "", discountPct: "" });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{adminTr("Add Customer Group")}</DialogTitle><DialogDescription>{adminTr("Create a new customer segment.")}</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <Field label="Group Name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <Field label="Discount %"><Input type="number" min="0" max="100" value={form.discountPct} onChange={(e) => setForm((f) => ({ ...f, discountPct: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onCreate(form)}><Loader2 className="hidden animate-spin" /> Add Group</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Analytics({
  distribution,
  revenueByGroup,
  growth,
  aovByGroup,
  performance,
}: {
  distribution: { name: string; value: number }[];
  revenueByGroup: { name: string; value: number }[];
  growth: { month: string; count: number }[];
  aovByGroup: { name: string; aov: number }[];
  performance: { name: string; revenue: number; customers: number }[];
}) {
  const reports = ["Revenue by Group", "Customer Growth", "Lifetime Value Report", "Retention Report", "Pricing Performance", "Discount Usage", "Tax Summary", "Membership Report"];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Customer Distribution by Group</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {distribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Revenue by Customer Group</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueByGroup} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
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
          <h3 className="font-semibold">Customer Growth</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={growth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-chart-1)" strokeWidth={2.25} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Average Order Value by Group</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={aovByGroup} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
                  <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="aov" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} barSize={22} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold">Group Performance</h3>
        <div className="mt-4 space-y-3">
          {performance.map((p) => (
            <div key={p.name}>
              <div className="mb-1 flex justify-between text-sm"><span>{p.name} · {p.customers} customers</span><b>{formatCurrency(p.revenue)}</b></div>
              <div className="h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${(p.revenue / Math.max(1, performance[0]?.revenue || 1)) * 100}%` }} /></div>
            </div>
          ))}
          {!performance.length && <p className="text-sm text-muted-foreground">No group performance data yet.</p>}
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

function Audit({ enriched }: { enriched: { group: Group; meta: Meta }[] }) {
  const events = enriched.flatMap((x) => x.meta.activity.map((a) => ({ ...a, group: x.group.name }))).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Customer group changes will appear here." className="py-16" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>{["User", "Group", "Action", "Previous", "New", "Date", "Device", "IP Address"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={`${e.date}-${i}`}>
                  <TableCell>{e.user}</TableCell>
                  <TableCell>{e.group}</TableCell>
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
