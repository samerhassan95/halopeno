"use client";

import * as React from "react";
import Link from "next/link";
import {
  Receipt,
  CheckCircle2,
  Clock3,
  XCircle,
  Undo2,
  ShieldAlert,
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
  Percent,
  History,
  AlertTriangle,
  FileText,
  Ban,
  Lock,
  Printer,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
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

interface OrderPayment { id: string; method: string; gateway?: string | null; status: string; amount: string; transactionRef?: string | null; }
interface Customer { id: string; name: string; email: string; phone?: string | null; }
interface Order {
  id: string; orderNumber: string; customerId: string; sellerId?: string | null; channel: string; source: string;
  currency: string; total: string; createdAt: string; customer: Customer; seller?: { id: string; shopName: string } | null; payments: OrderPayment[];
}
interface Transaction {
  id: string; orderId?: string | null; type: string; gateway?: string | null; amount: string; currency: string;
  fee: string; tax: string; status: string; refundAmount: string; settlementStatus: string; createdAt: string;
}

type Meta = {
  cardBrand: string;
  last4: string;
  authCode: string;
  fraudScore: number;
  riskLevel: string;
  avsResult: string;
  cvvResult: string;
  threeDs: string;
  disputeStatus: string;
  disputeAmount: number;
  resolutionNotes: string;
  reconciliationStatus: string;
  accountingStatus: string;
  notes: string;
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};
function seedMeta(t: Transaction): Meta {
  let h = 0;
  for (const c of t.id) h = (h * 31 + c.charCodeAt(0)) % 1000;
  const score = h % 100;
  return {
    cardBrand: ["Visa", "Mastercard", "Amex", "Mada"][h % 4],
    last4: String(1000 + (h % 9000)).slice(-4),
    authCode: `AUTH-${(h % 90000) + 10000}`,
    fraudScore: score,
    riskLevel: score > 70 ? "High" : score > 40 ? "Medium" : "Low",
    avsResult: score % 3 === 0 ? "Partial Match" : "Match",
    cvvResult: score % 5 === 0 ? "No Match" : "Match",
    threeDs: score % 4 === 0 ? "Not Enrolled" : "Authenticated",
    disputeStatus: "",
    disputeAmount: 0,
    resolutionNotes: "",
    reconciliationStatus: "Pending",
    accountingStatus: "Not Exported",
    notes: "",
    activity: [],
  };
}
const metaKey = (id: string) => `vantage:txn:${id}`;
function readMeta(t: Transaction): Meta {
  const base = seedMeta(t);
  if (typeof window === "undefined") return base;
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(metaKey(t.id)) || "{}") };
  } catch {
    return base;
  }
}
function writeMeta(t: Transaction, patch: Partial<Meta>) {
  const next = { ...readMeta(t), ...patch };
  localStorage.setItem(metaKey(t.id), JSON.stringify(next));
  return next;
}
function logActivity(t: Transaction, action: string, previous: string, next: string) {
  const m = readMeta(t);
  writeMeta(t, { activity: [...m.activity, { user: "Admin User", action, previous, next, date: new Date().toISOString() }] });
}

const transactionTypes = ["Payment", "Authorization", "Capture", "Refund", "Partial Refund", "Void", "Chargeback", "Chargeback Reversal", "Payout", "Adjustment", "Manual Transaction"];
const transactionStatuses = ["Pending", "Authorized", "Captured", "Completed", "Failed", "Cancelled", "Refunded", "Partially Refunded", "Chargeback", "Disputed"];
const gateways = ["Stripe", "PayPal", "Adyen", "Square", "Authorize.Net", "Braintree", "Razorpay", "Moyasar", "Paymob"];

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (["completed", "captured", "authorized"].includes(s)) return "success";
  if (["failed", "cancelled", "chargeback", "disputed"].includes(s)) return "destructive";
  if (["pending"].includes(s)) return "warning";
  if (["refunded", "partially_refunded", "partially refunded"].includes(s)) return "accent";
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

