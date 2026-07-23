"use client";

import * as React from "react";
import Link from "next/link";
import { Search, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useSidebar } from "@/lib/sidebar-context";
import { navSections } from "@/lib/nav-config";
import { LogoMark, LogoWordmark } from "./logo";
import { SidebarLeafItem, SidebarMenuGroup } from "./sidebar-menu-group";
import { Input } from "@/components/ui/input";

export function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { locale, t } = useI18n();
  const [query, setQuery] = React.useState("");

  const filteredSections = React.useMemo(() => {
    if (!query.trim()) return navSections;
    const q = query.trim().toLowerCase();
    return navSections
      .map((section) => {
        const items = section.items
          .map((item) => {
            if (item.type === "leaf") {
              return item.label[locale].toLowerCase().includes(q) ? item : null;
            }
            const children = item.children.filter((c) => c.label[locale].toLowerCase().includes(q));
            if (item.label[locale].toLowerCase().includes(q)) return item;
            if (children.length) return { ...item, children };
            return null;
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x));
        return { ...section, items };
      })
      .filter((section) => section.items.length > 0);
  }, [query, locale]);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex items-center gap-2.5 px-4 py-5", collapsed && "justify-center px-2")}>
        <LogoMark />
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <LogoWordmark className="text-white" />
            <span className="text-[11px] text-sidebar-muted">{t("sidebar.tagline")}</span>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-sidebar-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("sidebar.searchMenu")}
              className="h-9 border-sidebar-border bg-sidebar-hover/60 ps-8 text-[13px] text-sidebar-foreground placeholder:text-sidebar-muted focus-visible:border-sidebar-ring"
            />
          </div>
        </div>
      )}

      <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {filteredSections.map((section, idx) => (
          <div key={section.label?.en ?? `dash-${idx}`} className="space-y-1">
            {section.label && !collapsed && (
              <p className="px-3 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-muted">
                {section.label[locale]}
              </p>
            )}
            {section.label && collapsed && <div className="mx-3 my-2 h-px bg-sidebar-border" />}
            <div className="space-y-0.5">
              {section.items.map((item) =>
                item.type === "leaf" ? (
                  <SidebarLeafItem key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
                ) : (
                  <SidebarMenuGroup key={item.label.en} group={item} collapsed={collapsed} onNavigate={onNavigate} />
                )
              )}
            </div>
          </div>
        ))}
        {filteredSections.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-sidebar-muted">{t("common.noResults")}</p>
        )}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const { collapsed, toggleCollapsed } = useSidebar();
  const { t } = useI18n();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 start-0 z-30 hidden border-e border-sidebar-border transition-[width] duration-200 lg:flex",
        collapsed ? "w-[76px]" : "w-[264px]"
      )}
    >
      <div className="flex h-full w-full flex-col">
        <div className="flex-1 overflow-hidden">
          <SidebarContent collapsed={collapsed} />
        </div>
        <button
          onClick={toggleCollapsed}
          title={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          className="flex items-center justify-center gap-2 border-t border-sidebar-border py-3 text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>
    </aside>
  );
}
