"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Printer, Mail } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { StatusBadge } from "@/components/resource/status-badge";
import { api, ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";

interface OrderItemResponse {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  discount: string;
  tax: string;
  total: string;
  product: { id: string; name: string; sku: string; images: { url: string }[] } | null;
}

interface PaymentResponse {
  id: string;
  method: string;
  gateway: string | null;
  amount: string;
  status: string;
  transactionRef: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface ShipmentResponse {
  id: string;
  carrier: { name: string } | null;
  agent: { name: string } | null;
  trackingNumber: string | null;
  status: string;
  shippedAt: string | null;
  deliveredAt: string | null;
}

interface RefundResponse {
  id: string;
  amount: string;
  reason: string | null;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

interface OrderDetailResponse {
  id: string;
  orderNumber: string;
  channel: string;
  source: string;
  status: string;
  currency: string;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  shippingTotal: string;
  total: string;
  billingAddress: Record<string, unknown> | null;
  shippingAddress: Record<string, unknown> | null;
  customerNotes: string | null;
  internalNotes: string | null;
  couponCode: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    previousOrderCount: number;
    lifetimeValue: number;
  };
  seller: { id: string; shopName: string; name: string; email: string } | null;
  items: OrderItemResponse[];
  payments: PaymentResponse[];
  shipments: ShipmentResponse[];
  refunds: RefundResponse[];
}

const NEXT_STATUS: Record<string, string> = {
  DRAFT: "PENDING",
  PENDING: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "READY_FOR_SHIPMENT",
  READY_FOR_SHIPMENT: "SHIPPED",
  SHIPPED: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
  DELIVERED: "COMPLETED",
};

const NEXT_LABEL: Record<string, string> = {
  DRAFT: "Submit order",
  PENDING: "Confirm order",
  CONFIRMED: "Start processing",
  PROCESSING: "Mark ready for shipment",
  READY_FOR_SHIPMENT: "Ship order",
  SHIPPED: "Mark out for delivery",
  OUT_FOR_DELIVERY: "Mark delivered",
  DELIVERED: "Mark completed",
};

const TERMINAL_STATUSES = new Set([
  "CANCELLED",
  "COMPLETED",
  "REFUNDED",
  "FAILED",
  "RETURNED",
  "PARTIALLY_RETURNED",
  "PARTIALLY_REFUNDED",
]);

function addressLines(address: Record<string, unknown> | null): string[] {
  if (!address) return [];
  const known = ["line1", "line2", "address", "city", "state", "country", "postalCode", "zip"];
  const lines = known
    .map((k) => address[k])
    .filter((v): v is string => typeof v === "string" && v.length > 0);
  if (lines.length > 0) return lines;
  return Object.entries(address)
    .filter(([, v]) => typeof v === "string" && v)
    .map(([k, v]) => `${k}: ${v}`);
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | { label: string; status: string; destructive: boolean }>(null);

  function load() {
    setLoading(true);
    api
      .get<OrderDetailResponse>(`/sales/orders/${id}`)
      .then((res) => {
        setOrder({
          ...res,
          items: Array.isArray(res.items) ? res.items : [],
          payments: Array.isArray(res.payments) ? res.payments : [],
          shipments: Array.isArray(res.shipments) ? res.shipments : [],
          refunds: Array.isArray(res.refunds) ? res.refunds : [],
          customer: {
            ...res.customer,
            previousOrderCount: res.customer?.previousOrderCount ?? 0,
            lifetimeValue: Number(res.customer?.lifetimeValue ?? 0),
          },
        });
        setNotes(res.internalNotes ?? "");
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load order"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const task = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(task);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(status: string) {
    if (!order) return;
    setUpdating(true);
    try {
      await api.patch(`/sales/orders/${order.id}`, { status });
      toast.success(`Order marked as ${status.replace(/_/g, " ").toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update order");
    } finally {
      setUpdating(false);
      setConfirmAction(null);
    }
  }

  async function saveNotes() {
    if (!order) return;
    setSavingNotes(true);
    try {
      await api.patch(`/sales/orders/${order.id}`, { internalNotes: notes });
      toast.success("Notes saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <TableSkeleton rows={8} cols={4} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <EmptyState title="Order not found" description={error ?? "This order could not be loaded."} />
      </div>
    );
  }

  const nextStatus = NEXT_STATUS[order.status];
  const canCancel = !TERMINAL_STATUSES.has(order.status);
  const hasPaidPayment = order.payments.some((p) => p.status === "PAID");
  const canRefund = hasPaidPayment && order.status !== "REFUNDED" && order.status !== "CANCELLED";

  const paidAmount = order.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const refundedAmount = order.refunds
    .filter((r) => r.status === "APPROVED" || r.status === "COMPLETED")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const billingLines = addressLines(order.billingAddress);
  const shippingLines = addressLines(order.shippingAddress);

  const timeline = [
    { label: "Order created", date: order.createdAt },
    ...(order.updatedAt !== order.createdAt ? [{ label: `Currently ${order.status.replace(/_/g, " ").toLowerCase()}`, date: order.updatedAt }] : []),
    ...order.refunds.map((r) => ({ label: `Refund ${r.status.toLowerCase()} (${formatCurrency(Number(r.amount))})`, date: r.processedAt ?? r.createdAt })),
  ];

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon-sm" asChild>
            <Link href="/admin/orders/all">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
              <StatusBadge value={order.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Placed {new Date(order.createdAt).toLocaleString()} · {order.channel === "SELLER" ? order.seller?.shopName ?? "Seller" : "In-house"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print invoice
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Invoice email queued")}>
            <Mail className="size-4" />
            Send invoice
          </Button>
          {nextStatus && (
            <Button
              size="sm"
              disabled={updating}
              onClick={() => setConfirmAction({ label: NEXT_LABEL[order.status], status: nextStatus, destructive: false })}
            >
              {NEXT_LABEL[order.status]}
            </Button>
          )}
          {canRefund && (
            <Button
              variant="outline"
              size="sm"
              disabled={updating}
              className="text-warning hover:text-warning"
              onClick={() => setConfirmAction({ label: "Mark as refunded", status: "REFUNDED", destructive: true })}
            >
              Refund
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              disabled={updating}
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmAction({ label: "Cancel order", status: "CANCELLED", destructive: true })}
            >
              Cancel order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p className="font-medium">{order.customer.name}</p>
            <p className="text-muted-foreground">{order.customer.email}</p>
            {order.customer.phone && <p className="text-muted-foreground">{order.customer.phone}</p>}
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Previous orders</span>
              <span className="font-semibold">{order.customer.previousOrderCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Lifetime value</span>
              <span className="font-semibold">{formatCurrency(order.customer.lifetimeValue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Shipping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {shippingLines.length > 0 ? (
              shippingLines.map((line, i) => <p key={i}>{line}</p>)
            ) : (
              <p className="text-muted-foreground">No shipping address recorded.</p>
            )}
            <Separator className="my-2" />
            {order.shipments.length === 0 ? (
              <p className="text-muted-foreground">No shipment created yet.</p>
            ) : (
              order.shipments.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span>{s.carrier?.name ?? s.agent?.name ?? "Carrier TBD"}{s.trackingNumber ? ` · ${s.trackingNumber}` : ""}</span>
                  <Badge variant="secondary">{s.status.replace(/_/g, " ")}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {billingLines.length > 0 ? (
              billingLines.map((line, i) => <p key={i}>{line}</p>)
            ) : (
              <p className="text-muted-foreground">Same as shipping address.</p>
            )}
            {order.couponCode && (
              <>
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Coupon applied</span>
                  <span className="font-semibold">{order.couponCode}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Items</CardTitle>
          <CardDescription>{order.items.length} line item{order.items.length === 1 ? "" : "s"}</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit price</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Tax</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.product?.name ?? item.name}</TableCell>
                <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{formatCurrency(Number(item.unitPrice))}</TableCell>
                <TableCell>{formatCurrency(Number(item.discount))}</TableCell>
                <TableCell>{formatCurrency(Number(item.tax))}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(Number(item.total))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pricing summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(Number(order.subtotal))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(Number(order.discountTotal))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatCurrency(Number(order.shippingTotal))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(Number(order.taxTotal))}</span></div>
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(Number(order.total))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>{formatCurrency(paidAmount)}</span></div>
            {refundedAmount > 0 && (
              <div className="flex justify-between text-warning"><span>Refunded</span><span>-{formatCurrency(refundedAmount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span>{formatCurrency(Math.max(Number(order.total) - paidAmount, 0))}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {timeline.map((e, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="font-medium">{e.label}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Internal notes</CardTitle>
          <CardDescription>Only visible to staff, not the customer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add a note for other staff…"
            className="flex w-full rounded-[10px] border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <Button size="sm" disabled={savingNotes} onClick={saveNotes}>
            {savingNotes ? "Saving…" : "Save notes"}
          </Button>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction ? `${confirmAction.label}?` : ""}
        description={
          confirmAction?.destructive
            ? "This action cannot be undone."
            : "The customer and seller will be notified of this update."
        }
        confirmLabel={confirmAction?.label}
        destructive={confirmAction?.destructive ?? false}
        onConfirm={() => confirmAction && updateStatus(confirmAction.status)}
      />
    </div>
  );
}
