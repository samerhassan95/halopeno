"use client";

import * as React from "react";
import { PanelTop, Save, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

interface HeaderConfig {
  logoPlacement: "left" | "center";
  navPlacement: "left" | "center" | "right";
  showSearch: boolean;
  showAccountMenu: boolean;
  showWishlist: boolean;
  showCart: boolean;
  showAnnouncementBar: boolean;
  stickyHeader: boolean;
  mobileHeaderStyle: "compact" | "expanded";
}

interface SettingRow {
  id: string;
  group: string;
  key: string;
  value: Partial<HeaderConfig>;
}

const DEFAULTS: HeaderConfig = {
  logoPlacement: "left",
  navPlacement: "left",
  showSearch: true,
  showAccountMenu: true,
  showWishlist: true,
  showCart: true,
  showAnnouncementBar: false,
  stickyHeader: true,
  mobileHeaderStyle: "compact",
};

export default function HeaderBuilderPage() {
  const [config, setConfig] = React.useState<HeaderConfig>(DEFAULTS);
  const [settingId, setSettingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    api
      .get<{ data: SettingRow[] }>("/settings/settings?search=header&limit=10")
      .then((res) => {
        const row = res.data.find((item) => item.group === "storefront" && item.key === "header");
        if (row) {
          setSettingId(row.id);
          setConfig({ ...DEFAULTS, ...row.value });
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof HeaderConfig>(key: K, value: HeaderConfig[K]) {
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
          key: "header",
          value: config,
        });
        setSettingId(created.id);
      }
      toast.success("Header configuration saved — live on the storefront");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save header");
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
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]"><PanelTop className="size-6 text-primary" /> Header Builder</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Configure the storefront&apos;s header layout and features</p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Layout</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Logo placement</Label>
            <Select value={config.logoPlacement} onValueChange={(v) => set("logoPlacement", v as HeaderConfig["logoPlacement"])}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Navigation placement</Label>
            <Select value={config.navPlacement} onValueChange={(v) => set("navPlacement", v as HeaderConfig["navPlacement"])}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Mobile header style</Label>
            <Select value={config.mobileHeaderStyle} onValueChange={(v) => set("mobileHeaderStyle", v as HeaderConfig["mobileHeaderStyle"])}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="compact">Compact</SelectItem><SelectItem value="expanded">Expanded</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Features</CardTitle><CardDescription>Toggle header elements on or off</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {([
            ["showSearch", "Search"],
            ["showAccountMenu", "Customer account menu"],
            ["showWishlist", "Wishlist icon"],
            ["showCart", "Cart icon"],
            ["showAnnouncementBar", "Announcement bar"],
            ["stickyHeader", "Sticky header"],
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
