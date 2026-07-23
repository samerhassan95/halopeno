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
import { useResourceList } from "@/lib/hooks/use-resource-list";
import { api, ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { toCsv, downloadCsv } from "@/lib/csv-export";
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

function renderCell(row: Row, key: string, type: string | undefined) {
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
      return value ? "Yes" : "No";
    case "badge":
      return <StatusBadge value={value} />;
    default:
      return <span className="max-w-[240px] truncate">{String(value)}</span>;
  }
}

export function ResourceListPage({ config }: { config: ResourcePageConfig }) {
  const router = useRouter();
  const clientFilter = React.useMemo(() => {
    if (!config.clientFilterKey) return undefined;
    return (row: Row) => String(row[config.clientFilterKey!]) === config.clientFilterValue;
  }, [config.clientFilterKey, config.clientFilterValue]);

  const { data, total, totalPages, page, setPage, search, setSearch, loading, error, refetch } =
    useResourceList<Row>(config.endpoint, { clientFilter });

  const editFields = config.updateFields ?? config.createFields ?? fieldsFromColumns(config.columns);

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
    downloadCsv(`${config.route.replace(/\//g, "-")}.csv`, toCsv(rows, config.columns));
    toast.success(`Exported ${rows.length.toLocaleString()} row${rows.length === 1 ? "" : "s"}`);
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
      toast.success(`Deleted ${ids.length.toLocaleString()} entries`);
    } else {
      toast.error(`Deleted ${ids.length - failures} of ${ids.length}; ${failures} failed`);
    }
    refetch();
  }

  async function handleCreate(values: Record<string, unknown>) {
    setSubmitting(true);
    try {
      await api.post(config.endpoint, values);
      toast.success(`${config.title} entry created`);
      setCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(values: Record<string, unknown>) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await api.patch(`${config.endpoint}/${editTarget.id}`, values);
      toast.success("Changes saved");
      setEditTarget(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save changes");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`${config.endpoint}/${deleteTarget.id}`);
      toast.success("Deleted successfully");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{config.title}</h1>
        {config.subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{config.subtitle}</p>}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-[#92640a] dark:text-warning">
          <WifiOff className="size-4 shrink-0" />
          Live API unreachable ({error}).
        </div>
      )}

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 pb-4">
          <div>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription className="mt-1">{total.toLocaleString()} total</CardDescription>
          </div>
          <CardAction className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => exportCsv(data)} disabled={data.length === 0}>
              <Download className="size-4" />
              Export CSV
            </Button>
            {config.createFields && (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => (config.detailRoute ? router.push(`/admin/${config.detailRoute}/new`) : setCreateOpen(true))}
              >
                <Plus className="size-4" />
                Add new
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
              placeholder="Search"
              className="h-9 ps-8 text-sm"
            />
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 rounded-[10px] border border-border bg-muted/50 px-3 py-1.5 text-sm">
              <span className="font-medium">{selected.size.toLocaleString()} selected</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 px-2 text-xs"
                onClick={() => exportCsv(data.filter((row) => selected.has(row.id as string)))}
              >
                <Download className="size-3.5" />
                Export selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 px-2 text-xs text-destructive hover:text-destructive"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="size-3.5" />
                Delete selected
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={config.columns.length + 1} />
        ) : data.length === 0 ? (
          <EmptyState title="No results found" description="Try adjusting your search, or add a new entry." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleAll(checked === true)} aria-label="Select all" />
                </TableHead>
                {config.columns.map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={(row.id as string) ?? i}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(row.id as string)}
                      onCheckedChange={(checked) => toggleRow(row.id as string, checked === true)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  {config.columns.map((col) => (
                    <TableCell key={col.key}>{renderCell(row, col.key, col.type)}</TableCell>
                  ))}
                  <TableCell className="text-right">
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
                          <Eye /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            config.detailRoute ? router.push(`/admin/${config.detailRoute}/${row.id}`) : setEditTarget(row)
                          }
                        >
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(row)}>
                          <Trash2 /> Delete
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
              Page {page} of {totalPages} — {total.toLocaleString()} total
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {config.createFields && (
        <ResourceFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          title={`Add ${config.title}`}
          fields={config.createFields}
          submitting={submitting}
          onSubmit={handleCreate}
        />
      )}

      <ResourceFormDialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        title={`Edit ${config.title}`}
        fields={editFields}
        initialValues={editTarget ?? undefined}
        submitting={submitting}
        onSubmit={handleUpdate}
      />

      <ResourceViewDialog
        open={!!viewTarget}
        onOpenChange={(open) => !open && setViewTarget(null)}
        title={config.title}
        columns={config.columns}
        row={viewTarget}
        onEdit={() => viewTarget && setEditTarget(viewTarget)}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this entry?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />

      <ConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selected.size.toLocaleString()} entries?`}
        description="This action cannot be undone."
        confirmLabel={bulkDeleting ? "Deleting…" : "Delete all"}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
