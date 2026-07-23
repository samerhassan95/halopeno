"use client";

import * as React from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "sonner";

interface Complaint {
  id: string;
  customerId: string | null;
  subject: string;
  description: string | null;
  status: string;
  createdAt: string;
}

const statusVariant: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
  open: "warning",
  investigating: "secondary",
  resolved: "success",
  rejected: "destructive",
  closed: "secondary",
};

export default function ComplaintDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [complaint, setComplaint] = React.useState<Complaint | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [investigation, setInvestigation] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const c = await api.get<Complaint>(`/support/complaints/${id}`);
      setComplaint(c);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load complaint");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(status: string) {
    if (!complaint) return;
    try {
      const updated = await api.patch<Complaint>(`/support/complaints/${id}`, { status });
      setComplaint(updated);
      toast.success(`Complaint marked ${status}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update complaint");
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading complaint…</div>;
  if (!complaint) return <EmptyState title="Complaint not found" className="py-20" />;

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/support/complaints")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold tracking-tight">{complaint.subject}</h1>
          <p className="text-sm text-muted-foreground">
            Complaint #{complaint.id.slice(-8).toUpperCase()} · Filed {new Date(complaint.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={statusVariant[complaint.status] ?? "secondary"}>{complaint.status}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{complaint.description ?? "No description provided."}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="investigation" className="w-full">
            <TabsList className="mx-5 mt-2">
              <TabsTrigger value="investigation">Investigation</TabsTrigger>
              <TabsTrigger value="resolution">Resolution</TabsTrigger>
            </TabsList>
            <TabsContent value="investigation" className="space-y-3 px-5 pb-5">
              <div className="flex items-center gap-2 rounded-[10px] border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-[#92640a] dark:text-warning">
                <ShieldAlert className="size-4 shrink-0" />
                Document root cause and evidence before proposing a resolution.
              </div>
              <div className="space-y-1.5">
                <Label>Investigation notes</Label>
                <Textarea
                  value={investigation}
                  onChange={(e) => setInvestigation(e.target.value)}
                  placeholder="Summarize findings, root cause and responsible party…"
                  rows={5}
                />
              </div>
              <Button
                onClick={() => {
                  toast.success("Investigation notes saved");
                }}
                disabled={!investigation.trim()}
              >
                Save notes
              </Button>
            </TabsContent>
            <TabsContent value="resolution" className="space-y-4 px-5 pb-5">
              <div className="space-y-1.5">
                <Label>Update status</Label>
                <Select value={complaint.status} onValueChange={updateStatus}>
                  <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Resolving a complaint here doesn&apos;t automatically create a refund or return — do that from the
                related order if compensation was agreed.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
