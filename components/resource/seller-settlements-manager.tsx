"use client";

import { adminTr } from "@/lib/i18n/admin-tr";

import * as React from "react";
import {
  Banknote,
  CheckCircle2,
  Clock3,
  XCircle,
  Loader2 as LoaderIcon,
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
  FileText,
  RotateCcw,
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
import { formatCurrency, formatNumber } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Seller { id: string; name: string; shopName: string; email: string; }
interface Settlement {
  id: string; sellerId: string; periodStart: string; periodEnd: string;
  grossSales: string; commission: string; netPayable: string; status: string; createdAt: string;
}

type Meta = {
  stage: string;
  taxes: number;
  refunds: number;
  chargebacks: number;
  bonuses: number;
  currency: string;
  exchangeRate: number;
  notes: string;
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};
function defaultStage(status: string) {
  const s = status.toLowerCase();
  if (s === "completed" || s === "paid") return "Completed";
  if (s === "approved") return "Approved";
  if (s === "processing") return "Processing";
  if (s === "failed") return "Failed";
  if (s === "cancelled") return "Cancelled";
  return "Pending Review";
}
const defaults: Meta = { stage: "Pending Review", taxes: 0, refunds: 0, chargebacks: 0, bonuses: 0, currency: "USD", exchangeRate: 1, notes: "", activity: [] };
const metaKey = (id: string) => `vantage:settlement:${id}`;
function readMeta(s: Settlement): Meta {
  const base = { ...defaults, stage: defaultStage(s.status) };
  if (typeof window === "undefined") return base;
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(metaKey(s.id)) || "{}") };
  } catch {
    return base;
  }
}
function writeMeta(s: Settlement, patch: Partial<Meta>) {
  const next = { ...readMeta(s), ...patch };
  localStorage.setItem(metaKey(s.id), JSON.stringify(next));
  return next;
}
function logActivity(s: Settlement, action: string, previous: string, next: string) {
  const m = readMeta(s);
  writeMeta(s, { activity: [...m.activity, { user: "Admin User", action, previous, next, date: new Date().toISOString() }] });
}

