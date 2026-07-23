"use client";

import * as React from "react";
import { api, ApiError } from "@/lib/api/client";
import type { Product } from "@/types";

export interface DashboardSummary {
  kpis: {
    totalRevenue: number;
    netRevenue: number;
    grossProfit: number;
    totalOrders: number;
    avgOrderValue: number;
    refundRate: number;
    returnRate: number;
    totalCustomers: number;
    newCustomers: number;
    activeSellers: number;
    pendingSellerApprovals: number;
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    pendingOrders: number;
    pendingRefundRequests: number;
    openSupportTickets: number;
    fulfillmentRate: number;
  };
  orderStatusBreakdown: { status: string; count: number; percentage: number }[];
  revenueTrend: { date: string; revenue: number; orders: number }[];
  topProducts: Product[];
  topCategories: { id: string; name: string; revenue: number; productCount: number }[];
  topBrands: { id: string; name: string; revenue: number }[];
  topSellers: { id: string; name: string; revenue: number; orderCount: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerAvatar: string | null;
    sellerName: string;
    channel: string;
    date: string;
    productCount: number;
    total: number;
    paymentStatus: string;
    status: string;
  }[];
}

export function useDashboardSummary() {
  const [data, setData] = React.useState<DashboardSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refetch = React.useCallback(() => {
    setLoading(true);
    api
      .get<DashboardSummary>("/dashboard/summary")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Unable to reach the API");
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
