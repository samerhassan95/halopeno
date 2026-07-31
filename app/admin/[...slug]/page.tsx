"use client";

import { use } from "react";
import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { ResourceListPage } from "@/components/resource/resource-list-page";
import { AttributeValuesManager } from "@/components/resource/attribute-values-manager";
import { ProductTaxesManager } from "@/components/resource/product-taxes-manager";
import { ProductStockManager } from "@/components/resource/product-stock-manager";
import { StockTransfersManager } from "@/components/resource/stock-transfers-manager";
import { StockAdjustmentsManager } from "@/components/resource/stock-adjustments-manager";
import { StockCountsManager } from "@/components/resource/stock-counts-manager";
import { ProductBatchesManager } from "@/components/resource/product-batches-manager";
import { OrdersManager } from "@/components/resource/orders-manager";
import { InHouseOrdersManager } from "@/components/resource/in-house-orders-manager";
import { SellerOrdersManager } from "@/components/resource/seller-orders-manager";
import { findResourcePage } from "@/lib/resource-pages";

function titleCase(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function PlaceholderPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = use(params);
  const label = slug.map(titleCase).join(" / ");

  const config = findResourcePage(slug.join("/"));
  if (config) {
    if (config.route === "colors") return <AttributeValuesManager />;
    if (config.route === "taxes") return <ProductTaxesManager />;
    if (config.route === "stock") return <ProductStockManager />;
    if (config.route === "inventory/stock-transfers") return <StockTransfersManager />;
    if (config.route === "inventory/stock-adjustments") return <StockAdjustmentsManager />;
    if (config.route === "inventory/stock-counts") return <StockCountsManager />;
    if (config.route === "inventory/product-batches") return <ProductBatchesManager />;
    if (config.route === "orders/all") return <OrdersManager />;
    if (config.route === "orders/in-house") return <InHouseOrdersManager />;
    if (config.route === "orders/seller") return <SellerOrdersManager />;
    return <ResourceListPage config={config} />;
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight">{label}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">This section is part of the Vantage information architecture.</p>
      </div>
      <Card>
        <EmptyState
          icon={Construction}
          title={`${label} is under construction`}
          description="This page is wired into navigation and ready for its dedicated view — the dashboard overview is the fully built reference page."
          className="py-20"
        />
      </Card>
    </div>
  );
}
