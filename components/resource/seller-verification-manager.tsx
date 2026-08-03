"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock3,
  ShieldAlert,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  History,
  AlertTriangle,
  Mail,
  FileCheck,
  Percent,
  ExternalLink,
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
import { formatNumber } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types — shares the vantage:seller:* localStorage meta with sellers-manager
// ---------------------------------------------------------------------------

interface Seller {
  id: string; name: string; shopName: string; email: string; phone?: string | null; logo?: string | null;
  description?: string | null; taxNumber?: string | null; bankAccountName?: string | null; bankAccountNumber?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "REACTIVATED"; rating: string; verifiedAt?: string | null; createdAt: string;
}

type Meta = {
  statusStage: string;
  verificationStatus: string;
  businessType: string;
  country: string;
  registrationNumber: string;
  vatNumber: string;
  reviewer: string;
  riskScore: number;
  documents: { name: string; status: string }[];
  kyc: { identity: boolean; business: boolean; address: boolean; bank: boolean; tax: boolean; aml: boolean; pep: boolean; sanctions: boolean };
  reviewNotes: string;
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};
function defaultVerificationStatus(status: Seller["status"]) {
  if (status === "APPROVED" || status === "REACTIVATED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  if (status === "SUSPENDED") return "Suspended";
  return "Submitted";
}
function seedDefaults(s: Seller): Meta {
  let h = 0;
  for (const c of s.id) h = (h * 31 + c.charCodeAt(0)) % 1000;
  const risk = h % 100;
  const verified = s.status === "APPROVED";
  return {
    statusStage: defaultVerificationStatus(s.status),
    verificationStatus: defaultVerificationStatus(s.status),
    businessType: ["Individual", "LLC", "Corporation", "Partnership"][h % 4],
    country: "Saudi Arabia",
    registrationNumber: `REG-${s.id.slice(0, 8).toUpperCase()}`,
    vatNumber: s.taxNumber || `VAT-${s.id.slice(0, 6).toUpperCase()}`,
    reviewer: risk % 3 === 0 ? "Unassigned" : ["Sara Al-Fahad", "Omar Rashid"][risk % 2],
    riskScore: risk,
    documents: [
      { name: "Government ID", status: verified ? "Approved" : "Pending" },
      { name: "Business License", status: verified ? "Approved" : "Pending" },
      { name: "Tax Certificate", status: verified ? "Approved" : "Pending" },
      { name: "Proof of Address", status: verified ? "Approved" : "Pending" },
      { name: "Bank Account Verification", status: verified ? "Approved" : "Pending" },
    ],
    kyc: { identity: verified, business: verified, address: verified, bank: verified, tax: verified, aml: verified, pep: verified, sanctions: verified },
    reviewNotes: "",
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

const verificationStatuses = ["Draft", "Submitted", "Under Review", "Awaiting Documents", "Documents Received", "Approved", "Rejected", "Suspended", "Expired"];
function statusBadge(status: string) {
  if (status === "Approved") return "success";
  if (["Rejected", "Suspended", "Expired"].includes(status)) return "destructive";
  if (["Under Review", "Awaiting Documents", "Documents Received"].includes(status)) return "warning";
  return "secondary" as const;
}
function riskBadge(score: number) {
  if (score > 70) return "destructive";
  if (score > 40) return "warning";
  return "success" as const;
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

export function SellerVerificationManager() {
  const [sellers, setSellers] = React.useState<Seller[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [riskFilter, setRiskFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<Seller | null>(null);
  const [mainTab, setMainTab] = React.useState("queue");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);

  const load = React.useCallback(async () => {
    try {
      const s = await api.get<{ data: Seller[] }>("/marketplace/sellers?limit=100");
      setSellers(s.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load verification queue");
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

  const enriched = sellers.map((s) => ({ seller: s, meta: readMeta(s) }));

  const rows = enriched.filter(({ seller: s, meta: m }) => {
    const q = query.toLowerCase();
    const matches = !q || [s.id, s.shopName, s.name, s.email, m.registrationNumber, m.vatNumber].some((v) => String(v || "").toLowerCase().includes(q));
    const riskLevel = m.riskScore > 70 ? "high" : m.riskScore > 40 ? "medium" : "low";
    return matches && (statusFilter === "all" || m.verificationStatus === statusFilter) && (riskFilter === "all" || riskLevel === riskFilter);
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const paged = rows.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const pendingVerifications = enriched.filter((x) => ["Submitted", "Under Review", "Awaiting Documents", "Documents Received"].includes(x.meta.verificationStatus)).length;
  const approvedSellers = enriched.filter((x) => x.meta.verificationStatus === "Approved").length;
  const rejectedSellers = enriched.filter((x) => x.meta.verificationStatus === "Rejected").length;
  const underReview = enriched.filter((x) => x.meta.verificationStatus === "Under Review").length;
  const expiredDocuments = enriched.filter((x) => x.meta.verificationStatus === "Expired").length;
  const highRiskSellers = enriched.filter((x) => x.meta.riskScore > 70).length;
  const avgReviewTime = 2.4;
  const successRate = sellers.length ? (approvedSellers / sellers.length) * 100 : 0;

  // ---- Charts ----
  const trend = React.useMemo(() => {
    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      months.push({ month: key, count: sellers.filter((s) => { const sd = new Date(s.createdAt); return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear(); }).length });
    }
    return months;
  }, [sellers]);
  const approvalVsRejection = React.useMemo(() => [
    { name: "Approved", value: approvedSellers },
    { name: "Rejected", value: rejectedSellers },
    { name: "Pending", value: pendingVerifications },
  ], [approvedSellers, rejectedSellers, pendingVerifications]);
  const byCountry = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => { map[x.meta.country] = (map[x.meta.country] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [enriched]);
  const kycCompletion = React.useMemo(
    () => enriched.slice(0, 8).map((x) => ({ name: x.seller.shopName, pct: Math.round((Object.values(x.meta.kyc).filter(Boolean).length / 8) * 100) })),
    [enriched]
  );
  const reviewerPerformance = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => { if (x.meta.reviewer !== "Unassigned") map[x.meta.reviewer] = (map[x.meta.reviewer] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [enriched]);

  // ---- Actions ----
  async function decide(s: Seller, decision: "Approved" | "Rejected") {
    const m = readMeta(s);
    try {
      const saved = await api.patch<Seller>(`/marketplace/sellers/${s.id}`, { status: decision === "Approved" ? "APPROVED" : "REJECTED" });
      setSellers((x) => x.map((v) => (v.id === s.id ? { ...v, ...saved } : v)));
      writeMeta(s, { statusStage: decision === "Approved" ? "Active" : "Rejected", verificationStatus: decision });
      logActivity(s, `Verification ${decision.toLowerCase()}`, m.verificationStatus, decision);
      forceRerender((n) => n + 1);
      toast.success(`${s.shopName} verification ${decision.toLowerCase()}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    }
  }
  function updateMeta(s: Seller, patch: Partial<Meta>) {
    writeMeta(s, patch);
    forceRerender((n) => n + 1);
    toast.success("Verification record updated");
  }
  function requestDocuments(s: Seller) {
    updateMeta(s, { verificationStatus: "Awaiting Documents" });
    logActivity(s, "Documents requested", readMeta(s).verificationStatus, "Awaiting Documents");
    toast.success(`Document request sent to ${s.email}`);
  }
  function exportCsv() {
    const headers = ["Seller ID", "Store", "Owner", "Company", "Email", "Country", "KYC Status", "Risk Score", "Reviewer", "Verification Status"];
    const data = rows.map(({ seller: s, meta: m }) => [s.id, s.shopName, s.name, s.shopName, s.email, m.country, `${Math.round((Object.values(m.kyc).filter(Boolean).length / 8) * 100)}%`, m.riskScore, m.reviewer, m.verificationStatus]);
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "seller-verifications.csv");
  }
  function bulk(action: string) {
    if (action === "Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const s = sellers.find((x) => x.id === id);
      if (!s) return;
      if (action === "Approve") void decide(s, "Approved");
      else if (action === "Reject") void decide(s, "Rejected");
      else if (action === "Request Documents") requestDocuments(s);
    });
    if (!["Approve", "Reject", "Request Documents"].includes(action)) toast.success(`${action} queued for ${selected.size} sellers`);
    setSelected(new Set());
  }

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Seller Verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review seller applications, verify identity and business documents, manage compliance, and approve marketplace access.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setMainTab("queue")}><ShieldCheck /> Review Queue</Button>
          <Button variant="outline" onClick={() => bulk("Approve")}>Bulk Verify</Button>
          <Button variant="outline" onClick={() => toast.info("Application import queued")}>Import Applications</Button>
          <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          <Button variant="outline" onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <StatCard icon={Clock3} tone="warning" title="Pending Verifications" value={formatNumber(pendingVerifications)} />
        <StatCard icon={CheckCircle2} tone="success" title="Approved" value={formatNumber(approvedSellers)} />
        <StatCard icon={XCircle} tone="destructive" title="Rejected" value={formatNumber(rejectedSellers)} />
        <StatCard icon={Eye} tone="accent" title="Under Review" value={formatNumber(underReview)} />
        <StatCard icon={AlertTriangle} tone="warning" title="Expired Documents" value={formatNumber(expiredDocuments)} />
        <StatCard icon={ShieldAlert} tone="destructive" title="High Risk Sellers" value={formatNumber(highRiskSellers)} />
        <StatCard icon={Clock3} tone="accent" title="Avg. Review Time" value={`${avgReviewTime}d`} />
        <StatCard icon={Percent} tone="success" title="Success Rate" value={`${successRate.toFixed(1)}%`} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="queue">Verification Queue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search seller, store, owner, company, registration…" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="xl:w-48"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All verification statuses</SelectItem>{verificationStatuses.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="xl:w-36"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All risk levels</SelectItem><SelectItem value="low">Low Risk</SelectItem><SelectItem value="medium">Medium Risk</SelectItem><SelectItem value="high">High Risk</SelectItem></SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info("Business type, country, reviewer, and date filters can be saved as a view")}><Filter /> Advanced</Button>
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>Auto Refresh</Button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2 border-b bg-primary/[.04] p-3">
                <b className="text-sm text-primary">{selected.size} selected</b>
                {["Approve", "Reject", "Assign Reviewer", "Export", "Archive", "Request Documents"].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => bulk(v)}>{v}</Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center text-sm text-muted-foreground">Loading verification queue…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Verification queue unavailable" description={error} />
            ) : !rows.length ? (
              <EmptyState
                icon={ShieldCheck}
                title="All seller verification requests have been processed."
                description="New applications will appear here as sellers register."
                className="py-20"
                action={<div className="flex gap-2"><Button variant="outline" onClick={() => toast.info("Approved sellers list opened")}>View Approved Sellers</Button><Button variant="outline" onClick={() => toast.info("Application import queued")}>Import Applications</Button></div>}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead><Checkbox checked={paged.length > 0 && paged.every((x) => selected.has(x.seller.id))} onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.seller.id)) : new Set())} /></TableHead>
                      {["Store", "Owner", "Company", "Email", "Country", "KYC Status", "Risk Score", "Reviewer", "Verification Status", "Submitted", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ seller: s, meta: m }) => {
                      const kycPct = Math.round((Object.values(m.kyc).filter(Boolean).length / 8) * 100);
                      return (
                        <TableRow key={s.id}>
                          <TableCell><Checkbox checked={selected.has(s.id)} onCheckedChange={(v) => setSelected((x) => { const n = new Set(x); if (v) n.add(s.id); else n.delete(s.id); return n; })} /></TableCell>
                          <TableCell>
                            <button className="flex items-center gap-2" onClick={() => setDrawer(s)}>
                              <Avatar className="size-7"><AvatarImage src={s.logo || undefined} /><AvatarFallback>{initials(s.shopName)}</AvatarFallback></Avatar>
                              <span className="font-semibold text-primary">{s.shopName}</span>
                            </button>
                          </TableCell>
                          <TableCell>{s.name}</TableCell>
                          <TableCell>{s.shopName}</TableCell>
                          <TableCell>{s.email}</TableCell>
                          <TableCell>{m.country}</TableCell>
                          <TableCell><Badge variant={kycPct === 100 ? "success" : "warning"}>{kycPct}%</Badge></TableCell>
                          <TableCell><Badge variant={riskBadge(m.riskScore)}>{m.riskScore}</Badge></TableCell>
                          <TableCell>{m.reviewer}</TableCell>
                          <TableCell><Badge variant={statusBadge(m.verificationStatus)}>{m.verificationStatus}</Badge></TableCell>
                          <TableCell className="text-xs">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDrawer(s)}><Eye /> Review Documents</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void decide(s, "Approved")}><CheckCircle2 /> Approve</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void decide(s, "Rejected")}>Reject</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => requestDocuments(s)}><FileCheck /> Request More Documents</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateMeta(s, { statusStage: "Suspended", verificationStatus: "Suspended" })}>Suspend</DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href={`/admin/sellers/verification/${s.id}`}><ExternalLink /> View Seller Profile</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.info(`Message composer opened for ${s.email}`)}><Mail /> Send Message</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.success("Documents downloaded")}><Download /> Download Documents</DropdownMenuItem>
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
              <span className="text-xs text-muted-foreground">{rows.length} applications · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Page {page} of {pages}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics trend={trend} approvalVsRejection={approvalVsRejection} byCountry={byCountry} kycCompletion={kycCompletion} reviewerPerformance={reviewerPerformance} />
        </TabsContent>
        <TabsContent value="audit"><Audit enriched={enriched} /></TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Verification Requests", "Review Documents", "Approve Sellers", "Reject Sellers", "Request Additional Documents", "Assign Reviewers", "View Compliance Reports", "Export Reports", "Manage Verification Settings"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <VerificationDrawer seller={drawer} onClose={() => setDrawer(null)} onUpdateMeta={updateMeta} onDecide={decide} onRequestDocuments={requestDocuments} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function VerificationDrawer({
  seller,
  onClose,
  onUpdateMeta,
  onDecide,
  onRequestDocuments,
}: {
  seller: Seller | null;
  onClose: () => void;
  onUpdateMeta: (s: Seller, patch: Partial<Meta>) => void;
  onDecide: (s: Seller, decision: "Approved" | "Rejected") => void;
  onRequestDocuments: (s: Seller) => void;
}) {
  if (!seller) return null;
  const m = readMeta(seller);
  const [notes, setNotes] = React.useState(m.reviewNotes);
  const kycChecks = Object.entries(m.kyc);
  const kycPct = Math.round((kycChecks.filter(([, v]) => v).length / kycChecks.length) * 100);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {seller.shopName} <Badge variant={statusBadge(m.verificationStatus)}>{m.verificationStatus}</Badge>
            <Badge variant={riskBadge(m.riskScore)}><ShieldAlert className="size-3" /> Risk {m.riskScore}</Badge>
          </DialogTitle>
          <DialogDescription>Store & business information, documents, compliance, risk, and reviewer workflow.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="profile">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
            <TabsTrigger value="reviewer">Reviewer</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Owner" value={seller.name} />
              <Info label="Email" value={seller.email} />
              <Info label="Phone" value={seller.phone} />
              <Info label="Country" value={m.country} />
              <Info label="Business Type" value={m.businessType} />
              <Info label="Registration Number" value={m.registrationNumber} />
              <Info label="VAT Number" value={m.vatNumber} />
              <Info label="Business License" value={seller.taxNumber || "—"} />
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="mt-4 space-y-2">
              {m.documents.map((doc, i) => (
                <div key={doc.name} className="flex items-center justify-between rounded-xl border p-3">
                  <span className="text-sm font-medium">{doc.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={doc.status === "Approved" ? "success" : doc.status === "Rejected" ? "destructive" : "warning"}>{doc.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => toast.info(`Previewing ${doc.name}`)}>Preview</Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      const docs = [...m.documents]; docs[i] = { ...docs[i], status: "Approved" };
                      onUpdateMeta(seller, { documents: docs });
                    }}>Approve</Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => {
                      const docs = [...m.documents]; docs[i] = { ...docs[i], status: "Rejected" };
                      onUpdateMeta(seller, { documents: docs });
                    }}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="compliance">
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-sm"><span>KYC Completion</span><b>{kycPct}%</b></div>
              <div className="h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${kycPct}%` }} /></div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {kycChecks.map(([k, v]) => (
                <Card key={k} className="flex items-center justify-between p-3">
                  <span className="text-sm capitalize">{k === "aml" ? "AML Screening" : k === "pep" ? "PEP Screening" : `${k} Verification`}</span>
                  <Badge variant={v ? "success" : "warning"}>{v ? "Passed" : "Pending"}</Badge>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="risk">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Risk Score" value={`${m.riskScore} / 100`} />
              <Info label="Fraud Score" value={`${Math.min(99, m.riskScore + 5)} / 100`} />
              <Info label="Duplicate Detection" value="No duplicates found" />
              <Info label="Country Risk" value={m.riskScore > 60 ? "Elevated" : "Standard"} />
            </div>
            {m.riskScore > 70 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <ShieldAlert className="size-4 shrink-0" /> This seller has been flagged for elevated risk — manual review recommended before approval.
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviewer">
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Assigned Reviewer</Label>
                <Select value={m.reviewer} onValueChange={(v) => onUpdateMeta(seller, { reviewer: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Unassigned", "Sara Al-Fahad", "Omar Rashid"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Review Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => { onUpdateMeta(seller, { reviewNotes: notes }); onDecide(seller, "Approved"); }}><CheckCircle2 /> Approve</Button>
              <Button variant="destructive" onClick={() => { onUpdateMeta(seller, { reviewNotes: notes }); onDecide(seller, "Rejected"); }}>Reject</Button>
              <Button variant="outline" onClick={() => onRequestDocuments(seller)}>Request More Documents</Button>
              <Button variant="outline" onClick={() => toast.info("Case escalated to senior compliance reviewer")}>Escalate Case</Button>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="mt-4 space-y-3">
              {[{ action: "Application Submitted", date: seller.createdAt }, ...m.activity.map((a) => ({ action: `${a.action}: ${a.previous} → ${a.next}`, date: a.date }))].map((e, i) => (
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

function Analytics({
  trend,
  approvalVsRejection,
  byCountry,
  kycCompletion,
  reviewerPerformance,
}: {
  trend: { month: string; count: number }[];
  approvalVsRejection: { name: string; value: number }[];
  byCountry: { name: string; value: number }[];
  kycCompletion: { name: string; pct: number }[];
  reviewerPerformance: { name: string; value: number }[];
}) {
  const reports = ["Verification Report", "Approval Rate", "Rejection Reasons", "Compliance Report", "KYC Completion Report", "Reviewer Performance", "Country Verification Report", "Risk Analysis"];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Verification Trend</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          <h3 className="font-semibold">Approval vs Rejection</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={approvalVsRejection} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {approvalVsRejection.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
        <Card className="p-5">
          <h3 className="font-semibold">Verification by Country</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={byCountry} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} barSize={26} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">KYC Completion Rate</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={kycCompletion} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <RTooltip formatter={(v) => `${v}%`} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="pct" fill="var(--color-chart-3)" radius={[0, 4, 4, 0]} barSize={12} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Reviewer Performance</h3>
          <div className="mt-4 h-[240px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={reviewerPerformance} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} barSize={26} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
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

function Audit({ enriched }: { enriched: { seller: Seller; meta: Meta }[] }) {
  const events = enriched.flatMap((x) => x.meta.activity.map((a) => ({ ...a, shop: x.seller.shopName }))).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Verification decisions and edits will appear here." className="py-16" />
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
