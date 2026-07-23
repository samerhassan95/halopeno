"use client";

import * as React from "react";
import { api, ApiError } from "@/lib/api/client";

export type ReportRange = "7d" | "30d" | "90d" | "365d";

export function useReport<T>(endpoint: string, range: ReportRange) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refetch = React.useCallback(() => {
    setLoading(true);
    api
      .get<T>(`${endpoint}?range=${range}`)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Unable to reach the API");
      })
      .finally(() => setLoading(false));
  }, [endpoint, range]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
