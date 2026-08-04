"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  Store,
  Percent,
  Palette,
  Headset,
  BarChart2,
  Grid2x2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/context";

export function QuickMenu() {
  const { t } = useI18n();
  const shortcuts = [
    { label: t("header.tabs.dashboard"), href: "/admin", icon: LayoutDashboard },
    { label: t("header.quickOrders"), href: "/admin/orders/all", icon: ShoppingCart },
    { label: t("header.seller"), href: "/admin/sellers", icon: Store },
    { label: t("header.quickPromotions"), href: "/admin/promotions", icon: Percent },
    { label: t("header.tabs.designStudio"), href: "/admin/design-studio", icon: Palette },
    { label: t("header.quickSupport"), href: "/admin/support", icon: Headset },
    { label: t("header.quickReports"), href: "/admin/reports", icon: BarChart2 },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden gap-2 md:inline-flex">
          <Grid2x2 className="size-4" />
          {t("header.quickMenu")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {shortcuts.map((s) => (
          <DropdownMenuItem key={s.href} asChild>
            <Link href={s.href}>
              <s.icon /> {s.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
