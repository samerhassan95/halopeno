"use client";

import * as React from "react";
import {
  HandCoins,
  CheckCircle2,
  Clock3,
  XCircle,
  Ban,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BadgeDollarSign,
  History,
  AlertTriangle,
  CalendarClock,
  RotateCcw,
  Wallet,
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
import { formatCurrency, formatNumber } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Seller { id: string; name: string; shopName: string; email: string; phone?: string | null; bankAccountName?: string | null; bankAccountNumber?: string | null; }
interface Payout {
  id: string; sellerId: string; amount: string; method: "BANK" | "WALLET" | "MANUAL";
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING" | "PAID" | "FAILED";
  requestedAt: string; processedAt?: string | null; notes?: string | null;
}

type Meta = {
  stage: string;
  commissionRate: number;
  reviewer: string;
  gateway: string;
  transferId: string;
  reconciliationStatus: string;
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};
function defaultStage(status: Payout["status"]) {
  const map: Record<Payout["status"], string> = { PENDING: "Requested", APPROVED: "Approved", REJECTED: "Rejected", PROCESSING: "Processing", PAID: "Paid", FAILED: "Failed" };
  return map[status];
}
const defaults: Meta = { stage: "Requested", commissionRate: 10, reviewer: "Unassigned", gateway: "Bank Transfer", transferId: "", reconciliationStatus: "Pending", activity: [] };
const metaKey = (id: string) => `vantage:payout:${id}`;
function readMeta(p: Payout): Meta {
  const base = { ...defaults, stage: defaultStage(p.status) };
  if (typeof window === "undefined") return base;
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(metaKey(p.id)) || "{}") };
  } catch {
    return base;
  }
}
function writeMeta(p: Payout, patch: Partial<Meta>) {
  const next = { ...readMeta(p), ...patch };
  localStorage.setItem(metaKey(p.id), JSON.stringify(next));
  return next;
}
function logActivity(p: Payout, action: string, previous: string, next: string) {
  const m = readMeta(p);
  writeMeta(p, { activity: [...m.activity, { user: "Admin User", action, previous, next, date: new Date().toISOString() }] });
}

