"use client";

import { CalendarDays } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";

export type DateRangeValue = "today" | "last7" | "last30" | "thisYear" | "custom";

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}) {
  const { t } = useI18n();

  return (
    <Select value={value} onValueChange={(v) => onChange(v as DateRangeValue)}>
      <SelectTrigger className="w-[168px] gap-2">
        <CalendarDays className="size-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="today">{t("dashboard.dateRange.today")}</SelectItem>
        <SelectItem value="last7">{t("dashboard.dateRange.last7")}</SelectItem>
        <SelectItem value="last30">{t("dashboard.dateRange.last30")}</SelectItem>
        <SelectItem value="thisYear">{t("dashboard.dateRange.thisYear")}</SelectItem>
        <SelectItem value="custom">{t("dashboard.dateRange.custom")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
