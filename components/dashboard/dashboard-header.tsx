"use client";

import * as React from "react";
import { RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { DateRangeFilter, type DateRangeValue } from "./date-range-filter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function DashboardHeader({
  dateRange,
  onDateRangeChange,
}: {
  dateRange: DateRangeValue;
  onDateRangeChange: (v: DateRangeValue) => void;
}) {
  const { t, locale } = useI18n();
  const [refreshing, setRefreshing] = React.useState(false);

  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(today);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success("Dashboard refreshed");
    }, 900);
  };

  const handleExport = () => {
    toast.success("Report export started", { description: "You'll get a download link shortly." });
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">
          {t("dashboard.title")}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2.5">
        <p className="hidden text-sm text-muted-foreground lg:block">{formattedDate}</p>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={dateRange} onChange={onDateRangeChange} />
          <Button variant="outline" size="icon" onClick={handleRefresh} aria-label={t("dashboard.refresh")}>
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="size-4" />
            <span className="hidden sm:inline">{t("dashboard.export")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
