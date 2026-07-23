"use client";

import * as React from "react";
import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  UploadCloud,
  Home,
  FileText,
  ShoppingCart,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api/client";
import { DEFAULT_GLOBAL_STYLES, type GlobalStylesConfig } from "@/lib/storefront/global-styles";
import { DEFAULT_HOMEPAGE_SECTIONS, sectionLabel } from "@/lib/storefront/homepage-sections";
import { toast } from "sonner";

interface SettingRow { id: string; group: string; key: string; value: GlobalStylesConfig }

const PAGES = [
  { id: "home", label: "Home", icon: Home },
  { id: "product", label: "Product", icon: ShoppingCart },
  { id: "page", label: "Static page", icon: FileText },
];

const DEVICE_WIDTH: Record<"desktop" | "tablet" | "mobile", number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

export default function ThemeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [page, setPage] = React.useState("home");
  const [device, setDevice] = React.useState<"desktop" | "tablet" | "mobile">("desktop");
  const [styles, setStyles] = React.useState<GlobalStylesConfig>(DEFAULT_GLOBAL_STYLES);
  const [settingId, setSettingId] = React.useState<string | null>(null);
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
      .catch(() => {});
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
        const created = await api.post<SettingRow>("/settings/settings", { group: "storefront", key: "global_styles", value: styles });
        setSettingId(created.id);
      }
      toast.success(publish ? "Theme published" : "Draft saved");
      if (publish) setPreviewKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/design-studio/themes"><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Theme Editor — {id === "classic" ? "Halopeno Classic" : id}</h1>
            <p className="text-xs text-muted-foreground">Editing draft · unpublished changes apply on Publish</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={saving} onClick={() => save(false)}><Save className="size-4" /> Save draft</Button>
          <Button disabled={saving} onClick={() => save(true)} className="gap-2"><UploadCloud className="size-4" /> {saving ? "Publishing…" : "Publish"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[240px_1fr_320px]">
        <Card className="h-fit">
          <CardHeader><CardTitle className="text-sm">Pages</CardTitle></CardHeader>
          <CardContent className="space-y-1 p-3 pt-0">
            {PAGES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPage(p.id)}
                className={`flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-sm ${page === p.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary"}`}
              >
                <p.icon className="size-3.5" /> {p.label}
              </button>
            ))}
            {page === "home" && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1.5 px-2.5 text-xs font-medium text-muted-foreground">Sections</p>
                {DEFAULT_HOMEPAGE_SECTIONS.map((s) => (
                  <p key={s.id} className="truncate px-2.5 py-1 text-xs text-muted-foreground">{sectionLabel(s.type)}</p>
                ))}
                <Link href="/admin/homepage-builder" className="mt-1 flex items-center gap-1 px-2.5 py-1 text-xs text-primary hover:underline">
                  Manage sections <ExternalLink className="size-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm">Live preview</CardTitle>
            <Tabs value={device} onValueChange={(v) => setDevice(v as typeof device)}>
              <TabsList>
                <TabsTrigger value="desktop"><Monitor className="size-3.5" /></TabsTrigger>
                <TabsTrigger value="tablet"><Tablet className="size-3.5" /></TabsTrigger>
                <TabsTrigger value="mobile"><Smartphone className="size-3.5" /></TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center overflow-auto rounded-[10px] bg-secondary/40 p-4">
              <div className="h-[640px] overflow-hidden rounded-[12px] border border-border bg-background shadow-soft-lg transition-[width] duration-300" style={{ width: DEVICE_WIDTH[device] }}>
                {storefrontOrigin && (
                  <iframe
                    key={previewKey}
                    src={storefrontOrigin}
                    className="size-full"
                    style={{ width: DEVICE_WIDTH.desktop, transform: `scale(${DEVICE_WIDTH[device] / DEVICE_WIDTH.desktop})`, transformOrigin: "top left", height: `${(640 / DEVICE_WIDTH[device]) * DEVICE_WIDTH.desktop}px` }}
                    title="Storefront preview"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader><CardTitle className="text-sm">Properties</CardTitle><CardDescription>Colors & shape</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Primary color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={styles.primary} onChange={(e) => update("primary", e.target.value)} className="size-8 shrink-0 cursor-pointer rounded-[6px] border border-input bg-transparent p-0.5" />
                <Input className="h-8 text-xs" value={styles.primary} onChange={(e) => update("primary", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Accent color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={styles.accent} onChange={(e) => update("accent", e.target.value)} className="size-8 shrink-0 cursor-pointer rounded-[6px] border border-input bg-transparent p-0.5" />
                <Input className="h-8 text-xs" value={styles.accent} onChange={(e) => update("accent", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Background</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={styles.background} onChange={(e) => update("background", e.target.value)} className="size-8 shrink-0 cursor-pointer rounded-[6px] border border-input bg-transparent p-0.5" />
                <Input className="h-8 text-xs" value={styles.background} onChange={(e) => update("background", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Border radius</Label>
              <Input className="h-8 text-xs" value={styles.radius} onChange={(e) => update("radius", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
