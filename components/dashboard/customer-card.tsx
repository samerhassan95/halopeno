"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { StatCard } from "./stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { formatNumber } from "@/lib/utils";
import { customers, recentCustomers } from "@/lib/mock-data";

interface CustomerCardProps {
  total?: number;
  newThisMonth?: number;
}

export function CustomerCard({ total: totalProp, newThisMonth: newThisMonthProp }: CustomerCardProps = {}) {
  const { t } = useI18n();
  const total = totalProp ?? 18420 + customers.length;
  const newThisMonth = newThisMonthProp ?? 342;

  return (
    <StatCard
      icon={Users}
      tone="accent"
      title={t("dashboard.customers.title")}
      value={formatNumber(total)}
      trend={8.4}
    >
      <div className="flex items-center justify-between rounded-[10px] bg-secondary/60 px-3 py-2.5">
        <div className="flex -space-x-2 rtl:space-x-reverse">
          {recentCustomers.slice(0, 5).map((c) => (
            <Avatar key={c.id} className="size-7 ring-2 ring-card">
              <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-[10px] text-white">
                {c.avatar}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">+{newThisMonth}</span> {t("dashboard.customers.newThisMonth")}
        </p>
      </div>

      <Button variant="outline" size="sm" className="w-full" asChild>
        <Link href="/admin/customers">{t("dashboard.customers.viewAll")}</Link>
      </Button>
    </StatCard>
  );
}
