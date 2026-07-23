"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, MoreHorizontal, Eye, Truck, Ban, Download } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { useI18n } from "@/lib/i18n/context";
import { formatCurrency } from "@/lib/utils";
import { recentOrders as allOrders } from "@/lib/mock-data";
import type { Order, OrderStatus } from "@/types";
import { toast } from "sonner";

const statusVariant: Record<OrderStatus, "success" | "warning" | "destructive" | "secondary" | "default"> = {
  pending: "warning",
  confirmed: "default",
  processing: "secondary",
  shipped: "default",
  delivered: "success",
  cancelled: "destructive",
  returned: "warning",
  refunded: "destructive",
};

const paymentVariant = {
  paid: "success",
  unpaid: "warning",
  partial: "secondary",
  refunded: "destructive",
} as const;

const filters: (OrderStatus | "all")[] = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

export function RecentOrdersTable({ orders }: { orders?: Order[] } = {}) {
  const { t } = useI18n();
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "all">("all");
  const [page, setPage] = React.useState(1);
  const [cancelTarget, setCancelTarget] = React.useState<Order | null>(null);
  const pageSize = 6;
  const source = orders ?? allOrders;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return source.filter((o) => {
      const matchesQuery =
        !q || o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [search, statusFilter, source]);

  React.useEffect(() => setPage(1), [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 pb-4">
        <CardTitle>{t("dashboard.recentOrders.title")}</CardTitle>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => toast.success("Orders exported to CSV")}
          >
            <Download className="size-4" />
            {t("common.export")}
          </Button>
        </CardAction>
      </CardHeader>

      <div className="flex flex-col gap-3 border-y border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.search")}
            className="h-9 ps-8 text-sm"
          />
        </div>
        <div className="scrollbar-thin flex gap-1.5 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                (statusFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/70")
              }
            >
              {f === "all" ? t("common.all") : t(`dashboard.orders.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dashboard.recentOrders.orderId")}</TableHead>
              <TableHead>{t("dashboard.recentOrders.customer")}</TableHead>
              <TableHead>{t("dashboard.recentOrders.seller")}</TableHead>
              <TableHead>{t("dashboard.recentOrders.date")}</TableHead>
              <TableHead>{t("dashboard.recentOrders.products")}</TableHead>
              <TableHead>{t("dashboard.recentOrders.total")}</TableHead>
              <TableHead>{t("dashboard.recentOrders.payment")}</TableHead>
              <TableHead>{t("dashboard.recentOrders.status")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium text-primary">{o.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-secondary text-[10px]">{o.customerAvatar}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[120px] truncate">{o.customerName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{o.sellerName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(o.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </TableCell>
                <TableCell>{o.productCount}</TableCell>
                <TableCell className="font-medium">{formatCurrency(o.total)}</TableCell>
                <TableCell>
                  <Badge variant={paymentVariant[o.paymentStatus]}>{o.paymentStatus}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[o.status]}>{o.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => router.push("/admin/orders/all")}>
                        <Eye /> {t("common.view")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.success(`Order ${o.id} marked as shipped`)}>
                        <Truck /> Mark shipped
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setCancelTarget(o)}>
                        <Ban /> Cancel order
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-border p-4">
          <p className="text-xs text-muted-foreground">
            {t("common.showingResults", {
              from: (page - 1) * pageSize + 1,
              to: Math.min(page * pageSize, filtered.length),
              total: filtered.length,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              {t("common.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title={`Cancel order ${cancelTarget?.id}?`}
        description="The customer will be notified and any payment will be refunded automatically."
        confirmLabel="Cancel order"
        onConfirm={() => toast.success(`Order ${cancelTarget?.id} cancelled`)}
      />
    </Card>
  );
}
