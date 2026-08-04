"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, MoreHorizontal, Eye, Pencil, Trash2, Plus, WifiOff, Download } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { StatusBadge } from "@/components/resource/status-badge";
import { ResourceFormDialog } from "@/components/resource/resource-form-dialog";
import { ResourceViewDialog } from "@/components/resource/resource-view-dialog";
import { BrandDialog, type BrandItem } from "@/components/wholesale/brand-dialog";
import { CategoryDialog, type CategoryItem } from "@/components/wholesale/category-dialog";
import { CollectionDialog, type CollectionItem } from "@/components/wholesale/collection-dialog";
import { AttributeDialog, type AttributeItem } from "@/components/resource/attribute-dialog";
import { WarehouseDialog, type WarehouseItem } from "@/components/resource/warehouse-dialog";
import { useResourceList } from "@/lib/hooks/use-resource-list";
import { api, ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { toCsv, downloadCsv } from "@/lib/csv-export";
import { useI18n } from "@/lib/i18n/context";
import { useAdminColumnLabel, useAdminPageCopy, useAdminTr } from "@/lib/i18n/admin-tr";
import type { ResourcePageConfig, ResourceField } from "@/lib/resource-pages";

/** Falls back to an editable field per column when a config has no explicit create/update fields. */
function fieldsFromColumns(columns: ResourcePageConfig["columns"]): ResourceField[] {
  return columns
    .filter((col) => col.key !== "id")
    .map((col) => ({
      key: col.key,
      label: col.label,
      type: col.type === "boolean" ? "checkbox" : col.type === "number" || col.type === "currency" ? "number" : "text",
    }));
}

type Row = Record<string, unknown>;

function renderCell(
  row: Row,
  key: string,
  type: string | undefined,
  yesLabel: string,
  noLabel: string
) {
  const value = row[key];
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  switch (type) {
    case "currency":
      return formatCurrency(Number(value));
    case "number":
      return Number(value).toLocaleString();
    case "date":
      return new Date(String(value)).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    case "boolean":
      return value ? yesLabel : noLabel;
    case "badge":
      return <StatusBadge value={value} />;
    default:
      return <span className="max-w-[240px] truncate">{String(value)}</span>;
  }
}

export function ResourceListPage({ config }: { config: ResourcePageConfig }) {
  const router = useRouter();
  const { t } = useI18n();
  const tr = useAdminTr();
  const colLabel = useAdminColumnLabel();
  const pageCopy = useAdminPageCopy(config.route, config.title, config.subtitle);

  const clientFilter = React.useMemo(() => {
    if (!config.clientFilterKey) return undefined;
    return (row: Row) => String(row[config.clientFilterKey!]) === config.clientFilterValue;
  }, [config.clientFilterKey, config.clientFilterValue]);

  const { data, total, totalPages, page, setPage, search, setSearch, loading, error, refetch } =
    useResourceList<Row>(config.endpoint, { clientFilter });

  const editFields = React.useMemo(() => {
    const fields = config.updateFields ?? config.createFields ?? fieldsFromColumns(config.columns);
    return fields.map((field) => ({ ...field, label: colLabel(field.key, field.label) }));
  }, [config.updateFields, config.createFields, config.columns, colLabel]);

  const createFields = React.useMemo(() => {
    if (!config.createFields) return undefined;
    return config.createFields.map((field) => ({ ...field, label: colLabel(field.key, field.label) }));
  }, [config.createFields, colLabel]);

  const columns = React.useMemo(
    () => config.columns.map((col) => ({ ...col, label: colLabel(col.key, col.label) })),
    [config.columns, colLabel]
  );

  const [createOpen, setCreateOpen] = React.useState(false);
  const [viewTarget, setViewTarget] = React.useState<Row | null>(null);
  const [editTarget, setEditTarget] = React.useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Row | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);

  React.useEffect(() => {
    setSelected(new Set());
  }, [data]);

  const allSelected = data.length > 0 && data.every((row) => selected.has(row.id as string));

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(data.map((row) => row.id as string)) : new Set());
  }

  function toggleRow(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function exportCsv(rows: Row[]) {
    downloadCsv(`${config.route.replace(/\//g, "-")}.csv`, toCsv(rows, columns));
    toast.success(t("common.exportedOk", { count: rows.length }));
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    const ids = Array.from(selected);
    let failures = 0;
    for (const id of ids) {
      try {
        await api.delete(`${config.endpoint}/${id}`);
      } catch {
        failures += 1;
      }
    }
    setBulkDeleting(false);
    setSelected(new Set());
    if (failures === 0) {
      toast.success(t("common.deletedOk"));
    } else {
      toast.error(tr(`Deleted ${ids.length - failures} of ${ids.length}; ${failures} failed`));
    }
    refetch();
  }

  async function handleCreate(values: Record<string, unknown>) {
    setSubmitting(true);
    try {
      await api.post(config.endpoint, values);
      toast.success(t("common.createdOk", { title: pageCopy.title }));
      setCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.createFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(values: Record<string, unknown>) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await api.patch(`${config.endpoint}/${editTarget.id}`, values);
      toast.success(t("common.changesSaved"));
      setEditTarget(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`${config.endpoint}/${deleteTarget.id}`);
      toast.success(t("common.deletedOk"));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.deleteFailed"));
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{pageCopy.title}</h1>
        {pageCopy.subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{pageCopy.subtitle}</p>}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-[#92640a] dark:text-warning">
          <WifiOff className="size-4 shrink-0" />
          {t("common.apiUnreachable", { error })}
        </div>
      )}

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 pb-4">
          <div>
            <CardTitle>{pageCopy.title}</CardTitle>
            <CardDescription className="mt-1">{t("common.total", { count: total.toLocaleString() })}</CardDescription>
          </div>
          <CardAction className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => exportCsv(data)} disabled={data.length === 0}>
              <Download className="size-4" />
              {t("common.exportCsv")}
            </Button>
            {config.createFields && (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => (config.detailRoute ? router.push(`/admin/${config.detailRoute}/new`) : setCreateOpen(true))}
              >
                <Plus className="size-4" />
                {t("common.addNew")}
              </Button>
            )}
          </CardAction>
        </CardHeader>

        <div className="flex flex-wrap items-center gap-3 border-y border-border px-5 py-3.5">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search")}
              className="h-9 ps-8 text-sm"
            />
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 rounded-[10px] border border-border bg-muted/50 px-3 py-1.5 text-sm">
              <span className="font-medium">{t("common.selected", { count: selected.size.toLocaleString() })}</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 px-2 text-xs"
                onClick={() => exportCsv(data.filter((row) => selected.has(row.id as string)))}
              >
                <Download className="size-3.5" />
                {t("common.exportSelected")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 px-2 text-xs text-destructive hover:text-destructive"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="size-3.5" />
                {t("common.deleteSelected")}
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={columns.length + 1} />
        ) : data.length === 0 ? (
          <EmptyState title={t("common.noResults")} description={t("common.noResultsHint")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleAll(checked === true)} aria-label={t("common.selectAll")} />
                </TableHead>
                {columns.map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
                <TableHead className="text-end">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={(row.id as string) ?? i}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(row.id as string)}
                      onCheckedChange={(checked) => toggleRow(row.id as string, checked === true)}
                      aria-label={t("common.selectRow")}
                    />
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {renderCell(row, col.key, col.type, t("common.yes"), t("common.no"))}
                    </TableCell>
                  ))}
                  <TableCell className="text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() =>
                            config.detailRoute ? router.push(`/admin/${config.detailRoute}/${row.id}`) : setViewTarget(row)
                          }
                        >
                          <Eye /> {t("common.view")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            config.detailRoute ? router.push(`/admin/${config.detailRoute}/${row.id}`) : setEditTarget(row)
                          }
                        >
                          <Pencil /> {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(row)}>
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

        {!loading && data.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-border p-4">
            <p className="text-xs text-muted-foreground">
              {t("common.pageOf", {
                page,
                totalPages,
                total: total.toLocaleString(),
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
      </Card>

      {config.route === "inventory/warehouses" ? <WarehouseDialog open={createOpen} onOpenChange={setCreateOpen} editing={null} warehouses={data as unknown as WarehouseItem[]} onSaved={() => { setCreateOpen(false); refetch(); }} /> : config.route === "brands" ? <BrandDialog open={createOpen} onOpenChange={setCreateOpen} editing={null} brands={data as unknown as BrandItem[]} onSaved={() => { setCreateOpen(false); refetch(); }} /> : config.route === "categories" ? <CategoryDialog open={createOpen} onOpenChange={setCreateOpen} editing={null} categories={data as unknown as CategoryItem[]} onSaved={() => { setCreateOpen(false); refetch(); }} /> : config.route === "collections" ? <CollectionDialog open={createOpen} onOpenChange={setCreateOpen} editing={null} collections={data as unknown as CollectionItem[]} onSaved={() => { setCreateOpen(false); refetch(); }} /> : config.route === "attributes" ? <AttributeDialog open={createOpen} onOpenChange={setCreateOpen} editing={null} attributes={data as unknown as AttributeItem[]} onSaved={() => { setCreateOpen(false); refetch(); }} /> : createFields && (
        <ResourceFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          title={t("common.addTitle", { title: pageCopy.title })}
          fields={createFields}
          submitting={submitting}
          onSubmit={handleCreate}
        />
      )}

      {config.route === "inventory/warehouses" ? <WarehouseDialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)} editing={editTarget as unknown as WarehouseItem | null} warehouses={data as unknown as WarehouseItem[]} onSaved={() => { setEditTarget(null); refetch(); }} /> : config.route === "brands" ? <BrandDialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)} editing={editTarget as unknown as BrandItem | null} brands={data as unknown as BrandItem[]} onSaved={() => { setEditTarget(null); refetch(); }} /> : config.route === "categories" ? <CategoryDialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)} editing={editTarget as unknown as CategoryItem | null} categories={data as unknown as CategoryItem[]} onSaved={() => { setEditTarget(null); refetch(); }} /> : config.route === "collections" ? <CollectionDialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)} editing={editTarget as unknown as CollectionItem | null} collections={data as unknown as CollectionItem[]} onSaved={() => { setEditTarget(null); refetch(); }} /> : config.route === "attributes" ? <AttributeDialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)} editing={editTarget as unknown as AttributeItem | null} attributes={data as unknown as AttributeItem[]} onSaved={() => { setEditTarget(null); refetch(); }} /> : (
        <ResourceFormDialog
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          title={t("common.editTitle", { title: pageCopy.title })}
          fields={editFields}
          initialValues={editTarget ?? undefined}
          submitting={submitting}
          onSubmit={handleUpdate}
        />
      )}

      <ResourceViewDialog
        open={!!viewTarget}
        onOpenChange={(open) => !open && setViewTarget(null)}
        title={pageCopy.title}
        columns={columns}
        row={viewTarget}
        onEdit={() => viewTarget && setEditTarget(viewTarget)}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("common.deleteEntry")}
        description={t("common.cannotUndo")}
        confirmLabel={t("common.delete")}
        onConfirm={handleDelete}
      />

      <ConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t("common.deleteEntries", { count: selected.size.toLocaleString() })}
        description={t("common.cannotUndo")}
        confirmLabel={bulkDeleting ? t("common.deleting") : t("common.deleteAll")}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
