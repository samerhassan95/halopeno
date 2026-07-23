"use client";

import * as React from "react";
import { Bell, ShoppingCart, Store, UserPlus, AlertTriangle, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n/context";
import { notifications as initialNotifications } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

const iconByType = {
  order: ShoppingCart,
  seller: Store,
  customer: UserPlus,
  system: AlertTriangle,
  refund: Undo2,
};

const colorByType = {
  order: "bg-primary/10 text-primary",
  seller: "bg-accent/10 text-accent",
  customer: "bg-success/10 text-success",
  system: "bg-warning/10 text-[#92640a]",
  refund: "bg-destructive/10 text-destructive",
};

export function NotificationDropdown() {
  const { t } = useI18n();
  const [items, setItems] = React.useState(initialNotifications);
  const unread = items.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label={t("header.notifications")}>
              <Bell className="size-[18px]" />
              {unread > 0 && (
                <span className="absolute end-1.5 top-1.5 flex size-[16px] items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white ring-2 ring-card">
                  {unread}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("header.notifications")}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent className="w-[340px] p-0" sideOffset={10}>
        <div className="flex items-center justify-between px-3.5 py-3">
          <p className="font-display text-sm font-semibold">{t("header.notifications")}</p>
          <button
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => setItems((prev) => prev.map((n) => ({ ...n, read: true })))}
          >
            {t("header.markAllRead")}
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-thin border-t border-border">
          {items.map((n) => {
            const Icon = iconByType[n.type];
            return (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 px-3.5 py-3 transition-colors hover:bg-secondary/60 cursor-pointer",
                  !n.read && "bg-primary/[0.04]"
                )}
                onClick={() => setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
              >
                <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", colorByType[n.type])}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-snug">{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.description}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">{n.time}</p>
                </div>
                {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
              </div>
            );
          })}
        </div>
        <Link
          href="/admin/notifications"
          className="block border-t border-border px-3.5 py-2.5 text-center text-xs font-medium text-primary hover:bg-secondary/60"
        >
          {t("header.viewAllNotifications")}
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
