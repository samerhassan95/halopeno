"use client";

import * as React from "react";
import { WifiOff, Truck, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CardSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { formatNumber } from "@/lib/utils";

interface IntegrationsSummary {
  shipping: {
    kpis: { totalShipments: number; successRate: number; failed: number };
    byCarrier: { carrier: string; shipments: number; successRate: number }[];
  };
}

export default function ShippingIntegrationsPage() {
  const [data, setData] = React.useState<IntegrationsSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api
      .get<IntegrationsSummary>("/integrations-summary")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to reach the API"));
  }, []);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Shipping Integrations</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Connected carriers and delivery performance</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-[#92640a] dark:text-warning">
          <WifiOff className="size-4 shrink-0" />Live API unreachable ({error}) — showing no data.
        </div>
      )}

      {!data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard icon={Truck} tone="primary" title="Total shipments" value={formatNumber(data.shipping.kpis.totalShipments)} />
            <StatCard icon={CheckCircle2} tone="success" title="Delivery success rate" value={`${data.shipping.kpis.successRate}%`} />
            <StatCard icon={XCircle} tone="destructive" title="Failed shipments" value={formatNumber(data.shipping.kpis.failed)} />
          </div>

          <Card>
            <CardHeader><CardTitle>By carrier</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.shipping.byCarrier.length === 0 ? (
                <EmptyState title="No shipments recorded yet" />
              ) : (
                data.shipping.byCarrier.map((c) => (
                  <div key={c.carrier} className="flex items-center justify-between rounded-[10px] border border-border p-3 text-sm">
                    <span className="font-medium">{c.carrier}</span>
                    <div className="text-right text-sm">
                      <p>{formatNumber(c.shipments)} shipments</p>
                      <p className="text-xs text-muted-foreground">{c.successRate}% success</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
