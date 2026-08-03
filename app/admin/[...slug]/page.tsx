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
import { RefundsManager } from "@/components/resource/refunds-manager";
import { PreordersManager } from "@/components/resource/preorders-manager";
import { AbandonedCartsManager } from "@/components/resource/abandoned-carts-manager";
import { TransactionsManager } from "@/components/resource/transactions-manager";
import { InvoicesManager } from "@/components/resource/invoices-manager";
import { SellersManager } from "@/components/resource/sellers-manager";
import { DeliveryAgentsManager } from "@/components/resource/delivery-agents-manager";
import { SellerVerificationManager } from "@/components/resource/seller-verification-manager";
import { PayoutRequestsManager } from "@/components/resource/payout-requests-manager";
import { SellerSettlementsManager } from "@/components/resource/seller-settlements-manager";
import { CustomerGroupsManager } from "@/components/resource/customer-groups-manager";
import { ShippingZonesManager } from "@/components/resource/shipping-zones-manager";
import { ShippingRatesManager } from "@/components/resource/shipping-rates-manager";
import { CourierCompaniesManager } from "@/components/resource/courier-companies-manager";
import { PickupPointsManager } from "@/components/resource/pickup-points-manager";
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
    if (config.route === "refunds") return <RefundsManager />;
    if (config.route === "preorders") return <PreordersManager />;
    if (config.route === "abandoned-carts") return <AbandonedCartsManager />;
    if (config.route === "transactions") return <TransactionsManager />;
    if (config.route === "invoices") return <InvoicesManager />;
    if (config.route === "sellers") return <SellersManager />;
    if (config.route === "delivery-agents") return <DeliveryAgentsManager />;
    if (config.route === "sellers/verification") return <SellerVerificationManager />;
    if (config.route === "sellers/payouts") return <PayoutRequestsManager />;
    if (config.route === "sellers/settlements") return <SellerSettlementsManager />;
    if (config.route === "customer-groups") return <CustomerGroupsManager />;
    if (config.route === "shipping/zones") return <ShippingZonesManager />;
    if (config.route === "shipping/rates") return <ShippingRatesManager />;
    if (config.route === "shipping/carriers") return <CourierCompaniesManager />;
    if (config.route === "shipping/pickup-locations") return <PickupPointsManager />;
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
