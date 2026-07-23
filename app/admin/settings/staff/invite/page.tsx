"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
}

export default function InviteStaffPage() {
  const router = useRouter();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    jobTitle: "",
    department: "",
    roleId: "",
    message: "",
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    api.get<{ data: Role[] }>("/administration/roles?limit=50").then((res) => setRoles(res.data));
  }, []);

  async function submit() {
    setSaving(true);
    try {
      await api.post("/administration/users", {
        name: form.name,
        email: form.email,
        passwordHash: `invite_${crypto.randomUUID()}`,
        jobTitle: form.jobTitle || undefined,
        department: form.department || undefined,
        roleId: form.roleId || undefined,
        status: "INVITED",
      });
      toast.success(`Invitation sent to ${form.email}`);
      router.push("/admin/settings/staff");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send invitation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/settings/staff")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">Invite staff</h1>
          <p className="text-sm text-muted-foreground">Send a dashboard invitation to a new team member</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invitation details</CardTitle>
          <CardDescription>They&apos;ll receive an email to set their password and sign in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
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
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.roleId} onValueChange={(v) => setForm((f) => ({ ...f, roleId: v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Invitation message (optional)</Label>
            <Textarea rows={3} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
          </div>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={saving || !form.name.trim() || !form.email.trim()} className="gap-2">
              <Send className="size-4" />
              {saving ? "Sending…" : "Send invitation"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
