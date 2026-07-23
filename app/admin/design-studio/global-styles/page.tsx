"use client";

import * as React from "react";
import { Palette, Save, UploadCloud, RotateCcw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api/client";
import { DEFAULT_GLOBAL_STYLES, type GlobalStylesConfig } from "@/lib/storefront/global-styles";
import { toast } from "sonner";

interface SettingRow {
  id: string;
  group: string;
  key: string;
  value: GlobalStylesConfig;
}

export default function GlobalStylesPage() {
  const [styles, setStyles] = React.useState<GlobalStylesConfig>(DEFAULT_GLOBAL_STYLES);
  const [settingId, setSettingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [previewKey, setPreviewKey] = React.useState(0);
  const storefrontOrigin = typeof window !== "undefined" ? window.location.origin : "";

  React.useEffect(() => {
    api
      .get<{ data: SettingRow[] }>("/settings/settings?search=global_styles&limit=5")
      .then((res) => {
        const row = res.data.find((s) => s.group === "storefront" && s.key === "global_styles");
        if (row?.value) {
          setSettingId(row.id);
          setStyles({ ...DEFAULT_GLOBAL_STYLES, ...row.value });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof GlobalStylesConfig>(key: K, value: GlobalStylesConfig[K]) {
    setStyles((prev) => ({ ...prev, [key]: value }));
  }

  async function save(publish: boolean) {
    setSaving(true);
    try {
      if (settingId) {
        await api.patch(`/settings/settings/${settingId}`, { value: styles });
      } else {
        const created = await api.post<SettingRow>("/settings/settings", {
          group: "storefront",
          key: "global_styles",
          value: styles,
        });
        setSettingId(created.id);
      }
      toast.success(publish ? "Global styles published — live on the storefront" : "Draft saved");
      if (publish) setPreviewKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]">
            <Palette className="size-6 text-primary" /> Global Styles
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Brand colors and shape used across the storefront</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setStyles(DEFAULT_GLOBAL_STYLES)}>
            <RotateCcw className="size-4" /> Reset
          </Button>
          <Button variant="outline" disabled={saving || loading} onClick={() => save(false)}>
            <Save className="size-4" /> Save draft
          </Button>
          <Button disabled={saving || loading} onClick={() => save(true)} className="gap-2">
            <UploadCloud className="size-4" /> {saving ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Colors & shape</CardTitle>
            <CardDescription>Applied to the .storefront-theme scope</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorField label="Primary color" value={styles.primary} onChange={(v) => update("primary", v)} />
            <ColorField label="Accent color" value={styles.accent} onChange={(v) => update("accent", v)} />
            <ColorField label="Background color" value={styles.background} onChange={(v) => update("background", v)} />
            <div className="space-y-1.5">
              <Label>Border radius</Label>
              <Input value={styles.radius} onChange={(e) => update("radius", e.target.value)} placeholder="e.g. 1.5rem" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
            <CardDescription>Reflects the last published version</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-[10px] border border-border">
              {storefrontOrigin && (
                <iframe key={previewKey} src={storefrontOrigin} className="h-[720px] w-full" title="Storefront preview" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-[8px] border border-input bg-transparent p-0.5"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
