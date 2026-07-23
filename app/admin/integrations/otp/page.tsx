"use client";

import * as React from "react";
import { WifiOff, ShieldCheck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { CardSkeleton, TableSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { formatNumber } from "@/lib/utils";

interface OtpRequest {
  id: string;
  useCase: string;
  channel: string;
  destination: string;
  provider: string;
  country: string | null;
  attempts: number;
  status: string;
  failureReason: string | null;
  requestedAt: string;
}

const statusVariant: Record<string, "success" | "destructive" | "secondary" | "warning"> = {
  VERIFIED: "success",
  FAILED: "destructive",
  EXPIRED: "warning",
  PENDING: "secondary",
};

export default function OtpDashboardPage() {
  const [requests, setRequests] = React.useState<OtpRequest[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api
      .get<{ data: OtpRequest[] }>("/integrations/otp-requests?limit=100")
      .then((res) => setRequests(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to reach the API"));
  }, []);

  const kpis = React.useMemo(() => {
    if (!requests) return null;
    const total = requests.length;
    const verified = requests.filter((r) => r.status === "VERIFIED").length;
    const failed = requests.filter((r) => r.status === "FAILED").length;
    const providerAgg = new Map<string, { total: number; verified: number }>();
    for (const r of requests) {
      const e = providerAgg.get(r.provider) ?? { total: 0, verified: 0 };
      e.total += 1;
      if (r.status === "VERIFIED") e.verified += 1;
      providerAgg.set(r.provider, e);
    }
    const byProvider = Array.from(providerAgg.entries()).map(([provider, v]) => ({
      provider,
      successRate: v.total ? Math.round((v.verified / v.total) * 100) : 0,
    }));
    return {
      total,
      deliveryRate: total ? Math.round(((total - failed) / total) * 100) : 0,
      verified,
      failed,
      byProvider,
    };
  }, [requests]);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">OTP System</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">One-time-password verification across every provider and channel</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-[#92640a] dark:text-warning">
          <WifiOff className="size-4 shrink-0" />Live API unreachable ({error}) — showing no data.
        </div>
      )}

      {!kpis ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard icon={ShieldCheck} tone="primary" title="Total OTP requests" value={formatNumber(kpis.total)} />
            <StatCard icon={CheckCircle2} tone="success" title="Delivery rate" value={`${kpis.deliveryRate}%`} />
            <StatCard icon={ShieldCheck} tone="accent" title="Verified" value={formatNumber(kpis.verified)} />
            <StatCard icon={XCircle} tone="destructive" title="Failed" value={formatNumber(kpis.failed)} />
          </div>

          <Card>
            <CardHeader><CardTitle>Success rate by provider</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpis.byProvider} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="provider" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={32} unit="%" />
                    <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="successRate" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent requests</CardTitle></CardHeader>
            <CardContent className="p-0">
              {!requests ? (
                <TableSkeleton rows={5} cols={6} />
              ) : requests.length === 0 ? (
                <EmptyState title="No OTP requests yet" className="py-16" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Use case</TableHead><TableHead>Channel</TableHead><TableHead>Destination</TableHead><TableHead>Provider</TableHead><TableHead>Attempts</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.slice(0, 20).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.useCase.replace(/_/g, " ").toLowerCase()}</TableCell>
                        <TableCell>{r.channel}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{r.destination}</TableCell>
                        <TableCell>{r.provider}</TableCell>
                        <TableCell>{r.attempts}</TableCell>
                        <TableCell><Badge variant={statusVariant[r.status] ?? "secondary"}>{r.status.toLowerCase()}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
