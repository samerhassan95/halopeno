"use client";

import * as React from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Lock, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Ticket {
  id: string;
  subject: string;
  category: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  customerId: string | null;
  sellerId: string | null;
  assignedTo: string | null;
  slaDueAt: string | null;
  createdAt: string;
}
interface Reply {
  id: string;
  ticketId: string;
  authorType: string;
  authorName: string | null;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

const priorityVariant: Record<Ticket["priority"], "secondary" | "warning" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "secondary",
  HIGH: "warning",
  URGENT: "destructive",
};
const statusVariant: Record<Ticket["status"], "secondary" | "warning" | "success"> = {
  OPEN: "warning",
  IN_PROGRESS: "secondary",
  RESOLVED: "success",
  CLOSED: "secondary",
};

export default function TicketWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [ticket, setTicket] = React.useState<Ticket | null>(null);
  const [replies, setReplies] = React.useState<Reply[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState("");
  const [internal, setInternal] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const [t, r] = await Promise.all([
        api.get<Ticket>(`/support/support-tickets/${id}`),
        api.get<{ data: Reply[] }>(`/support/ticket-replies?limit=100`),
      ]);
      setTicket(t);
      setReplies(r.data.filter((x) => x.ticketId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function updateTicket(patch: Partial<Ticket>) {
    if (!ticket) return;
    try {
      const updated = await api.patch<Ticket>(`/support/support-tickets/${id}`, patch);
      setTicket(updated);
      toast.success("Ticket updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update ticket");
    }
  }

  async function sendReply() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const reply = await api.post<Reply>("/support/ticket-replies", {
        ticketId: id,
        authorType: "agent",
        authorName: "Sarah Kim",
        message: message.trim(),
        isInternal: internal,
      });
      setReplies((prev) => [...prev, reply]);
      setMessage("");
      setInternal(false);
      toast.success(internal ? "Internal note added" : "Reply sent");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading ticket…</div>;
  if (!ticket) return <EmptyState title="Ticket not found" className="py-20" />;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/support/tickets")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold tracking-tight">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground">Ticket #{ticket.id.slice(-8).toUpperCase()} · Opened {new Date(ticket.createdAt).toLocaleDateString()}</p>
        </div>
        <Badge variant={priorityVariant[ticket.priority]}>{ticket.priority.toLowerCase()}</Badge>
        <Badge variant={statusVariant[ticket.status]}>{ticket.status.toLowerCase().replace("_", " ")}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {replies.length === 0 ? (
                <EmptyState title="No replies yet" description="Send the first reply below." />
              ) : (
                replies.map((r) => (
                  <div
                    key={r.id}
                    className={cn(
                      "rounded-[10px] border p-3.5 text-sm",
                      r.isInternal ? "border-warning/30 bg-warning/10" : "border-border bg-card"
                    )}
                  >
                    <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {r.authorName ?? (r.authorType === "customer" ? "Customer" : "Agent")}
                        {r.isInternal && (
                          <span className="ms-2 inline-flex items-center gap-1 text-warning">
                            <Lock className="size-3" /> internal note
                          </span>
                        )}
                      </span>
                      <span>{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{r.message}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-5">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a reply to the customer…"
                rows={4}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox checked={internal} onCheckedChange={(c) => setInternal(c === true)} />
                  Internal note (not visible to customer)
                </label>
                <Button onClick={sendReply} disabled={sending || !message.trim()} className="gap-2">
                  <Send className="size-4" />
                  {sending ? "Sending…" : internal ? "Add note" : "Send reply"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Ticket details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={ticket.status} onValueChange={(v) => updateTicket({ status: v as Ticket["status"] })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={ticket.priority} onValueChange={(v) => updateTicket({ priority: v as Ticket["priority"] })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Category</p>
                <p className="font-medium">{ticket.category ?? "Uncategorized"}</p>
              </div>
              {ticket.slaDueAt && (
                <div className="flex items-center gap-2 rounded-[8px] bg-secondary px-3 py-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  SLA due {new Date(ticket.slaDueAt).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
