"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";

export function AffiliateTracker() {
  const params = useSearchParams();

  React.useEffect(() => {
    const code = params.get("ref") || params.get("affiliate");
    if (!code) return;
    window.localStorage.setItem("halopeno-referral-code", code);
    void api.post("/storefront/affiliate/click", { code }).catch(() => undefined);
  }, [params]);

  return null;
}
