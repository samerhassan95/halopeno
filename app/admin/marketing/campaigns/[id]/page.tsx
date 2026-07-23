"use client";

import * as React from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Rocket, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { api, ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  type: string;
  channels: string[];
  segment: string | null;
  goal: string | null;
  status: string;
  budget: number;
  spend: number;
  revenue: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = React.useState<Campaign | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const load = React.useCallback(() => {
    api
      .get<Campaign>(`/marketing/campaigns/${id}`)
      .then(setCampaign)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load campaign"));
  }, [id]);

  React.useEffect(() => load(), [load]);

  async function save(patch: Partial<Campaign>) {
    setSaving(true);
    try {
      const updated = await api.patch<Campaign>(`/marketing/campaigns/${id}`, patch);
      setCampaign(updated);
      toast.success("Campaign updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/marketing/campaigns/${id}`);
      toast.success("Campaign deleted");
      router.push("/admin/marketing/campaigns");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete");
    }
  }

  if (!campaign) {
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  }

  const spend = Number(campaign.spend);
  const revenue = Number(campaign.revenue);
  const roi = spend ? Math.round(((revenue - spend) / spend) * 100) : 0;

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/marketing/campaigns")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
              <Rocket className="size-5 text-primary" /> {campaign.name}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Created {new Date(campaign.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Budget</p><p className="mt-1 text-lg font-bold">{formatCurrency(campaign.budget)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Spend</p><p className="mt-1 text-lg font-bold">{formatCurrency(campaign.spend)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Revenue</p><p className="mt-1 text-lg font-bold text-success">{formatCurrency(campaign.revenue)}</p><p className="text-xs text-muted-foreground">{roi >= 0 ? "+" : ""}{roi}% ROI</p></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Campaign configuration and status</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={campaign.status} onValueChange={(v) => save({ status: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Input value={campaign.type} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Input value={campaign.segment ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Channels</Label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {campaign.channels.map((c) => <Badge key={c} variant="secondary" className="capitalize">{c}</Badge>)}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Input value={campaign.startsAt ? new Date(campaign.startsAt).toLocaleDateString() : "Not scheduled"} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>End date</Label>
            <Input value={campaign.endsAt ? new Date(campaign.endsAt).toLocaleDateString() : "Not scheduled"} disabled />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Goal</Label>
            <Input value={campaign.goal ?? ""} disabled />
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${campaign.name}"?`}
        description="This will permanently remove the campaign. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
