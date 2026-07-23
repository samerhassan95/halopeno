"use client";

import * as React from "react";
import { RefreshCw, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ReportRange } from "@/lib/hooks/use-report";

const RANGE_LABELS: Record<ReportRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "365d": "Last 12 months",
};

export function ReportHeader({
  title,
  subtitle,
  range,
  onRangeChange,
  onRefresh,
}: {
  title: string;
  subtitle: string;
  range: ReportRange;
  onRangeChange: (v: ReportRange) => void;
  onRefresh: () => void;
}) {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 700);
  };

  const handleExport = (format: "CSV" | "PDF") => {
    toast.success(`Report exported as ${format}`, { description: "You'll get a download link shortly." });
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">{title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={range} onValueChange={(v) => onRangeChange(v as ReportRange)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RANGE_LABELS) as ReportRange[]).map((r) => (
              <SelectItem key={r} value={r}>
                {RANGE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Refresh">
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => handleExport("CSV")}>
          <Download className="size-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => handleExport("PDF")}>
          <FileText className="size-4" />
          <span className="hidden sm:inline">PDF</span>
        </Button>
      </div>
    </div>
  );
}
