"use client";

import * as React from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, ShieldCheck, KeyRound, Monitor, History } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "sonner";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  department: string | null;
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
  roleId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}
interface Role {
  id: string;
  name: string;
}

const statusVariant: Record<StaffUser["status"], "success" | "destructive" | "secondary"> = {
  ACTIVE: "success",
  SUSPENDED: "destructive",
  INVITED: "secondary",
};

export default function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = React.useState<StaffUser | null>(null);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [form, setForm] = React.useState({ name: "", jobTitle: "", department: "", roleId: "" });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      api.get<StaffUser>(`/administration/users/${id}`),
      api.get<{ data: Role[] }>("/administration/roles?limit=50"),
    ])
      .then(([u, r]) => {
        setUser(u);
        setRoles(r.data);
        setForm({ name: u.name, jobTitle: u.jobTitle ?? "", department: u.department ?? "", roleId: u.roleId ?? "" });
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load staff member"))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    setSaving(true);
    try {
      const updated = await api.patch<StaffUser>(`/administration/users/${id}`, {
        name: form.name,
        jobTitle: form.jobTitle || undefined,
        department: form.department || undefined,
        roleId: form.roleId || undefined,
      });
      setUser(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(status: StaffUser["status"]) {
    if (!user) return;
    try {
      const updated = await api.patch<StaffUser>(`/administration/users/${id}`, { status });
      setUser(updated);
      toast.success(`Account ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update status");
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading staff profile…</div>;
  if (!user) return <EmptyState title="Staff member not found" className="py-20" />;

  const roleName = roles.find((r) => r.id === user.roleId)?.name ?? "No role assigned";

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/settings/staff")}>
          <ArrowLeft className="size-4" />
        </Button>
        <Avatar className="size-10">
          <AvatarFallback>{user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email} · {roleName}</p>
        </div>
        <Badge variant={statusVariant[user.status]}>{user.status.toLowerCase()}</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mx-5 mt-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 px-5 pb-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user.email} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label>Job title</Label>
                  <Input value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={save} disabled={saving} className="gap-2">
                  <Save className="size-4" />
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4 px-5 pb-5">
              <div className="space-y-1.5">
                <Label>Assigned role</Label>
                <Select value={form.roleId} onValueChange={(v) => setForm((f) => ({ ...f, roleId: v }))}>
                  <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="No role assigned" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={save} disabled={saving} className="gap-2">
                <ShieldCheck className="size-4" /> Update role
              </Button>
            </TabsContent>

            <TabsContent value="security" className="space-y-3 px-5 pb-5">
              <div className="flex items-center justify-between rounded-[10px] border border-border p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-secondary"><KeyRound className="size-4" /></span>
                  <div>
                    <p className="text-sm font-medium">Account status</p>
                    <p className="text-xs text-muted-foreground">Suspend to immediately revoke dashboard access</p>
                  </div>
                </div>
                {user.status === "SUSPENDED" ? (
                  <Button size="sm" variant="outline" onClick={() => setStatus("ACTIVE")}>Reactivate</Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={() => setStatus("SUSPENDED")}>Suspend account</Button>
                )}
              </div>
              <div className="rounded-[10px] border border-border p-3.5 text-sm text-muted-foreground">
                Two-factor authentication and password-reset enforcement aren&apos;t wired to a real auth provider in
                this environment — status changes above are real, this section is illustrative only.
              </div>
            </TabsContent>

            <TabsContent value="sessions" className="space-y-3 px-5 pb-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <History className="size-4" />
                Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
              </div>
              <div className="flex items-center justify-between rounded-[10px] border border-border p-3.5 text-sm">
                <div className="flex items-center gap-3">
                  <Monitor className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Current session</p>
                    <p className="text-xs text-muted-foreground">This browser</p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
