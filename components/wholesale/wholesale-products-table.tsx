"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  MoreHorizontal,
  PackageSearch,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { api, ApiError } from "@/lib/api/client";
import type { WholesaleProductRow } from "./types";

type ColumnKey = "product" | "sku" | "category" | "brand" | "collection" | "stock" | "moq" | "packaging" | "price" | "status" | "created" | "updated";
type SortKey = "name" | "sku" | "stock" | "wholesalePrice" | "createdAt" | "updatedAt";

const columns: { key: ColumnKey; label: string }[] = [
  { key: "product", label: "Product" }, { key: "sku", label: "SKU" }, { key: "category", label: "Category" },
  { key: "brand", label: "Brand" }, { key: "collection", label: "Collection" }, { key: "stock", label: "Stock" },
  { key: "moq", label: "MOQ" }, { key: "packaging", label: "Packaging" }, { key: "price", label: "Wholesale price" },
  { key: "status", label: "Status" }, { key: "created", label: "Created" }, { key: "updated", label: "Updated" },
];

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  PUBLISHED: "success", APPROVED: "success", DRAFT: "secondary", PENDING_REVIEW: "warning", ARCHIVED: "secondary",
  OUT_OF_STOCK: "destructive", DISABLED: "warning", REJECTED: "destructive",
};

