"use client";

import * as React from "react";
import { WifiOff, Webhook, CheckCircle2, RotateCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { CardSkeleton, TableSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";

interface Delivery {
  id: string;
  webhookUrl: string;
  event: string;
  statusCode: number | null;
  success: boolean;
  attempt: number;
  createdAt: string;
}
interface IntegrationsSummary {
  webhooks: {
    kpis: { activeWebhooks: number; totalWebhooks: number; totalDeliveries: number; successRate: number };
    deliveries: Delivery[];
  };
}

export default function WebhookDeliveriesPage() {
  const [data, setData] = React.useState<IntegrationsSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [retrying, setRetrying] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    api
      .get<IntegrationsSummary>("/integrations-summary")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to reach the API"));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function retry(delivery: Delivery) {
    setRetrying(delivery.id);
    try {
      await api.post(`/integrations-summary/webhooks/deliveries/${delivery.id}/retry`);
      toast.success("Delivery retried successfully");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Retry failed");
    } finally {
      setRetrying(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Webhooks</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Outbound event subscriptions and delivery history</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-[#92640a] dark:text-warning">
          <WifiOff className="size-4 shrink-0" />Live API unreachable ({error}) — showing no data.
        </div>
      )}

      {!data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard icon={Webhook} tone="primary" title="Active webhooks" value={formatNumber(data.webhooks.kpis.activeWebhooks)} />
            <StatCard icon={Webhook} tone="accent" title="Total webhooks" value={formatNumber(data.webhooks.kpis.totalWebhooks)} />
            <StatCard icon={RotateCw} tone="warning" title="Deliveries logged" value={formatNumber(data.webhooks.kpis.totalDeliveries)} />
            <StatCard icon={CheckCircle2} tone="success" title="Success rate" value={`${data.webhooks.kpis.successRate}%`} />
          </div>

          <Card>
            <CardHeader><CardTitle>Recent deliveries</CardTitle></CardHeader>
            <CardContent className="p-0">
              {!data ? (
                <TableSkeleton rows={5} cols={5} />
              ) : data.webhooks.deliveries.length === 0 ? (
                <EmptyState title="No webhook deliveries yet" description="Deliveries appear here once events fire." className="py-16" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Endpoint</TableHead><TableHead>Event</TableHead><TableHead>Status</TableHead><TableHead>Attempt</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.webhooks.deliveries.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="max-w-[240px] truncate font-mono text-xs">{d.webhookUrl}</TableCell>
                        <TableCell><Badge variant="secondary">{d.event}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={d.success ? "success" : "destructive"}>{d.statusCode ?? "—"} {d.success ? "OK" : "failed"}</Badge>
                        </TableCell>
                        <TableCell>{d.attempt}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {!d.success && (
                            <Button size="sm" variant="outline" className="gap-1.5" disabled={retrying === d.id} onClick={() => retry(d)}>
                              <RotateCw className="size-3.5" />
                              {retrying === d.id ? "Retrying…" : "Retry"}
                            </Button>
                          )}
                        </TableCell>
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
