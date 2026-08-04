"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Search, PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/storefront/account/account-menu";
import { useStorefrontI18n } from "@/lib/storefront/i18n/context";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useStorefrontI18n();

  const items = [
    { label: t("nav.home"), href: "/", icon: Home },
    { label: t("nav.shop"), href: "/shop", icon: ShoppingBag },
    { label: t("nav.search"), href: "/shop?focus=search", icon: Search },
    { label: t("nav.orders"), href: "/account?tab=orders", icon: PackageSearch },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const active = pathname === item.href.split("?")[0];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        <AccountMenu mobile />
      </div>
    </nav>
  );
}
