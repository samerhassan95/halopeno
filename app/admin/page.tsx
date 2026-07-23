"use client";

import * as React from "react";
import { WifiOff } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { CustomerCard } from "@/components/dashboard/customer-card";
import { ProductStatsCard } from "@/components/dashboard/product-stats-card";
import { SalesCard } from "@/components/dashboard/sales-card";
import { SellerCard } from "@/components/dashboard/seller-card";
import { CategoryStatsCard } from "@/components/dashboard/category-stats-card";
import { BrandStatsCard } from "@/components/dashboard/brand-stats-card";
import { MiniStatRow } from "@/components/dashboard/mini-stat-row";
import { OrdersOverview } from "@/components/dashboard/orders-overview";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TopCategoriesProducts } from "@/components/dashboard/top-categories-products";
import { RecentOrdersTable } from "@/components/dashboard/recent-orders-table";
import { AdditionalSections } from "@/components/dashboard/additional-sections";
import type { DateRangeValue } from "@/components/dashboard/date-range-filter";
import { useDashboardSummary } from "@/lib/hooks/use-dashboard-summary";
import { aggregateStatusCounts, toFrontendOrderStatus, toFrontendPaymentStatus } from "@/lib/api/order-status-map";
import type { Order } from "@/types";

export default function DashboardPage() {
  const [dateRange, setDateRange] = React.useState<DateRangeValue>("last30");
  const { data, error } = useDashboardSummary();

  const statusCounts = data ? aggregateStatusCounts(data.orderStatusBreakdown) : undefined;

  const recentOrders: Order[] | undefined = data?.recentOrders.map((o) => ({
    id: o.orderNumber,
    customerId: "",
    customerName: o.customerName,
    customerAvatar:
      o.customerAvatar ??
      o.customerName
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join(""),
    sellerName: o.sellerName,
    channel: o.channel === "SELLER" ? "seller" : "in_house",
    date: o.date,
    productCount: o.productCount,
    total: o.total,
    paymentStatus: toFrontendPaymentStatus(o.paymentStatus),
    deliveryStatus: "pending",
    status: toFrontendOrderStatus(o.status),
  }));

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <DashboardHeader dateRange={dateRange} onDateRangeChange={setDateRange} />

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-[#92640a] dark:text-warning">
          <WifiOff className="size-4 shrink-0" />
          Live API unreachable ({error}) — showing representative sample data instead.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CustomerCard total={data?.kpis.totalCustomers} newThisMonth={data?.kpis.newCustomers} />
        <ProductStatsCard
          total={data?.kpis.totalProducts}
          active={data ? data.kpis.totalProducts - data.kpis.outOfStockProducts : undefined}
          outOfStock={data?.kpis.outOfStockProducts}
        />
        <SalesCard />
        <SellerCard
          total={data ? data.kpis.activeSellers + data.kpis.pendingSellerApprovals : undefined}
          approved={data?.kpis.activeSellers}
          pending={data?.kpis.pendingSellerApprovals}
          topSellers={data?.topSellers}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CategoryStatsCard topCategories={data?.topCategories} />
        <BrandStatsCard topBrands={data?.topBrands} />
      </div>

      <MiniStatRow
        totalOrders={data?.kpis.totalOrders}
        netRevenue={data?.kpis.netRevenue}
        avgOrderValue={data?.kpis.avgOrderValue}
        refundRate={data?.kpis.refundRate}
        lowStock={data?.kpis.lowStockProducts}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <OrdersOverview statusCounts={statusCounts} total={data?.kpis.totalOrders} fulfillmentRate={data?.kpis.fulfillmentRate} />
        </div>
        <div className="xl:col-span-3">
          <SalesChart />
        </div>
      </div>

      <TopCategoriesProducts
        topCategories={data?.topCategories}
        topProducts={data?.topProducts}
        totalProducts={data?.kpis.totalProducts}
      />

      <RecentOrdersTable orders={recentOrders} />

      <AdditionalSections />
    </div>
  );
}
