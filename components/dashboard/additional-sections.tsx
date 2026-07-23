"use client";

import {
  Award,
  AlertTriangle,
  PackageX,
  UserPlus,
  ShieldCheck,
  Undo2,
  Headset,
  CreditCard,
  Globe2,
  MapPin,
  Smartphone,
  TicketPercent,
  History,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n/context";
import { formatCompact, formatCurrency, formatNumber } from "@/lib/utils";
import { InfoListCard, type InfoListRow } from "./info-list-card";
import { DonutBreakdownCard } from "./donut-breakdown-card";
import {
  bestSellingProducts,
  lowStockProducts,
  outOfStockProducts,
  recentCustomers,
  pendingSellers,
  recentRefunds,
  recentTickets,
  coupons,
  paymentMethods,
  trafficSources,
  salesByCountry,
  salesByDevice,
  recentActivity,
} from "@/lib/mock-data";

export function AdditionalSections() {
  const { t } = useI18n();

  const bestSellingRows: InfoListRow[] = bestSellingProducts.map((p) => ({
    id: p.id,
    leading: (
      <span className="flex size-8 items-center justify-center rounded-[8px] bg-secondary text-base">{p.image}</span>
    ),
    primary: p.name,
    secondary: `${formatNumber(p.qtySold)} sold`,
    trailing: <span className="text-xs font-semibold">{formatCurrency(p.revenue)}</span>,
  }));

  const lowStockRows: InfoListRow[] = lowStockProducts.map((p) => ({
    id: p.id,
    leading: (
      <span className="flex size-8 items-center justify-center rounded-[8px] bg-warning/10 text-warning">
        <AlertTriangle className="size-4" />
      </span>
    ),
    primary: p.name,
    secondary: p.sku,
    trailing: <Badge variant="warning">{p.stock} left</Badge>,
  }));

  const outOfStockRows: InfoListRow[] = outOfStockProducts.map((p) => ({
    id: p.id,
    leading: (
      <span className="flex size-8 items-center justify-center rounded-[8px] bg-destructive/10 text-destructive">
        <PackageX className="size-4" />
      </span>
    ),
    primary: p.name,
    secondary: p.categoryName,
    trailing: <Badge variant="destructive">Out of stock</Badge>,
  }));

  const customerRows: InfoListRow[] = recentCustomers.map((c) => ({
    id: c.id,
    leading: (
      <Avatar className="size-8">
        <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-[10px] text-white">
          {c.avatar}
        </AvatarFallback>
      </Avatar>
    ),
    primary: c.name,
    secondary: c.location,
    trailing: (
      <span className="text-xs text-muted-foreground">
        {new Date(c.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </span>
    ),
  }));

  const sellerRows: InfoListRow[] = pendingSellers.map((s) => ({
    id: s.id,
    leading: (
      <Avatar className="size-8">
        <AvatarFallback className="bg-gradient-to-br from-warning to-destructive text-[10px] text-white">
          {s.avatar}
        </AvatarFallback>
      </Avatar>
    ),
    primary: s.shopName,
    secondary: s.name,
    trailing: <Badge variant="warning">Pending</Badge>,
  }));

  const refundRows: InfoListRow[] = recentRefunds.map((r) => ({
    id: r.id,
    leading: (
      <span className="flex size-8 items-center justify-center rounded-[8px] bg-destructive/10 text-destructive">
        <Undo2 className="size-4" />
      </span>
    ),
    primary: r.customerName,
    secondary: r.reason,
    trailing: <span className="text-xs font-semibold">{formatCurrency(r.amount)}</span>,
  }));

  const ticketRows: InfoListRow[] = recentTickets.map((tk) => ({
    id: tk.id,
    leading: (
      <Avatar className="size-8">
        <AvatarFallback className="bg-secondary text-[10px]">{tk.avatar}</AvatarFallback>
      </Avatar>
    ),
    primary: tk.subject,
    secondary: tk.customerName,
    trailing: (
      <Badge variant={tk.priority === "high" ? "destructive" : tk.priority === "medium" ? "warning" : "secondary"}>
        {tk.priority}
      </Badge>
    ),
  }));

  const couponRows: InfoListRow[] = coupons.map((c) => ({
    id: c.id,
    leading: (
      <span className="flex size-8 items-center justify-center rounded-[8px] bg-accent/10 text-accent">
        <TicketPercent className="size-4" />
      </span>
    ),
    primary: c.code,
    secondary: `${formatNumber(c.uses)} redemptions`,
    trailing: <span className="text-xs font-semibold">{formatCompact(c.revenue)}</span>,
  }));

  const activityRows: InfoListRow[] = recentActivity.map((a) => ({
    id: a.id,
    leading: (
      <span className="flex size-8 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
        <History className="size-4" />
      </span>
    ),
    primary: (
      <>
        <span className="font-semibold">{a.actor}</span> {a.action}{" "}
        <span className="font-semibold">{a.target}</span>
      </>
    ),
    secondary: a.time,
  }));

  const countryMax = Math.max(...salesByCountry.map((c) => c.value));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <InfoListCard
        title={t("dashboard.sections.bestSelling")}
        icon={Award}
        rows={bestSellingRows}
        viewAllHref="/admin/products/all"
        viewAllLabel={t("common.viewAll")}
      />
      <InfoListCard
        title={t("dashboard.sections.lowStock")}
        icon={AlertTriangle}
        rows={lowStockRows}
        viewAllHref="/admin/stock"
        viewAllLabel={t("common.viewAll")}
      />
      <InfoListCard
        title={t("dashboard.sections.outOfStock")}
        icon={PackageX}
        rows={outOfStockRows}
        viewAllHref="/admin/stock"
        viewAllLabel={t("common.viewAll")}
      />
      <InfoListCard
        title={t("dashboard.sections.newCustomers")}
        icon={UserPlus}
        rows={customerRows}
        viewAllHref="/admin/customers"
        viewAllLabel={t("common.viewAll")}
      />
      <InfoListCard
        title={t("dashboard.sections.pendingSellers")}
        icon={ShieldCheck}
        rows={sellerRows}
        viewAllHref="/admin/sellers/verification"
        viewAllLabel={t("common.viewAll")}
      />
      <InfoListCard
        title={t("dashboard.sections.refundRequests")}
        icon={Undo2}
        rows={refundRows}
        viewAllHref="/admin/refunds"
        viewAllLabel={t("common.viewAll")}
      />
      <InfoListCard
        title={t("dashboard.sections.supportTickets")}
        icon={Headset}
        rows={ticketRows}
        viewAllHref="/admin/support/tickets"
        viewAllLabel={t("common.viewAll")}
      />
      <DonutBreakdownCard title={t("dashboard.sections.paymentMethods")} icon={CreditCard} data={paymentMethods} />
      <DonutBreakdownCard title={t("dashboard.sections.trafficSources")} icon={Globe2} data={trafficSources} />
      <DonutBreakdownCard title={t("dashboard.sections.salesByDevice")} icon={Smartphone} data={salesByDevice} />

      <div className="rounded-[14px] border border-border bg-card p-5 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          <h3 className="font-display text-[15px] font-semibold">{t("dashboard.sections.salesByCountry")}</h3>
        </div>
        <div className="space-y-3">
          {salesByCountry.map((c) => (
            <div key={c.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground">{formatCurrency(c.value)}</span>
              </div>
              <Progress value={(c.value / countryMax) * 100} />
            </div>
          ))}
        </div>
      </div>

      <InfoListCard
        title={t("dashboard.sections.topCoupons")}
        icon={TicketPercent}
        rows={couponRows}
        viewAllHref="/admin/coupons"
        viewAllLabel={t("common.viewAll")}
      />

      <InfoListCard title={t("dashboard.sections.activity")} icon={History} rows={activityRows} />
    </div>
  );
}