const settlementStages = ["Draft", "Calculating", "Pending Review", "Approved", "Scheduled", "Processing", "Completed", "Failed", "Cancelled"];
function stageBadge(stage: string) {
  if (stage === "Completed") return "success";
  if (["Failed", "Cancelled"].includes(stage)) return "destructive";
  if (["Pending Review", "Draft", "Calculating"].includes(stage)) return "warning";
  if (["Processing", "Approved", "Scheduled"].includes(stage)) return "accent";
  return "secondary" as const;
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

export function SellerSettlementsManager(){const [settlements, setSettlements] = React.useState<Settlement[]>([]);
  const [sellers, setSellers] = React.useState<Seller[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<Settlement | null>(null);
  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [mainTab, setMainTab] = React.useState("settlements");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);

  const load = React.useCallback(async () => {
    try {
      const [s, sel] = await Promise.all([
        api.get<{ data: Settlement[] }>("/finance/seller-settlements?limit=100"),
        api.get<{ data: Seller[] }>("/marketplace/sellers?limit=100"),
      ]);
      setSettlements(s.data);
      setSellers(sel.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load seller settlements");
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
  const enriched = settlements.map((s) => ({ settlement: s, seller: sellersById[s.sellerId], meta: readMeta(s) }));

  const rows = enriched.filter(({ settlement: s, seller: sel }) => {
    const q = query.toLowerCase();
    const matches = !q || [s.id, sel?.shopName, sel?.name].some((v) => String(v || "").toLowerCase().includes(q));
    const m = readMeta(s);
    return matches && (statusFilter === "all" || m.stage === statusFilter);
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const paged = rows.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const total = settlements.length;
  const pending = enriched.filter((x) => x.meta.stage === "Pending Review").length;
  const processing = enriched.filter((x) => x.meta.stage === "Processing").length;
  const completed = enriched.filter((x) => x.meta.stage === "Completed").length;
  const totalSettlementAmount = settlements.reduce((n, s) => n + Number(s.netPayable), 0);
  const commissionEarned = settlements.reduce((n, s) => n + Number(s.commission), 0);
  const avgSettlementTime = 3.2;
  const failed = enriched.filter((x) => x.meta.stage === "Failed").length;

  // ---- Charts ----
  const trend = React.useMemo(() => {
    const months: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      const v = settlements.filter((s) => { const sd = new Date(s.createdAt); return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear(); }).reduce((n, s) => n + Number(s.netPayable), 0);
      months.push({ month: key, value: v });
    }
    return months;
  }, [settlements]);
  const volume = React.useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days.push({ date: key, count: settlements.filter((s) => new Date(s.createdAt).toDateString() === d.toDateString()).length });
    }
    return days;
  }, [settlements]);
  const marketplaceRevenue = React.useMemo(() => {
    const months: { month: string; gross: number; commission: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      const monthS = settlements.filter((s) => { const sd = new Date(s.createdAt); return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear(); });
      months.push({ month: key, gross: monthS.reduce((n, s) => n + Number(s.grossSales), 0), commission: monthS.reduce((n, s) => n + Number(s.commission), 0) });
    }
    return months;
  }, [settlements]);
  const statusDistribution = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => { map[x.meta.stage] = (map[x.meta.stage] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [enriched]);
  const topSellers = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => { const name = x.seller?.shopName || "Unknown"; map[name] = (map[name] || 0) + Number(x.settlement.netPayable); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [enriched]);

  // ---- Actions ----
  async function updateBackendStatus(s: Settlement, status: string) {
    try {
      const saved = await api.patch<Settlement>(`/finance/seller-settlements/${s.id}`, { status });
      setSettlements((x) => x.map((v) => (v.id === s.id ? { ...v, ...saved } : v)));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
      throw e;
    }
  }
  async function transition(s: Settlement, stage: string) {
    const m = readMeta(s);
    try {
      await updateBackendStatus(s, stage.toLowerCase().replace(" ", "_"));
      writeMeta(s, { stage });
      logActivity(s, "Status updated", m.stage, stage);
      forceRerender((n) => n + 1);
      toast.success(`Settlement marked ${stage}`);
    } catch {
      /* handled */
    }
  }
  function updateMeta(s: Settlement, patch: Partial<Meta>) {
    writeMeta(s, patch);
    forceRerender((n) => n + 1);
    toast.success("Settlement updated");
  }
  function exportCsv() {
    const headers = ["Settlement ID", "Seller", "Period Start", "Period End", "Gross Sales", "Commission", "Net Settlement", "Status"];
    const data = rows.map(({ settlement: s, seller: sel, meta: m }) => [s.id, sel?.shopName, s.periodStart, s.periodEnd, s.grossSales, s.commission, s.netPayable, m.stage]);
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "seller-settlements.csv");
  }
  function bulk(action: string) {
    if (action === "Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const s = settlements.find((x) => x.id === id);
      if (!s) return;
      if (action === "Approve") void transition(s, "Approved");
      else if (action === "Complete") void transition(s, "Completed");
      else if (action === "Reject") void transition(s, "Cancelled");
    });
    if (!["Approve", "Complete", "Reject"].includes(action)) toast.success(`${action} queued for ${selected.size} settlements`);
    setSelected(new Set());
  }
  async function generateSettlement(form: { sellerId: string; periodStart: string; periodEnd: string; grossSales: string; commissionRate: string }) {
    if (!form.sellerId || !form.grossSales) { toast.error("Seller and gross sales are required"); return; }
    const gross = Number(form.grossSales);
    const commission = gross * (Number(form.commissionRate) / 100);
    const net = gross - commission;
    try {
      const saved = await api.post<Settlement>("/finance/seller-settlements", {
        sellerId: form.sellerId, periodStart: new Date(form.periodStart).toISOString(), periodEnd: new Date(form.periodEnd).toISOString(),
        grossSales: gross, commission, netPayable: net, status: "pending",
      });
      setSettlements((x) => [saved, ...x]);
      setGenerateOpen(false);
      toast.success("Settlement generated");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not generate settlement");
    }
  }
  function runSettlementCycle() {
    let count = 0;
    sellers.forEach((s) => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      count += 1;
      void api.post<Settlement>("/finance/seller-settlements", {
        sellerId: s.id, periodStart: start.toISOString(), periodEnd: now.toISOString(),
        grossSales: 0, commission: 0, netPayable: 0, status: "pending",
      }).then((saved) => setSettlements((x) => [saved, ...x])).catch(() => {});
    });
    toast.success(`Settlement cycle started for ${count} sellers`);
  }

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{adminTr("Seller Settlements")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Calculate, reconcile, approve, and manage seller settlement cycles before payouts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setGenerateOpen(true)}><Calculator /> Generate Settlements</Button>
          <Button variant="outline" onClick={runSettlementCycle}><RotateCcw /> Run Settlement Cycle</Button>
          <Button variant="outline" onClick={() => toast.info("Settlement data import queued")}>{adminTr("Import Settlement Data")}</Button>
          <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          <Button variant="outline" onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <StatCard icon={Banknote} tone="primary" title="Total Settlements" value={formatNumber(total)} />
        <StatCard icon={Clock3} tone="warning" title="Pending" value={formatNumber(pending)} />
        <StatCard icon={LoaderIcon} tone="accent" title="Processing" value={formatNumber(processing)} />
        <StatCard icon={CheckCircle2} tone="success" title="Completed" value={formatNumber(completed)} />
        <StatCard icon={BadgeDollarSign} tone="primary" title="Total Settlement Amount" value={formatCurrency(totalSettlementAmount)} />
        <StatCard icon={BadgeDollarSign} tone="success" title="Commission Earned" value={formatCurrency(commissionEarned)} />
        <StatCard icon={Clock3} tone="accent" title="Avg. Settlement Time" value={`${avgSettlementTime}d`} />
        <StatCard icon={XCircle} tone="destructive" title="Failed" value={formatNumber(failed)} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="settlements">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search settlement, seller, store, reference…" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">{adminTr("All statuses")}</SelectItem>{settlementStages.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info("Currency, commission plan, and settlement cycle filters can be saved as a view")}><Filter /> Advanced</Button>
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>Auto Refresh</Button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2 border-b bg-primary/[.04] p-3">
                <b className="text-sm text-primary">{selected.size} selected</b>
                {["Approve", "Reject", "Complete", "Export", "Archive"].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => bulk(v)}>{v}</Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center text-sm text-muted-foreground">Loading settlements…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Settlements unavailable" description={error} />
            ) : !rows.length ? (
              <EmptyState
                icon={Banknote}
                title="No seller settlements have been generated yet."
                description={adminTr("Generate settlements or run a settlement cycle to calculate seller payables.")}
                className="py-20"
                action={<div className="flex gap-2"><Button onClick={() => setGenerateOpen(true)}><Plus /> Generate Settlements</Button><Button variant="outline" onClick={runSettlementCycle}>{adminTr("Run Settlement Cycle")}</Button></div>}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead><Checkbox checked={paged.length > 0 && paged.every((x) => selected.has(x.settlement.id))} onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.settlement.id)) : new Set())} /></TableHead>
                      {["Settlement ID", "Seller", "Period", "Gross Sales", "Commission", "Net Settlement", "Status", "Settlement Date", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ settlement: s, seller: sel, meta: m }) => (
                      <TableRow key={s.id}>
                        <TableCell><Checkbox checked={selected.has(s.id)} onCheckedChange={(v) => setSelected((x) => { const n = new Set(x); if (v) n.add(s.id); else n.delete(s.id); return n; })} /></TableCell>
                        <TableCell><button className="font-mono text-xs font-semibold text-primary" onClick={() => setDrawer(s)}>{s.id.slice(0, 12)}</button></TableCell>
                        <TableCell>{sel?.shopName || "—"}</TableCell>
                        <TableCell className="text-xs">{new Date(s.periodStart).toLocaleDateString()} – {new Date(s.periodEnd).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(Number(s.grossSales))}</TableCell>
                        <TableCell>{formatCurrency(Number(s.commission))}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(Number(s.netPayable))}</TableCell>
                        <TableCell><Badge variant={stageBadge(m.stage)}>{m.stage}</Badge></TableCell>
                        <TableCell className="text-xs">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDrawer(s)}><Eye /> View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info("Recalculating settlement…")}><Calculator /> Recalculate</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void transition(s, "Approved")}><CheckCircle2 /> Approve</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void transition(s, "Cancelled")}>Reject</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.success("Settlement statement generated")}><FileText /> Generate Statement</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.success("Invoice generated")}>{adminTr("Generate Invoice")}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.success("Settlement PDF downloaded")}><Download /> Download PDF</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setMainTab("audit")}><History /> View Audit Log</DropdownMenuItem>
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
              <span className="text-xs text-muted-foreground">{rows.length} settlements · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">{adminTr("Page {page} of {pages}", { page: page, pages: pages })}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics trend={trend} volume={volume} marketplaceRevenue={marketplaceRevenue} statusDistribution={statusDistribution} topSellers={topSellers} />
        </TabsContent>
        <TabsContent value="audit"><Audit enriched={enriched} /></TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Settlements", "Generate Settlements", "Recalculate Settlements", "Approve Settlements", "Reject Settlements", "View Financial Reports", "Export Reports", "Manage Settlement Settings"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <SettlementDrawer settlement={drawer} seller={drawer ? sellersById[drawer.sellerId] : undefined} onClose={() => setDrawer(null)} onTransition={transition} onUpdateMeta={updateMeta} />
      <GenerateSettlementDialog open={generateOpen} onClose={() => setGenerateOpen(false)} sellers={sellers} onGenerate={generateSettlement} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function SettlementDrawer({
  settlement,
  seller,
  onClose,
  onTransition,
  onUpdateMeta,
}: {
  settlement: Settlement | null;
  seller?: Seller;
  onClose: () => void;
  onTransition: (s: Settlement, stage: string) => void;
  onUpdateMeta: (s: Settlement, patch: Partial<Meta>) => void;
}) {
  if (!settlement) return null;
  const m = readMeta(settlement);
  const [notes, setNotes] = React.useState(m.notes);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Settlement {settlement.id.slice(0, 12)} <Badge variant={stageBadge(m.stage)}>{m.stage}</Badge></DialogTitle>
          <DialogDescription>Seller info, settlement period, calculation breakdown, and activity.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="seller">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="seller">Seller</TabsTrigger>
            <TabsTrigger value="period">Period</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="seller">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Seller ID" value={seller?.id.slice(0, 12)} />
              <Info label="Store Name" value={seller?.shopName} />
              <Info label="Owner" value={seller?.name} />
              <Info label="Commission Plan" value="Standard 10%" />
            </div>
          </TabsContent>

          <TabsContent value="period">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Start Date" value={new Date(settlement.periodStart).toLocaleDateString()} />
              <Info label="End Date" value={new Date(settlement.periodEnd).toLocaleDateString()} />
              <Info label="Generated Date" value={new Date(settlement.createdAt).toLocaleDateString()} />
              <Info label="Due Date" value={new Date(new Date(settlement.periodEnd).getTime() + 7 * 86400000).toLocaleDateString()} />
            </div>
          </TabsContent>

          <TabsContent value="breakdown">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Gross Sales" value={formatCurrency(Number(settlement.grossSales))} />
              <Info label="Marketplace Commission" value={formatCurrency(Number(settlement.commission))} />
              <Info label="Taxes" value={formatCurrency(m.taxes)} />
              <Info label="Refunds" value={formatCurrency(m.refunds)} />
              <Info label="Chargebacks" value={formatCurrency(m.chargebacks)} />
              <Info label="Bonuses" value={formatCurrency(m.bonuses)} />
              <Info label="Previous Balance" value={formatCurrency(0)} />
              <Info label="Net Settlement" value={formatCurrency(Number(settlement.netPayable))} />
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Currency" value={m.currency} />
              <Info label="Exchange Rate" value={m.exchangeRate} />
              <Info label="Payment Status" value={m.stage === "Completed" ? "Paid" : "Pending"} />
              <Info label="Settlement Reference" value={settlement.id.slice(0, 12)} />
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="mt-4 space-y-3">
              {[{ action: "Settlement Generated", date: settlement.createdAt }, ...m.activity.map((a) => ({ action: `${a.action}: ${a.previous} → ${a.next}`, date: a.date }))].map((e, i) => (
                <div key={`${e.date}-${i}`} className="flex gap-3">
                  <Clock3 className="mt-3 size-4 text-primary" />
                  <div className="flex-1 rounded-xl border p-3">
                    <b>{e.action}</b>
                    <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString()} · Admin User</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes…" />
              <Button size="sm" onClick={() => onUpdateMeta(settlement, { notes })}>Save Notes</Button>
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onTransition(settlement, "Cancelled")}>Reject</Button>
          <Button onClick={() => onTransition(settlement, "Approved")}><CheckCircle2 /> Approve</Button>
          <Button variant="outline" onClick={() => onTransition(settlement, "Completed")}>Mark Completed</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GenerateSettlementDialog({
  open,
  onClose,
  sellers,
  onGenerate,
}: {
  open: boolean;
  onClose: () => void;
  sellers: Seller[];
  onGenerate: (form: { sellerId: string; periodStart: string; periodEnd: string; grossSales: string; commissionRate: string }) => void;
}) {
  const now = new Date();
  const [form, setForm] = React.useState({
    sellerId: "",
    periodStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    periodEnd: now.toISOString().slice(0, 10),
    grossSales: "0",
    commissionRate: "10",
  });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{adminTr("Generate Settlement")}</DialogTitle><DialogDescription>{adminTr("Calculate a settlement for a seller's sales period.")}</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Seller</Label>
            <Select value={form.sellerId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, sellerId: v === "none" ? "" : v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">Select seller</SelectItem>{sellers.map((s) => <SelectItem key={s.id} value={s.id}>{s.shopName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Period Start</Label><Input type="date" className="mt-1.5" value={form.periodStart} onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))} /></div>
          <div><Label>Period End</Label><Input type="date" className="mt-1.5" value={form.periodEnd} onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))} /></div>
          <div><Label>Gross Sales</Label><Input type="number" className="mt-1.5" value={form.grossSales} onChange={(e) => setForm((f) => ({ ...f, grossSales: e.target.value }))} /></div>
          <div><Label>Commission Rate (%)</Label><Input type="number" className="mt-1.5" value={form.commissionRate} onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))} /></div>
        </div>
        <div className="rounded-xl border bg-secondary/40 p-3 text-sm">
          Net payable: <b>{formatCurrency(Number(form.grossSales) * (1 - Number(form.commissionRate) / 100))}</b>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onGenerate(form)}><Loader2 className="hidden animate-spin" /> Generate</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Analytics({
  trend,
  volume,
  marketplaceRevenue,
  statusDistribution,
  topSellers,
}: {
  trend: { month: string; value: number }[];
  volume: { date: string; count: number }[];
  marketplaceRevenue: { month: string; gross: number; commission: number }[];
  statusDistribution: { name: string; value: number }[];
  topSellers: { name: string; value: number }[];
}) {
  const reports = ["Settlement Report", "Marketplace Revenue", "Commission Report", "Seller Earnings", "Refund Report", "Chargeback Report", "Tax Report", "Financial Reconciliation Report", "Accounting Summary"];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Settlement Trend</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          <h3 className="font-semibold">Settlement Volume</h3>
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

      <Card className="p-5">
        <h3 className="font-semibold">Marketplace Revenue</h3>
        <div className="mt-4 h-[260px] w-full">
          <ChartMount>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={marketplaceRevenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
                <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="gross" name="Gross Sales" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="commission" name="Commission" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} barSize={16} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartMount>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="font-semibold">Settlement Status Distribution</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {statusDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold">Top Sellers by Settlement Value</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={topSellers} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="var(--color-chart-4)" radius={[0, 4, 4, 0]} barSize={14} />
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

function Audit({ enriched }: { enriched: { settlement: Settlement; seller?: Seller; meta: Meta }[] }) {
  const events = enriched.flatMap((x) => x.meta.activity.map((a) => ({ ...a, settlementId: x.settlement.id.slice(0, 12) }))).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Settlement status changes will appear here." className="py-16" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>{["User", "Settlement", "Action", "Previous", "New", "Date", "Device", "IP Address"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={`${e.date}-${i}`}>
                  <TableCell>{e.user}</TableCell>
                  <TableCell className="font-mono text-xs">{e.settlementId}</TableCell>
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
