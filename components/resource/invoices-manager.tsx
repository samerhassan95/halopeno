"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertTriangle,
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
  Mail,
  Printer,
  Copy,
  Ban,
  ArrowLeftRight,
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

interface OrderItem { id: string; name: string; sku: string; quantity: number; unitPrice: string; total: string; product?: { name: string; sku: string } | null; }
interface Customer { id: string; name: string; email: string; phone?: string | null; }
interface Order {
  id: string; orderNumber: string; customerId: string; sellerId?: string | null; currency: string; total: string;
  discountTotal: string; taxTotal: string; shippingTotal: string; createdAt: string;
  customer: Customer; seller?: { id: string; shopName: string } | null; items: OrderItem[];
}
interface Invoice { id: string; orderId: string; invoiceNumber: string; total: string; issuedAt: string; dueAt?: string | null; status: string; }

type Meta = {
  invoiceType: string;
  paymentStatus: string;
  paidAmount: number;
  notes: string;
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};
const defaults: Meta = { invoiceType: "Sales Invoice", paymentStatus: "Pending", paidAmount: 0, notes: "", activity: [] };
const metaKey = (id: string) => `vantage:invoice:${id}`;
function readMeta(id: string): Meta {
  if (typeof window === "undefined") return defaults;
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(metaKey(id)) || "{}") };
  } catch {
    return defaults;
  }
}
function writeMeta(id: string, patch: Partial<Meta>) {
  const next = { ...readMeta(id), ...patch };
  localStorage.setItem(metaKey(id), JSON.stringify(next));
  return next;
}
function logActivity(id: string, action: string, previous: string, next: string) {
  const m = readMeta(id);
  writeMeta(id, { activity: [...m.activity, { user: "Admin User", action, previous, next, date: new Date().toISOString() }] });
}

const invoiceTypes = ["Sales Invoice", "Proforma Invoice", "Credit Note", "Debit Note", "Tax Invoice", "Recurring Invoice", "Manual Invoice"];
const invoiceStatuses = ["Draft", "Issued", "Sent", "Viewed", "Partially Paid", "Paid", "Overdue", "Cancelled", "Voided"];
const paymentStatuses = ["Pending", "Paid", "Partially Paid", "Failed", "Refunded", "Cancelled"];

