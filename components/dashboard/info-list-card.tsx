import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/lib/utils";

export interface InfoListRow {
  id: string;
  leading: React.ReactNode;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function InfoListCard({
  title,
  icon: Icon,
  rows,
  viewAllHref,
  viewAllLabel,
  emptyLabel,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  rows: InfoListRow[];
  viewAllHref?: string;
  viewAllLabel?: string;
  emptyLabel?: string;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          {title}
        </CardTitle>
        {viewAllHref && (
          <CardAction>
            <Link href={viewAllHref} className="text-xs font-medium text-primary hover:underline">
              {viewAllLabel ?? "View all"}
            </Link>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex-1 pt-3">
        {rows.length === 0 ? (
          <EmptyState title={emptyLabel ?? "Nothing here yet"} />
        ) : (
          <div className="space-y-1">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-3 rounded-[10px] px-1.5 py-2 transition-colors hover:bg-secondary/50">
                <div className="shrink-0">{row.leading}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.primary}</p>
                  {row.secondary && <p className="truncate text-xs text-muted-foreground">{row.secondary}</p>}
                </div>
                {row.trailing && <div className="shrink-0 text-right">{row.trailing}</div>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
