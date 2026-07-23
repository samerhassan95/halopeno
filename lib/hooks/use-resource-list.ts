"use client";

import * as React from "react";
import { api, ApiError } from "@/lib/api/client";

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface UseResourceListOptions<T> {
  clientFilter?: (row: T) => boolean;
  pageSize?: number;
}

export function useResourceList<T = Record<string, unknown>>(
  endpoint: string,
  options: UseResourceListOptions<T> = {}
) {
  const { clientFilter, pageSize = 10 } = options;
  const fetchLimit = clientFilter ? 100 : pageSize;

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [rawData, setRawData] = React.useState<T[]>([]);
  const [rawMeta, setRawMeta] = React.useState({ total: 0, page: 1, limit: fetchLimit, totalPages: 1 });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadTick, setReloadTick] = React.useState(0);

  const serverPage = clientFilter ? 1 : page;

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(serverPage));
    params.set("limit", String(fetchLimit));
    if (search) params.set("search", search);

    api
      .get<PaginatedResult<T>>(`${endpoint}?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setRawData(res.data);
        setRawMeta(res.meta);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Unable to reach the API");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, serverPage, search, fetchLimit, reloadTick]);

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  const refetch = React.useCallback(() => setReloadTick((t) => t + 1), []);

  const filtered = React.useMemo(
    () => (clientFilter ? rawData.filter(clientFilter) : rawData),
    [rawData, clientFilter]
  );

  const data = React.useMemo(
    () => (clientFilter ? filtered.slice((page - 1) * pageSize, page * pageSize) : rawData),
    [clientFilter, filtered, page, pageSize, rawData]
  );
  const total = clientFilter ? filtered.length : rawMeta.total;
  const totalPages = clientFilter ? Math.max(1, Math.ceil(filtered.length / pageSize)) : rawMeta.totalPages;

  return {
    data,
    total,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    loading,
    error,
    refetch,
    pageSize,
  };
}
