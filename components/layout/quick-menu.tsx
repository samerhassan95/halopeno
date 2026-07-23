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

const shortcuts = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "All Orders", href: "/admin/orders/all", icon: ShoppingCart },
  { label: "Sellers", href: "/admin/sellers", icon: Store },
  { label: "Promotions", href: "/admin/promotions", icon: Percent },
  { label: "Design Studio", href: "/admin/design-studio", icon: Palette },
  { label: "Support", href: "/admin/support", icon: Headset },
  { label: "Reports", href: "/admin/reports", icon: BarChart2 },
];

export function QuickMenu() {
  const { t } = useI18n();
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
