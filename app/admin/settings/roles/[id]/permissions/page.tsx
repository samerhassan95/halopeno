"use client";

import * as React from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}
interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
}

const ACTIONS = ["view", "create", "edit", "delete", "approve", "export"];

export default function PermissionMatrixPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [role, setRole] = React.useState<Role | null>(null);
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  const [assigned, setAssigned] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      api.get<Role>(`/administration/roles/${id}`),
      api.get<{ data: Permission[] }>("/administration/permissions?limit=100"),
      api.get<{ permissionIds: string[] }>(`/administration/roles/${id}/permissions`),
    ])
      .then(([r, p, assignedRes]) => {
        setRole(r);
        setPermissions(p.data);
        setAssigned(new Set(assignedRes.permissionIds));
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load permissions"))
      .finally(() => setLoading(false));
  }, [id]);

  const modules = React.useMemo(() => {
    const map = new Map<string, Map<string, Permission>>();
    for (const p of permissions) {
      if (!map.has(p.module)) map.set(p.module, new Map());
      map.get(p.module)!.set(p.action, p);
    }
    return map;
  }, [permissions]);

  function toggle(permissionId: string) {
    setAssigned((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
    setDirty(true);
  }

  function toggleModule(moduleActions: Map<string, Permission>, checked: boolean) {
    setAssigned((prev) => {
      const next = new Set(prev);
      for (const p of moduleActions.values()) {
        if (checked) next.add(p.id);
        else next.delete(p.id);
      }
      return next;
    });
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/administration/roles/${id}/permissions`, { permissionIds: Array.from(assigned) });
      setDirty(false);
      toast.success("Permissions saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading permission matrix…</div>;
  if (!role) return <EmptyState title="Role not found" className="py-20" />;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/settings/roles")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold tracking-tight">{role.name} permissions</h1>
          <p className="text-sm text-muted-foreground">{role.description ?? "Configure module-level access for this role"}</p>
        </div>
        <Button onClick={save} disabled={!dirty || saving} className="gap-2">
          <Save className="size-4" />
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4" /> Permission matrix</CardTitle>
          <CardDescription>Toggle actions per module. Changes apply after saving.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Module</TableHead>
                {ACTIONS.map((a) => (
                  <TableHead key={a} className="text-center capitalize">{a}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(modules.entries()).map(([moduleName, actionsMap]) => {
                const allChecked = Array.from(actionsMap.values()).every((p) => assigned.has(p.id));
                return (
                  <TableRow key={moduleName}>
                    <TableCell className="font-medium capitalize">
                      <label className="flex items-center gap-2">
                        <Checkbox checked={allChecked} onCheckedChange={(c) => toggleModule(actionsMap, c === true)} />
                        {moduleName}
                      </label>
                    </TableCell>
                    {ACTIONS.map((action) => {
                      const perm = actionsMap.get(action);
                      return (
                        <TableCell key={action} className="text-center">
                          {perm ? (
                            <Checkbox checked={assigned.has(perm.id)} onCheckedChange={() => toggle(perm.id)} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className={cn("text-xs text-muted-foreground", dirty && "text-warning")}>
        {dirty ? "You have unsaved changes." : "All changes saved."}
      </p>
    </div>
  );
}
