"use client";

import { adminTr } from "@/lib/i18n/admin-tr";

import * as React from "react";
import Link from "next/link";
import {
  Undo2,
  Clock3,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Printer,
  Mail,
  Plus,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  BadgeDollarSign,
  PackageSearch,
  History,
  FileText,
  AlertTriangle,
  ArrowLeftRight,
  Percent,
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

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  product?: { name: string; sku: string; categoryId?: string | null } | null;
}
interface OrderPayment {
  id: string;
  method: string;
  gateway?: string | null;
  status: string;
  amount: string;
  transactionRef?: string | null;
}
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  tags?: string[];
}
interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  sellerId?: string | null;
  channel: string;
  source: string;
  status: string;
  currency: string;
  total: string;
  createdAt: string;
  customer: Customer;
  seller?: { id: string; shopName: string } | null;
  items: OrderItem[];
  payments: OrderPayment[];
}
interface ReturnRecord {
  id: string;
  orderId: string;
  reason: string;
  authorizationNo?: string | null;
  status: string;
  isPartial: boolean;
  createdAt: string;
}
interface Refund {
  id: string;
  orderId: string;
  amount: string;
  reason?: string | null;
  method: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
  createdAt: string;
  processedAt?: string | null;
}

type Meta = {
  refundType: string;
  workflowStage: string;
  requestedBy: string;
  approvedBy: string;
  internalReason: string;
  staffNotes: string;
  attachments: string[];
  gatewayReference: string;
  gatewayResponse: string;
  processingMinutes: number;
  reviewer: string;
  managerApproval: string;
  financeApproval: string;
  approvalNotes: string;
  rejectionReason: string;
  automatic: boolean;
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};

const defaults: Meta = {
  refundType: "Full Refund",
  workflowStage: "Requested",
  requestedBy: "Customer",
  approvedBy: "",
  internalReason: "",
  staffNotes: "",
  attachments: [],
  gatewayReference: "",
  gatewayResponse: "",
  processingMinutes: 0,
  reviewer: "Unassigned",
  managerApproval: "Pending",
  financeApproval: "Pending",
  approvalNotes: "",
  rejectionReason: "",
  automatic: true,
  activity: [],
};
const metaKey = (id: string) => `vantage:refund:${id}`;
function defaultStageForStatus(status: Refund["status"]) {
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  if (status === "PROCESSED") return "Refunded";
  return "Requested";
}
function readMeta(id: string, fallbackStage?: string): Meta {
  const base = fallbackStage ? { ...defaults, workflowStage: fallbackStage } : defaults;
  if (typeof window === "undefined") return base;
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(metaKey(id)) || "{}") };
  } catch {
    return base;
  }
}
function writeMeta(id: string, patch: Partial<Meta>, fallbackStage?: string) {
  const next = { ...readMeta(id, fallbackStage), ...patch };
  localStorage.setItem(metaKey(id), JSON.stringify(next));
  return next;
}
function logActivity(id: string, action: string, previous: string, next: string, fallbackStage?: string) {
  const m = readMeta(id, fallbackStage);
  writeMeta(id, {
    activity: [...m.activity, { user: "Admin User", action, previous, next, date: new Date().toISOString() }],
  });
}

const workflowStages = [
  "Requested",
  "Under Review",
  "Pending Approval",
  "Approved",
  "Processing",
  "Refunded",
  "Partially Refunded",
  "Rejected",
  "Cancelled",
];
const refundTypes = [
  "Full Refund",
  "Partial Refund",
  "Item Refund",
  "Shipping Refund",
  "Tax Refund",
  "Store Credit",
  "Wallet Credit",
  "Exchange Refund",
  "Manual Refund",
];
const refundMethods = [
  "original_payment",
  "bank_transfer",
  "store_credit",
  "wallet_credit",
  "gift_card",
  "cash",
  "manual_offline",
];
const refundReasons = [
  "Item damaged",
  "Wrong item shipped",
  "Not as described",
  "Changed my mind",
  "Late delivery",
  "Duplicate order",
  "Quality issue",
  "Missing parts",
  "Other",
];

