"use client";

import * as React from "react";
import { CheckCircle2, Circle, Building2, Store, Palette, Globe, Percent, CreditCard, Truck, Mail, ShieldCheck, Rocket } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface Step {
  key: string;
  label: string;
  description: string;
  icon: typeof Building2;
  href: string;
  done: boolean;
}

export default function SetupDashboardPage() {
  const [counts, setCounts] = React.useState<Record<string, number> | null>(null);

  React.useEffect(() => {
    Promise.all([
      api.get<{ meta: { total: number } }>("/administration/companies?limit=1"),
      api.get<{ meta: { total: number } }>("/administration/stores?limit=1"),
      api.get<{ meta: { total: number } }>("/administration/currencies?limit=1"),
      api.get<{ meta: { total: number } }>("/administration/languages?limit=1"),
      api.get<{ meta: { total: number } }>("/finance/tax-classes?limit=1"),
      api.get<{ meta: { total: number } }>("/integrations/integration-connections?limit=1"),
      api.get<{ meta: { total: number } }>("/shipping/shipping-zones?limit=1"),
    ])
      .then(([companies, stores, currencies, languages, tax, integrations, zones]) =>
        setCounts({
          companies: companies.meta.total,
          stores: stores.meta.total,
          currencies: currencies.meta.total,
          languages: languages.meta.total,
          tax: tax.meta.total,
          integrations: integrations.meta.total,
          zones: zones.meta.total,
        })
      )
      .catch(() => setCounts({}));
  }, []);

  const steps: Step[] = counts
    ? [
        { key: "company", label: "Company information", description: "Legal name, tax number and default currency", icon: Building2, href: "/admin/settings/setup", done: (counts.companies ?? 0) > 0 },
        { key: "store", label: "Store information", description: "Domain, branding and store locale", icon: Store, href: "/admin/settings/setup", done: (counts.stores ?? 0) > 0 },
        { key: "branding", label: "Branding", description: "Logo, favicon and brand colors", icon: Palette, href: "/admin/design-studio/global-styles", done: true },
        { key: "localization", label: "Localization", description: "Languages and currencies enabled", icon: Globe, href: "/admin/settings/languages", done: (counts.languages ?? 0) > 0 && (counts.currencies ?? 0) > 0 },
        { key: "taxes", label: "Taxes", description: "Tax classes and rates configured", icon: Percent, href: "/admin/finance/tax-classes", done: (counts.tax ?? 0) > 0 },
        { key: "payments", label: "Payments", description: "At least one payment gateway connected", icon: CreditCard, href: "/admin/integrations/payments", done: (counts.integrations ?? 0) > 0 },
        { key: "shipping", label: "Shipping", description: "Shipping zones and rates defined", icon: Truck, href: "/admin/shipping/zones", done: (counts.zones ?? 0) > 0 },
        { key: "email", label: "Email", description: "Outbound email provider configured", icon: Mail, href: "/admin/settings/system", done: false },
        { key: "security", label: "Security", description: "Roles and permissions reviewed", icon: ShieldCheck, href: "/admin/settings/roles", done: true },
        { key: "launch", label: "Launch", description: "Store is live and accepting orders", icon: Rocket, href: "/", done: true },
      ]
    : [];

  const completedCount = steps.filter((s) => s.done).length;
  const pct = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Setup</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Get your store fully configured and ready to launch</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup progress</CardTitle>
          <CardDescription>{completedCount} of {steps.length || 10} steps complete</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={pct} />
          <p className="mt-2 text-right text-sm font-medium text-muted-foreground">{pct}%</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {steps.length === 0
          ? Array.from({ length: 10 }).map((_, i) => <Card key={i} className="h-20 animate-pulse" />)
          : steps.map((s) => (
              <a
                key={s.key}
                href={s.href}
                className={cn(
                  "flex items-start gap-3 rounded-[12px] border p-4 transition-colors hover:bg-secondary",
                  s.done ? "border-success/30 bg-success/5" : "border-border"
                )}
              >
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", s.done ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground")}>
                  <s.icon className="size-4" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{s.label}</p>
                    {s.done ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-muted-foreground" />}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
                </div>
                {!s.done && <Badge variant="warning">Pending</Badge>}
              </a>
            ))}
      </div>
    </div>
  );
}
