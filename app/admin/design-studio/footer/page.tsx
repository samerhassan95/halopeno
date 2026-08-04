"use client";

import * as React from "react";
import { PanelBottom, Save, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

interface FooterConfig {
  columns: number;
  showNewsletter: boolean;
  showSocialLinks: boolean;
  showPaymentLogos: boolean;
  copyrightText: string;
  mobileLayout: "accordion" | "stacked";
}

interface SettingRow {
  id: string;
  group: string;
  key: string;
  value: Partial<FooterConfig>;
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
  const [config, setConfig] = React.useState<FooterConfig>(DEFAULTS);
  const [settingId, setSettingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    api
      .get<{ data: SettingRow[] }>("/settings/settings?search=footer&limit=10")
      .then((res) => {
        const row = res.data.find((item) => item.group === "storefront" && item.key === "footer");
        if (row) {
          setSettingId(row.id);
          setConfig({ ...DEFAULTS, ...row.value });
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof FooterConfig>(key: K, value: FooterConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      if (settingId) {
        await api.patch(`/settings/settings/${settingId}`, { value: config });
      } else {
        const created = await api.post<SettingRow>("/settings/settings", {
          group: "storefront",
          key: "footer",
          value: config,
        });
        setSettingId(created.id);
      }
      toast.success("Footer configuration saved — live on the storefront");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save footer");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]"><PanelBottom className="size-6 text-primary" /> Footer Builder</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Configure the storefront&apos;s footer layout and content</p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
        </Button>
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
