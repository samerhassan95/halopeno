"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { WifiOff, MessageSquareText, UserX, Clock, Mail, ShieldAlert, Timer, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { CardSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "sonner";

interface CommunicationSummary {
  kpis: {
    openTickets: number;
    unassignedTickets: number;
    overdueTickets: number;
    newContactMessages: number;
    openComplaints: number;
    avgResponseTimeHours: number;
    avgResolutionTimeHours: number;
    publishedArticles: number;
    totalTickets: number;
  };
  ticketsByStatus: { status: string; count: number }[];
  ticketsByPriority: { priority: string; count: number }[];
  ticketsTrend: { date: string; count: number }[];
  recentTickets: { id: string; subject: string; status: string; priority: string; assignedTo: string | null; createdAt: string }[];
}

const priorityVariant: Record<string, "secondary" | "warning" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "secondary",
  HIGH: "warning",
  URGENT: "destructive",
};

export default function CommunicationDashboardPage() {
  const router = useRouter();
  const [data, setData] = React.useState<CommunicationSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api
      .get<CommunicationSummary>("/communication/summary")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to reach the API"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Communication</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Support tickets, complaints and customer messages in one place</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-[#92640a] dark:text-warning">
          <WifiOff className="size-4 shrink-0" />Live API unreachable ({error}) — showing no data.
        </div>
      )}

      {loading || !data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={MessageSquareText} tone="primary" title="Open tickets" value={String(data.kpis.openTickets)} />
            <StatCard icon={UserX} tone="warning" title="Unassigned" value={String(data.kpis.unassignedTickets)} />
            <StatCard icon={Clock} tone="destructive" title="Overdue" value={String(data.kpis.overdueTickets)} />
            <StatCard icon={Mail} tone="accent" title="New contact messages" value={String(data.kpis.newContactMessages)} />
            <StatCard icon={ShieldAlert} tone="destructive" title="Open complaints" value={String(data.kpis.openComplaints)} />
            <StatCard icon={Timer} tone="primary" title="Avg. first response" value={`${data.kpis.avgResponseTimeHours}h`} />
            <StatCard icon={CheckCircle2} tone="success" title="Avg. resolution" value={`${data.kpis.avgResolutionTimeHours}h`} />
            <StatCard icon={MessageSquareText} tone="accent" title="Published KB articles" value={String(data.kpis.publishedArticles)} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Tickets by status</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.ticketsByStatus} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="status" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="count" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Tickets by priority</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.ticketsByPriority} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="priority" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="count" fill="var(--color-chart-4)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent tickets</CardTitle>
              <CardDescription>Latest support conversations across every channel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recentTickets.length === 0 ? (
                <EmptyState title="No tickets yet" />
              ) : (
                data.recentTickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/admin/support/tickets/${t.id}`)}
                    className="flex w-full items-center justify-between rounded-[10px] border border-border p-3 text-start text-sm transition-colors hover:bg-secondary"
                  >
                    <div>
                      <p className="font-medium">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.assignedTo ?? "Unassigned"} · {new Date(t.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={priorityVariant[t.priority] ?? "secondary"}>{t.priority.toLowerCase()}</Badge>
                      <Badge variant="secondary">{t.status.toLowerCase().replace("_", " ")}</Badge>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
