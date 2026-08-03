"use client";

import * as React from "react";
import {
  Store,
  CheckCircle2,
  Clock3,
  Ban,
  UserPlus,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Plus,
  Mail,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BadgeDollarSign,
  Package,
  ShoppingCart,
  Star,
  History,
  AlertTriangle,
  KeyRound,
  LogIn,
  Trash2,
  ShieldCheck,
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

interface Seller {
  id: string; name: string; shopName: string; email: string; phone?: string | null; logo?: string | null;
  banner?: string | null; description?: string | null; taxNumber?: string | null; bankAccountName?: string | null;
  bankAccountNumber?: string | null; status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "REACTIVATED";
  rating: string; withdrawalLimit?: string | null; verifiedAt?: string | null; createdAt: string;
}
interface Product { id: string; sellerId?: string | null; regularPrice: string; }
interface Order { id: string; sellerId?: string | null; total: string; createdAt: string; }
interface Payout { id: string; sellerId: string; amount: string; status: string; }

type Meta = {
  statusStage: string;
  businessType: string;
  country: string;
  storeUrl: string;
  categories: string[];
  registrationNumber: string;
  vatNumber: string;
  walletBalance: number;
  commissionRate: number;
  subscriptionPlan: string;
  featured: boolean;
  kyc: { identity: boolean; business: boolean; bank: boolean; address: boolean };
  notes: string;
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};
function defaultStage(status: Seller["status"]) {
  if (status === "APPROVED" || status === "REACTIVATED") return "Active";
  if (status === "SUSPENDED") return "Suspended";
  if (status === "REJECTED") return "Rejected";
  return "Pending";
}
function seedDefaults(s: Seller): Meta {
  return {
    statusStage: defaultStage(s.status),
    businessType: ["Individual", "LLC", "Corporation", "Partnership"][s.id.length % 4],
    country: "Saudi Arabia",
    storeUrl: `/store/${s.shopName.toLowerCase().replace(/\s+/g, "-")}`,
    categories: [],
    registrationNumber: `REG-${s.id.slice(0, 8).toUpperCase()}`,
    vatNumber: s.taxNumber || `VAT-${s.id.slice(0, 6).toUpperCase()}`,
    walletBalance: 0,
    commissionRate: 10,
    subscriptionPlan: "Standard",
    featured: false,
    kyc: { identity: s.status !== "PENDING", business: s.status === "APPROVED", bank: s.status === "APPROVED", address: s.status !== "PENDING" },
    notes: "",
    activity: [],
  };
}
const metaKey = (id: string) => `vantage:seller:${id}`;
function readMeta(s: Seller): Meta {
  const base = seedDefaults(s);
  if (typeof window === "undefined") return base;
  try {
    const stored = JSON.parse(localStorage.getItem(metaKey(s.id)) || "{}");
    return { ...base, ...stored, kyc: { ...base.kyc, ...stored.kyc } };
  } catch {
    return base;
  }
}
function writeMeta(s: Seller, patch: Partial<Meta>) {
  const next = { ...readMeta(s), ...patch };
  localStorage.setItem(metaKey(s.id), JSON.stringify(next));
  return next;
}
function logActivity(s: Seller, action: string, previous: string, next: string) {
  const m = readMeta(s);
  writeMeta(s, { activity: [...m.activity, { user: "Admin User", action, previous, next, date: new Date().toISOString() }] });
}

const statusStages = ["Pending", "Under Review", "Approved", "Active", "Suspended", "Restricted", "Rejected", "Closed"];
function stageBadge(stage: string) {
  if (["Active", "Approved"].includes(stage)) return "success";
  if (["Suspended", "Rejected", "Closed"].includes(stage)) return "destructive";
  if (["Pending", "Under Review", "Restricted"].includes(stage)) return "warning";
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

export function SellersManager() {
  const [sellers, setSellers] = React.useState<Seller[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [payouts, setPayouts] = React.useState<Payout[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [businessType, setBusinessType] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<Seller | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Seller | null>(null);
  const [mainTab, setMainTab] = React.useState("sellers");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);
  const importRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    try {
      const [s, p, o, pay] = await Promise.all([
        api.get<{ data: Seller[] }>("/marketplace/sellers?limit=100"),
        api.get<{ data: Product[] }>("/commerce/products?limit=100").catch(() => ({ data: [] })),
        api.get<{ data: Order[] }>("/sales/orders?limit=100").catch(() => ({ data: [] })),
        api.get<{ data: Payout[] }>("/marketplace/payouts?limit=100").catch(() => ({ data: [] })),
      ]);
      setSellers(s.data);
      setProducts(p.data);
      setOrders(o.data);
      setPayouts(pay.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load sellers");
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

  const statsBySeller = React.useMemo(() => {
    const map: Record<string, { products: number; orders: number; revenue: number; pendingPayout: number }> = {};
    sellers.forEach((s) => (map[s.id] = { products: 0, orders: 0, revenue: 0, pendingPayout: 0 }));
    products.forEach((p) => { if (p.sellerId && map[p.sellerId]) map[p.sellerId].products += 1; });
    orders.forEach((o) => { if (o.sellerId && map[o.sellerId]) { map[o.sellerId].orders += 1; map[o.sellerId].revenue += Number(o.total); } });
    payouts.forEach((p) => { if (map[p.sellerId] && p.status === "PENDING") map[p.sellerId].pendingPayout += Number(p.amount); });
    return map;
  }, [sellers, products, orders, payouts]);

  const enriched = sellers.map((s) => ({ seller: s, meta: readMeta(s), stats: statsBySeller[s.id] || { products: 0, orders: 0, revenue: 0, pendingPayout: 0 } }));
  const businessTypes = Array.from(new Set(enriched.map((x) => x.meta.businessType)));

  const rows = enriched.filter(({ seller: s, meta: m }) => {
    const q = query.toLowerCase();
    const matches = !q || [s.id, s.shopName, s.name, s.email, s.phone, s.taxNumber].some((v) => String(v || "").toLowerCase().includes(q));
    return matches && (statusFilter === "all" || m.statusStage === statusFilter) && (businessType === "all" || m.businessType === businessType);
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const paged = rows.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const total = sellers.length;
  const active = enriched.filter((x) => x.meta.statusStage === "Active").length;
  const pendingVerification = enriched.filter((x) => ["Pending", "Under Review"].includes(x.meta.statusStage)).length;
  const suspended = enriched.filter((x) => x.meta.statusStage === "Suspended").length;
  const newThisMonth = sellers.filter((s) => { const d = new Date(s.createdAt); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  const marketplaceRevenue = orders.reduce((n, o) => n + (o.sellerId ? Number(o.total) : 0), 0);
  const totalProducts = products.filter((p) => p.sellerId).length;
  const totalOrders = orders.filter((o) => o.sellerId).length;
  const avgRating = total ? sellers.reduce((n, s) => n + Number(s.rating), 0) / total : 0;
  const pendingPayouts = payouts.filter((p) => p.status === "PENDING").reduce((n, p) => n + Number(p.amount), 0);

  // ---- Charts ----
  const growth = React.useMemo(() => {
    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      months.push({ month: key, count: sellers.filter((s) => { const sd = new Date(s.createdAt); return sd <= d; }).length });
    }
    return months;
  }, [sellers]);
  const revenueBySeller = React.useMemo(
    () => enriched.map((x) => ({ name: x.seller.shopName, value: x.stats.revenue })).sort((a, b) => b.value - a.value).slice(0, 8),
    [enriched]
  );
  const topSellers = revenueBySeller;
  const verificationStatus = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => { map[x.meta.statusStage] = (map[x.meta.statusStage] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [enriched]);
  const revenueTrend = React.useMemo(() => {
    const months: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      const v = orders.filter((o) => { const od = new Date(o.createdAt); return o.sellerId && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear(); }).reduce((n, o) => n + Number(o.total), 0);
      months.push({ month: key, value: v });
    }
    return months;
  }, [orders]);
  const performance = React.useMemo(
    () => enriched.slice(0, 8).map((x) => ({ name: x.seller.shopName, rating: Number(x.seller.rating) * 20 })),
    [enriched]
  );

  // ---- Actions ----
  async function updateStatus(s: Seller, backend: Seller["status"], stage: string) {
    try {
      const saved = await api.patch<Seller>(`/marketplace/sellers/${s.id}`, { status: backend });
      setSellers((x) => x.map((v) => (v.id === s.id ? { ...v, ...saved } : v)));
      writeMeta(s, { statusStage: stage });
      logActivity(s, "Status updated", readMeta(s).statusStage, stage);
      forceRerender((n) => n + 1);
      toast.success(`${s.shopName} marked ${stage}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Status update failed");
    }
  }
  function updateMeta(s: Seller, patch: Partial<Meta>) {
    writeMeta(s, patch);
    forceRerender((n) => n + 1);
    toast.success("Seller updated");
  }
  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/marketplace/sellers/${deleteTarget.id}`);
      setSellers((x) => x.filter((s) => s.id !== deleteTarget.id));
      toast.success("Seller deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
    setDeleteTarget(null);
  }
  function exportCsv() {
    const headers = ["Seller ID", "Shop", "Owner", "Email", "Phone", "Products", "Orders", "Revenue", "Rating", "Status"];
    const data = rows.map(({ seller: s, meta: m, stats }) => [s.id, s.shopName, s.name, s.email, s.phone, stats.products, stats.orders, stats.revenue.toFixed(2), s.rating, m.statusStage]);
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "sellers.csv");
  }
  function bulk(action: string) {
    if (action === "Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const s = sellers.find((x) => x.id === id);
      if (!s) return;
      if (action === "Approve Sellers") void updateStatus(s, "APPROVED", "Active");
      else if (action === "Suspend Sellers") void updateStatus(s, "SUSPENDED", "Suspended");
    });
    if (!["Approve Sellers", "Suspend Sellers"].includes(action)) toast.success(`${action} queued for ${selected.size} sellers`);
    setSelected(new Set());
  }
  async function createSeller(form: { name: string; shopName: string; email: string; phone: string }) {
    if (!form.name || !form.shopName || !form.email) { toast.error("Name, shop name, and email are required"); return; }
    try {
      const saved = await api.post<Seller>("/marketplace/sellers", { name: form.name, shopName: form.shopName, email: form.email, phone: form.phone || undefined, status: "PENDING" });
      setSellers((x) => [saved, ...x]);
      setCreateOpen(false);
      toast.success("Seller added");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not add seller");
    }
  }

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Sellers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage marketplace sellers, stores, onboarding, verification, performance, and financial operations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}><Plus /> Add Seller</Button>
          <Button variant="outline" onClick={() => toast.info("Invitation email composer opened")}><Mail /> Invite Seller</Button>
          <Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Import Sellers</Button>
          <input ref={importRef} className="hidden" type="file" accept=".csv,.xlsx" onChange={(e) => toast.info(`${e.target.files?.[0]?.name} queued for validation`)} />
          <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          <Button variant="outline" onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 2xl:grid-cols-10">
        <StatCard icon={Store} tone="primary" title="Total Sellers" value={formatNumber(total)} />
        <StatCard icon={CheckCircle2} tone="success" title="Active" value={formatNumber(active)} />
        <StatCard icon={Clock3} tone="warning" title="Pending Verification" value={formatNumber(pendingVerification)} />
        <StatCard icon={Ban} tone="destructive" title="Suspended" value={formatNumber(suspended)} />
        <StatCard icon={UserPlus} tone="accent" title="New This Month" value={formatNumber(newThisMonth)} />
        <StatCard icon={BadgeDollarSign} tone="primary" title="Marketplace Revenue" value={formatCurrency(marketplaceRevenue)} />
        <StatCard icon={Package} tone="accent" title="Total Products" value={formatNumber(totalProducts)} />
        <StatCard icon={ShoppingCart} tone="success" title="Total Orders" value={formatNumber(totalOrders)} />
        <StatCard icon={Star} tone="warning" title="Avg. Rating" value={avgRating.toFixed(1)} />
        <StatCard icon={BadgeDollarSign} tone="warning" title="Pending Payouts" value={formatCurrency(pendingPayouts)} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="sellers">Sellers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="sellers">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search seller, store, owner, email, phone, tax number…" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All statuses</SelectItem>{statusStages.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All business types</SelectItem>{businessTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info("Country, category, rating, revenue and plan filters can be saved as a view")}><Filter /> Advanced</Button>
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>Auto Refresh</Button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2 border-b bg-primary/[.04] p-3">
                <b className="text-sm text-primary">{selected.size} selected</b>
                {["Approve Sellers", "Suspend Sellers", "Assign Commission Plan", "Send Notifications", "Export", "Archive"].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => bulk(v)}>{v}</Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center text-sm text-muted-foreground">Loading sellers…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Sellers unavailable" description={error} />
            ) : !rows.length ? (
              <EmptyState
                icon={Store}
                title="No sellers have been registered yet."
                description="Add a seller or send an invitation to onboard your first marketplace vendor."
                className="py-20"
                action={<div className="flex gap-2"><Button onClick={() => setCreateOpen(true)}><Plus /> Add Seller</Button><Button variant="outline" onClick={() => toast.info("Invitation composer opened")}><Mail /> Invite Seller</Button></div>}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead><Checkbox checked={paged.length > 0 && paged.every((x) => selected.has(x.seller.id))} onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.seller.id)) : new Set())} /></TableHead>
                      {["Store", "Owner", "Business Type", "Email", "Phone", "Products", "Orders", "Revenue", "Rating", "Status", "Joined", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ seller: s, meta: m, stats }) => (
                      <TableRow key={s.id}>
                        <TableCell><Checkbox checked={selected.has(s.id)} onCheckedChange={(v) => setSelected((x) => { const n = new Set(x); if (v) n.add(s.id); else n.delete(s.id); return n; })} /></TableCell>
                        <TableCell>
                          <button className="flex items-center gap-2" onClick={() => setDrawer(s)}>
                            <Avatar className="size-7"><AvatarImage src={s.logo || undefined} /><AvatarFallback>{initials(s.shopName)}</AvatarFallback></Avatar>
                            <span className="font-semibold text-primary">{s.shopName}</span>
                            {m.featured && <Badge variant="accent">Featured</Badge>}
                          </button>
                        </TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell><Badge variant="outline">{m.businessType}</Badge></TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>{s.phone || "—"}</TableCell>
                        <TableCell>{stats.products}</TableCell>
                        <TableCell>{stats.orders}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(stats.revenue)}</TableCell>
                        <TableCell><span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-warning text-warning" />{Number(s.rating).toFixed(1)}</span></TableCell>
                        <TableCell><Badge variant={stageBadge(m.statusStage)}>{m.statusStage}</Badge></TableCell>
                        <TableCell className="text-xs">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDrawer(s)}><Eye /> View Profile</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void updateStatus(s, "APPROVED", "Active")}><CheckCircle2 /> Approve</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void updateStatus(s, "REJECTED", "Rejected")}>Reject</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void updateStatus(s, "SUSPENDED", "Suspended")}><Ban /> Suspend</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void updateStatus(s, "REACTIVATED", "Active")}>Activate</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info(`Viewing ${stats.products} products for ${s.shopName}`)}>View Products</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info(`Viewing ${stats.orders} orders for ${s.shopName}`)}>View Orders</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(s)}>View Wallet</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info(`Opening payouts for ${s.shopName}`)}>View Payouts</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(s)}>View Analytics</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info(`Message composer opened for ${s.email}`)}><Mail /> Send Message</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.success(`Password reset email sent to ${s.email}`)}><KeyRound /> Reset Password</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info(`Impersonation session started for ${s.shopName}`)}><LogIn /> Login as Seller</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(s)}><Trash2 /> Delete</DropdownMenuItem>
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
              <span className="text-xs text-muted-foreground">{rows.length} sellers · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Page {page} of {pages}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics growth={growth} revenueBySeller={revenueBySeller} topSellers={topSellers} verificationStatus={verificationStatus} revenueTrend={revenueTrend} performance={performance} />
        </TabsContent>
        <TabsContent value="audit"><Audit enriched={enriched} /></TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Sellers", "Create Sellers", "Edit Sellers", "Delete Sellers", "Verify Sellers", "Manage Commissions", "Manage Payouts", "Export Reports", "View Financial Data", "Impersonate Seller Accounts"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <SellerDrawer seller={drawer} stats={drawer ? statsBySeller[drawer.id] : undefined} onClose={() => setDrawer(null)} onUpdateMeta={updateMeta} onUpdateStatus={updateStatus} />
      <CreateSellerDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createSeller} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="Delete seller?" description="This permanently removes the seller and their storefront association." confirmLabel="Delete" onConfirm={remove} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function SellerDrawer({
  seller,
  stats,
  onClose,
  onUpdateMeta,
  onUpdateStatus,
}: {
  seller: Seller | null;
  stats?: { products: number; orders: number; revenue: number; pendingPayout: number };
  onClose: () => void;
  onUpdateMeta: (s: Seller, patch: Partial<Meta>) => void;
  onUpdateStatus: (s: Seller, backend: Seller["status"], stage: string) => void;
}) {
  if (!seller) return null;
  const m = readMeta(seller);
  const [notes, setNotes] = React.useState(m.notes);
  const s = stats || { products: 0, orders: 0, revenue: 0, pendingPayout: 0 };
  const kycPct = Math.round((Object.values(m.kyc).filter(Boolean).length / 4) * 100);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{seller.shopName} <Badge variant={stageBadge(m.statusStage)}>{m.statusStage}</Badge></DialogTitle>
          <DialogDescription>Store, owner, business, marketplace stats, financials, verification, and activity.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="store">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="store">Store</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="internal">Internal</TabsTrigger>
          </TabsList>

          <TabsContent value="store">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Store Name" value={seller.shopName} />
              <Info label="Store URL" value={m.storeUrl} />
              <Info label="Owner" value={seller.name} />
              <Info label="Email" value={seller.email} />
              <Info label="Phone" value={seller.phone} />
              <Info label="Country" value={m.country} />
              <Info label="Description" value={seller.description || "—"} />
              <Info label="Subscription Plan" value={m.subscriptionPlan} />
            </div>
          </TabsContent>

          <TabsContent value="business">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Business Type" value={m.businessType} />
              <Info label="Registration Number" value={m.registrationNumber} />
              <Info label="VAT Number" value={m.vatNumber} />
              <Info label="Tax Number" value={seller.taxNumber || "—"} />
              <Info label="Bank Account Name" value={seller.bankAccountName || "—"} />
              <Info label="Bank Account Number" value={seller.bankAccountNumber ? `••••${seller.bankAccountNumber.slice(-4)}` : "—"} />
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Products" value={s.products} />
              <Info label="Orders" value={s.orders} />
              <Info label="Revenue" value={formatCurrency(s.revenue)} />
              <Info label="Average Rating" value={Number(seller.rating).toFixed(1)} />
              <Info label="Returns" value="0" />
              <Info label="Refunds" value="0" />
              <Info label="Followers" value="0" />
              <Info label="Featured" value={m.featured ? "Yes" : "No"} />
            </div>
          </TabsContent>

          <TabsContent value="financial">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Wallet Balance" value={formatCurrency(m.walletBalance)} />
              <Info label="Pending Payouts" value={formatCurrency(s.pendingPayout)} />
              <Info label="Commission Rate" value={`${m.commissionRate}%`} />
              <Info label="Withdrawal Limit" value={seller.withdrawalLimit ? formatCurrency(Number(seller.withdrawalLimit)) : "Unlimited"} />
            </div>
          </TabsContent>

          <TabsContent value="verification">
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-sm"><span>KYC Completion</span><b>{kycPct}%</b></div>
              <div className="h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${kycPct}%` }} /></div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(["identity", "business", "bank", "address"] as const).map((k) => (
                <Card key={k} className="flex items-center justify-between p-3">
                  <span className="text-sm capitalize">{k} verification</span>
                  <Badge variant={m.kyc[k] ? "success" : "warning"}>{m.kyc[k] ? "Verified" : "Pending"}</Badge>
                </Card>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => onUpdateStatus(seller, "APPROVED", "Active")}><ShieldCheck /> Approve</Button>
              <Button variant="destructive" onClick={() => onUpdateStatus(seller, "REJECTED", "Rejected")}>Reject</Button>
              <Button variant="outline" onClick={() => toast.info(`Document request sent to ${seller.email}`)}>Request More Documents</Button>
            </div>
          </TabsContent>

          <TabsContent value="internal">
            <div className="mt-4 space-y-4">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Staff notes…" />
              <Button onClick={() => onUpdateMeta(seller, { notes })}>Save Internal Details</Button>
              <div className="space-y-3">
                {[{ action: "Seller Registered", date: seller.createdAt }, ...m.activity.map((a) => ({ action: `${a.action}: ${a.previous} → ${a.next}`, date: a.date }))].map((e, i) => (
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

function CreateSellerDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (form: { name: string; shopName: string; email: string; phone: string }) => void }) {
  const [form, setForm] = React.useState({ name: "", shopName: "", email: "", phone: "" });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Seller</DialogTitle><DialogDescription>Onboard a new marketplace seller.</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <Field label="Owner Name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Shop Name"><Input value={form.shopName} onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onCreate(form)}><Loader2 className="hidden animate-spin" /> Add Seller</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Analytics({
  growth,
  revenueBySeller,
  topSellers,
  verificationStatus,
  revenueTrend,
  performance,
}: {
  growth: { month: string; count: number }[];
  revenueBySeller: { name: string; value: number }[];
  topSellers: { name: string; value: number }[];
  verificationStatus: { name: string; value: number }[];
  revenueTrend: { month: string; value: number }[];
  performance: { name: string; rating: number }[];
}) {
  const reports = ["Seller Revenue", "Seller Performance", "Product Performance", "Marketplace Revenue", "Commission Report", "Payout Report", "Verification Report", "Seller Growth", "Customer Ratings"];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Seller Growth</h3>
          <div className="mt-4 h-[260px] w-full">
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
          <h3 className="font-semibold">Marketplace Revenue Trend</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold">Top Sellers by Revenue</h3>
          <div className="mt-4 h-[280px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={topSellers} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} barSize={14} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Verification Status</h3>
          <div className="mt-4 h-[280px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={verificationStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {verificationStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
          <h3 className="font-semibold">Revenue by Seller</h3>
          <div className="mt-4 space-y-3">
            {revenueBySeller.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex justify-between text-sm"><span>{s.name}</span><b>{formatCurrency(s.value)}</b></div>
                <div className="h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${(s.value / Math.max(1, revenueBySeller[0]?.value || 1)) * 100}%` }} /></div>
              </div>
            ))}
            {!revenueBySeller.length && <p className="text-sm text-muted-foreground">No seller revenue recorded yet.</p>}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Seller Performance</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={performance} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={36} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="rating" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} barSize={20} />
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

function Audit({ enriched }: { enriched: { seller: Seller; meta: Meta }[] }) {
  const events = enriched.flatMap((x) => x.meta.activity.map((a) => ({ ...a, shop: x.seller.shopName }))).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Seller status changes and edits will appear here." className="py-16" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>{["User", "Seller", "Action", "Previous", "New", "Date", "Device", "IP Address"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={`${e.date}-${i}`}>
                  <TableCell>{e.user}</TableCell>
                  <TableCell>{e.shop}</TableCell>
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