export function WholesaleProductsTable({ initialProducts }: { initialProducts: WholesaleProductRow[] }) {
  const router = useRouter();
  const [products, setProducts] = React.useState(initialProducts);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [category, setCategory] = React.useState("all");
  const [stock, setStock] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("updatedAt");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState("10");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = React.useState<WholesaleProductRow | null>(null);
  const [visibleColumns, setVisibleColumns] = React.useState<Set<ColumnKey>>(new Set(columns.map((c) => c.key)));

  const categories = React.useMemo(() => Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean) as string[])).sort(), [products]);
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !q || [p.name, p.sku, p.category?.name, p.brand?.name].some((value) => value?.toLowerCase().includes(q)))
      .filter((p) => status === "all" || p.status === status)
      .filter((p) => category === "all" || p.category?.name === category)
      .filter((p) => stock === "all" || (stock === "in" ? p.stock > 10 : stock === "low" ? p.stock > 0 && p.stock <= 10 : p.stock === 0))
      .sort((a, b) => {
        const av = sortKey === "wholesalePrice" ? Number(a.wholesalePrice ?? 0) : a[sortKey];
        const bv = sortKey === "wholesalePrice" ? Number(b.wholesalePrice ?? 0) : b[sortKey];
        const result = typeof av === "number" ? av - Number(bv) : String(av).localeCompare(String(bv));
        return sortDirection === "asc" ? result : -result;
      });
  }, [products, query, status, category, stock, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / Number(pageSize)));
  const paged = filtered.slice((page - 1) * Number(pageSize), page * Number(pageSize));
  const allPageSelected = paged.length > 0 && paged.every((product) => selected.has(product.id));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDirection((current) => current === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDirection("asc"); }
  }

  function download(format: "csv" | "xls") {
    const rows = filtered.map((p) => [p.name, p.sku, p.category?.name ?? "", p.brand?.name ?? "", p.wholesaleConfig?.collection ?? "", p.stock, p.wholesaleConfig?.moq ?? 1, p.wholesaleConfig?.packagingUnit ?? "Piece", p.wholesalePrice ?? p.regularPrice, p.status, p.createdAt, p.updatedAt]);
    const headers = ["Product", "SKU", "Category", "Brand", "Collection", "Stock", "MOQ", "Packaging", "Wholesale Price", "Status", "Created", "Updated"];
    const body = format === "csv"
      ? [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")
      : `<table><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</table>`;
    const blob = new Blob([body], { type: format === "csv" ? "text/csv;charset=utf-8" : "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); link.download = `wholesale-products.${format}`; link.click(); URL.revokeObjectURL(link.href);
    toast.success(`${format.toUpperCase()} export downloaded`);
  }

  async function updateStatus(ids: string[], nextStatus: string) {
    try {
      await Promise.all(ids.map((id) => api.patch(`/commerce/products/${id}`, { status: nextStatus })));
      setProducts((current) => current.map((p) => ids.includes(p.id) ? { ...p, status: nextStatus } : p));
      setSelected(new Set()); toast.success(`${ids.length} product${ids.length === 1 ? "" : "s"} updated`);
    } catch (error) { toast.error(error instanceof ApiError ? error.message : "Bulk action failed"); }
  }

  async function duplicate(product: WholesaleProductRow) {
    try {
      const copy = await api.post<WholesaleProductRow>("/commerce/products", {
        name: `${product.name} Copy`, slug: `${product.slug}-copy-${Date.now().toString().slice(-5)}`, sku: `${product.sku}-COPY-${Date.now().toString().slice(-4)}`,
        type: "WHOLESALE", status: "DRAFT", categoryId: product.categoryId ?? undefined, brandId: product.brandId ?? undefined,
        regularPrice: Number(product.regularPrice), wholesalePrice: Number(product.wholesalePrice ?? product.regularPrice), stock: product.stock,
        wholesaleConfig: product.wholesaleConfig ?? undefined,
      });
      setProducts((current) => [{ ...copy, category: product.category, brand: product.brand, images: product.images }, ...current]);
      toast.success("Wholesale product duplicated");
    } catch (error) { toast.error(error instanceof ApiError ? error.message : "Could not duplicate product"); }
  }

  const renderSortHeader = (label: string, field: SortKey) => (
    <button type="button" onClick={() => toggleSort(field)} className="inline-flex items-center gap-1.5 hover:text-foreground">
      {label}<ArrowUpDown className={cn("size-3.5", sortKey === field && "text-primary")} />
    </button>
  );

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1 xl:max-w-sm">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search products, SKU, brand…" className="ps-9" />
          </div>
          <Select value={category} onValueChange={(value) => { setCategory(value); setPage(1); }}><SelectTrigger className="w-full sm:w-[165px]"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}><SelectTrigger className="w-full sm:w-[145px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{["PUBLISHED", "DRAFT", "PENDING_REVIEW", "ARCHIVED", "OUT_OF_STOCK"].map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select>
          <Select value={stock} onValueChange={(value) => { setStock(value); setPage(1); }}><SelectTrigger className="w-full sm:w-[135px]"><Filter className="size-3.5" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All stock</SelectItem><SelectItem value="in">In stock</SelectItem><SelectItem value="low">Low stock</SelectItem><SelectItem value="out">Out of stock</SelectItem></SelectContent></Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Columns3 className="size-4" />Columns</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Visible columns</DropdownMenuLabel>{columns.map((column) => <DropdownMenuCheckboxItem key={column.key} checked={visibleColumns.has(column.key)} onCheckedChange={(checked) => setVisibleColumns((current) => { const next = new Set(current); if (checked) next.add(column.key); else next.delete(column.key); return next; })}>{column.label}</DropdownMenuCheckboxItem>)}</DropdownMenuContent></DropdownMenu>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Download className="size-4" />Export</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => download("csv")}><Download />Export CSV</DropdownMenuItem><DropdownMenuItem onClick={() => download("xls")}><FileSpreadsheet />Export Excel</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </div>

      {selected.size > 0 && <div className="flex flex-wrap items-center gap-2 border-b border-primary/20 bg-primary/[0.05] px-4 py-2.5"><span className="text-sm font-semibold text-primary">{selected.size} selected</span><Button size="sm" variant="outline" onClick={() => updateStatus(Array.from(selected), "PUBLISHED")}>Set active</Button><Button size="sm" variant="outline" onClick={() => updateStatus(Array.from(selected), "ARCHIVED")}><Archive className="size-3.5" />Archive</Button><Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button></div>}

      {filtered.length === 0 ? <EmptyState icon={PackageSearch} title="No wholesale products found" description="Adjust your filters or add your first wholesale product." action={<Button onClick={() => router.push("/admin/products/wholesale/new")}><Plus className="size-4" />Add wholesale product</Button>} /> : (
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-10"><Checkbox aria-label="Select current page" checked={allPageSelected} onCheckedChange={(checked) => setSelected((current) => { const next = new Set(current); paged.forEach((p) => { if (checked) next.add(p.id); else next.delete(p.id); }); return next; })} /></TableHead>
            {visibleColumns.has("product") && <TableHead>{renderSortHeader("Product", "name")}</TableHead>}
            {visibleColumns.has("sku") && <TableHead>{renderSortHeader("SKU", "sku")}</TableHead>}
            {visibleColumns.has("category") && <TableHead>Category</TableHead>}{visibleColumns.has("brand") && <TableHead>Brand</TableHead>}{visibleColumns.has("collection") && <TableHead>Collection</TableHead>}
            {visibleColumns.has("stock") && <TableHead>{renderSortHeader("Stock", "stock")}</TableHead>}{visibleColumns.has("moq") && <TableHead>MOQ</TableHead>}{visibleColumns.has("packaging") && <TableHead>Packaging</TableHead>}
            {visibleColumns.has("price") && <TableHead>{renderSortHeader("Wholesale price", "wholesalePrice")}</TableHead>}{visibleColumns.has("status") && <TableHead>Status</TableHead>}
            {visibleColumns.has("created") && <TableHead>{renderSortHeader("Created", "createdAt")}</TableHead>}{visibleColumns.has("updated") && <TableHead>{renderSortHeader("Updated", "updatedAt")}</TableHead>}<TableHead className="w-14 text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>{paged.map((product) => { const image = product.images?.[0]?.url; const config = product.wholesaleConfig; return <TableRow key={product.id} data-state={selected.has(product.id) ? "selected" : undefined}>
            <TableCell><Checkbox aria-label={`Select ${product.name}`} checked={selected.has(product.id)} onCheckedChange={(checked) => setSelected((current) => { const next = new Set(current); if (checked) next.add(product.id); else next.delete(product.id); return next; })} /></TableCell>
            {visibleColumns.has("product") && <TableCell><div className="flex items-center gap-3">{image ? <img src={image} alt="" className="size-10 rounded-[10px] border border-border object-cover" /> : <span className="flex size-10 items-center justify-center rounded-[10px] bg-primary/10 text-xs font-bold text-primary">{product.name.slice(0, 2).toUpperCase()}</span>}<div><p className="max-w-[220px] truncate font-semibold">{product.name}</p><p className="text-xs text-muted-foreground">{config?.visibility ?? "Business accounts"}</p></div></div></TableCell>}
            {visibleColumns.has("sku") && <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>}{visibleColumns.has("category") && <TableCell>{product.category?.name ?? "—"}</TableCell>}{visibleColumns.has("brand") && <TableCell>{product.brand?.name ?? "—"}</TableCell>}{visibleColumns.has("collection") && <TableCell>{config?.collection || "—"}</TableCell>}
            {visibleColumns.has("stock") && <TableCell><span className={cn("font-semibold", product.stock <= 10 && "text-destructive")}>{formatNumber(product.stock)}</span></TableCell>}{visibleColumns.has("moq") && <TableCell>{config?.moq ?? 1}</TableCell>}{visibleColumns.has("packaging") && <TableCell>{config?.unitsPerPackage ?? 1} / {config?.packagingUnit ?? "Piece"}</TableCell>}
            {visibleColumns.has("price") && <TableCell className="font-semibold">{formatCurrency(Number(product.wholesalePrice ?? product.regularPrice))}</TableCell>}{visibleColumns.has("status") && <TableCell><Badge variant={statusVariant[product.status] ?? "secondary"}>{product.status.replaceAll("_", " ")}</Badge></TableCell>}
            {visibleColumns.has("created") && <TableCell className="text-muted-foreground">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(product.createdAt))}</TableCell>}{visibleColumns.has("updated") && <TableCell className="text-muted-foreground">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(product.updatedAt))}</TableCell>}
            <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${product.name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => router.push(`/admin/products/wholesale/${product.id}`)}><Eye />View details</DropdownMenuItem><DropdownMenuItem onClick={() => router.push(`/admin/products/wholesale/${product.id}`)}><Pencil />Edit product</DropdownMenuItem><DropdownMenuItem onClick={() => duplicate(product)}><Copy />Duplicate</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => updateStatus([product.id], "ARCHIVED")}><Archive />Archive</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(product)}><Trash2 />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
          </TableRow>; })}</TableBody>
        </Table>
      )}
      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">Showing {filtered.length ? (page - 1) * Number(pageSize) + 1 : 0}–{Math.min(page * Number(pageSize), filtered.length)} of {filtered.length} products</p><div className="flex items-center gap-2"><Select value={pageSize} onValueChange={(value) => { setPageSize(value); setPage(1); }}><SelectTrigger className="h-8 w-[105px]"><SelectValue /></SelectTrigger><SelectContent>{[10, 20, 50].map((size) => <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>)}</SelectContent></Select><Button variant="outline" size="icon-sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft className="size-4" /></Button><span className="min-w-16 text-center text-xs font-medium">{page} / {totalPages}</span><Button variant="outline" size="icon-sm" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}><ChevronRight className="size-4" /></Button></div></div>
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} title={`Delete “${deleteTarget?.name}”?`} description="This permanently removes the product and its wholesale configuration. This cannot be undone." onConfirm={async () => { if (!deleteTarget) return; try { await api.delete(`/commerce/products/${deleteTarget.id}`); setProducts((current) => current.filter((p) => p.id !== deleteTarget.id)); toast.success("Product deleted"); } catch (error) { toast.error(error instanceof ApiError ? error.message : "Delete failed"); } }} />
    </Card>
  );
}
