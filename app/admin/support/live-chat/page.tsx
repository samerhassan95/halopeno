"use client";

import * as React from "react";
import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";

export default function LiveChatAdminPage() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .get<{ data: any[] }>("/support/contact-messages?search=Live%20chat&limit=50")
      .then((res) => setRows((res.data ?? []).filter((row) => String(row.subject || "").toLowerCase().includes("live chat"))))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><MessageSquare className="size-6 text-primary" /> Live Chat Inbox</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Messages from the storefront live chat widget land here via contact messages.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent chats</CardTitle>
          <CardDescription>{loading ? "Loading…" : `${rows.length} conversations`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-[14px] border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{row.name} · {row.email}</p>
                  <p className="text-xs text-muted-foreground">{row.subject}</p>
                </div>
                <Badge variant="outline">{row.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{row.message}</p>
            </div>
          ))}
          {!loading && !rows.length ? <p className="text-sm text-muted-foreground">No live chat messages yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
