"use client";

import * as React from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
}

export default function RoleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [role, setRole] = React.useState<Role | null>(null);
  const [permissionCount, setPermissionCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      api.get<Role>(`/administration/roles/${id}`),
      api.get<{ permissionIds: string[] }>(`/administration/roles/${id}/permissions`),
    ])
      .then(([r, p]) => {
        setRole(r);
        setPermissionCount(p.permissionIds.length);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load role"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading role…</div>;
  if (!role) return <EmptyState title="Role not found" className="py-20" />;

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/settings/roles")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold tracking-tight">{role.name}</h1>
          <p className="text-sm text-muted-foreground">{role.description ?? "No description"}</p>
        </div>
        {role.isSystem && <Badge variant="secondary">System role</Badge>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"><ShieldCheck className="size-4" /></span>
            <div>
              <CardTitle className="text-2xl">{permissionCount}</CardTitle>
              <CardDescription>Permissions assigned</CardDescription>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent/10 text-accent"><Users className="size-4" /></span>
            <div>
              <CardTitle className="text-2xl">—</CardTitle>
              <CardDescription>Staff members with this role</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Access control</CardTitle>
          <CardDescription>Configure exactly which modules and actions this role can perform</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push(`/admin/settings/roles/${id}/permissions`)} className="gap-2">
            <ShieldCheck className="size-4" /> Manage permission matrix
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
