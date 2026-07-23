"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSidebar } from "@/lib/sidebar-context";
import { useI18n } from "@/lib/i18n/context";
import { SidebarContent } from "./sidebar";

export function MobileSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebar();
  const { dir } = useI18n();

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side={dir === "rtl" ? "right" : "left"} className="w-[280px] max-w-[80vw]">
        <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
