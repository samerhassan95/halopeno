"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/context";
import { CategoryCarousel } from "./category-carousel";
import { ProductTable } from "./product-table";
import { products as mockProducts } from "@/lib/mock-data";
import type { Product } from "@/types";

type TimeFilter = "today" | "week" | "month" | "all";

interface TopCategoriesProductsProps {
  topCategories?: { id: string; name: string; revenue: number; productCount: number }[];
  topProducts?: Product[];
  totalProducts?: number;
}

export function TopCategoriesProducts({ topCategories, topProducts, totalProducts }: TopCategoriesProductsProps = {}) {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [timeFilter, setTimeFilter] = React.useState<TimeFilter>("month");
  const products = topProducts ?? mockProducts;

  const filteredProducts = React.useMemo(() => {
    if (!activeCategory) return products;
    return products.filter((p) => p.categoryId === activeCategory);
  }, [activeCategory, products]);

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 pb-4">
        <div>
          <CardTitle>{t("dashboard.topCategories.title")}</CardTitle>
          <CardDescription className="mt-1">{t("dashboard.topCategories.subtitle")}</CardDescription>
        </div>
        <CardAction>
          <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
            <TabsList>
              <TabsTrigger value="today">{t("common.today")}</TabsTrigger>
              <TabsTrigger value="week">{t("common.week")}</TabsTrigger>
              <TabsTrigger value="month">{t("common.month")}</TabsTrigger>
              <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-2">
        <CategoryCarousel
          activeId={activeCategory}
          onSelect={setActiveCategory}
          categories={topCategories}
          totalProducts={totalProducts}
        />
      </CardContent>

      <ProductTable products={filteredProducts} />
    </Card>
  );
}
