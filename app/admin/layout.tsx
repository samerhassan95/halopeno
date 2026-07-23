"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAuth } from "@/lib/auth-context";

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === "/admin/login";

  React.useEffect(() => {
    if (!isLoginRoute && !loading && !user) router.replace("/admin/login");
  }, [isLoginRoute, loading, user, router]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-background" />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
