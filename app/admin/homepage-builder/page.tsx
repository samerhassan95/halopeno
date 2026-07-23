"use client";

import * as React from "react";
import {
  LayoutTemplate,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Save,
  UploadCloud,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api/client";
import {
  HOMEPAGE_SECTION_TYPES,
  DEFAULT_HOMEPAGE_SECTIONS,
  sectionLabel,
  type HomepageSectionConfig,
} from "@/lib/storefront/homepage-sections";
import { toast } from "sonner";

interface SettingRow {
  id: string;
  group: string;
  key: string;
  value: HomepageSectionConfig[];
}

const DEVICE_WIDTH: Record<"desktop" | "tablet" | "mobile", number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

export default function HomepageBuilderPage() {
  const [sections, setSections] = React.useState<HomepageSectionConfig[]>(DEFAULT_HOMEPAGE_SECTIONS);
  const [settingId, setSettingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [device, setDevice] = React.useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = React.useState(0);
  const storefrontOrigin = typeof window !== "undefined" ? window.location.origin : "";

  const load = React.useCallback(() => {
    setLoading(true);
    api
      .get<{ data: SettingRow[] }>("/settings/settings?search=homepage_sections&limit=5")
      .then((res) => {
        const row = res.data.find((s) => s.group === "storefront" && s.key === "homepage_sections");
        if (row?.value?.length) {
          setSettingId(row.id);
          setSections(row.value);
        }
      })
      .catch(() => {
        /* fall back to defaults, already in state */
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => load(), [load]);

  function move(index: number, dir: -1 | 1) {
    setSections((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }

  function toggleVisible(id: string) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  }

  function duplicate(id: string) {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: `${prev[idx].type}-${Date.now()}` };
      const next = [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }

  function remove(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
  }

  function addSection(type: (typeof HOMEPAGE_SECTION_TYPES)[number]["type"]) {
    setSections((prev) => [...prev, { id: `${type}-${Date.now()}`, type, visible: true, order: prev.length }]);
  }

  async function save(publish: boolean) {
    setSaving(true);
    try {
      if (settingId) {
        await api.patch(`/settings/settings/${settingId}`, { value: sections });
      } else {
        const created = await api.post<SettingRow>("/settings/settings", {
          group: "storefront",
          key: "homepage_sections",
          value: sections,
        });
        setSettingId(created.id);
      }
      toast.success(publish ? "Homepage published — live on the storefront" : "Draft saved");
      if (publish) setPreviewKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save homepage");
    } finally {
      setSaving(false);
    }
  }

  const usedTypes = new Set(sections.map((s) => s.type));
  const availableTypes = HOMEPAGE_SECTION_TYPES.filter((t) => !usedTypes.has(t.type));

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]">
            <LayoutTemplate className="size-6 text-primary" /> Homepage Builder
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Reorder, hide or add storefront homepage sections — changes go live on publish</p>
        </div>
        <div className="flex items-center gap-2">
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
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Sections</CardTitle>
              <CardDescription>{sections.filter((s) => s.visible).length} visible of {sections.length}</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5" disabled={availableTypes.length === 0}>
                  <Plus className="size-3.5" /> Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableTypes.map((t) => (
                  <DropdownMenuItem key={t.type} onClick={() => addSection(t.type)}>
                    {t.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : (
              sections.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center gap-2 rounded-[10px] border border-border p-2.5",
                    !s.visible && "opacity-50"
                  )}
                >
                  <div className="flex flex-col">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>
                  <span className="flex-1 truncate text-sm font-medium">{sectionLabel(s.type)}</span>
                  <Switch checked={s.visible} onCheckedChange={() => toggleVisible(s.id)} />
                  <Button variant="ghost" size="icon-sm" onClick={() => duplicate(s.id)}><Copy className="size-3.5" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => remove(s.id)}><Trash2 className="size-3.5 text-destructive" /></Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Live preview</CardTitle>
              <CardDescription>Reflects the last published version</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button variant={device === "desktop" ? "default" : "outline"} size="icon-sm" onClick={() => setDevice("desktop")}><Monitor className="size-3.5" /></Button>
              <Button variant={device === "tablet" ? "default" : "outline"} size="icon-sm" onClick={() => setDevice("tablet")}><Tablet className="size-3.5" /></Button>
              <Button variant={device === "mobile" ? "default" : "outline"} size="icon-sm" onClick={() => setDevice("mobile")}><Smartphone className="size-3.5" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center overflow-auto rounded-[10px] bg-secondary/40 p-4">
              <div
                className="h-[720px] overflow-hidden rounded-[12px] border border-border bg-background shadow-soft-lg transition-[width] duration-300"
                style={{ width: DEVICE_WIDTH[device] }}
              >
                {storefrontOrigin && (
                  <iframe
                    key={previewKey}
                    src={storefrontOrigin}
                    className="size-full"
                    style={{ width: DEVICE_WIDTH.desktop, transform: `scale(${DEVICE_WIDTH[device] / DEVICE_WIDTH.desktop})`, transformOrigin: "top left", height: `${(720 / DEVICE_WIDTH[device]) * DEVICE_WIDTH.desktop}px` }}
                    title="Storefront preview"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
