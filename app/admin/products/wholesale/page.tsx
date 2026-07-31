"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Boxes, CircleDollarSign, PackageCheck, Plus, TrendingUp } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { WholesaleProductsTable } from "@/components/wholesale/wholesale-products-table";
import { WholesaleDirectory } from "@/components/wholesale/wholesale-directory";
import type { WholesaleProductRow } from "@/components/wholesale/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function WholesaleProductsPage() {
  const router = useRouter();
  const [products, setProducts] = React.useState<WholesaleProductRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api.get<{ data: WholesaleProductRow[] }>("/commerce/products?limit=100&sortBy=updatedAt&sortOrder=desc")
      .then((response) => setProducts(response.data.filter((product) => product.type === "WHOLESALE" || product.wholesalePrice !== null)))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to load wholesale catalog"))
      .finally(() => setLoading(false));
  }, []);

  const totalValue = products.reduce((sum, product) => sum + product.stock * Number(product.wholesalePrice ?? product.regularPrice), 0);
  const active = products.filter((product) => ["PUBLISHED", "APPROVED"].includes(product.status)).length;
  const lowStock = products.filter((product) => product.stock <= (product.wholesaleConfig?.lowStockAlert ?? 10)).length;
  const averageMoq = products.length ? Math.round(products.reduce((sum, product) => sum + (product.wholesaleConfig?.moq ?? 1), 0) / products.length) : 0;
  const stats = [
    { label: "Wholesale products", value: formatNumber(products.length), detail: `${active} active`, icon: Boxes, tone: "text-primary bg-primary/10" },
    { label: "Inventory value", value: formatCurrency(totalValue), detail: "At wholesale price", icon: CircleDollarSign, tone: "text-success bg-success/10" },
    { label: "Average MOQ", value: formatNumber(averageMoq), detail: "Units per order", icon: PackageCheck, tone: "text-accent bg-accent/10" },
    { label: "Needs attention", value: formatNumber(lowStock), detail: "Low or out of stock", icon: AlertTriangle, tone: "text-warning bg-warning/10" },
  ];

  return <div className="mx-auto flex max-w-[1800px] flex-col gap-6 pb-10">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><TrendingUp className="size-3.5" />B2B Commerce</div><h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Wholesale Products</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Manage volume pricing, packaging, business visibility, inventory, and fulfillment from one scalable workspace.</p></div><Button size="lg" onClick={() => router.push("/admin/products/wholesale/new")}><Plus className="size-4" />Add wholesale product</Button></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => { const Icon = stat.icon; return <Card key={stat.label} className="flex items-center gap-4 p-4 shadow-sm"><span className={`flex size-11 items-center justify-center rounded-xl ${stat.tone}`}><Icon className="size-5" /></span><div><p className="text-xs font-medium text-muted-foreground">{stat.label}</p><p className="mt-0.5 text-xl font-bold tracking-tight">{stat.value}</p><p className="text-[11px] text-muted-foreground">{stat.detail}</p></div></Card>; })}</div>
    <Tabs defaultValue="products" className="space-y-4"><div className="overflow-x-auto"><TabsList className="min-w-max"><TabsTrigger value="products">All Products</TabsTrigger><TabsTrigger value="categories">Categories</TabsTrigger><TabsTrigger value="brands">Brands</TabsTrigger><TabsTrigger value="collections">Collections</TabsTrigger></TabsList></div><TabsContent value="products">{loading ? <TableSkeleton rows={8} cols={10} /> : error ? <EmptyState title="Wholesale catalog unavailable" description={error} /> : <WholesaleProductsTable initialProducts={products} />}</TabsContent><TabsContent value="categories"><WholesaleDirectory kind="category" /></TabsContent><TabsContent value="brands"><WholesaleDirectory kind="brand" /></TabsContent><TabsContent value="collections"><WholesaleDirectory kind="collection" /></TabsContent></Tabs>
  </div>;
}