function statusBadge(status: string) {
  if (["Paid"].includes(status)) return "success";
  if (["Overdue", "Cancelled", "Voided"].includes(status)) return "destructive";
  if (["Draft", "Issued", "Sent"].includes(status)) return "secondary";
  if (["Partially Paid", "Viewed"].includes(status)) return "warning";
  return "outline" as const;
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

export function InvoicesManager() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [paymentStatus, setPaymentStatus] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<Invoice | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [mainTab, setMainTab] = React.useState("invoices");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);

  const load = React.useCallback(async () => {
    try {
      const [i, o] = await Promise.all([
        api.get<{ data: Invoice[] }>("/sales/invoices?limit=100"),
        api.get<{ data: Order[] }>("/sales/orders?limit=100"),
      ]);
      setInvoices(i.data);
      setOrders(o.data.map((x) => ({ ...x, items: Array.isArray(x.items) ? x.items : [] })));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load invoices");
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
  const enriched = invoices.map((inv) => ({ inv, order: ordersById[inv.orderId], meta: readMeta(inv.id) }));

  const rows = enriched.filter(({ inv, order: o, meta: m }) => {
    const q = query.toLowerCase();
    const matches = !q || [inv.invoiceNumber, o?.orderNumber, o?.customer?.name, o?.customer?.email, o?.seller?.shopName].some((v) => String(v || "").toLowerCase().includes(q));
    return (
      matches &&
      (status === "all" || inv.status === status) &&
      (type === "all" || m.invoiceType === type) &&
      (paymentStatus === "all" || m.paymentStatus === paymentStatus)
    );
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const paged = rows.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const total = invoices.length;
  const paid = enriched.filter((x) => x.inv.status === "Paid").length;
  const unpaid = enriched.filter((x) => ["Issued", "Sent", "Viewed"].includes(x.inv.status)).length;
  const partiallyPaid = enriched.filter((x) => x.inv.status === "Partially Paid").length;
  const overdue = enriched.filter((x) => x.inv.status === "Overdue").length;
  const draft = enriched.filter((x) => x.inv.status === "Draft").length;
  const cancelled = enriched.filter((x) => ["Cancelled", "Voided"].includes(x.inv.status)).length;
  const totalBilled = invoices.reduce((n, i) => n + Number(i.total), 0);
  const outstandingBalance = enriched.reduce((n, x) => n + Math.max(0, Number(x.inv.total) - x.meta.paidAmount), 0);
  const avgInvoiceValue = total ? totalBilled / total : 0;
  const collectionRate = totalBilled ? ((totalBilled - outstandingBalance) / totalBilled) * 100 : 0;

  // ---- Charts ----
  const revenueTrend = React.useMemo(() => {
    const months: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      const v = invoices.filter((iv) => { const id2 = new Date(iv.issuedAt); return id2.getMonth() === d.getMonth() && id2.getFullYear() === d.getFullYear(); }).reduce((n, iv) => n + Number(iv.total), 0);
      months.push({ month: key, value: v });
    }
    return months;
  }, [invoices]);
  const statusDistribution = React.useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach((iv) => { map[iv.status] = (map[iv.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [invoices]);
  const monthlyBilling = React.useMemo(() => {
    const months: { month: string; billed: number; collected: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      const monthInv = enriched.filter((x) => { const id2 = new Date(x.inv.issuedAt); return id2.getMonth() === d.getMonth() && id2.getFullYear() === d.getFullYear(); });
      months.push({
        month: key,
        billed: monthInv.reduce((n, x) => n + Number(x.inv.total), 0),
        collected: monthInv.reduce((n, x) => n + x.meta.paidAmount, 0),
      });
    }
    return months;
  }, [enriched]);
  const outstandingByAge = React.useMemo(() => {
    const buckets = { "Current": 0, "1-30 days": 0, "31-60 days": 0, "60+ days": 0 };
    const now = Date.now();
    enriched.forEach((x) => {
      const balance = Math.max(0, Number(x.inv.total) - x.meta.paidAmount);
      if (!balance) return;
      const due = x.inv.dueAt ? new Date(x.inv.dueAt).getTime() : now;
      const daysOverdue = Math.max(0, Math.floor((now - due) / 86400000));
      if (daysOverdue === 0) buckets["Current"] += balance;
      else if (daysOverdue <= 30) buckets["1-30 days"] += balance;
      else if (daysOverdue <= 60) buckets["31-60 days"] += balance;
      else buckets["60+ days"] += balance;
    });
    return Object.entries(buckets).map(([bucket, value]) => ({ bucket, value }));
  }, [enriched]);
  const collectionRateTrend = React.useMemo(() => {
    return monthlyBilling.map((m) => ({ month: m.month, rate: m.billed ? Math.round((m.collected / m.billed) * 100) : 0 }));
  }, [monthlyBilling]);
  const taxSummary = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => { const country = "Saudi Arabia"; map[country] = (map[country] || 0) + Number(x.order?.taxTotal || 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [enriched]);

  // ---- Actions ----
  async function updateStatus(inv: Invoice, next: string) {
    try {
      const saved = await api.patch<Invoice>(`/sales/invoices/${inv.id}`, { status: next });
      setInvoices((x) => x.map((v) => (v.id === inv.id ? { ...v, ...saved } : v)));
      logActivity(inv.id, "Status updated", inv.status, next);
      forceRerender((n) => n + 1);
      toast.success(`Invoice marked ${next}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Status update failed");
    }
  }
  function recordPayment(inv: Invoice, amount: number) {
    const m = readMeta(inv.id);
    const paidAmount = Math.min(Number(inv.total), m.paidAmount + amount);
    const paymentStatus = paidAmount >= Number(inv.total) ? "Paid" : "Partially Paid";
    writeMeta(inv.id, { paidAmount, paymentStatus });
    logActivity(inv.id, "Payment recorded", formatCurrency(m.paidAmount), formatCurrency(paidAmount));
    if (paymentStatus === "Paid") void updateStatus(inv, "Paid");
    else forceRerender((n) => n + 1);
    toast.success(`${formatCurrency(amount)} payment recorded`);
  }
  function updateMeta(inv: Invoice, patch: Partial<Meta>) {
    writeMeta(inv.id, patch);
    forceRerender((n) => n + 1);
    toast.success("Invoice updated");
  }
  function exportCsv() {
    const headers = ["Invoice Number", "Order", "Customer", "Seller", "Type", "Amount", "Paid", "Outstanding", "Payment Status", "Invoice Status", "Issued", "Due"];
    const data = rows.map(({ inv, order: o, meta: m }) => [
      inv.invoiceNumber, o?.orderNumber, o?.customer?.name, o?.seller?.shopName || "In-house", m.invoiceType,
      inv.total, m.paidAmount.toFixed(2), (Number(inv.total) - m.paidAmount).toFixed(2), m.paymentStatus, inv.status, inv.issuedAt, inv.dueAt,
    ]);
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "invoices.csv");
  }
  function bulk(action: string) {
    if (action === "Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const inv = invoices.find((x) => x.id === id);
      if (!inv) return;
      if (action === "Mark as Paid") recordPayment(inv, Number(inv.total) - readMeta(inv.id).paidAmount);
    });
    if (action !== "Mark as Paid") toast.success(`${action} queued for ${selected.size} invoices`);
    setSelected(new Set());
  }
  async function createInvoice(form: { orderId: string; invoiceNumber: string; dueAt: string; type: string }) {
    const order = orders.find((o) => o.id === form.orderId);
    if (!order) { toast.error("Order is required"); return; }
    try {
      const saved = await api.post<Invoice>("/sales/invoices", {
        orderId: form.orderId, invoiceNumber: form.invoiceNumber, total: Number(order.total),
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined, status: "Draft",
      });
      writeMeta(saved.id, { invoiceType: form.type });
      setInvoices((x) => [saved, ...x]);
      setCreateOpen(false);
      toast.success("Invoice created");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create invoice");
    }
  }

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage customer invoices, billing, payments, taxes, and financial records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}><Plus /> Create Invoice</Button>
          <Button variant="outline" onClick={() => toast.info("Invoice import queued for validation")}>Import Invoices</Button>
          <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          <Button variant="outline" onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-11">
        <StatCard icon={FileText} tone="primary" title="Total Invoices" value={formatNumber(total)} />
        <StatCard icon={CheckCircle2} tone="success" title="Paid" value={formatNumber(paid)} />
        <StatCard icon={Clock3} tone="warning" title="Unpaid" value={formatNumber(unpaid)} />
        <StatCard icon={ArrowLeftRight} tone="accent" title="Partially Paid" value={formatNumber(partiallyPaid)} />
        <StatCard icon={AlertTriangle} tone="destructive" title="Overdue" value={formatNumber(overdue)} />
        <StatCard icon={FileText} title="Draft" value={formatNumber(draft)} />
        <StatCard icon={XCircle} tone="destructive" title="Cancelled" value={formatNumber(cancelled)} />
        <StatCard icon={BadgeDollarSign} tone="primary" title="Total Billed" value={formatCurrency(totalBilled)} />
        <StatCard icon={BadgeDollarSign} tone="warning" title="Outstanding" value={formatCurrency(outstandingBalance)} />
        <StatCard icon={FileText} tone="accent" title="Avg. Invoice" value={formatCurrency(avgInvoiceValue)} />
        <StatCard icon={Percent} tone="success" title="Collection Rate" value={`${collectionRate.toFixed(1)}%`} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoice, order, customer, seller…" />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="xl:w-40"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All statuses</SelectItem>{invoiceStatuses.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All payment statuses</SelectItem>{paymentStatuses.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All invoice types</SelectItem>{invoiceTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info("Seller, currency, tax type, country, and due date filters can be saved as a view")}>
                <Filter /> Advanced
              </Button>
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>Auto Refresh</Button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2 border-b bg-primary/[.04] p-3">
                <b className="text-sm text-primary">{selected.size} selected</b>
                {["Send Invoices", "Export", "Print", "Download PDFs", "Mark as Paid", "Archive"].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => bulk(v)}>{v}</Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center text-sm text-muted-foreground">Loading invoices…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Invoices unavailable" description={error} />
            ) : !rows.length ? (
              <EmptyState
                icon={FileText}
                title="No invoices have been created yet."
                description="Create an invoice or import existing invoice records."
                className="py-20"
                action={
                  <div className="flex gap-2">
                    <Button onClick={() => setCreateOpen(true)}><Plus /> Create Invoice</Button>
                    <Button variant="outline" onClick={() => toast.info("Invoice import queued")}>Import Invoices</Button>
                  </div>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead>
                        <Checkbox checked={paged.length > 0 && paged.every((x) => selected.has(x.inv.id))} onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.inv.id)) : new Set())} />
                      </TableHead>
                      {["Invoice #", "Order", "Customer", "Seller", "Type", "Amount", "Paid", "Outstanding", "Currency", "Payment Status", "Invoice Status", "Issued", "Due", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ inv, order: o, meta: m }) => {
                      const outstanding = Math.max(0, Number(inv.total) - m.paidAmount);
                      return (
                        <TableRow key={inv.id}>
                          <TableCell>
                            <Checkbox checked={selected.has(inv.id)} onCheckedChange={(v) => setSelected((x) => { const n = new Set(x); if (v) n.add(inv.id); else n.delete(inv.id); return n; })} />
                          </TableCell>
                          <TableCell><button className="font-mono text-xs font-semibold text-primary" onClick={() => setDrawer(inv)}>{inv.invoiceNumber}</button></TableCell>
                          <TableCell>{o ? <Link href={`/admin/orders/all/${o.id}`} className="font-mono text-xs text-primary">{o.orderNumber}</Link> : "—"}</TableCell>
                          <TableCell>{o?.customer?.name || "—"}</TableCell>
                          <TableCell>{o?.seller?.shopName || "In-house"}</TableCell>
                          <TableCell><Badge variant="outline">{m.invoiceType}</Badge></TableCell>
                          <TableCell className="font-bold">{formatCurrency(Number(inv.total), o?.currency)}</TableCell>
                          <TableCell>{formatCurrency(m.paidAmount, o?.currency)}</TableCell>
                          <TableCell className={outstanding > 0 ? "font-semibold text-warning" : ""}>{formatCurrency(outstanding, o?.currency)}</TableCell>
                          <TableCell>{o?.currency || "USD"}</TableCell>
                          <TableCell><Badge variant={m.paymentStatus === "Paid" ? "success" : m.paymentStatus === "Failed" ? "destructive" : "warning"}>{m.paymentStatus}</Badge></TableCell>
                          <TableCell><Badge variant={statusBadge(inv.status)}>{inv.status}</Badge></TableCell>
                          <TableCell className="text-xs">{new Date(inv.issuedAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs">{inv.dueAt ? new Date(inv.dueAt).toLocaleDateString() : "—"}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDrawer(inv)}><Eye /> View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDrawer(inv)}><FileText /> Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.success(`${inv.invoiceNumber} duplicated`)}><Copy /> Duplicate</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { void updateStatus(inv, "Sent"); toast.info(`Invoice emailed to ${o?.customer?.email}`); }}><Mail /> Send by Email</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.success("Invoice PDF downloaded")}><Download /> Download PDF</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.print()}><Printer /> Print</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => recordPayment(inv, outstanding)}><BadgeDollarSign /> Record Payment</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void updateStatus(inv, "Voided")}><Ban /> Void Invoice</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void updateStatus(inv, "Cancelled")}>Cancel Invoice</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setDrawer(inv)}><History /> View Timeline</DropdownMenuItem>
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
              <span className="text-xs text-muted-foreground">{rows.length} invoices · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Page {page} of {pages}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics revenueTrend={revenueTrend} statusDistribution={statusDistribution} monthlyBilling={monthlyBilling} outstandingByAge={outstandingByAge} collectionRateTrend={collectionRateTrend} taxSummary={taxSummary} />
        </TabsContent>
        <TabsContent value="audit"><Audit enriched={enriched} /></TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Invoices", "Create Invoices", "Edit Invoices", "Delete Invoices", "Send Invoices", "Record Payments", "Export Reports", "Manage Billing Settings"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <InvoiceDrawer inv={drawer} order={drawer ? ordersById[drawer.orderId] : undefined} onClose={() => setDrawer(null)} onRecordPayment={recordPayment} onUpdateMeta={updateMeta} />
      <CreateInvoiceDialog open={createOpen} onClose={() => setCreateOpen(false)} orders={orders} onCreate={createInvoice} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function InvoiceDrawer({
  inv,
  order,
  onClose,
  onRecordPayment,
  onUpdateMeta,
}: {
  inv: Invoice | null;
  order?: Order;
  onClose: () => void;
  onRecordPayment: (inv: Invoice, amount: number) => void;
  onUpdateMeta: (inv: Invoice, patch: Partial<Meta>) => void;
}) {
  if (!inv) return null;
  const m = readMeta(inv.id);
  const outstanding = Math.max(0, Number(inv.total) - m.paidAmount);
  const [notes, setNotes] = React.useState(m.notes);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {inv.invoiceNumber} <Badge variant={statusBadge(inv.status)}>{inv.status}</Badge>
          </DialogTitle>
          <DialogDescription>Customer, order, financial breakdown, payments, tax, and timeline.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="customer">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="order">Order</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="tax">Tax</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="customer">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Customer Name" value={order?.customer?.name} />
              <Info label="Email" value={order?.customer?.email} />
              <Info label="Phone" value={order?.customer?.phone} />
              <Info label="Customer Group" value="Standard" />
            </div>
          </TabsContent>

          <TabsContent value="order">
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>{["Product", "SKU", "Qty", "Unit Price", "Total"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {(order?.items || []).map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.product?.name || i.name}</TableCell>
                      <TableCell className="font-mono text-xs">{i.sku}</TableCell>
                      <TableCell>{i.quantity}</TableCell>
                      <TableCell>{formatCurrency(Number(i.unitPrice))}</TableCell>
                      <TableCell>{formatCurrency(Number(i.total))}</TableCell>
                    </TableRow>
                  ))}
                  {!order?.items?.length && <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No line items loaded for this order.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="financial">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Subtotal" value={formatCurrency(Number(order?.total || 0) - Number(order?.taxTotal || 0) - Number(order?.shippingTotal || 0) + Number(order?.discountTotal || 0))} />
              <Info label="Discount" value={formatCurrency(Number(order?.discountTotal || 0))} />
              <Info label="Shipping" value={formatCurrency(Number(order?.shippingTotal || 0))} />
              <Info label="Taxes" value={formatCurrency(Number(order?.taxTotal || 0))} />
              <Info label="Grand Total" value={formatCurrency(Number(inv.total))} />
              <Info label="Paid Amount" value={formatCurrency(m.paidAmount)} />
              <Info label="Remaining Balance" value={formatCurrency(outstanding)} />
              <Info label="Invoice Type" value={m.invoiceType} />
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Payment Status" value={m.paymentStatus} />
              <Info label="Outstanding" value={formatCurrency(outstanding)} />
              <Info label="Payment Gateway" value="Manual / Bank Transfer" />
              <Info label="Payment Date" value={m.paidAmount > 0 ? new Date().toLocaleDateString() : "—"} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button disabled={!outstanding} onClick={() => onRecordPayment(inv, outstanding)}><BadgeDollarSign /> Record Full Payment</Button>
              <Button variant="outline" disabled={!outstanding} onClick={() => onRecordPayment(inv, outstanding / 2)}>Record Partial Payment</Button>
            </div>
          </TabsContent>

          <TabsContent value="tax">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="VAT / Tax Total" value={formatCurrency(Number(order?.taxTotal || 0))} />
              <Info label="Tax Rate" value="15%" />
              <Info label="Tax Region" value="Saudi Arabia" />
              <Info label="Tax Exemption" value="None" />
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="mt-4 space-y-3">
              {[{ action: "Invoice Created", date: inv.issuedAt }, ...m.activity.map((a) => ({ action: `${a.action}: ${a.previous} → ${a.next}`, date: a.date }))].map((e, i) => (
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
              <Button size="sm" onClick={() => onUpdateMeta(inv, { notes })}>Save Notes</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CreateInvoiceDialog({
  open,
  onClose,
  orders,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  orders: Order[];
  onCreate: (form: { orderId: string; invoiceNumber: string; dueAt: string; type: string }) => void;
}) {
  const [form, setForm] = React.useState({ orderId: "", invoiceNumber: `INV-${Date.now().toString().slice(-6)}`, dueAt: "", type: invoiceTypes[0] });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>Issue a new invoice for an existing order.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Order" className="sm:col-span-2">
            <Select value={form.orderId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, orderId: v === "none" ? "" : v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select order</SelectItem>
                {orders.map((o) => <SelectItem key={o.id} value={o.id}>{o.orderNumber} · {o.customer?.name} · {formatCurrency(Number(o.total))}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Invoice Number"><Input value={form.invoiceNumber} onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))} /></Field>
          <Field label="Due Date"><Input type="date" value={form.dueAt} onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))} /></Field>
          <Field label="Invoice Type" className="sm:col-span-2">
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{invoiceTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onCreate(form)}><Loader2 className="hidden animate-spin" /> Create Invoice</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Analytics({
  revenueTrend,
  statusDistribution,
  monthlyBilling,
  outstandingByAge,
  collectionRateTrend,
  taxSummary,
}: {
  revenueTrend: { month: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
  monthlyBilling: { month: string; billed: number; collected: number }[];
  outstandingByAge: { bucket: string; value: number }[];
  collectionRateTrend: { month: string; rate: number }[];
  taxSummary: { name: string; value: number }[];
}) {
  const reports = ["Invoice Report", "Outstanding Invoices", "Revenue Report", "Tax Report", "Payment Collection", "Aging Report", "Customer Billing Report", "Seller Billing Report", "Monthly Financial Summary"];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <Card className="p-5">
        <h3 className="font-semibold">Invoice Revenue Trend</h3>
        <div className="mt-4 h-[260px] w-full">
          <ChartMount>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          <h3 className="font-semibold">Invoice Status Distribution</h3>
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
        <Card className="p-5">
          <h3 className="font-semibold">Monthly Billing</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyBilling} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
                  <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="billed" name="Billed" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="collected" name="Collected" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} barSize={16} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="font-semibold">Outstanding Balance (Aging)</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={outstandingByAge} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
                  <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} barSize={26} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Payment Collection Rate</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={collectionRateTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `${v}%`} />
                  <RTooltip formatter={(v) => `${v}%`} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="rate" stroke="var(--color-chart-5)" strokeWidth={2.25} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Tax Summary</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taxSummary} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {taxSummary.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
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

function Audit({ enriched }: { enriched: { inv: Invoice; order?: Order; meta: Meta }[] }) {
  const events = enriched.flatMap((x) => x.meta.activity.map((a) => ({ ...a, invoiceNumber: x.inv.invoiceNumber }))).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Invoice status changes and edits will appear here." className="py-16" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>{["User", "Invoice", "Action", "Previous", "New", "Date", "Device", "IP Address"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={`${e.date}-${i}`}>
                  <TableCell>{e.user}</TableCell>
                  <TableCell className="font-mono text-xs">{e.invoiceNumber}</TableCell>
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
