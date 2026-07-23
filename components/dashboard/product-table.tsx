"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, MoreHorizontal, Search, Eye, Pencil, Trash2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { useI18n } from "@/lib/i18n/context";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { api, ApiError } from "@/lib/api/client";
import type { Product, ProductStatus } from "@/types";
import { toast } from "sonner";

const statusVariant: Record<ProductStatus, "success" | "warning" | "destructive" | "secondary"> = {
  active: "success",
  draft: "secondary",
  out_of_stock: "destructive",
  inactive: "warning",
};

type SortKey = "name" | "qtySold" | "stock" | "price" | "revenue";

export function ProductTable({ products }: { products: Product[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("revenue");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(new Set());
  const pageSize = 6;

  const visibleProducts = React.useMemo(
    () => products.filter((p) => !hiddenIds.has(p.id)),
    [products, hiddenIds],
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? visibleProducts.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      : visibleProducts;
    const sorted = [...base].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [products, search, sortKey, sortDir]);

  React.useEffect(() => setPage(1), [search, products]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortHead = ({ label, sortField }: { label: string; sortField: SortKey }) => (
    <TableHead>
      <button
        onClick={() => toggleSort(sortField)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        <ArrowUpDown className={cn("size-3", sortKey === sortField && "text-primary")} />
      </button>
    </TableHead>
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.search")}
            className="h-9 ps-8 text-sm"
          />
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">
          {t("common.showingResults", {
            from: filtered.length === 0 ? 0 : (page - 1) * pageSize + 1,
            to: Math.min(page * pageSize, filtered.length),
            total: filtered.length,
          })}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortHead label={t("dashboard.table.product")} sortField="name" />
              <TableHead>{t("dashboard.table.sku")}</TableHead>
              <TableHead>{t("dashboard.table.seller")}</TableHead>
              <TableHead>{t("dashboard.table.category")}</TableHead>
              <SortHead label={t("dashboard.table.qtySold")} sortField="qtySold" />
              <SortHead label={t("dashboard.table.stock")} sortField="stock" />
              <SortHead label={t("dashboard.table.price")} sortField="price" />
              <SortHead label={t("dashboard.table.revenue")} sortField="revenue" />
              <TableHead>{t("dashboard.table.status")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    {p.image && (p.image.startsWith("http") || p.image.startsWith("/")) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="size-8 shrink-0 rounded-[8px] object-cover" />
                    ) : (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-secondary text-xs font-bold">
                        {p.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="max-w-[180px] truncate font-medium">{p.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                <TableCell>{p.sellerName}</TableCell>
                <TableCell>{p.categoryName}</TableCell>
                <TableCell>{formatNumber(p.qtySold)}</TableCell>
                <TableCell className={cn(p.stock <= 15 && "font-semibold text-destructive")}>
                  {formatNumber(p.stock)}
                </TableCell>
                <TableCell>{formatCurrency(p.price)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(p.revenue)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[p.status]}>{p.status.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => router.push("/admin/products/all")}>
                        <Eye /> {t("common.view")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/admin/products/all")}>
                        <Pencil /> {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(p)}>
                        <Trash2 /> {t("common.delete")}
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
          <p className="text-xs text-muted-foreground sm:hidden">
            {page}/{totalPages}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              {t("common.previous")}
            </Button>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {page} / {totalPages}
            </span>
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
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will permanently remove the product from your catalog. This action cannot be undone."
        confirmLabel={deleting ? "Deleting…" : t("common.delete")}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          try {
            await api.delete(`/commerce/products/${deleteTarget.id}`);
            setHiddenIds((prev) => new Set(prev).add(deleteTarget.id));
            toast.success(`${deleteTarget.name} deleted`);
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Failed to delete product");
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
