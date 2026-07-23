"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, History, FileSliders, Cog, Wand2, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AI_TOOLS, toolLabel } from "@/lib/ai-studio/tools";
import { useLocalCollection } from "@/lib/hooks/use-local-collection";
import { api, ApiError } from "@/lib/api/client";

interface GenerationLog {
  id: string;
  feature: string;
  outputText: string | null;
  model: string | null;
  createdAt: string;
}

interface Template { id: string; name: string }

export default function AiStudioDashboard() {
  const [logs, setLogs] = React.useState<GenerationLog[] | null>(null);
  const { items: templates } = useLocalCollection<Template>("ai-studio-templates", []);

  React.useEffect(() => {
    api
      .get<{ data: GenerationLog[] }>("/ai-studio/ai-generation-logs?limit=5&sortBy=createdAt&sortOrder=desc")
      .then((res) => setLogs(res.data))
      .catch((err) => {
        setLogs([]);
        if (!(err instanceof ApiError)) console.error(err);
      });
  }, []);

  const monthlyLimit = 500;
  const used = logs?.length ?? 0;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]">
          <Sparkles className="size-6 text-primary" /> AI Studio
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">AI-assisted content, media and merchandising tools</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/ai-studio/content-generator">
          <Card className="h-full p-5 transition-shadow hover:shadow-soft-lg">
            <div className="mb-3 flex size-10 items-center justify-center rounded-[11px] bg-primary/10 text-primary"><Wand2 className="size-[19px]" /></div>
            <p className="font-medium">Content generator</p>
            <p className="mt-1 text-xs text-muted-foreground">12 generation tools</p>
          </Card>
        </Link>
        <Link href="/admin/ai-studio/history">
          <Card className="h-full p-5 transition-shadow hover:shadow-soft-lg">
            <div className="mb-3 flex size-10 items-center justify-center rounded-[11px] bg-accent/10 text-accent"><History className="size-[19px]" /></div>
            <p className="font-medium">Generation history</p>
            <p className="mt-1 text-xs text-muted-foreground">{logs === null ? "Loading…" : `${logs.length} recent generations`}</p>
          </Card>
        </Link>
        <Link href="/admin/ai-studio/templates">
          <Card className="h-full p-5 transition-shadow hover:shadow-soft-lg">
            <div className="mb-3 flex size-10 items-center justify-center rounded-[11px] bg-success/10 text-success"><FileSliders className="size-[19px]" /></div>
            <p className="font-medium">Templates</p>
            <p className="mt-1 text-xs text-muted-foreground">{templates.length} saved template{templates.length === 1 ? "" : "s"}</p>
          </Card>
        </Link>
        <Link href="/admin/ai-studio/settings">
          <Card className="h-full p-5 transition-shadow hover:shadow-soft-lg">
            <div className="mb-3 flex size-10 items-center justify-center rounded-[11px] bg-warning/10 text-[#92640a] dark:text-warning"><Cog className="size-[19px]" /></div>
            <p className="font-medium">Settings</p>
            <p className="mt-1 text-xs text-muted-foreground">Provider, limits & guardrails</p>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>AI tools</CardTitle><CardDescription>Jump straight into a specific generator</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {AI_TOOLS.map((t) => (
              <Link key={t.type} href={`/admin/ai-studio/content-generator?type=${t.type}`} className="rounded-[10px] border border-border p-3 text-sm hover:bg-secondary">
                <p className="font-medium">{t.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Zap className="size-4" /> Credit usage</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">This month</span>
                <span className="font-medium">{used} / {monthlyLimit}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (used / monthlyLimit) * 100)}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Recent generations</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {logs === null ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
              ) : logs.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No generations yet</p>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="text-sm">
                    <p className="font-medium">{toolLabel(l.feature)}</p>
                    <p className="truncate text-xs text-muted-foreground">{l.outputText}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
