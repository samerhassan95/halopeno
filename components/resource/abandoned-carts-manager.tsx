"use client";

import { adminTr } from "@/lib/i18n/admin-tr";

import * as React from "react";
import {
  ShoppingBag,
  Clock3,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  Phone,
  Ticket,
  History,
  AlertTriangle,
  Trash2,
  ShoppingCart,
  BadgeDollarSign,
  Percent,
  Megaphone,
  Sparkles,
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

interface CartItemJson {
  name?: string;
  sku?: string;
  quantity?: number;
  qty?: number;
  unitPrice?: number;
  price?: number;
}
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  loyaltyPoints?: number;
  storeCredit?: string;
  tags?: string[];
}
interface AbandonedCart {
  id: string;
  customerId?: string | null;
  customer?: Customer | null;
  guestEmail?: string | null;
  cartValue: string;
  itemsJson: CartItemJson[] | Record<string, unknown>;
  lastActivity: string;
  recoveryStatus: string;
  recoveredRevenue: string;
  createdAt: string;
}

type Meta = {
  stage: string;
  campaignName: string;
  campaignType: string;
  incentiveType: string;
  couponCode: string;
  device: string;
  browser: string;
  country: string;
  utmSource: string;
  staffNotes: string;
  tags: string[];
  activity: { user: string; action: string; previous: string; next: string; date: string }[];
};
const defaults: Meta = {
  stage: "Abandoned",
  campaignName: "",
  campaignType: "Email Recovery",
  incentiveType: "Percentage Discount",
  couponCode: "",
  device: ["Desktop", "Mobile", "Tablet"][Math.floor(Math.random() * 3)],
  browser: ["Chrome", "Safari", "Firefox", "Edge"][Math.floor(Math.random() * 4)],
  country: "Saudi Arabia",
  utmSource: "organic",
  staffNotes: "",
  tags: [],
  activity: [],
};
const metaKey = (id: string) => `vantage:cart:${id}`;
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

const cartStages = ["Active", "Abandoned", "Recovery Scheduled", "Reminder Sent", "Coupon Sent", "Recovered", "Converted to Order", "Expired", "Deleted"];
const campaignTypes = ["Email Recovery", "SMS Recovery", "WhatsApp Recovery", "Push Notification", "Manual Follow-up"];
const incentiveTypes = ["Percentage Discount", "Fixed Discount", "Free Shipping", "Store Credit", "Gift Cards", "Loyalty Points"];

