import * as React from "react";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const iconTone = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-[#92640a] dark:text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

interface StatCardProps {
  icon: LucideIcon;
  tone?: keyof typeof iconTone;
  title: string;
  value: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function StatCard({
  icon: Icon,
  tone = "primary",
  title,
  value,
  trend,
  trendLabel,
  children,
  footer,
  className,
}: StatCardProps) {
  const positive = (trend ?? 0) >= 0;
  return (
    <Card className={cn("flex flex-col gap-4 p-5 transition-shadow hover:shadow-soft-lg", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className={cn("flex size-10 items-center justify-center rounded-[11px]", iconTone[tone])}>
          <Icon className="size-[19px]" />
        </div>
        {typeof trend === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold",
              positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}
          >
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 font-display text-[26px] font-bold leading-none tracking-tight">{value}</p>
        {trendLabel && <p className="mt-1.5 text-xs text-muted-foreground">{trendLabel}</p>}
      </div>

      {children}
      {footer}
    </Card>
  );
}
