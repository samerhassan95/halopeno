"use client";

import * as React from "react";
import Link from "next/link";
import { Rocket, Users2, CalendarRange, LineChart, Plus, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  type: string;
  channels: string[];
  segment: string | null;
  status: string;
  budget: number;
  spend: number;
  revenue: number;
  startsAt: string | null;
  endsAt: string | null;
}

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  active: "success",
  scheduled: "warning",
  draft: "secondary",
  completed: "secondary",
  cancelled: "destructive",
};

export default function MarketingDashboardPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api
      .get<{ data: Campaign[] }>("/marketing/campaigns")
      .then((res) => setCampaigns(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to reach the API"));
  }, []);

  const active = (campaigns ?? []).filter((c) => c.status === "active");
  const upcoming = (campaigns ?? [])
    .filter((c) => c.startsAt && new Date(c.startsAt) > new Date())
    .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime());
  const totalRevenue = (campaigns ?? []).reduce((s, c) => s + Number(c.revenue), 0);
  const totalSpend = (campaigns ?? []).reduce((s, c) => s + Number(c.spend), 0);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[26px]">Marketing</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Campaigns, audience segments and marketing performance in one workspace</p>
        </div>
        <Link href="/admin/marketing/campaigns/new">
          <Button className="gap-2"><Plus className="size-4" /> New campaign</Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-[#92640a] dark:text-warning">
          Live API unreachable ({error}).
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/marketing/campaigns">
          <Card className="h-full p-5 transition-shadow hover:shadow-soft-lg">
            <div className="mb-3 flex size-10 items-center justify-center rounded-[11px] bg-primary/10 text-primary"><Rocket className="size-[19px]" /></div>
            <p className="font-medium">Campaigns</p>
            <p className="mt-1 text-xs text-muted-foreground">{campaigns ? `${active.length} active of ${campaigns.length} total` : "Loading…"}</p>
          </Card>
        </Link>
        <Link href="/admin/marketing/segments">
          <Card className="h-full p-5 transition-shadow hover:shadow-soft-lg">
            <div className="mb-3 flex size-10 items-center justify-center rounded-[11px] bg-accent/10 text-accent"><Users2 className="size-[19px]" /></div>
            <p className="font-medium">Audience segments</p>
            <p className="mt-1 text-xs text-muted-foreground">Build targeted customer segments</p>
          </Card>
        </Link>
        <Link href="/admin/marketing/calendar">
          <Card className="h-full p-5 transition-shadow hover:shadow-soft-lg">
            <div className="mb-3 flex size-10 items-center justify-center rounded-[11px] bg-success/10 text-success"><CalendarRange className="size-[19px]" /></div>
            <p className="font-medium">Marketing calendar</p>
            <p className="mt-1 text-xs text-muted-foreground">{upcoming.length} upcoming campaign{upcoming.length === 1 ? "" : "s"}</p>
          </Card>
        </Link>
        <Link href="/admin/marketing/analytics">
          <Card className="h-full p-5 transition-shadow hover:shadow-soft-lg">
            <div className="mb-3 flex size-10 items-center justify-center rounded-[11px] bg-warning/10 text-[#92640a] dark:text-warning"><LineChart className="size-[19px]" /></div>
            <p className="font-medium">Marketing analytics</p>
            <p className="mt-1 text-xs text-muted-foreground">ROI {totalSpend ? `${Math.round(((totalRevenue - totalSpend) / totalSpend) * 100)}%` : "—"}</p>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Active campaigns</CardTitle>
              <CardDescription>Currently running across all channels</CardDescription>
            </div>
            <Link href="/admin/marketing/campaigns" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {!campaigns ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : active.length === 0 ? (
              <EmptyState title="No active campaigns" description="Launch a campaign to see it here." className="py-10" />
            ) : (
              active.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.channels.join(", ")} · {c.segment ?? "All customers"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <p className="font-medium">{formatCurrency(c.revenue)}</p>
                      <p className="text-xs text-muted-foreground">of {formatCurrency(c.budget)} budget</p>
                    </div>
                    <Badge variant={statusVariant[c.status] ?? "secondary"}>{c.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <CardDescription>Next scheduled campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!campaigns ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : upcoming.length === 0 ? (
              <EmptyState title="Nothing scheduled" className="py-10" />
            ) : (
              upcoming.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{new Date(c.startsAt!).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
