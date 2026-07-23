"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { StatusBadge } from "@/components/resource/status-badge";
import { api, ApiError } from "@/lib/api/client";

interface SellerResponse {
  id: string;
  name: string;
  shopName: string;
  email: string;
  phone: string | null;
  description: string | null;
  taxNumber: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  status: string;
  rating: string;
  verifiedAt: string | null;
  createdAt: string;
}

export default function SellerVerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [seller, setSeller] = useState<SellerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | { label: string; status: string; destructive: boolean }>(null);

  function load() {
    setLoading(true);
    api
      .get<SellerResponse>(`/marketplace/sellers/${id}`)
      .then((res) => {
        setSeller(res);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load seller"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(status: string) {
    if (!seller) return;
    setUpdating(true);
    try {
      const payload: Record<string, unknown> = { status };
      if (status === "APPROVED") payload.verifiedAt = new Date().toISOString();
      await api.patch(`/marketplace/sellers/${seller.id}`, payload);
      toast.success(`Seller ${status.toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update seller");
    } finally {
      setUpdating(false);
      setConfirmAction(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-[1000px] flex-col gap-4">
        <TableSkeleton rows={6} cols={2} />
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="mx-auto flex max-w-[1000px] flex-col gap-4">
        <EmptyState title="Seller not found" description={error ?? "This seller could not be loaded."} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon-sm" asChild>
            <Link href="/admin/sellers/verification">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight">{seller.shopName}</h1>
              <StatusBadge value={seller.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Applied {new Date(seller.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {seller.status !== "APPROVED" && (
            <Button
              size="sm"
              disabled={updating}
              onClick={() => setConfirmAction({ label: "Approve seller", status: "APPROVED", destructive: false })}
            >
              Approve
            </Button>
          )}
          {seller.status !== "REJECTED" && (
            <Button
              variant="outline"
              size="sm"
              disabled={updating}
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmAction({ label: "Reject seller", status: "REJECTED", destructive: true })}
            >
              Reject
            </Button>
          )}
          {seller.status === "APPROVED" && (
            <Button
              variant="outline"
              size="sm"
              disabled={updating}
              className="text-warning hover:text-warning"
              onClick={() => setConfirmAction({ label: "Suspend seller", status: "SUSPENDED", destructive: true })}
            >
              Suspend
            </Button>
          )}
          {seller.status === "SUSPENDED" && (
            <Button
              size="sm"
              disabled={updating}
              onClick={() => setConfirmAction({ label: "Reactivate seller", status: "REACTIVATED", destructive: false })}
            >
              Reactivate
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span>{seller.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{seller.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{seller.phone ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span>{Number(seller.rating).toFixed(1)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Business details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Tax number</span><span>{seller.taxNumber ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Bank account name</span><span>{seller.bankAccountName ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Bank account number</span><span>{seller.bankAccountNumber ?? "—"}</span></div>
            <Separator className="my-1" />
            <div className="flex justify-between"><span className="text-muted-foreground">Verified at</span><span>{seller.verifiedAt ? new Date(seller.verifiedAt).toLocaleDateString() : "Not yet verified"}</span></div>
          </CardContent>
        </Card>
      </div>

      {seller.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Shop description</CardTitle>
            <CardDescription>{seller.description}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <ConfirmationDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction ? `${confirmAction.label}?` : ""}
        description={
          confirmAction?.destructive
            ? "The seller will be notified and their storefront access will change immediately."
            : "The seller will be notified of this update."
        }
        confirmLabel={confirmAction?.label}
        destructive={confirmAction?.destructive ?? false}
        onConfirm={() => confirmAction && updateStatus(confirmAction.status)}
      />
    </div>
  );
}
