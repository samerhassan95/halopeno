"use client";

import * as React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  Store,
  Users,
  Landmark,
  HandCoins,
  Boxes,
  Star,
  Clock,
  FileDown,
  Wand2,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "sonner";

const categories = [
  { title: "Sales", description: "Revenue, orders, channels & comparisons", href: "/admin/reports/sales", icon: TrendingUp, tone: "primary" as const },
  { title: "Products", description: "Best sellers, profitability, returns", href: "/admin/reports/products", icon: Package, tone: "accent" as const },
  { title: "Sellers", description: "Marketplace performance & commission", href: "/admin/reports/sellers", icon: Store, tone: "success" as const },
  { title: "Customers", description: "Acquisition, retention, lifetime value", href: "/admin/reports/customers", icon: Users, tone: "warning" as const },
  { title: "Tax", description: "Collected, refunded & net liability", href: "/admin/reports/taxes", icon: Landmark, tone: "destructive" as const },
  { title: "Commissions", description: "Marketplace commission ledger", href: "/admin/reports/commissions", icon: HandCoins, tone: "primary" as const },
  { title: "Stock", description: "Inventory value, low & dead stock", href: "/admin/reports/stock", icon: Boxes, tone: "accent" as const },
];

const iconTone = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-[#92640a] dark:text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

interface SavedReport {
  id: string;
  name?: string;
  title?: string;
  createdAt?: string;
}

const recentlyViewed = [
  { name: "Sales Overview", href: "/admin/reports/sales", viewedAt: "2h ago" },
  { name: "Product Performance", href: "/admin/reports/products", viewedAt: "Yesterday" },
  { name: "Seller Performance", href: "/admin/reports/sellers", viewedAt: "3 days ago" },
];

const initialSchedules = [
  { id: "1", report: "Sales Overview", frequency: "Weekly", recipients: "finance@halopeno.dev", format: "PDF", enabled: true },
  { id: "2", report: "Customer Overview", frequency: "Monthly", recipients: "growth@halopeno.dev", format: "CSV", enabled: false },
];

export default function ReportCenterPage() {
  const [saved, setSaved] = React.useState<SavedReport[] | null>(null);
  const [savedError, setSavedError] = React.useState(false);
  const [schedules, setSchedules] = React.useState(initialSchedules);

  React.useEffect(() => {
    api
      .get<{ data: SavedReport[] }>("/analytics/saved-reports")
      .then((res) => setSaved(res.data))
      .catch((err) => {
        setSavedError(true);
        if (!(err instanceof ApiError)) console.error(err);
      });
  }, []);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[26px]">Report Center</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Every analytics dashboard, saved report and export in one place</p>
        </div>
        <Link href="/admin/reports/builder">
          <Button className="gap-2">
            <Wand2 className="size-4" />
            Custom report builder
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="h-full p-5 transition-shadow hover:shadow-soft-lg">
              <div className={`mb-3 flex size-10 items-center justify-center rounded-[11px] ${iconTone[c.tone]}`}>
                <c.icon className="size-[19px]" />
              </div>
              <p className="font-medium">{c.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="size-4" /> Recently viewed</CardTitle>
            <CardDescription>Jump back into a report you looked at recently</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentlyViewed.map((r) => (
              <Link key={r.href} href={r.href} className="flex items-center justify-between rounded-[8px] px-2 py-2 text-sm hover:bg-secondary">
                <span className="font-medium">{r.name}</span>
                <span className="text-xs text-muted-foreground">{r.viewedAt}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Star className="size-4" /> Saved reports</CardTitle>
            <CardDescription>Custom reports saved from the report builder</CardDescription>
          </CardHeader>
          <CardContent>
            {saved === null && !savedError ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : !saved || saved.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No saved reports yet"
                description="Build a custom report and save it to see it here."
                action={
                  <Link href="/admin/reports/builder">
                    <Button variant="outline" size="sm" className="gap-2"><Plus className="size-3.5" /> New report</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-1">
                {saved.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-[8px] px-2 py-2 text-sm hover:bg-secondary">
                    <span className="font-medium">{r.name ?? r.title ?? "Untitled report"}</span>
                    {r.createdAt && <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileDown className="size-4" /> Scheduled reports</CardTitle>
          <CardDescription>Automatically emailed exports on a recurring schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {schedules.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border p-3">
              <div>
                <p className="text-sm font-medium">{s.report}</p>
                <p className="text-xs text-muted-foreground">{s.recipients}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{s.frequency}</Badge>
                <Badge variant="outline">{s.format}</Badge>
                <Switch
                  checked={s.enabled}
                  onCheckedChange={(checked) => {
                    setSchedules((prev) => prev.map((x) => (x.id === s.id ? { ...x, enabled: checked } : x)));
                    toast.success(`${s.report} schedule ${checked ? "enabled" : "disabled"}`);
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
