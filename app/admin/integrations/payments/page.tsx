"use client";

import * as React from "react";
import { WifiOff, CreditCard, CheckCircle2, DollarSign, Percent } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { CardSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface IntegrationsSummary {
  payments: {
    kpis: { totalTransactions: number; successRate: number; totalVolume: number; totalFees: number };
    byGateway: { gateway: string; count: number; volume: number }[];
  };
}

export default function PaymentGatewaysPage() {
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
        <h1 className="font-display text-2xl font-bold tracking-tight">Payment Gateways</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Connected payment providers and transaction health</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-[#92640a] dark:text-warning">
          <WifiOff className="size-4 shrink-0" />Live API unreachable ({error}) — showing no data.
        </div>
      )}

      {!data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={CreditCard} tone="primary" title="Transactions" value={formatNumber(data.payments.kpis.totalTransactions)} />
            <StatCard icon={CheckCircle2} tone="success" title="Success rate" value={`${data.payments.kpis.successRate}%`} />
            <StatCard icon={DollarSign} tone="accent" title="Total volume" value={formatCurrency(data.payments.kpis.totalVolume)} />
            <StatCard icon={Percent} tone="warning" title="Gateway fees" value={formatCurrency(data.payments.kpis.totalFees)} />
          </div>

          <Card>
            <CardHeader><CardTitle>By gateway / method</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.payments.byGateway.length === 0 ? (
                <EmptyState title="No payment transactions yet" />
              ) : (
                data.payments.byGateway.map((g) => (
                  <div key={g.gateway} className="flex items-center justify-between rounded-[10px] border border-border p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">{g.gateway}</Badge>
                      <span className="text-muted-foreground">{formatNumber(g.count)} transactions</span>
                    </div>
                    <span className="font-medium">{formatCurrency(g.volume)}</span>
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
