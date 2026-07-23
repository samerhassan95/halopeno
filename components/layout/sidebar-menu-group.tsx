"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { NavGroup, NavLeaf } from "@/lib/nav-config";

function isChildActive(pathname: string, children: NavLeaf[]) {
  return children.some((c) => pathname === c.href);
}

export function SidebarLeafItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavLeaf;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const Icon = item.icon;
  const active = pathname === item.href;

  const content = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0 py-2.5",
        active
          ? "bg-sidebar-active text-sidebar-active-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-sidebar-foreground"
      )}
    >
      {Icon && <Icon className={cn("size-[18px] shrink-0", active ? "text-white" : "text-sidebar-muted")} />}
      {!collapsed && <span className="truncate">{item.label[locale]}</span>}
      {!collapsed && item.badge ? (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">
          {item.badge}
        </span>
      ) : null}
      {collapsed && item.badge ? (
        <span className="absolute end-1.5 top-1.5 flex size-2 rounded-full bg-accent" />
      ) : null}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">{content}</div>
        </TooltipTrigger>
        <TooltipContent side={locale === "ar" ? "left" : "right"}>{item.label[locale]}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function SidebarMenuGroup({
  group,
  collapsed,
  onNavigate,
}: {
  group: NavGroup;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { locale } = useI18n();
  const Icon = group.icon;
  const childActive = isChildActive(pathname, group.children);
  const [open, setOpen] = React.useState(childActive);

  React.useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  if (collapsed) {
    return (
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center justify-center rounded-[10px] py-2.5 transition-colors",
                  childActive
                    ? "bg-sidebar-active text-white"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-hover"
                )}
              >
                {Icon && <Icon className="size-[18px]" />}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side={locale === "ar" ? "left" : "right"}>{group.label[locale]}</TooltipContent>
        </Tooltip>
        <PopoverContent
          side={locale === "ar" ? "left" : "right"}
          align="start"
          className="w-56 bg-popover p-1.5"
        >
          <p className="px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label[locale]}
          </p>
          {group.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center rounded-[8px] px-2.5 py-2 text-sm transition-colors",
                pathname === child.href
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-popover-foreground hover:bg-secondary"
              )}
            >
              {child.label[locale]}
            </Link>
          ))}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
            childActive
              ? "text-sidebar-foreground bg-sidebar-hover"
              : "text-sidebar-foreground/80 hover:bg-sidebar-hover"
          )}
        >
          {Icon && <Icon className="size-[18px] shrink-0 text-sidebar-muted" />}
          <span className="truncate">{group.label[locale]}</span>
          <ChevronDown
            className={cn(
              "ml-auto size-3.5 shrink-0 text-sidebar-muted transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-slide-in">
        <div className="mt-1 flex flex-col gap-0.5 border-s border-sidebar-border ms-5 ps-4">
          {group.children.map((child) => {
            const active = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "rounded-[8px] px-3 py-1.5 text-[13px] transition-colors",
                  active
                    ? "text-white font-medium bg-sidebar-active"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground"
                )}
              >
                {child.label[locale]}
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
