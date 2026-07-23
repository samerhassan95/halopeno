"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { StatCard } from "./stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { formatNumber } from "@/lib/utils";
import { sellers, approvedSellers, pendingSellers, topSellers as mockTopSellers } from "@/lib/mock-data";

interface SellerCardProps {
  total?: number;
  approved?: number;
  pending?: number;
  topSellers?: { id: string; name: string }[];
}

export function SellerCard({ total: totalProp, approved, pending, topSellers }: SellerCardProps = {}) {
  const { t } = useI18n();
  const total = totalProp ?? 1240 + sellers.length;
  const approvedCount = approved ?? approvedSellers.length * 87;
  const pendingCount = pending ?? pendingSellers.length * 4;
  const avatars = (topSellers ?? mockTopSellers).slice(0, 5).map((s) => ({
    id: s.id,
    initials: "avatar" in s ? (s as { avatar: string }).avatar : s.name.split(" ").map((p) => p[0]).slice(0, 2).join(""),
  }));

  return (
    <StatCard
      icon={Store}
      tone="warning"
      title={t("dashboard.sellers.title")}
      value={formatNumber(total)}
      trend={-2.3}
    >
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2 rtl:space-x-reverse">
          {avatars.map((s) => (
            <Avatar key={s.id} className="size-7 ring-2 ring-card">
              <AvatarFallback className="bg-gradient-to-br from-warning to-destructive text-[10px] text-white">
                {s.initials}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div className="flex gap-3 text-[11px]">
          <span>
            <span className="font-semibold text-success">{approvedCount}</span>{" "}
            <span className="text-muted-foreground">{t("dashboard.sellers.approved")}</span>
          </span>
          <span>
            <span className="font-semibold text-warning">{pendingCount}</span>{" "}
            <span className="text-muted-foreground">{t("dashboard.sellers.pending")}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/sellers">{t("dashboard.sellers.allSellers")}</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/sellers/verification">{t("dashboard.sellers.pendingSellers")}</Link>
        </Button>
      </div>
    </StatCard>
  );
}