const payoutStages = ["Draft", "Requested", "Pending Review", "Approved", "Scheduled", "Processing", "Paid", "Failed", "Cancelled", "Rejected"];
function stageBadge(stage: string) {
  if (stage === "Paid") return "success";
  if (["Failed", "Rejected", "Cancelled"].includes(stage)) return "destructive";
  if (["Requested", "Pending Review", "Scheduled"].includes(stage)) return "warning";
  if (["Processing", "Approved"].includes(stage)) return "accent";
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

export function PayoutRequestsManager() {
  const [payouts, setPayouts] = React.useState<Payout[]>([]);
  const [sellers, setSellers] = React.useState<Seller[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [methodFilter, setMethodFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<Payout | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [mainTab, setMainTab] = React.useState("payouts");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);

  const load = React.useCallback(async () => {
    try {
      const [p, s] = await Promise.all([
        api.get<{ data: Payout[] }>("/marketplace/payouts?limit=100"),
        api.get<{ data: Seller[] }>("/marketplace/sellers?limit=100"),
      ]);
      setPayouts(p.data);
      setSellers(s.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load payout requests");
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

  const sellersById = React.useMemo(() => Object.fromEntries(sellers.map((s) => [s.id, s])), [sellers]);
  const enriched = payouts.map((p) => ({ payout: p, seller: sellersById[p.sellerId], meta: readMeta(p) }));

  const rows = enriched.filter(({ payout: p, seller: s, meta: m }) => {
    const q = query.toLowerCase();
    const matches = !q || [p.id, s?.shopName, s?.name, s?.email, m.transferId].some((v) => String(v || "").toLowerCase().includes(q));
    return matches && (statusFilter === "all" || m.stage === statusFilter) && (methodFilter === "all" || p.method === methodFilter);
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const paged = rows.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const pending = enriched.filter((x) => ["Requested", "Pending Review"].includes(x.meta.stage)).length;
  const approved = enriched.filter((x) => x.meta.stage === "Approved").length;
  const paid = enriched.filter((x) => x.meta.stage === "Paid").length;
  const rejected = enriched.filter((x) => x.meta.stage === "Rejected").length;
  const totalPendingAmount = enriched.filter((x) => ["Requested", "Pending Review", "Scheduled"].includes(x.meta.stage)).reduce((n, x) => n + Number(x.payout.amount), 0);
  const totalPaidThisMonth = payouts.filter((p) => { const d = new Date(p.processedAt || p.requestedAt); const now = new Date(); return p.status === "PAID" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((n, p) => n + Number(p.amount), 0);
  const avgProcessingTime = React.useMemo(() => {
    const times = payouts.filter((p) => p.processedAt).map((p) => (new Date(p.processedAt!).getTime() - new Date(p.requestedAt).getTime()) / 86400000);
    return times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }, [payouts]);
  const failedTransfers = enriched.filter((x) => x.meta.stage === "Failed").length;

  // ---- Charts ----
  const monthlyTrend = React.useMemo(() => {
    const months: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      const v = payouts.filter((p) => { const pd = new Date(p.requestedAt); return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear(); }).reduce((n, p) => n + Number(p.amount), 0);
      months.push({ month: key, value: v });
    }
    return months;
  }, [payouts]);
  const volume = React.useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days.push({ date: key, count: payouts.filter((p) => new Date(p.requestedAt).toDateString() === d.toDateString()).length });
    }
    return days;
  }, [payouts]);
  const byMethod = React.useMemo(() => {
    const map: Record<string, number> = {};
    payouts.forEach((p) => { map[p.method] = (map[p.method] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: titleCase(name), value }));
  }, [payouts]);
  const pendingVsPaid = React.useMemo(() => [
    { name: "Pending", value: totalPendingAmount },
    { name: "Paid", value: payouts.filter((p) => p.status === "PAID").reduce((n, p) => n + Number(p.amount), 0) },
  ], [totalPendingAmount, payouts]);
  const topSellers = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => { const name = x.seller?.shopName || "Unknown"; map[name] = (map[name] || 0) + Number(x.payout.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [enriched]);

  // ---- Actions ----
  async function updateBackendStatus(p: Payout, backend: Payout["status"]) {
    try {
      const saved = await api.patch<Payout>(`/marketplace/payouts/${p.id}`, { status: backend, processedAt: ["PAID", "FAILED"].includes(backend) ? new Date().toISOString() : undefined });
      setPayouts((x) => x.map((v) => (v.id === p.id ? { ...v, ...saved } : v)));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
      throw e;
    }
  }
  async function transition(p: Payout, stage: string) {
    const m = readMeta(p);
    try {
      if (stage === "Approved") await updateBackendStatus(p, "APPROVED");
      else if (stage === "Rejected") await updateBackendStatus(p, "REJECTED");
      else if (stage === "Processing") await updateBackendStatus(p, "PROCESSING");
      else if (stage === "Paid") await updateBackendStatus(p, "PAID");
      else if (stage === "Failed") await updateBackendStatus(p, "FAILED");
      writeMeta(p, { stage });
      logActivity(p, "Status updated", m.stage, stage);
      forceRerender((n) => n + 1);
      toast.success(`Payout marked ${stage}`);
    } catch {
      /* handled */
    }
  }
  function updateMeta(p: Payout, patch: Partial<Meta>) {
    writeMeta(p, patch);
    forceRerender((n) => n + 1);
    toast.success("Payout updated");
  }
  function exportCsv() {
    const headers = ["Request ID", "Seller", "Amount", "Commission", "Net", "Method", "Status", "Requested", "Paid"];
    const data = rows.map(({ payout: p, seller: s, meta: m }) => {
      const net = Number(p.amount) * (1 - m.commissionRate / 100);
      return [p.id, s?.shopName, p.amount, `${m.commissionRate}%`, net.toFixed(2), titleCase(p.method), m.stage, p.requestedAt, p.processedAt || "—"];
    });
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "payout-requests.csv");
  }
  function bulk(action: string) {
    if (action === "Bulk Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const p = payouts.find((x) => x.id === id);
      if (!p) return;
      if (action === "Bulk Approve") void transition(p, "Approved");
      else if (action === "Bulk Reject") void transition(p, "Rejected");
      else if (action === "Bulk Pay") void transition(p, "Paid");
    });
    if (!["Bulk Approve", "Bulk Reject", "Bulk Pay"].includes(action)) toast.success(`${action} queued for ${selected.size} requests`);
    setSelected(new Set());
  }
  async function createPayout(form: { sellerId: string; amount: string; method: Payout["method"] }) {
    if (!form.sellerId || !form.amount) { toast.error("Seller and amount are required"); return; }
    try {
      const saved = await api.post<Payout>("/marketplace/payouts", { sellerId: form.sellerId, amount: Number(form.amount), method: form.method, status: "PENDING" });
      setPayouts((x) => [saved, ...x]);
      setCreateOpen(false);
      toast.success("Payout request created");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create payout request");
    }
  }

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Payout Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage seller withdrawal requests, approvals, payment processing, and financial reconciliation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => (selected.size ? bulk("Bulk Pay") : setCreateOpen(true))}><BadgeDollarSign /> Process Payouts</Button>
          <Button variant="outline" onClick={() => toast.info("Scheduled payment window opened")}><CalendarClock /> Schedule Payments</Button>
          <Button variant="outline" onClick={() => toast.info("Payout import queued")}>Import Requests</Button>
          <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          <Button variant="outline" onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <StatCard icon={Clock3} tone="warning" title="Pending Requests" value={formatNumber(pending)} />
        <StatCard icon={CheckCircle2} tone="success" title="Approved" value={formatNumber(approved)} />
        <StatCard icon={BadgeDollarSign} tone="success" title="Paid" value={formatNumber(paid)} />
        <StatCard icon={XCircle} tone="destructive" title="Rejected" value={formatNumber(rejected)} />
        <StatCard icon={HandCoins} tone="warning" title="Total Pending" value={formatCurrency(totalPendingAmount)} />
        <StatCard icon={BadgeDollarSign} tone="primary" title="Paid This Month" value={formatCurrency(totalPaidThisMonth)} />
        <StatCard icon={Clock3} tone="accent" title="Avg. Processing" value={`${avgProcessingTime.toFixed(1)}d`} />
        <StatCard icon={AlertTriangle} tone="destructive" title="Failed Transfers" value={formatNumber(failedTransfers)} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="payouts">Payout Requests</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="payouts">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search request, seller, store, email, transfer ID…" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All statuses</SelectItem>{payoutStages.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="xl:w-40"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All methods</SelectItem><SelectItem value="BANK">Bank</SelectItem><SelectItem value="WALLET">Wallet</SelectItem><SelectItem value="MANUAL">Manual</SelectItem></SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info("Country, currency, amount range, and reviewer filters can be saved as a view")}><Filter /> Advanced</Button>
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>Auto Refresh</Button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2 border-b bg-primary/[.04] p-3">
                <b className="text-sm text-primary">{selected.size} selected</b>
                {["Bulk Approve", "Bulk Reject", "Bulk Schedule", "Bulk Pay", "Bulk Export", "Bulk Archive"].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => bulk(v)}>{v}</Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center text-sm text-muted-foreground">Loading payout requests…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Payout requests unavailable" description={error} />
            ) : !rows.length ? (
              <EmptyState
                icon={HandCoins}
                title="No payout requests have been submitted yet."
                description="Seller withdrawal requests will appear here."
                className="py-20"
                action={<div className="flex gap-2"><Button onClick={() => setCreateOpen(true)}><Plus /> Process Payouts</Button><Button variant="outline" onClick={() => toast.info("Payout import queued")}>Import Requests</Button></div>}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead><Checkbox checked={paged.length > 0 && paged.every((x) => selected.has(x.payout.id))} onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.payout.id)) : new Set())} /></TableHead>
                      {["Request ID", "Seller", "Store", "Requested Amount", "Commission", "Net Amount", "Method", "Requested", "Status", "Paid Date", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ payout: p, seller: s, meta: m }) => {
                      const net = Number(p.amount) * (1 - m.commissionRate / 100);
                      return (
                        <TableRow key={p.id}>
                          <TableCell><Checkbox checked={selected.has(p.id)} onCheckedChange={(v) => setSelected((x) => { const n = new Set(x); if (v) n.add(p.id); else n.delete(p.id); return n; })} /></TableCell>
                          <TableCell><button className="font-mono text-xs font-semibold text-primary" onClick={() => setDrawer(p)}>{p.id.slice(0, 12)}</button></TableCell>
                          <TableCell>{s?.name || "—"}</TableCell>
                          <TableCell>{s?.shopName || "—"}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(Number(p.amount))}</TableCell>
                          <TableCell>{m.commissionRate}%</TableCell>
                          <TableCell>{formatCurrency(net)}</TableCell>
                          <TableCell><Badge variant="outline">{titleCase(p.method)}</Badge></TableCell>
                          <TableCell className="text-xs">{new Date(p.requestedAt).toLocaleDateString()}</TableCell>
                          <TableCell><Badge variant={stageBadge(m.stage)}>{m.stage}</Badge></TableCell>
                          <TableCell className="text-xs">{p.processedAt ? new Date(p.processedAt).toLocaleDateString() : "—"}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDrawer(p)}><Eye /> View Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void transition(p, "Approved")}><CheckCircle2 /> Approve</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void transition(p, "Rejected")}>Reject</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateMeta(p, { stage: "Scheduled" })}><CalendarClock /> Hold / Schedule</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void transition(p, "Paid")}><BadgeDollarSign /> Mark as Paid</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void transition(p, "Processing")}><RotateCcw /> Retry Payment</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.success("Receipt downloaded")}><Download /> Download Receipt</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setMainTab("audit")}><History /> View Audit Log</DropdownMenuItem>
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
              <span className="text-xs text-muted-foreground">{rows.length} payout requests · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Page {page} of {pages}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics monthlyTrend={monthlyTrend} volume={volume} byMethod={byMethod} pendingVsPaid={pendingVsPaid} topSellers={topSellers} />
        </TabsContent>
        <TabsContent value="audit"><Audit enriched={enriched} /></TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Payout Requests", "Approve Payouts", "Reject Payouts", "Process Payments", "Retry Payments", "View Financial Reports", "Export Reports", "Manage Payment Settings"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <PayoutDrawer payout={drawer} seller={drawer ? sellersById[drawer.sellerId] : undefined} onClose={() => setDrawer(null)} onTransition={transition} onUpdateMeta={updateMeta} />
      <CreatePayoutDialog open={createOpen} onClose={() => setCreateOpen(false)} sellers={sellers} onCreate={createPayout} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function PayoutDrawer({
  payout,
  seller,
  onClose,
  onTransition,
  onUpdateMeta,
}: {
  payout: Payout | null;
  seller?: Seller;
  onClose: () => void;
  onTransition: (p: Payout, stage: string) => void;
  onUpdateMeta: (p: Payout, patch: Partial<Meta>) => void;
}) {
  if (!payout) return null;
  const m = readMeta(payout);
  const commission = Number(payout.amount) * (m.commissionRate / 100);
  const net = Number(payout.amount) - commission;
  const [transferId, setTransferId] = React.useState(m.transferId);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Payout {payout.id.slice(0, 12)} <Badge variant={stageBadge(m.stage)}>{m.stage}</Badge></DialogTitle>
          <DialogDescription>Seller info, financial breakdown, payment details, processing, and activity.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="seller">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="seller">Seller</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="seller">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Seller ID" value={seller?.id.slice(0, 12)} />
              <Info label="Store Name" value={seller?.shopName} />
              <Info label="Owner" value={seller?.name} />
              <Info label="Email" value={seller?.email} />
              <Info label="Phone" value={seller?.phone} />
            </div>
          </TabsContent>

          <TabsContent value="financial">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Requested Amount" value={formatCurrency(Number(payout.amount))} />
              <Info label="Marketplace Commission" value={`${m.commissionRate}% (${formatCurrency(commission)})`} />
              <Info label="Taxes" value={formatCurrency(0)} />
              <Info label="Net Payable" value={formatCurrency(net)} />
            </div>
            <div className="mt-3 max-w-xs">
              <Label>Commission Rate</Label>
              <Input type="number" className="mt-1.5" value={m.commissionRate} onChange={(e) => onUpdateMeta(payout, { commissionRate: Number(e.target.value) })} />
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Payment Method" value={titleCase(payout.method)} />
              <Info label="Bank Name" value={seller?.bankAccountName ? "On file" : "—"} />
              <Info label="Account Holder" value={seller?.bankAccountName} />
              <Info label="Account Number" value={seller?.bankAccountNumber ? `••••${seller.bankAccountNumber.slice(-4)}` : "—"} />
            </div>
          </TabsContent>

          <TabsContent value="processing">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Requested Date" value={new Date(payout.requestedAt).toLocaleDateString()} />
              <Info label="Paid Date" value={payout.processedAt ? new Date(payout.processedAt).toLocaleDateString() : "—"} />
              <Info label="Reviewer" value={m.reviewer} />
              <Info label="Reconciliation Status" value={m.reconciliationStatus} />
            </div>
            <div className="mt-4 max-w-sm space-y-2">
              <Label>Transfer Reference</Label>
              <Input value={transferId} onChange={(e) => setTransferId(e.target.value)} placeholder="TX-000000" />
              <Button size="sm" onClick={() => onUpdateMeta(payout, { transferId })}>Save Reference</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => onTransition(payout, "Approved")}><CheckCircle2 /> Approve</Button>
              <Button variant="destructive" onClick={() => onTransition(payout, "Rejected")}>Reject</Button>
              <Button variant="outline" onClick={() => onTransition(payout, "Paid")}>Mark as Paid</Button>
              <Button variant="outline" onClick={() => onUpdateMeta(payout, { reconciliationStatus: "Reconciled" })}>Mark Reconciled</Button>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="mt-4 space-y-3">
              {[{ action: "Payout Requested", date: payout.requestedAt }, ...m.activity.map((a) => ({ action: `${a.action}: ${a.previous} → ${a.next}`, date: a.date }))].map((e, i) => (
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CreatePayoutDialog({
  open,
  onClose,
  sellers,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  sellers: Seller[];
  onCreate: (form: { sellerId: string; amount: string; method: Payout["method"] }) => void;
}) {
  const [form, setForm] = React.useState<{ sellerId: string; amount: string; method: Payout["method"] }>({ sellerId: "", amount: "0", method: "BANK" });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create Payout Request</DialogTitle><DialogDescription>Manually record a seller withdrawal request.</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label>Seller</Label>
            <Select value={form.sellerId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, sellerId: v === "none" ? "" : v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">Select seller</SelectItem>{sellers.map((s) => <SelectItem key={s.id} value={s.id}>{s.shopName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount</Label>
            <Input type="number" className="mt-1.5" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <Label>Method</Label>
            <Select value={form.method} onValueChange={(v) => setForm((f) => ({ ...f, method: v as Payout["method"] }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="BANK">Bank</SelectItem><SelectItem value="WALLET">Wallet</SelectItem><SelectItem value="MANUAL">Manual</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onCreate(form)}><Loader2 className="hidden animate-spin" /> Create Request</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Analytics({
  monthlyTrend,
  volume,
  byMethod,
  pendingVsPaid,
  topSellers,
}: {
  monthlyTrend: { month: string; value: number }[];
  volume: { date: string; count: number }[];
  byMethod: { name: string; value: number }[];
  pendingVsPaid: { name: string; value: number }[];
  topSellers: { name: string; value: number }[];
}) {
  const reports = ["Monthly Payout Report", "Seller Earnings Report", "Commission Report", "Tax Report", "Failed Payments", "Payment Method Report", "Accounting Report", "Financial Summary"];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Monthly Payout Trend</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
        <Card className="p-5">
          <h3 className="font-semibold">Payout Volume</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={volume} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          <h3 className="font-semibold">Payment Methods</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byMethod} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {byMethod.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Pending vs Paid</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pendingVsPaid} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {pendingVsPaid.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Top Sellers by Earnings</h3>
          <div className="mt-4 max-h-[240px] space-y-3 overflow-y-auto">
            {topSellers.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex justify-between text-sm"><span>{s.name}</span><b>{formatCurrency(s.value)}</b></div>
                <div className="h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${(s.value / Math.max(1, topSellers[0]?.value || 1)) * 100}%` }} /></div>
              </div>
            ))}
            {!topSellers.length && <p className="text-sm text-muted-foreground">No payout data yet.</p>}
          </div>
        </Card>
      </div>

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

function Audit({ enriched }: { enriched: { payout: Payout; seller?: Seller; meta: Meta }[] }) {
  const events = enriched.flatMap((x) => x.meta.activity.map((a) => ({ ...a, payoutId: x.payout.id.slice(0, 12) }))).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Payout status changes will appear here." className="py-16" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>{["User", "Request", "Action", "Previous", "New", "Date", "Device", "IP Address"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={`${e.date}-${i}`}>
                  <TableCell>{e.user}</TableCell>
                  <TableCell className="font-mono text-xs">{e.payoutId}</TableCell>
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
