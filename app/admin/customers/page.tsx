"use client";

import * as React from "react";
import { toast } from "sonner";
import { MoreHorizontal, Eye, Pencil, Trash2, Ban, ShieldAlert, Wallet, Download, ShieldCheck } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { ResourceFormDialog } from "@/components/resource/resource-form-dialog";
import { ResourceViewDialog } from "@/components/resource/resource-view-dialog";
import { useResourceList } from "@/lib/hooks/use-resource-list";
import { api, ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { toCsv, downloadCsv } from "@/lib/csv-export";
import type { ResourceField, ResourceColumn } from "@/lib/resource-pages";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isDisabled: boolean;
  isEmailVerified: boolean;
  loyaltyPoints: number;
  storeCredit: string | number;
  tags: string[];
  orderCount: number;
  totalSpent: number;
  createdAt: string;
  [key: string]: unknown;
}

type Tab = "all" | "banned" | "suspicious" | "verified" | "unverified";

const VIEW_COLUMNS: ResourceColumn[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "orderCount", label: "Orders", type: "number" },
  { key: "totalSpent", label: "Total spent", type: "currency" },
  { key: "loyaltyPoints", label: "Loyalty points", type: "number" },
  { key: "storeCredit", label: "Store credit", type: "currency" },
  { key: "isEmailVerified", label: "Email verified", type: "boolean" },
  { key: "isDisabled", label: "Banned", type: "boolean" },
  { key: "createdAt", label: "Joined", type: "date" },
];

const EDIT_FIELDS: ResourceField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "email", label: "Email", type: "text", required: true },
  { key: "phone", label: "Phone", type: "text" },
  { key: "loyaltyPoints", label: "Loyalty points", type: "number" },
];

export default function CustomersPage() {
  const [tab, setTab] = React.useState<Tab>("all");

  const clientFilter = React.useMemo(() => {
    if (tab === "all") return undefined;
    return (row: CustomerRow) => {
      if (tab === "banned") return row.isDisabled;
      if (tab === "suspicious") return row.tags?.includes("suspicious") ?? false;
      if (tab === "verified") return row.isEmailVerified;
      if (tab === "unverified") return !row.isEmailVerified;
      return true;
    };
  }, [tab]);

  const { data, total, totalPages, page, setPage, search, setSearch, loading, error, refetch } =
    useResourceList<CustomerRow>("/customers/customers", { clientFilter });

  const [viewTarget, setViewTarget] = React.useState<CustomerRow | null>(null);
  const [editTarget, setEditTarget] = React.useState<CustomerRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<CustomerRow | null>(null);
  const [rechargeTarget, setRechargeTarget] = React.useState<CustomerRow | null>(null);
  const [rechargeAmount, setRechargeAmount] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function toggleBan(row: CustomerRow) {
    try {
      await api.patch(`/customers/customers/${row.id}`, { isDisabled: !row.isDisabled });
      toast.success(row.isDisabled ? "Customer unbanned" : "Customer banned");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update customer");
    }
  }

  async function toggleSuspicious(row: CustomerRow) {
    const isSuspicious = row.tags?.includes("suspicious") ?? false;
    const nextTags = isSuspicious ? row.tags.filter((t) => t !== "suspicious") : [...(row.tags ?? []), "suspicious"];
    try {
      await api.patch(`/customers/customers/${row.id}`, { tags: nextTags });
      toast.success(isSuspicious ? "Suspicious flag removed" : "Marked as suspicious");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update customer");
    }
  }

  async function handleRecharge() {
    if (!rechargeTarget) return;
    const amount = Number(rechargeAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      const current = Number(rechargeTarget.storeCredit) || 0;
      await api.patch(`/customers/customers/${rechargeTarget.id}`, { storeCredit: current + amount });
      toast.success(`Added ${formatCurrency(amount)} to wallet`);
      setRechargeTarget(null);
      setRechargeAmount("");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to recharge wallet");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(values: Record<string, unknown>) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await api.patch(`/customers/customers/${editTarget.id}`, values);
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
      await api.delete(`/customers/customers/${deleteTarget.id}`);
      toast.success("Customer deleted");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete customer");
    } finally {
      setDeleteTarget(null);
    }
  }

  function exportCsv() {
    downloadCsv("customers.csv", toCsv(data, VIEW_COLUMNS));
    toast.success(`Exported ${data.length.toLocaleString()} row${data.length === 1 ? "" : "s"}`);
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">All Customers</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Registered shoppers on the platform</p>
      </div>

      {error && (
        <div className="rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-[#92640a] dark:text-warning">
          Live API unreachable ({error}).
        </div>
      )}

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 pb-4">
          <div>
            <CardTitle>Customers</CardTitle>
            <CardDescription className="mt-1">{total.toLocaleString()} total</CardDescription>
          </div>
          <CardAction>
            <Button size="sm" variant="outline" className="gap-2" onClick={exportCsv} disabled={data.length === 0}>
              <Download className="size-4" />
              Export CSV
            </Button>
          </CardAction>
        </CardHeader>

        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border px-5 py-3.5">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList>
              <TabsTrigger value="all">All Customers</TabsTrigger>
              <TabsTrigger value="banned">Banned</TabsTrigger>
              <TabsTrigger value="suspicious">Suspicious</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="unverified">Unverified</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers…"
            className="h-9 w-full max-w-xs text-sm"
          />
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : data.length === 0 ? (
          <EmptyState title="No customers found" description="Try adjusting your search or filters." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
                const isSuspicious = row.tags?.includes("suspicious") ?? false;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.email}</TableCell>
                    <TableCell>{row.phone ?? "—"}</TableCell>
                    <TableCell>{row.orderCount.toLocaleString()}</TableCell>
                    <TableCell>{formatCurrency(row.totalSpent)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {row.isDisabled && <Badge variant="destructive">Banned</Badge>}
                        {isSuspicious && <Badge variant="warning">Suspicious</Badge>}
                        {row.isEmailVerified ? (
                          <Badge variant="success">Verified</Badge>
                        ) : (
                          <Badge variant="secondary">Unverified</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setViewTarget(row)}>
                            <Eye /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditTarget(row)}>
                            <Pencil /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleBan(row)}>
                            <Ban /> {row.isDisabled ? "Unban this customer" : "Ban this customer"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleSuspicious(row)}>
                            {isSuspicious ? <ShieldCheck /> : <ShieldAlert />}
                            {isSuspicious ? "Remove suspicious flag" : "Mark as suspicious"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRechargeTarget(row)}>
                            <Wallet /> Wallet recharge
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(row)}>
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
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
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ResourceViewDialog
        open={!!viewTarget}
        onOpenChange={(open) => !open && setViewTarget(null)}
        title="Customer"
        columns={VIEW_COLUMNS}
        row={viewTarget}
        onEdit={() => viewTarget && setEditTarget(viewTarget)}
      />

      <ResourceFormDialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        title="Edit Customer"
        fields={EDIT_FIELDS}
        initialValues={editTarget ?? undefined}
        submitting={submitting}
        onSubmit={handleUpdate}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this customer?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />

      <Dialog open={!!rechargeTarget} onOpenChange={(open) => !open && setRechargeTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Wallet recharge</DialogTitle>
            <DialogDescription>
              Add store credit to {rechargeTarget?.name}&apos;s wallet. Current balance:{" "}
              {rechargeTarget ? formatCurrency(Number(rechargeTarget.storeCredit) || 0) : "—"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="recharge-amount">Amount to add</Label>
            <Input
              id="recharge-amount"
              type="number"
              min={0}
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRechargeTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleRecharge} disabled={submitting}>
              {submitting ? "Adding…" : "Add credit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