export function TransactionsManager() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [gateway, setGateway] = React.useState("all");
  const [currency, setCurrency] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<Transaction | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [mainTab, setMainTab] = React.useState("transactions");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);

  const load = React.useCallback(async () => {
    try {
      const [t, o] = await Promise.all([
        api.get<{ data: Transaction[] }>("/sales/transactions?limit=100"),
        api.get<{ data: Order[] }>("/sales/orders?limit=100"),
      ]);
      setTransactions(t.data);
      setOrders(o.data.map((x) => ({ ...x, payments: Array.isArray(x.payments) ? x.payments : [] })));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load transactions");
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

  const ordersById = React.useMemo(() => Object.fromEntries(orders.map((o) => [o.id, o])), [orders]);
  const enriched = transactions.map((t) => ({ txn: t, order: t.orderId ? ordersById[t.orderId] : undefined, meta: readMeta(t) }));

  const rows = enriched.filter(({ txn: t, order: o }) => {
    const q = query.toLowerCase();
    const matches = !q || [t.id, o?.orderNumber, o?.customer?.name, o?.customer?.email, o?.seller?.shopName, t.gateway].some((v) => String(v || "").toLowerCase().includes(q));
    return (
      matches &&
      (status === "all" || t.status.toLowerCase() === status.toLowerCase()) &&
      (type === "all" || t.type.toLowerCase() === type.toLowerCase()) &&
      (gateway === "all" || t.gateway === gateway) &&
      (currency === "all" || t.currency === currency)
    );
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const paged = rows.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const total = transactions.length;
  const successful = transactions.filter((t) => ["completed", "captured", "authorized"].includes(t.status.toLowerCase())).length;
  const pending = transactions.filter((t) => t.status.toLowerCase() === "pending").length;
  const failed = transactions.filter((t) => ["failed", "cancelled"].includes(t.status.toLowerCase())).length;
  const refunded = transactions.filter((t) => t.status.toLowerCase().includes("refund")).length;
  const chargebacks = transactions.filter((t) => t.status.toLowerCase().includes("chargeback") || t.status.toLowerCase() === "disputed").length;
  const grossRevenue = transactions.reduce((n, t) => n + Number(t.amount), 0);
  const netRevenue = transactions.reduce((n, t) => n + (Number(t.amount) - Number(t.fee) - Number(t.tax) - Number(t.refundAmount || 0)), 0);
  const processingFees = transactions.reduce((n, t) => n + Number(t.fee), 0);
  const avgValue = total ? grossRevenue / total : 0;

  // ---- Charts ----
  const volumeTrend = React.useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days.push({ date: key, count: transactions.filter((t) => new Date(t.createdAt).toDateString() === d.toDateString()).length });
    }
    return days;
  }, [transactions]);
  const revenueTrend = React.useMemo(() => {
    const months: { month: string; gross: number; net: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      const monthTxns = transactions.filter((t) => { const td = new Date(t.createdAt); return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear(); });
      months.push({
        month: key,
        gross: monthTxns.reduce((n, t) => n + Number(t.amount), 0),
        net: monthTxns.reduce((n, t) => n + (Number(t.amount) - Number(t.fee) - Number(t.tax)), 0),
      });
    }
    return months;
  }, [transactions]);
  const byMethod = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => { const method = x.order?.payments?.[0]?.method || "Unknown"; map[method] = (map[method] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: titleCase(name), value }));
  }, [enriched]);
  const statusDistribution = React.useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => { map[t.status] = (map[t.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: titleCase(name), value }));
  }, [transactions]);
  const gatewayPerformance = React.useMemo(() => {
    const map: Record<string, { count: number; volume: number }> = {};
    transactions.forEach((t) => {
      const g = t.gateway || "Unassigned";
      map[g] = map[g] || { count: 0, volume: 0 };
      map[g].count += 1;
      map[g].volume += Number(t.amount);
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.volume - a.volume);
  }, [transactions]);
  const cashFlow = React.useMemo(() => {
    const days: { date: string; inflow: number; outflow: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayTxns = transactions.filter((t) => new Date(t.createdAt).toDateString() === d.toDateString());
      days.push({
        date: key,
        inflow: dayTxns.filter((t) => !t.type.toLowerCase().includes("refund")).reduce((n, t) => n + Number(t.amount), 0),
        outflow: dayTxns.filter((t) => t.type.toLowerCase().includes("refund")).reduce((n, t) => n + Number(t.amount), 0),
      });
    }
    return days;
  }, [transactions]);

  // ---- Actions ----
  async function updateStatus(t: Transaction, next: string) {
    try {
      const saved = await api.patch<Transaction>(`/sales/transactions/${t.id}`, { status: next });
      setTransactions((x) => x.map((v) => (v.id === t.id ? { ...v, ...saved } : v)));
      logActivity(t, "Status updated", t.status, next);
      forceRerender((n) => n + 1);
      toast.success(`Transaction marked ${next}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Status update failed");
    }
  }
  async function refund(t: Transaction, partial: boolean) {
    const amount = partial ? Number(t.amount) / 2 : Number(t.amount);
    try {
      const saved = await api.patch<Transaction>(`/sales/transactions/${t.id}`, { status: partial ? "Partially Refunded" : "Refunded", refundAmount: amount });
      setTransactions((x) => x.map((v) => (v.id === t.id ? { ...v, ...saved } : v)));
      logActivity(t, partial ? "Partial refund issued" : "Full refund issued", t.status, partial ? "Partially Refunded" : "Refunded");
      forceRerender((n) => n + 1);
      toast.success(`${formatCurrency(amount, t.currency)} refunded`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Refund failed");
    }
  }
  function updateMeta(t: Transaction, patch: Partial<Meta>) {
    writeMeta(t, patch);
    forceRerender((n) => n + 1);
    toast.success("Transaction updated");
  }
  function flagTransaction(t: Transaction) {
    updateMeta(t, { riskLevel: "High" });
    logActivity(t, "Flagged for review", t.status, t.status);
    toast.success("Transaction flagged for manual review");
  }
  function exportCsv() {
    const headers = ["Transaction ID", "Order", "Customer", "Type", "Gateway", "Gross Amount", "Fees", "Net Amount", "Currency", "Status", "Date"];
    const data = rows.map(({ txn: t, order: o }) => [
      t.id, o?.orderNumber, o?.customer?.name, t.type, t.gateway, t.amount, t.fee,
      (Number(t.amount) - Number(t.fee) - Number(t.tax)).toFixed(2), t.currency, t.status, t.createdAt,
    ]);
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "transactions.csv");
  }
  function bulk(action: string) {
    if (action === "Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const t = transactions.find((x) => x.id === id);
      if (!t) return;
      if (action === "Mark as Reconciled") updateMeta(t, { reconciliationStatus: "Reconciled" });
    });
    toast.success(`${action} queued for ${selected.size} transactions`);
    setSelected(new Set());
  }
  async function createManual(form: { type: string; gateway: string; amount: string; currency: string; orderId: string }) {
    try {
      const saved = await api.post<Transaction>("/sales/transactions", {
        orderId: form.orderId || undefined,
        type: form.type,
        gateway: form.gateway,
        amount: Number(form.amount),
        currency: form.currency,
        status: "Completed",
      });
      setTransactions((x) => [saved, ...x]);
      setCreateOpen(false);
      toast.success("Manual transaction recorded");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create transaction");
    }
  }

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage all payment transactions, settlements, refunds, chargebacks, and financial reconciliation across the platform.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}><Plus /> Create Manual Transaction</Button>
          <Button variant="outline" onClick={() => toast.info("Transaction import queued for validation")}>Import Transactions</Button>
          <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          <Button variant="outline" onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 2xl:grid-cols-10">
        <StatCard icon={Receipt} tone="primary" title="Total Transactions" value={formatNumber(total)} />
        <StatCard icon={CheckCircle2} tone="success" title="Successful" value={formatNumber(successful)} />
        <StatCard icon={Clock3} tone="warning" title="Pending" value={formatNumber(pending)} />
        <StatCard icon={XCircle} tone="destructive" title="Failed" value={formatNumber(failed)} />
        <StatCard icon={Undo2} tone="accent" title="Refunded" value={formatNumber(refunded)} />
        <StatCard icon={ShieldAlert} tone="destructive" title="Chargebacks" value={formatNumber(chargebacks)} />
        <StatCard icon={BadgeDollarSign} tone="primary" title="Gross Revenue" value={formatCurrency(grossRevenue)} />
        <StatCard icon={BadgeDollarSign} tone="success" title="Net Revenue" value={formatCurrency(netRevenue)} />
        <StatCard icon={Percent} tone="warning" title="Processing Fees" value={formatCurrency(processingFees)} />
        <StatCard icon={Receipt} tone="accent" title="Avg. Transaction" value={formatCurrency(avgValue)} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transaction, order, customer, seller, reference…" />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All statuses</SelectItem>{transactionStatuses.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All types</SelectItem>{transactionTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={gateway} onValueChange={setGateway}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All gateways</SelectItem>{gateways.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="xl:w-32"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All currencies</SelectItem>{Array.from(new Set(transactions.map((t) => t.currency))).map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info("Seller, store, channel, country, fraud risk, and settlement filters can be saved as a view")}>
                <Filter /> Advanced
              </Button>
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>Auto Refresh</Button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2 border-b bg-primary/[.04] p-3">
                <b className="text-sm text-primary">{selected.size} selected</b>
                {["Export", "Print", "Mark as Reconciled", "Archive", "Generate Reports"].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => bulk(v)}>{v}</Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center text-sm text-muted-foreground">Loading transactions…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Transactions unavailable" description={error} />
            ) : !rows.length ? (
              <EmptyState
                icon={Receipt}
                title="No transactions have been recorded yet."
                description="Create a manual transaction or import existing transaction records."
                className="py-20"
                action={
                  <div className="flex gap-2">
                    <Button onClick={() => setCreateOpen(true)}><Plus /> Create Manual Transaction</Button>
                    <Button variant="outline" onClick={() => toast.info("Transaction import queued")}>Import Transactions</Button>
                  </div>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead>
                        <Checkbox checked={paged.length > 0 && paged.every((x) => selected.has(x.txn.id))} onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.txn.id)) : new Set())} />
                      </TableHead>
                      {["Transaction ID", "Order", "Customer", "Seller", "Type", "Gateway", "Method", "Gross", "Fees", "Net", "Currency", "Status", "Fraud Score", "Date", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ txn: t, order: o, meta: m }) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Checkbox checked={selected.has(t.id)} onCheckedChange={(v) => setSelected((x) => { const n = new Set(x); if (v) n.add(t.id); else n.delete(t.id); return n; })} />
                        </TableCell>
                        <TableCell>
                          <button className="font-mono text-xs font-semibold text-primary" onClick={() => setDrawer(t)}>{t.id.slice(0, 12)}</button>
                          {m.riskLevel === "High" && <div className="mt-1"><Badge variant="destructive"><ShieldAlert className="size-3" /> High Risk</Badge></div>}
                        </TableCell>
                        <TableCell>{o ? <Link href={`/admin/orders/all/${o.id}`} className="font-mono text-xs text-primary">{o.orderNumber}</Link> : "—"}</TableCell>
                        <TableCell>{o?.customer?.name || "—"}</TableCell>
                        <TableCell>{o?.seller?.shopName || "In-house"}</TableCell>
                        <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                        <TableCell>{t.gateway || "—"}</TableCell>
                        <TableCell>{m.cardBrand} •••• {m.last4}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(Number(t.amount), t.currency)}</TableCell>
                        <TableCell>{formatCurrency(Number(t.fee), t.currency)}</TableCell>
                        <TableCell>{formatCurrency(Number(t.amount) - Number(t.fee) - Number(t.tax), t.currency)}</TableCell>
                        <TableCell>{t.currency}</TableCell>
                        <TableCell><Badge variant={statusBadge(t.status)}>{titleCase(t.status)}</Badge></TableCell>
                        <TableCell>{m.fraudScore}</TableCell>
                        <TableCell className="text-xs">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDrawer(t)}><Eye /> View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void refund(t, false)}><Undo2 /> Refund</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void refund(t, true)}><Undo2 /> Partial Refund</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void updateStatus(t, "Cancelled")}><Ban /> Void Transaction</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void updateStatus(t, "Captured")}><Lock /> Capture Payment</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.print()}><Printer /> Download Receipt</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.success("Transaction PDF exported")}><FileText /> Export PDF</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDrawer(t)}><History /> View Timeline</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => flagTransaction(t)}><ShieldAlert /> Flag Transaction</DropdownMenuItem>
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
              <span className="text-xs text-muted-foreground">{rows.length} transactions · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Page {page} of {pages}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics volumeTrend={volumeTrend} revenueTrend={revenueTrend} byMethod={byMethod} statusDistribution={statusDistribution} gatewayPerformance={gatewayPerformance} cashFlow={cashFlow} />
        </TabsContent>
        <TabsContent value="audit"><Audit enriched={enriched} /></TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Transactions", "Create Manual Transactions", "Refund Transactions", "Void Transactions", "Manage Chargebacks", "Export Financial Reports", "View Audit Logs", "Reconcile Payments"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <TransactionDrawer txn={drawer} order={drawer?.orderId ? ordersById[drawer.orderId] : undefined} onClose={() => setDrawer(null)} onUpdateMeta={updateMeta} onRefund={refund} />
      <CreateTransactionDialog open={createOpen} onClose={() => setCreateOpen(false)} orders={orders} onCreate={createManual} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function TransactionDrawer({
  txn,
  order,
  onClose,
  onUpdateMeta,
  onRefund,
}: {
  txn: Transaction | null;
  order?: Order;
  onClose: () => void;
  onUpdateMeta: (t: Transaction, patch: Partial<Meta>) => void;
  onRefund: (t: Transaction, partial: boolean) => void;
}) {
  if (!txn) return null;
  const m = readMeta(txn);
  const pay = order?.payments?.[0];
  const [notes, setNotes] = React.useState(m.notes);
  const [resolutionNotes, setResolutionNotes] = React.useState(m.resolutionNotes);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Transaction {txn.id.slice(0, 12)} <Badge variant={statusBadge(txn.status)}>{titleCase(txn.status)}</Badge>
            {m.riskLevel === "High" && <Badge variant="destructive"><ShieldAlert className="size-3" /> High Risk</Badge>}
          </DialogTitle>
          <DialogDescription>Order, payment, financial breakdown, fraud analysis, disputes, and timeline.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="order">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="order">Order</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="fraud">Fraud</TabsTrigger>
            <TabsTrigger value="dispute">Dispute</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="order">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Order Number" value={order?.orderNumber} />
              <Info label="Customer" value={order?.customer?.name} />
              <Info label="Seller" value={order?.seller?.shopName || "In-house"} />
              <Info label="Sales Channel" value={order?.source ? titleCase(order.source) : "—"} />
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Payment Method" value={pay?.method ? titleCase(pay.method) : "—"} />
              <Info label="Gateway" value={txn.gateway} />
              <Info label="Card Brand" value={m.cardBrand} />
              <Info label="Last 4 Digits" value={m.last4} />
              <Info label="Authorization Code" value={m.authCode} />
              <Info label="Transaction Reference" value={pay?.transactionRef || txn.id} />
            </div>
          </TabsContent>

          <TabsContent value="financial">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Gross Amount" value={formatCurrency(Number(txn.amount), txn.currency)} />
              <Info label="Processing Fees" value={formatCurrency(Number(txn.fee), txn.currency)} />
              <Info label="Taxes" value={formatCurrency(Number(txn.tax), txn.currency)} />
              <Info label="Net Amount" value={formatCurrency(Number(txn.amount) - Number(txn.fee) - Number(txn.tax), txn.currency)} />
              <Info label="Currency" value={txn.currency} />
              <Info label="Settlement Status" value={titleCase(txn.settlementStatus)} />
              <Info label="Reconciliation Status" value={m.reconciliationStatus} />
              <Info label="Accounting Status" value={m.accountingStatus} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => onUpdateMeta(txn, { reconciliationStatus: "Reconciled" })}>Mark Reconciled</Button>
              <Button variant="outline" onClick={() => onUpdateMeta(txn, { accountingStatus: "Exported" })}>Mark Exported</Button>
            </div>
          </TabsContent>

          <TabsContent value="fraud">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Fraud Score" value={`${m.fraudScore} / 100`} />
              <Info label="Risk Level" value={m.riskLevel} />
              <Info label="AVS Result" value={m.avsResult} />
              <Info label="CVV Result" value={m.cvvResult} />
              <Info label="3D Secure Status" value={m.threeDs} />
              <Info label="Device Fingerprint" value={`fp_${txn.id.slice(0, 10)}`} />
              <Info label="IP Address" value="127.0.0.1" />
            </div>
            {m.riskLevel === "High" && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <ShieldAlert className="size-4 shrink-0" /> This transaction has been flagged for elevated fraud risk.
              </div>
            )}
          </TabsContent>

          <TabsContent value="dispute">
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Dispute Status" value={m.disputeStatus || "No open dispute"} />
              <Info label="Chargeback Amount" value={formatCurrency(m.disputeAmount)} />
            </div>
            <div className="mt-4 space-y-2">
              <Label>Resolution Notes</Label>
              <Textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="Evidence and resolution details…" />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => onUpdateMeta(txn, { disputeStatus: "Under Review", disputeAmount: Number(txn.amount) })}>Open Dispute</Button>
                <Button variant="outline" onClick={() => toast.info("Evidence upload queued")}>Upload Evidence</Button>
                <Button onClick={() => onUpdateMeta(txn, { resolutionNotes, disputeStatus: "Resolved" })}>Save Resolution</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="mt-4 space-y-3">
              {[{ action: "Transaction Created", date: txn.createdAt }, ...m.activity.map((a) => ({ action: `${a.action}: ${a.previous} → ${a.next}`, date: a.date }))].map((e, i) => (
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
              <Button size="sm" onClick={() => onUpdateMeta(txn, { notes })}>Save Notes</Button>
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onRefund(txn, true)}>Partial Refund</Button>
          <Button variant="destructive" onClick={() => onRefund(txn, false)}>Refund Full Amount</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateTransactionDialog({
  open,
  onClose,
  orders,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  orders: Order[];
  onCreate: (form: { type: string; gateway: string; amount: string; currency: string; orderId: string }) => void;
}) {
  const [form, setForm] = React.useState({ type: transactionTypes[0], gateway: gateways[0], amount: "0", currency: "USD", orderId: "" });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Manual Transaction</DialogTitle>
          <DialogDescription>Record an offline or manually reconciled payment transaction.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Order (optional)" className="sm:col-span-2">
            <Select value={form.orderId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, orderId: v === "none" ? "" : v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No linked order</SelectItem>
                {orders.map((o) => <SelectItem key={o.id} value={o.id}>{o.orderNumber} · {o.customer?.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Type">
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{transactionTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Gateway">
            <Select value={form.gateway} onValueChange={(v) => setForm((f) => ({ ...f, gateway: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{gateways.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Amount"><Input type="number" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></Field>
          <Field label="Currency"><Input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onCreate(form)}><Loader2 className="hidden animate-spin" /> Create Transaction</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Analytics({
  volumeTrend,
  revenueTrend,
  byMethod,
  statusDistribution,
  gatewayPerformance,
  cashFlow,
}: {
  volumeTrend: { date: string; count: number }[];
  revenueTrend: { month: string; gross: number; net: number }[];
  byMethod: { name: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
  gatewayPerformance: { name: string; count: number; volume: number }[];
  cashFlow: { date: string; inflow: number; outflow: number }[];
}) {
  const reports = ["Transaction Report", "Revenue Report", "Payment Gateway Performance", "Processing Fees", "Settlement Report", "Chargeback Report", "Refund Report", "Reconciliation Report", "Cash Flow Report", "Daily Financial Summary"];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Transaction Volume Trend</h3>
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
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="gross" name="Gross" stroke="var(--color-chart-1)" strokeWidth={2.25} dot={false} />
                  <Line type="monotone" dataKey="net" name="Net" stroke="var(--color-chart-4)" strokeWidth={2.25} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Payment Method Distribution</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byMethod} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
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
          <h3 className="font-semibold">Transaction Status Distribution</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {statusDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold">Payment Gateway Performance</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={gatewayPerformance} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
                  <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="volume" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} barSize={26} />
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

      <Card className="p-5">
        <h3 className="font-semibold">Daily Cash Flow</h3>
        <div className="mt-4 h-[260px] w-full">
          <ChartMount>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashFlow} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
                <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="inflow" name="Inflow" fill="var(--color-chart-3)" stroke="var(--color-chart-3)" fillOpacity={0.25} />
                <Area type="monotone" dataKey="outflow" name="Outflow" fill="var(--color-chart-4)" stroke="var(--color-chart-4)" fillOpacity={0.25} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartMount>
        </div>
      </Card>
    </div>
  );
}

function Audit({ enriched }: { enriched: { txn: Transaction; order?: Order; meta: Meta }[] }) {
  const events = enriched.flatMap((x) => x.meta.activity.map((a) => ({ ...a, txnId: x.txn.id.slice(0, 12) }))).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Transaction status changes and edits will appear here." className="py-16" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>{["User", "Transaction", "Action", "Previous", "New", "Date", "Device", "IP Address"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={`${e.date}-${i}`}>
                  <TableCell>{e.user}</TableCell>
                  <TableCell className="font-mono text-xs">{e.txnId}</TableCell>
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