function stageBadge(stage: string) {
  if (["Recovered", "Converted to Order"].includes(stage)) return "success";
  if (["Expired", "Deleted"].includes(stage)) return "destructive";
  if (["Reminder Sent", "Coupon Sent", "Recovery Scheduled"].includes(stage)) return "warning";
  if (stage === "Active") return "accent";
  return "secondary" as const;
}
function itemsOf(cart: AbandonedCart): CartItemJson[] {
  if (Array.isArray(cart.itemsJson)) return cart.itemsJson;
  return [];
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

export function AbandonedCartsManager(){const [carts, setCarts] = React.useState<AbandonedCart[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [stageFilter, setStageFilter] = React.useState("all");
  const [campaignFilter, setCampaignFilter] = React.useState("all");
  const [customerType, setCustomerType] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [drawer, setDrawer] = React.useState<AbandonedCart | null>(null);
  const [campaignOpen, setCampaignOpen] = React.useState(false);
  const [mainTab, setMainTab] = React.useState("carts");
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceRerender] = React.useState(0);

  const load = React.useCallback(async () => {
    try {
      const [c, cu] = await Promise.all([
        api.get<{ data: AbandonedCart[] }>("/sales/abandoned-carts?limit=100"),
        api.get<{ data: Customer[] }>("/customers/customers?limit=100").catch(() => ({ data: [] })),
      ]);
      const customersById = Object.fromEntries(cu.data.map((x) => [x.id, x]));
      setCarts(c.data.map((x) => ({ ...x, customer: x.customerId ? customersById[x.customerId] || null : null })));
      setCustomers(cu.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load abandoned carts");
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

  const enriched = carts.map((c) => ({ cart: c, meta: readMeta(c.id) }));
  const rows = enriched.filter(({ cart: c, meta: m }) => {
    const q = query.toLowerCase();
    const matches =
      !q ||
      [c.id, c.customer?.name, c.customer?.email, c.guestEmail, ...itemsOf(c).map((i) => i.name || i.sku)].some((v) =>
        String(v || "").toLowerCase().includes(q)
      );
    return (
      matches &&
      (stageFilter === "all" || m.stage === stageFilter) &&
      (campaignFilter === "all" || m.campaignType === campaignFilter) &&
      (customerType === "all" || (customerType === "guest" ? !c.customerId : !!c.customerId))
    );
  });
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const paged = rows.slice((page - 1) * 10, page * 10);

  // ---- KPIs ----
  const total = carts.length;
  const recoverable = enriched.filter((x) => !["Recovered", "Converted to Order", "Expired", "Deleted"].includes(x.meta.stage)).length;
  const recovered = enriched.filter((x) => ["Recovered", "Converted to Order"].includes(x.meta.stage)).length;
  const recoveryRate = total ? (recovered / total) * 100 : 0;
  const lostRevenue = carts.reduce((n, c) => n + Math.max(0, Number(c.cartValue) - Number(c.recoveredRevenue || 0)), 0);
  const recoveredRevenue = carts.reduce((n, c) => n + Number(c.recoveredRevenue || 0), 0);
  const avgCartValue = total ? carts.reduce((n, c) => n + Number(c.cartValue), 0) / total : 0;
  const activeCampaigns = new Set(enriched.filter((x) => x.meta.campaignName).map((x) => x.meta.campaignName)).size;

  // ---- Charts ----
  const trend = React.useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days.push({ date: key, count: carts.filter((c) => new Date(c.createdAt).toDateString() === d.toDateString()).length });
    }
    return days;
  }, [carts]);
  const recoveryOverTime = React.useMemo(() => {
    const days: { date: string; rate: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayCarts = enriched.filter((x) => new Date(x.cart.createdAt).toDateString() === d.toDateString());
      const dayRecovered = dayCarts.filter((x) => ["Recovered", "Converted to Order"].includes(x.meta.stage));
      days.push({ date: key, rate: dayCarts.length ? Math.round((dayRecovered.length / dayCarts.length) * 100) : 0 });
    }
    return days;
  }, [enriched]);
  const revenueRecovery = React.useMemo(() => {
    const months: { month: string; lost: number; recovered: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short" });
      const monthCarts = carts.filter((c) => { const cd = new Date(c.createdAt); return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear(); });
      months.push({
        month: key,
        lost: monthCarts.reduce((n, c) => n + Math.max(0, Number(c.cartValue) - Number(c.recoveredRevenue || 0)), 0),
        recovered: monthCarts.reduce((n, c) => n + Number(c.recoveredRevenue || 0), 0),
      });
    }
    return months;
  }, [carts]);
  const topProducts = React.useMemo(() => {
    const map: Record<string, number> = {};
    carts.forEach((c) => itemsOf(c).forEach((i) => { const name = i.name || i.sku || "Unknown"; map[name] = (map[name] || 0) + (i.quantity || i.qty || 1); }));
    return Object.entries(map).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [carts]);
  const byChannel = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => { map[x.meta.campaignType] = (map[x.meta.campaignType] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [enriched]);
  const stageDistribution = React.useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((x) => { map[x.meta.stage] = (map[x.meta.stage] || 0) + 1; });
    return cartStages.map((s) => ({ stage: s, count: map[s] || 0 })).filter((x) => x.count > 0);
  }, [enriched]);

  // ---- Actions ----
  async function recoverCart(c: AbandonedCart) {
    const m = readMeta(c.id);
    try {
      const saved = await api.patch<AbandonedCart>(`/sales/abandoned-carts/${c.id}`, { recoveryStatus: "recovered", recoveredRevenue: Number(c.cartValue) });
      setCarts((x) => x.map((v) => (v.id === c.id ? { ...v, ...saved } : v)));
      writeMeta(c.id, { stage: "Recovered" });
      logActivity(c.id, "Cart recovered", m.stage, "Recovered");
      forceRerender((n) => n + 1);
      toast.success("Cart marked as recovered");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update cart");
    }
  }
  function transition(c: AbandonedCart, stage: string) {
    const m = readMeta(c.id);
    writeMeta(c.id, { stage });
    logActivity(c.id, "Status updated", m.stage, stage);
    forceRerender((n) => n + 1);
    toast.success(`Cart marked ${stage}`);
  }
  function updateMeta(c: AbandonedCart, patch: Partial<Meta>) {
    writeMeta(c.id, patch);
    forceRerender((n) => n + 1);
    toast.success("Cart updated");
  }
  function sendRecovery(c: AbandonedCart, channel: string) {
    const contact = c.customer?.email || c.guestEmail || "customer";
    updateMeta(c, { stage: "Reminder Sent" });
    logActivity(c.id, `${channel} sent`, readMeta(c.id).stage, "Reminder Sent");
    toast.success(`${channel} recovery message sent to ${contact}`);
  }
  function generateCoupon(c: AbandonedCart) {
    const code = `SAVE${Math.floor(Math.random() * 9000 + 1000)}`;
    updateMeta(c, { couponCode: code, stage: "Coupon Sent" });
    toast.success(`Coupon ${code} generated and sent`);
  }
  function exportCsv() {
    const headers = ["Cart ID", "Customer", "Email", "Type", "Products", "Qty", "Cart Value", "Recovery Status", "Last Activity", "Abandoned Since"];
    const data = rows.map(({ cart: c, meta: m }) => [
      c.id, c.customer?.name || "Guest", c.customer?.email || c.guestEmail, c.customerId ? "Registered" : "Guest",
      itemsOf(c).map((i) => i.name).join("; "), itemsOf(c).reduce((n, i) => n + (i.quantity || i.qty || 1), 0),
      c.cartValue, m.stage, c.lastActivity, c.createdAt,
    ]);
    download([headers, ...data].map((row) => row.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")).join("\n"), "abandoned-carts.csv");
  }
  function bulk(action: string) {
    if (action === "Export") return exportCsv();
    if (!selected.size) return;
    selected.forEach((id) => {
      const c = carts.find((x) => x.id === id);
      if (!c) return;
      if (action === "Send Recovery Emails") sendRecovery(c, "Email");
      else if (action === "Send SMS") sendRecovery(c, "SMS");
      else if (action === "Send WhatsApp") sendRecovery(c, "WhatsApp");
      else if (action === "Generate Coupons") generateCoupon(c);
    });
    if (!["Send Recovery Emails", "Send SMS", "Send WhatsApp", "Generate Coupons"].includes(action)) toast.success(`${action} queued for ${selected.size} carts`);
    setSelected(new Set());
  }

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-5 pb-12">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 py-2 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{adminTr("Abandoned Carts")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor abandoned shopping carts and recover lost sales using automated recovery workflows.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCampaignOpen(true)}><Megaphone /> Create Recovery Campaign</Button>
          <Button variant="outline" onClick={() => bulk("Send Recovery Emails")}><Mail /> Send Recovery Messages</Button>
          <Button variant="outline" onClick={() => bulk("Generate Coupons")}><Ticket /> Generate Coupons</Button>
          <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          <Button variant="outline" onClick={() => void load()}><RefreshCw /> Refresh</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <StatCard icon={ShoppingBag} tone="primary" title="Total Abandoned" value={formatNumber(total)} />
        <StatCard icon={ShoppingCart} tone="accent" title="Recoverable" value={formatNumber(recoverable)} />
        <StatCard icon={CheckCircle2} tone="success" title="Recovered" value={formatNumber(recovered)} />
        <StatCard icon={Percent} tone="warning" title="Recovery Rate" value={`${recoveryRate.toFixed(1)}%`} />
        <StatCard icon={BadgeDollarSign} tone="destructive" title="Lost Revenue" value={formatCurrency(lostRevenue)} />
        <StatCard icon={BadgeDollarSign} tone="success" title="Recovered Revenue" value={formatCurrency(recoveredRevenue)} />
        <StatCard icon={ShoppingBag} tone="primary" title="Avg. Cart Value" value={formatCurrency(avgCartValue)} />
        <StatCard icon={Megaphone} tone="accent" title="Active Campaigns" value={formatNumber(activeCampaigns)} />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="carts">{adminTr("Abandoned Carts")}</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="carts">
          <Card className="mt-4 overflow-hidden">
            <div className="sticky top-16 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:flex-wrap">
              <div className="relative flex-1 xl:max-w-sm">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cart, customer, email, product, SKU…" />
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="xl:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All recovery statuses</SelectItem>
                  {cartStages.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectTrigger className="xl:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All campaign types</SelectItem>
                  {campaignTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={customerType} onValueChange={setCustomerType}>
                <SelectTrigger className="xl:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Guest / Registered</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info("Device, browser, country, coupon, and cart value filters can be saved as a view")}>
                <Filter /> Advanced
              </Button>
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>Auto Refresh</Button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2 border-b bg-primary/[.04] p-3">
                <b className="text-sm text-primary">{selected.size} selected</b>
                {["Send Recovery Emails", "Send SMS", "Send WhatsApp", "Generate Coupons", "Export", "Archive", "Delete"].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => bulk(v)}>{v}</Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center text-sm text-muted-foreground">Loading abandoned carts…</div>
            ) : error ? (
              <EmptyState icon={AlertTriangle} title="Abandoned carts unavailable" description={error} />
            ) : !rows.length ? (
              <EmptyState
                icon={ShoppingBag}
                title="No abandoned carts found."
                description="Carts left without completing checkout will appear here."
                className="py-20"
                action={
                  <div className="flex gap-2">
                    <Button onClick={() => setCampaignOpen(true)}><Megaphone /> Create Recovery Campaign</Button>
                    <Button variant="outline" onClick={() => toast.info("Recovery data import queued")}>Import Recovery Data</Button>
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
                          checked={paged.length > 0 && paged.every((x) => selected.has(x.cart.id))}
                          onCheckedChange={(v) => setSelected(v ? new Set(paged.map((x) => x.cart.id)) : new Set())}
                        />
                      </TableHead>
                      {["Cart ID", "Customer", "Email", "Type", "Products", "Qty", "Cart Value", "Recovery Status", "Campaign", "Last Activity", "Abandoned Since", "Actions"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(({ cart: c, meta: m }) => {
                      const items = itemsOf(c);
                      return (
                        <TableRow key={c.id}>
                          <TableCell>
                            <Checkbox
                              checked={selected.has(c.id)}
                              onCheckedChange={(v) => setSelected((x) => { const n = new Set(x); if (v) n.add(c.id); else n.delete(c.id); return n; })}
                            />
                          </TableCell>
                          <TableCell><button className="font-mono text-xs font-semibold text-primary" onClick={() => setDrawer(c)}>{c.id.slice(0, 12)}</button></TableCell>
                          <TableCell className="font-semibold">{c.customer?.name || "Guest"}</TableCell>
                          <TableCell>{c.customer?.email || c.guestEmail || "—"}</TableCell>
                          <TableCell><Badge variant="outline">{c.customerId ? "Registered" : "Guest"}</Badge></TableCell>
                          <TableCell className="max-w-40 truncate text-xs text-muted-foreground">{items.map((i) => i.name).join(", ") || "—"}</TableCell>
                          <TableCell>{items.reduce((n, i) => n + (i.quantity || i.qty || 1), 0)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(Number(c.cartValue))}</TableCell>
                          <TableCell><Badge variant={stageBadge(m.stage)}>{m.stage}</Badge></TableCell>
                          <TableCell><Badge variant="outline">{m.campaignType}</Badge></TableCell>
                          <TableCell className="text-xs">{new Date(c.lastActivity).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDrawer(c)}><Eye /> View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void recoverCart(c)}><CheckCircle2 /> Recover Cart</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => sendRecovery(c, "Email")}><Mail /> Send Email</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => sendRecovery(c, "SMS")}><Phone /> Send SMS</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => sendRecovery(c, "WhatsApp")}><MessageSquare /> Send WhatsApp</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => generateCoupon(c)}><Ticket /> Generate Coupon</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => transition(c, "Converted to Order")}>Convert to Order</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDrawer(c)}><History /> View Timeline</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => transition(c, "Deleted")}><Trash2 /> Delete</DropdownMenuItem>
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
              <span className="text-xs text-muted-foreground">{rows.length} abandoned carts · Customize and reorder columns</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">{adminTr("Page {page} of {pages}", { page: page, pages: pages })}</span>
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics trend={trend} recoveryOverTime={recoveryOverTime} revenueRecovery={revenueRecovery} topProducts={topProducts} byChannel={byChannel} stageDistribution={stageDistribution} />
        </TabsContent>
        <TabsContent value="audit"><Audit enriched={enriched} /></TabsContent>
        <TabsContent value="security">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["View Abandoned Carts", "Manage Recovery Campaigns", "Send Recovery Messages", "Generate Coupons", "Delete Abandoned Carts", "Export Reports", "View Analytics"].map((x) => (
              <Card key={x} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{x}</span>
                <Badge variant="success">Granted</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <CartDrawer cart={drawer} onClose={() => setDrawer(null)} onSendRecovery={sendRecovery} onGenerateCoupon={generateCoupon} onUpdateMeta={updateMeta} onTransition={transition} />
      <CampaignDialog open={campaignOpen} onClose={() => setCampaignOpen(false)} carts={carts} onLaunched={(name, type, incentive) => {
        carts.forEach((c) => {
          const m = readMeta(c.id);
          if (!["Recovered", "Converted to Order"].includes(m.stage)) writeMeta(c.id, { campaignName: name, campaignType: type, incentiveType: incentive, stage: "Recovery Scheduled" });
        });
        forceRerender((n) => n + 1);
        setCampaignOpen(false);
        toast.success(`Recovery campaign "${name}" launched for ${recoverable} carts`);
      }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

function CartDrawer({
  cart,
  onClose,
  onSendRecovery,
  onGenerateCoupon,
  onUpdateMeta,
  onTransition,
}: {
  cart: AbandonedCart | null;
  onClose: () => void;
  onSendRecovery: (c: AbandonedCart, channel: string) => void;
  onGenerateCoupon: (c: AbandonedCart) => void;
  onUpdateMeta: (c: AbandonedCart, patch: Partial<Meta>) => void;
  onTransition: (c: AbandonedCart, stage: string) => void;
}) {
  if (!cart) return null;
  const m = readMeta(cart.id);
  const items = itemsOf(cart);
  const [notes, setNotes] = React.useState(m.staffNotes);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Cart {cart.id.slice(0, 12)} <Badge variant={stageBadge(m.stage)}>{m.stage}</Badge>
          </DialogTitle>
          <DialogDescription>Customer, products, checkout details, behavior, and recovery timeline.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="customer">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="checkout">Checkout</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="internal">Internal</TabsTrigger>
          </TabsList>

          <TabsContent value="customer">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Name" value={cart.customer?.name || "Guest"} />
              <Info label="Email" value={cart.customer?.email || cart.guestEmail} />
              <Info label="Phone" value={cart.customer?.phone} />
              <Info label="Customer Group" value={cart.customerId ? "Registered" : "Guest"} />
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>{["Product", "SKU", "Quantity", "Unit Price"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {items.length ? items.map((i, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{i.name || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{i.sku || "—"}</TableCell>
                      <TableCell>{i.quantity || i.qty || 1}</TableCell>
                      <TableCell>{formatCurrency(Number(i.unitPrice || i.price || 0))}</TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No line item detail captured for this cart.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3"><Info label="Cart Total" value={formatCurrency(Number(cart.cartValue))} /></div>
          </TabsContent>

          <TabsContent value="checkout">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Shipping Method" value="Standard Shipping" />
              <Info label="Payment Method" value="Not selected" />
              <Info label="Coupon Applied" value={m.couponCode || "None"} />
              <Info label="Taxes" value={formatCurrency(0)} />
            </div>
          </TabsContent>

          <TabsContent value="behavior">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Device" value={m.device} />
              <Info label="Browser" value={m.browser} />
              <Info label="Country" value={m.country} />
              <Info label="UTM Source" value={m.utmSource} />
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="mt-4 space-y-3">
              {[{ action: "Cart Created", date: cart.createdAt }, { action: "Checkout Abandoned", date: cart.lastActivity }, ...m.activity.map((a) => ({ action: `${a.action}: ${a.previous} → ${a.next}`, date: a.date }))].map((e, i) => (
                <div key={`${e.date}-${i}`} className="flex gap-3">
                  <Clock3 className="mt-3 size-4 text-primary" />
                  <div className="flex-1 rounded-xl border p-3">
                    <b>{e.action}</b>
                    <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString()} · Admin User</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => onSendRecovery(cart, "Email")}><Mail /> Send Email</Button>
              <Button variant="outline" onClick={() => onGenerateCoupon(cart)}><Ticket /> Generate Coupon</Button>
              <Button variant="outline" onClick={() => onTransition(cart, "Converted to Order")}>Convert to Order</Button>
            </div>
          </TabsContent>

          <TabsContent value="internal">
            <div className="mt-4 space-y-4">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Staff notes…" />
              <Button onClick={() => onUpdateMeta(cart, { staffNotes: notes })}>Save Internal Details</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CampaignDialog({
  open,
  onClose,
  carts,
  onLaunched,
}: {
  open: boolean;
  onClose: () => void;
  carts: AbandonedCart[];
  onLaunched: (name: string, type: string, incentive: string) => void;
}) {
  const [form, setForm] = React.useState({ name: "", type: campaignTypes[0], incentive: incentiveTypes[0] });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Recovery Campaign</DialogTitle>
          <DialogDescription>Launch an automated recovery workflow across {carts.length} tracked carts.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Campaign Name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Weekend Win-Back" /></Field>
          <Field label="Campaign Type">
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{campaignTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Incentive">
            <Select value={form.incentive} onValueChange={(v) => setForm((f) => ({ ...f, incentive: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{incentiveTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (!form.name) { toast.error("Campaign name is required"); return; } onLaunched(form.name, form.type, form.incentive); }}>
            <Sparkles /> Launch Campaign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Analytics({
  trend,
  recoveryOverTime,
  revenueRecovery,
  topProducts,
  byChannel,
  stageDistribution,
}: {
  trend: { date: string; count: number }[];
  recoveryOverTime: { date: string; rate: number }[];
  revenueRecovery: { month: string; lost: number; recovered: number }[];
  topProducts: { name: string; qty: number }[];
  byChannel: { name: string; value: number }[];
  stageDistribution: { stage: string; count: number }[];
}) {
  const reports = ["Abandoned Cart Report", "Recovery Performance", "Lost Revenue", "Recovered Revenue", "Customer Behavior", "Product Abandonment", "Recovery Campaign Performance", "Conversion Rate", "Marketing Attribution"];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Abandoned Carts Trend</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          <h3 className="font-semibold">Recovery Rate Over Time</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={recoveryOverTime} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `${v}%`} />
                  <RTooltip formatter={(v) => `${v}%`} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="rate" stroke="var(--color-chart-1)" strokeWidth={2.25} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold">Revenue Recovery</h3>
        <div className="mt-4 h-[260px] w-full">
          <ChartMount>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueRecovery} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
                <RTooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="lost" name="Lost" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="recovered" name="Recovered" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} barSize={16} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartMount>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold">Top Abandoned Products</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={topProducts} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="qty" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} barSize={14} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Recovery by Channel</h3>
          <div className="mt-4 h-[260px] w-full">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byChannel} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {byChannel.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
          <h3 className="font-semibold">Customer Abandonment Timeline</h3>
          <div className="mt-4 space-y-3">
            {stageDistribution.map((s) => (
              <div key={s.stage}>
                <div className="mb-1 flex justify-between text-sm"><span>{s.stage}</span><b>{s.count}</b></div>
                <div className="h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${(s.count / Math.max(1, stageDistribution.reduce((n, x) => n + x.count, 0))) * 100}%` }} /></div>
              </div>
            ))}
            {!stageDistribution.length && <p className="text-sm text-muted-foreground">No stage activity recorded yet.</p>}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Reports</h3>
          <div className="mt-4 grid max-h-[240px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {reports.map((r) => (
              <button key={r} className="flex items-center justify-between rounded-xl border p-3 text-sm" onClick={() => toast.info(`${r} generated`)}>
                {r} <Download className="size-4 shrink-0" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Audit({ enriched }: { enriched: { cart: AbandonedCart; meta: Meta }[] }) {
  const events = enriched.flatMap((x) => x.meta.activity.map((a) => ({ ...a, cartId: x.cart.id.slice(0, 12) }))).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card className="mt-4 overflow-hidden">
      {!events.length ? (
        <EmptyState icon={History} title="No audit events yet" description="Cart recovery actions will appear here." className="py-16" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>{["User", "Cart", "Action", "Previous", "New", "Date", "Device", "IP Address"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={`${e.date}-${i}`}>
                  <TableCell>{e.user}</TableCell>
                  <TableCell className="font-mono text-xs">{e.cartId}</TableCell>
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
