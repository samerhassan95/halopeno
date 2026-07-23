"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LayoutGrid, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/lib/sidebar-context";
import { useI18n } from "@/lib/i18n/context";
import { QuickMenu } from "./quick-menu";
import { AddNewDropdown } from "./add-new-dropdown";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { NotificationDropdown } from "./notification-dropdown";
import { ProfileDropdown } from "./profile-dropdown";
import { cn } from "@/lib/utils";

export function TopHeader() {
  const { setMobileOpen } = useSidebar();
  const { t } = useI18n();
  const pathname = usePathname();

  const tabs = [
    { label: t("header.tabs.dashboard"), href: "/admin" },
    { label: t("header.tabs.sales"), href: "/admin/orders/all" },
    { label: t("header.tabs.preorders"), href: "/admin/preorders" },
    { label: t("header.tabs.earnings"), href: "/admin/reports/commissions" },
    { label: t("header.tabs.designStudio"), href: "/admin/design-studio" },
  ];

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-card/80 px-3 backdrop-blur-md sm:px-5">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      <div className="hidden lg:flex">
        <QuickMenu />
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/"
            className="hidden size-9 items-center justify-center rounded-[10px] border border-border bg-secondary text-foreground/70 transition-colors hover:bg-secondary/70 md:flex"
          >
            <LayoutGrid className="size-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>Storefront shortcut</TooltipContent>
      </Tooltip>

      <nav className="scrollbar-thin ml-1 hidden flex-1 items-center gap-1 overflow-x-auto xl:flex">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "shrink-0 rounded-[9px] px-3.5 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-1 items-center justify-end gap-1 xl:flex-none">
        <div className="hidden sm:block">
          <AddNewDropdown />
        </div>
        <div className="sm:hidden">
          <AddNewDropdown />
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex" asChild>
              <Link href="/admin/reports">
                <LineChart className="size-[18px]" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("header.analytics")}</TooltipContent>
        </Tooltip>

        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>
        <ThemeToggle />
        <NotificationDropdown />
        <div className="mx-1 h-6 w-px bg-border" />
        <ProfileDropdown />
      </div>
    </header>
  );
}
