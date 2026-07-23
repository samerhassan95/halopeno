"use client";

import { Sidebar } from "./sidebar";
import { MobileSidebar } from "./mobile-sidebar";
import { TopHeader } from "./top-header";
import { useSidebar } from "@/lib/sidebar-context";
import { cn } from "@/lib/utils";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-200 lg:ms-[264px]",
          collapsed && "lg:ms-[76px]"
        )}
      >
        <TopHeader />
        <main className="flex-1 px-3 py-5 sm:px-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
