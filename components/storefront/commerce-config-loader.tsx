"use client";

import * as React from "react";
import { useCommerceConfigStore } from "@/lib/storefront/store/commerce-config-store";

export function CommerceConfigLoader() {
  const fetchConfig = useCommerceConfigStore((s) => s.fetchConfig);
  React.useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);
  return null;
}
