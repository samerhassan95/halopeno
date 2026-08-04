"use client";

import * as React from "react";
import { useCommerceConfigStore } from "@/lib/storefront/store/commerce-config-store";

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const site = useCommerceConfigStore((s) => s.site);
  if (!site?.maintenanceMode) return <>{children}</>;
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Maintenance</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-brown sm:text-4xl">
        {site.siteName} is briefly offline
      </h1>
      <p className="mt-4 max-w-md text-sm text-muted-foreground">{site.maintenanceMessage}</p>
    </div>
  );
}
