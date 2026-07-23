"use client";

import * as React from "react";
import { PanelBottom, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface FooterConfig {
  columns: number;
  showNewsletter: boolean;
  showSocialLinks: boolean;
  showPaymentLogos: boolean;
  copyrightText: string;
  mobileLayout: "accordion" | "stacked";
}

const DEFAULTS: FooterConfig = {
  columns: 4,
  showNewsletter: true,
  showSocialLinks: true,
  showPaymentLogos: true,
  copyrightText: "© 2026 Halopeno. All rights reserved.",
  mobileLayout: "accordion",
};

export default function FooterBuilderPage() {
  const [config, setConfig] = React.useState<FooterConfig>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    try {
      const raw = window.localStorage.getItem("design-studio-footer");
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  function set<K extends keyof FooterConfig>(key: K, value: FooterConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    window.localStorage.setItem("design-studio-footer", JSON.stringify(config));
    toast.success("Footer configuration saved");
  }

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]"><PanelBottom className="size-6 text-primary" /> Footer Builder</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Configure the storefront's footer layout and content</p>
        </div>
        <Button onClick={save} className="gap-2"><Save className="size-4" /> Save</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Layout</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Number of columns</Label>
            <Input type="number" min={1} max={6} value={config.columns} onChange={(e) => set("columns", Number(e.target.value) || 1)} />
          </div>
          <div className="space-y-1.5">
            <Label>Copyright text</Label>
            <Input value={config.copyrightText} onChange={(e) => set("copyrightText", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Features</CardTitle><CardDescription>Toggle footer elements on or off</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {([
            ["showNewsletter", "Newsletter signup form"],
            ["showSocialLinks", "Social links"],
            ["showPaymentLogos", "Payment method logos"],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between rounded-[10px] border border-border p-3">
              <span className="text-sm font-medium">{label}</span>
              <Switch checked={config[key]} onCheckedChange={(v) => set(key, v)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