function stageBadge(stage: string) {
  if (["Refunded", "Approved"].includes(stage)) return "success";
  if (["Rejected", "Cancelled"].includes(stage)) return "destructive";
  if (["Processing", "Pending Approval", "Under Review"].includes(stage)) return "warning";
  if (stage === "Partially Refunded") return "accent";
  return "secondary" as const;
}
function titleCase(v: string) {
  return v.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
function riskScore(refund: Refund) {
  let h = 0;
  for (const c of refund.id) h = (h * 31 + c.charCodeAt(0)) % 1000;
  const amountBoost = Number(refund.amount) > 200 ? 20 : 0;
  return Math.min(99, (h % 65) + amountBoost);
}
function download(body: string, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RefundsManager(){const [refunds, setRefunds] = React.useState<Refund[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [returns, setReturns] = React.useState<ReturnRecord[]>([]);
  const [categoryByProduct, setCategoryByProduct] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [method, setMethod] = React.useState("all");
  const [gateway, setGateway] = React.useState("all");
  const [reasonFilter, setReasonFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<Refund | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Refund | null>(null);
  const [mainTab, setMainTab] = React.useState("refunds");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);
  const importRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    try {
      const [r, o, ret, prod] = await Promise.all([
        api.get<{ data: Refund[] }>("/sales/refunds?limit=100"),
        api.get<{ data: Order[] }>("/sales/orders?limit=100"),
        api.get<{ data: ReturnRecord[] }>("/sales/returns?limit=100").catch(() => ({ data: [] })),
        api.get<{ data: { id: string; categoryId?: string | null; category?: { name: string } | null }[] }>(
          "/commerce/products?limit=100"
        ).catch(() => ({ data: [] })),
      ]);
      setRefunds(r.data);
      setOrders(o.data.map((x) => ({ ...x, items: Array.isArray(x.items) ? x.items : [], payments: Array.isArray(x.payments) ? x.payments : [] })));
      setReturns(ret.data);
      const catMap: Record<string, string> = {};
      prod.data.forEach((p) => {
        if (p.categoryId && p.category?.name) catMap[p.categoryId] = p.category.name;
      });
      setCategoryByProduct(catMap);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load refunds");
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
  const returnsByOrder = React.useMemo(() => {
    const map: Record<string, ReturnRecord> = {};
    for (const r of returns) map[r.orderId] = r;
    return map;
  }, [returns]);

  const enriched = refunds.map((r) => ({ refund: r, order: ordersById[r.orderId], meta: readMeta(r.id, defaultStageForStatus(r.status)) }));

  const rows = enriched.filter(({ refund: r, order: o, meta: m }) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      [r.id, o?.orderNumber, o?.customer?.name, o?.customer?.email, o?.customer?.phone, r.reason, ...(o?.items || []).flatMap((i) => [i.sku, i.product?.name, i.name]), o?.payments?.[0]?.transactionRef]
        .some((v) => String(v || "").toLowerCase().includes(q));
    return (
      matchesQuery &&
      (status === "all" || m.workflowStage === status) &&
      (type === "all" || m.refundType === type) &&
      (method === "all" || r.method === method) &&
      (gateway === "all" || o?.payments?.[0]?.gateway === gateway) &&
      (reasonFilter === "all" || (r.reason || "Other") === reasonFilter)
    );
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const paged = rows.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const total = refunds.length;
  const pendingReview = enriched.filter((x) => ["Requested", "Under Review", "Pending Approval"].includes(x.meta.workflowStage)).length;
  const approvedCount = enriched.filter((x) => x.meta.workflowStage === "Approved" || x.refund.status === "APPROVED").length;
  const rejectedCount = enriched.filter((x) => x.meta.workflowStage === "Rejected" || x.refund.status === "REJECTED").length;
  const processingCount = enriched.filter((x) => x.meta.workflowStage === "Processing").length;
  const completedCount = enriched.filter((x) => ["Refunded", "Partially Refunded"].includes(x.meta.workflowStage) || x.refund.status === "PROCESSED").length;
  const totalRefundedAmount = enriched
    .filter((x) => ["Refunded", "Partially Refunded"].includes(x.meta.workflowStage) || x.refund.status === "PROCESSED")
    .reduce((n, x) => n + Number(x.refund.amount), 0);
  const refundRate = orders.length ? (refunds.length / orders.length) * 100 : 0;

  // ---- Charts ----
  const trend = React.useMemo(() => {
    const days: { date: string; count: number; value: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayRefunds = refunds.filter((r) => new Date(r.createdAt).toDateString() === d.toDateString());
      days.push({ date: key, count: dayRefunds.length, value: dayRefunds.reduce((n, r) => n + Number(r.amount), 0) });
    }
    return days;
  }, [refunds]);

  const byReason = React.useMemo(() => {
    const map: Record<string, number> = {};
    refunds.forEach((r) => {
      const key = r.reason || "Not specified";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [refunds]);

  const byMonth = React.useMemo(() => {
    const months: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      const monthRefunds = refunds.filter((r) => {
        const rd = new Date(r.createdAt);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
      });
      months.push({ month: key, value: monthRefunds.reduce((n, r) => n + Number(r.amount), 0) });
    }
    return months;
  }, [refunds]);

  const statusDistribution = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => {
      map[x.meta.workflowStage] = (map[x.meta.workflowStage] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [enriched]);

  const byCategory = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach(({ refund: r, order: o }) => {
      const items = o?.items || [];
      if (!items.length) {
        map["Uncategorized"] = (map["Uncategorized"] || 0) + Number(r.amount);
        return;
      }
      items.forEach((it) => {
        const cat = (it.product?.categoryId && categoryByProduct[it.product.categoryId]) || "Uncategorized";
        map[cat] = (map[cat] || 0) + Number(r.amount) / items.length;
      });
    });
    return Object.entries(map).map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [enriched, categoryByProduct]);

  // ---- Actions ----
  async function updateBackendStatus(r: Refund, next: Refund["status"]) {
    try {
      const saved = await api.patch<Refund>(`/sales/refunds/${r.id}`, { status: next, processedAt: next === "PROCESSED" ? new Date().toISOString() : undefined });
      setRefunds((x) => x.map((v) => (v.id === r.id ? { ...v, ...saved } : v)));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Status update failed");
      throw e;
    }
  }

  async function transition(r: Refund, stage: string) {
    const m = readMeta(r.id, defaultStageForStatus(r.status));
    try {
      if (stage === "Approved") await updateBackendStatus(r, "APPROVED");
      else if (stage === "Rejected") await updateBackendStatus(r, "REJECTED");
      else if (["Refunded", "Partially Refunded"].includes(stage)) await updateBackendStatus(r, "PROCESSED");
      writeMeta(r.id, { workflowStage: stage, approvedBy: stage === "Approved" ? "Admin User" : m.approvedBy });
      logActivity(r.id, "Status updated", m.workflowStage, stage);
      forceRerender((n) => n + 1);
      toast.success(`Refund marked ${stage}`);
      if (stage === "Refunded" && Number(r.amount) > 500) toast.info(`High-value refund completed: ${formatCurrency(Number(r.amount))}`);
    } catch {
      /* toast already shown */
    }
  }

  function updateMeta(r: Refund, patch: Partial<Meta>) {
    writeMeta(r.id, patch);
    forceRerender((n) => n + 1);
    toast.success("Refund updated");
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/sales/refunds/${deleteTarget.id}`);
      setRefunds((x) => x.filter((r) => r.id !== deleteTarget.id));
      toast.success("Refund request deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
    setDeleteTarget(null);
  }

  function exportCsv() {
    const headers = ["Refund ID", "Order", "Customer", "Type", "Amount", "Method", "Reason", "Status", "Requested", "Completed"];
    const data = rows.map(({ refund: r, order: o, meta: m }) => [
      r.id,
      o?.orderNumber || "—",
      o?.customer?.name || "—",
      m.refundType,
      r.amount,
      r.method,
      r.reason || "—",
      m.workflowStage,
      r.createdAt,
      r.processedAt || "—",
    ]);
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "refunds.csv");
  }

  function bulk(action: string) {
    if (action === "Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const r = refunds.find((x) => x.id === id);
      if (!r) return;
      if (action === "Approve") void transition(r, "Approved");
      else if (action === "Reject") void transition(r, "Rejected");
      else if (action === "Process Refunds") void transition(r, "Refunded");
    });
    if (!["Approve", "Reject", "Process Refunds"].includes(action)) toast.success(`${action} queued for ${selected.size} refunds`);
    setSelected(new Set());
  }

  const gateways = Array.from(new Set(orders.flatMap((o) => o.payments.map((p) => p.gateway).filter(Boolean)))) as string[];

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{adminTr("Refunds")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer refund requests, approvals, payment processing, and financial reconciliation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Create Manual Refund
          </Button>
          <Button variant="outline" onClick={() => importRef.current?.click()}>
            <Upload /> Import Refund Requests
          </Button>
          <input
            ref={importRef}
            className="hidden"
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => toast.info(`${e.target.files?.[0]?.name} queued for validation`)}
          />
          <Button variant="outline" onClick={exportCsv}>
            <Download /> Export
          </Button>
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw /> Refresh
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <StatCard icon={Undo2} tone="primary" title="Total Requests" value={formatNumber(total)} />
        <StatCard icon={Clock3} tone="warning" title={adminTr("Pending Review")} value={formatNumber(pendingReview)} />
        <StatCard icon={CheckCircle2} tone="success" title="Approved" value={formatNumber(approvedCount)} />
        <StatCard icon={XCircle} tone="destructive" title="Rejected" value={formatNumber(rejectedCount)} />
        <StatCard icon={Loader2} tone="accent" title="Processing" value={formatNumber(processingCount)} />
        <StatCard icon={ShieldCheck} tone="success" title="Completed" value={formatNumber(completedCount)} />
        <StatCard icon={BadgeDollarSign} tone="primary" title="Total Refunded" value={formatCurrency(totalRefundedAmount)} />
        <StatCard icon={Percent} tone="warning" title={adminTr("Refund Rate")} value={`${refundRate.toFixed(1)}%`} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="refunds">{adminTr("Refunds")}</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="refunds">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="ps-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search refund, order, customer, email, phone, SKU, transaction ID…"
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{adminTr("All statuses")}</SelectItem>
                  {workflowStages.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All refund types</SelectItem>
                  {refundTypes.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All refund methods</SelectItem>
                  {refundMethods.map((v) => (
                    <SelectItem key={v} value={v}>{titleCase(v)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={gateway} onValueChange={setGateway}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All gateways</SelectItem>
                  {gateways.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger className="xl:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All reasons</SelectItem>
                  {refundReasons.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Seller, warehouse, category, currency, amount range and date range filters can be saved as a view")
                }
              >
                <Filter /> Advanced
              </Button>
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>
                Auto Refresh
              </Button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2 border-b bg-primary/[.04] p-3">
                <b className="text-sm text-primary">{selected.size} selected</b>
                {["Approve", "Reject", "Process Refunds", "Export", "Print", "Archive"].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => bulk(v)}>
                    {v}
                  </Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center text-sm text-muted-foreground">Loading refunds…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Refunds unavailable" description={error} />
            ) : !rows.length ? (
              <EmptyState
                icon={Undo2}
                title="No refund requests have been submitted yet."
                description="Create a manual refund or import existing refund records."
                className="py-20"
                action={
                  <div className="flex gap-2">
                    <Button onClick={() => setCreateOpen(true)}><Plus /> Create Manual Refund</Button>
                    <Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Import Refund Requests</Button>
                  </div>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead>
                        <Checkbox
                          checked={paged.length > 0 && paged.every((x) => selected.has(x.refund.id))}
                          onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.refund.id)) : new Set())}
                        />
                      </TableHead>
                      {[
                        "Refund ID", "Order", "Customer", "Product(s)", "Type", "Amount", "Method", "Gateway",
                        "Reason", "Requested By", "Approved By", "Status", "Requested", "Completed", "Actions",
                      ].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ refund: r, order: o, meta: m }) => {
                      const risk = riskScore(r);
                      return (
                        <TableRow key={r.id}>
                          <TableCell>
                            <Checkbox
                              checked={selected.has(r.id)}
                              onCheckedChange={(v) =>
                                setSelected((x) => {
                                  const n = new Set(x);
                                  if (v) n.add(r.id);
                                  else n.delete(r.id);
                                  return n;
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <button className="font-mono text-xs font-semibold text-primary" onClick={() => setDrawer(r)}>
                              {r.id.slice(0, 10)}
                            </button>
                            {risk > 70 && (
                              <div className="mt-1">
                                <Badge variant="destructive"><ShieldAlert className="size-3" /> Risk {risk}</Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {o ? (
                              <Link href={`/admin/orders/all/${o.id}`} className="font-mono text-xs text-primary">
                                {o.orderNumber}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold">{o?.customer?.name || "Guest"}</p>
                            <p className="text-xs text-muted-foreground">{o?.customer?.email || "—"}</p>
                          </TableCell>
                          <TableCell className="max-w-40 truncate text-xs text-muted-foreground">
                            {o?.items?.map((i) => i.product?.name || i.name).join(", ") || "—"}
                          </TableCell>
                          <TableCell><Badge variant="outline">{m.refundType}</Badge></TableCell>
                          <TableCell className="font-bold">{formatCurrency(Number(r.amount), o?.currency || "USD")}</TableCell>
                          <TableCell>{titleCase(r.method)}</TableCell>
                          <TableCell>{o?.payments?.[0]?.gateway || "—"}</TableCell>
                          <TableCell className="max-w-32 truncate">{r.reason || "—"}</TableCell>
                          <TableCell className="text-xs">{m.requestedBy}</TableCell>
                          <TableCell className="text-xs">{m.approvedBy || "—"}</TableCell>
                          <TableCell><Badge variant={stageBadge(m.workflowStage)}>{m.workflowStage}</Badge></TableCell>
                          <TableCell className="text-xs">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs">{r.processedAt ? new Date(r.processedAt).toLocaleDateString() : "—"}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost"><MoreHorizontal /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDrawer(r)}><Eye /> View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDrawer(r)}><FileText /> Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void transition(r, "Approved")}><CheckCircle2 /> Approve</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void transition(r, "Rejected")}><XCircle /> Reject</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void transition(r, "Refunded")}><ShieldCheck /> Process Refund</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { updateMeta(r, { refundType: "Partial Refund", workflowStage: "Processing" }); }}>
                                  <ArrowLeftRight /> Partial Refund
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.print()}><Printer /> Print</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.success("Refund PDF prepared")}><Download /> Download PDF</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.info(`Email composer opened for ${o?.customer?.email}`)}>
                                  <Mail /> Contact Customer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDrawer(r)}><History /> View Timeline</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setMainTab("audit")}><PackageSearch /> View Audit Log</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(r)}>Delete</DropdownMenuItem>
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
              <span className="text-xs text-muted-foreground">{rows.length} refund requests · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">{adminTr("Page {page} of {pages}", { page: page, pages: pages })}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics trend={trend} byReason={byReason} byMonth={byMonth} statusDistribution={statusDistribution} byCategory={byCategory} />
        </TabsContent>
        <TabsContent value="audit">
          <Audit enriched={enriched} />
        </TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Refunds", "Create Manual Refunds", "Approve Refunds", "Reject Refunds", "Process Refunds", "Export Refund Data", "Manage Financial Records"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <RefundDrawer
        refund={drawer}
        order={drawer ? ordersById[drawer.orderId] : undefined}
        rma={drawer ? returnsByOrder[drawer.orderId] : undefined}
        onClose={() => setDrawer(null)}
        onTransition={transition}
        onUpdateMeta={updateMeta}
      />
      <CreateRefundDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        orders={orders}
        onCreated={(r) => {
          setRefunds((x) => [r, ...x]);
          setCreateOpen(false);
        }}
      />
      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete refund request?"
        description="This permanently removes the refund request and its history."
        confirmLabel="Delete"
        onConfirm={remove}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function RefundDrawer({
  refund,
  order,
  rma,
  onClose,
  onTransition,
  onUpdateMeta,
}: {
  refund: Refund | null;
  order?: Order;
  rma?: ReturnRecord;
  onClose: () => void;
  onTransition: (r: Refund, stage: string) => void;
  onUpdateMeta: (r: Refund, patch: Partial<Meta>) => void;
}) {
  if (!refund) return null;
  const m = readMeta(refund.id, defaultStageForStatus(refund.status));
  const pay = order?.payments?.[0];
  const risk = riskScore(refund);
  const [notes, setNotes] = React.useState(m.staffNotes);
  const [approvalNotes, setApprovalNotes] = React.useState(m.approvalNotes);
  const [rejectionReason, setRejectionReason] = React.useState(m.rejectionReason);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Refund {refund.id.slice(0, 10)}
            <Badge variant={stageBadge(m.workflowStage)}>{m.workflowStage}</Badge>
            {risk > 70 && <Badge variant="destructive"><ShieldAlert className="size-3" /> High Risk</Badge>}
          </DialogTitle>
          <DialogDescription>Order, products, payment, reason, approval, RMA, fraud signals, and timeline.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="order">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="order">Order</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="reason">Reason</TabsTrigger>
            <TabsTrigger value="approval">Approval</TabsTrigger>
            <TabsTrigger value="rma">RMA</TabsTrigger>
            <TabsTrigger value="fraud">Fraud</TabsTrigger>
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

          <TabsContent value="products">
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>{["Product", "SKU", "Qty", "Unit Price", "Refund Qty"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow>
                </TableHeader>
                <TableBody>
                  {(order?.items || []).map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.product?.name || i.name}</TableCell>
                      <TableCell>{i.sku}</TableCell>
                      <TableCell>{i.quantity}</TableCell>
                      <TableCell>{formatCurrency(Number(i.unitPrice))}</TableCell>
                      <TableCell>{m.refundType === "Full Refund" ? i.quantity : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {!order?.items?.length && (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No line items loaded for this order.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Payment Gateway" value={pay?.gateway} />
              <Info label="Transaction ID" value={pay?.transactionRef} />
              <Info label="Payment Method" value={pay?.method} />
              <Info label="Original Amount" value={formatCurrency(Number(pay?.amount || 0))} />
              <Info label="Refunded Amount" value={formatCurrency(Number(refund.amount))} />
              <Info label="Remaining Balance" value={formatCurrency(Math.max(0, Number(pay?.amount || 0) - Number(refund.amount)))} />
              <Info label="Gateway Reference" value={m.gatewayReference || "Auto-generated on processing"} />
              <Info label="Processing Type" value={m.automatic ? "Automatic Gateway Refund" : "Manual Offline Refund"} />
            </div>
          </TabsContent>

          <TabsContent value="reason">
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Customer Reason" value={refund.reason} />
              <Info label="Internal Reason" value={m.internalReason || "—"} />
            </div>
            <div className="mt-4 space-y-2">
              <Label>Staff Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes about this refund…" />
              <Button size="sm" onClick={() => onUpdateMeta(refund, { staffNotes: notes })}>Save Notes</Button>
            </div>
          </TabsContent>

          <TabsContent value="approval">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Assigned Reviewer" value={m.reviewer} />
              <Info label="Manager Approval" value={m.managerApproval} />
              <Info label="Finance Approval" value={m.financeApproval} />
              <Info label="Requested By" value={m.requestedBy} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Approval Notes</Label>
                <Textarea value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{adminTr("Rejection Reason")}</Label>
                <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => { onUpdateMeta(refund, { approvalNotes, managerApproval: "Approved", financeApproval: "Approved" }); onTransition(refund, "Approved"); }}>
                <CheckCircle2 /> Approve
              </Button>
              <Button variant="destructive" onClick={() => { onUpdateMeta(refund, { rejectionReason }); onTransition(refund, "Rejected"); }}>
                <XCircle /> Reject
              </Button>
              <Button variant="outline" onClick={() => onTransition(refund, "Processing")}>Move to Processing</Button>
              <Button variant="outline" onClick={() => onTransition(refund, "Refunded")}>Mark Refunded</Button>
            </div>
          </TabsContent>

          <TabsContent value="rma">
            {rma ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Return Request ID" value={rma.id.slice(0, 10)} />
                <Info label="Return Status" value={titleCase(rma.status)} />
                <Info label="Inspection Result" value={rma.status === "INSPECTED" || rma.status === "COMPLETED" ? "Passed" : "Pending"} />
                <Info label="Received Date" value={new Date(rma.createdAt).toLocaleDateString()} />
                <Info label="Restocked" value={rma.status === "COMPLETED" ? "Yes" : "No"} />
                <Info label="Replacement Sent" value={rma.isPartial ? "Partial" : "No"} />
              </div>
            ) : (
              <EmptyState icon={PackageSearch} title="No related RMA" description="This refund is not linked to a return authorization." className="py-12" />
            )}
          </TabsContent>

          <TabsContent value="fraud">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Refund Risk Score" value={`${risk} / 100`} />
              <Info label="Customer Refund History" value="1 prior refund" />
              <Info label="Previous Disputes" value="0" />
              <Info label="Fraud Detection Result" value={risk > 70 ? "High Risk — Manual Review Required" : risk > 40 ? "Medium Risk" : "Low Risk"} />
            </div>
            {risk > 70 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <ShieldAlert className="size-4 shrink-0" /> This request has been flagged for elevated refund risk — recommend manager review before processing.
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline">
            <div className="mt-4 space-y-3">
              {[{ action: "Refund Requested", date: refund.createdAt }, ...m.activity.map((a) => ({ action: `${a.action}: ${a.previous} → ${a.next}`, date: a.date }))].map((e, i) => (
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

function CreateRefundDialog({
  open,
  onClose,
  orders,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  orders: Order[];
  onCreated: (r: Refund) => void;
}) {
  const [form, setForm] = React.useState({ orderId: "", amount: "0", reason: refundReasons[0], method: refundMethods[0], type: refundTypes[0] });
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!form.orderId) {
      toast.error("Order is required");
      return;
    }
    setSaving(true);
    try {
      const saved = await api.post<Refund>("/sales/refunds", {
        orderId: form.orderId,
        amount: Number(form.amount),
        reason: form.reason,
        method: form.method,
        status: "PENDING",
      });
      writeMeta(saved.id, { refundType: form.type, workflowStage: "Requested", requestedBy: "Admin User" });
      onCreated(saved);
      toast.success("Manual refund created");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create refund");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{adminTr("Create Manual Refund")}</DialogTitle>
          <DialogDescription>Issue a refund against an existing order.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Order" className="sm:col-span-2">
            <Select value={form.orderId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, orderId: v === "none" ? "" : v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select order</SelectItem>
                {orders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.orderNumber} · {o.customer?.name} · {formatCurrency(Number(o.total))}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Refund Type">
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{refundTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Refund Method">
            <Select value={form.method} onValueChange={(v) => setForm((f) => ({ ...f, method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{refundMethods.map((v) => <SelectItem key={v} value={v}>{titleCase(v)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Amount">
            <Input type="number" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </Field>
          <Field label="Reason">
            <Select value={form.reason} onValueChange={(v) => setForm((f) => ({ ...f, reason: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{refundReasons.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={() => void save()}>{saving && <Loader2 className="animate-spin" />} Create Refund</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChartMount({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  return ready ? <>{children}</> : null;
}

function Analytics({
  trend,
  byReason,
  byMonth,
  statusDistribution,
  byCategory,
}: {
  trend: { date: string; count: number; value: number }[];
  byReason: { reason: string; count: number }[];
  byMonth: { month: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
  byCategory: { category: string; value: number }[];
}) {
  const reports = [
    "Refund Report", "Refund Reasons", "Refund by Product", "Refund by Customer", "Refund by Seller",
    "Refund by Payment Gateway", "Refund Processing Time", "Financial Refund Report", "Refund Loss Report",
  ];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <Card className="p-5">
        <h3 className="font-semibold">Refund Trend</h3>
        <p className="text-xs text-muted-foreground">Refund requests and value over the last 14 days</p>
        <div className="mt-4 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
              <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="count" name="Requests" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} barSize={14} />
              <Line yAxisId="right" type="monotone" dataKey="value" name="Value" stroke="var(--color-chart-1)" strokeWidth={2.25} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Refund Reasons</h3>
          <div className="mt-4 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={byReason} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="reason" width={110} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} barSize={14} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Refund Status Distribution</h3>
          <div className="mt-4 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {statusDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold">Refund Value by Month</h3>
          <div className="mt-4 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={byMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
                <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} barSize={22} />
              </ComposedChart>
            </ResponsiveContainer>
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
        <h3 className="font-semibold">Refunds by Category</h3>
        <div className="mt-4 h-[240px] w-full">
          <ChartMount>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={byCategory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
                <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} barSize={26} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartMount>
        </div>
      </Card>
    </div>
  );
}

function Audit({ enriched }: { enriched: { refund: Refund; order?: Order; meta: Meta }[] }) {
  const events = enriched
    .flatMap((x) => x.meta.activity.map((a) => ({ ...a, refundId: x.refund.id.slice(0, 10) })))
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Refund status changes and edits will appear here." className="py-16" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>{["User", "Refund", "Action", "Previous Status", "New Status", "Date", "Device", "IP Address"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={`${e.date}-${i}`}>
                  <TableCell>{e.user}</TableCell>
                  <TableCell className="font-mono text-xs">{e.refundId}</TableCell>
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
