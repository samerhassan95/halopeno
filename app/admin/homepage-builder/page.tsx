"use client";

import * as React from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  History,
  LayoutTemplate,
  Loader2,
  Maximize2,
  Monitor,
  MoreHorizontal,
  Plus,
  Redo2,
  RefreshCw,
  Save,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  UploadCloud,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_SECTION_SETTINGS,
  HOMEPAGE_SECTION_TYPES,
  hydrateHomepageSection,
  sectionLabel,
  type HomepageSectionConfig,
  type HomepageSectionSettings,
  type HomepageSectionType,
} from "@/lib/storefront/homepage-sections";
import { SECTION_SCHEMAS, sectionDefaultData, type SectionField } from "@/lib/storefront/homepage-section-schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaUploadField } from "@/components/ui/media-upload-field";
import { CollectionPickerField, ProductPickerField } from "@/components/ui/section-catalog-pickers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CatalogLoader } from "@/components/storefront/catalog-loader";
import { Hero } from "@/components/storefront/home/hero";
import { DeliveryBar } from "@/components/storefront/home/delivery-bar";
import { SignatureDishes } from "@/components/storefront/home/signature-dishes";
import { BestSellers } from "@/components/storefront/home/best-sellers";
import { OffersSection } from "@/components/storefront/home/offers-section";
import { WhyChooseUs } from "@/components/storefront/home/why-choose-us";
import { AboutTeaser } from "@/components/storefront/home/about-teaser";
import { ReviewsSection } from "@/components/storefront/home/reviews-section";
import { BlogTeaser } from "@/components/storefront/home/blog-teaser";
import { SectionShell } from "@/components/storefront/home/section-shell";
import { StorefrontI18nProvider } from "@/lib/storefront/i18n/context";

interface SettingRow { id: string; group: string; key: string; value: HomepageSectionConfig[] }
type SidebarMode = "list" | "edit";
type Device = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTH: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 390 };

function normalizeSections(sections: HomepageSectionConfig[]) {
  return sections.map((section, index) => ({
    ...hydrateHomepageSection(section),
    order: index,
    data: { ...sectionDefaultData(section.type), ...section.data },
  }));
}

export default function HomepageBuilderPage() {
  const [sections, setSections] = React.useState<HomepageSectionConfig[]>(normalizeSections(DEFAULT_HOMEPAGE_SECTIONS));
  const [settingId, setSettingId] = React.useState<string | null>(null);
  const [draftSettingId, setDraftSettingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveState, setSaveState] = React.useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [sidebarMode, setSidebarMode] = React.useState<SidebarMode>("list");
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null);
  const [draftSectionData, setDraftSectionData] = React.useState<HomepageSectionConfig | null>(null);
  const [originalSection, setOriginalSection] = React.useState<HomepageSectionConfig | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);
  const [pageDirty, setPageDirty] = React.useState(false);
  const [device, setDevice] = React.useState<Device>("desktop");
  const [zoom, setZoom] = React.useState(75);
  const [previewMode, setPreviewMode] = React.useState<"draft" | "live">("draft");
  const [history, setHistory] = React.useState<HomepageSectionConfig[][]>([]);
  const [future, setFuture] = React.useState<HomepageSectionConfig[][]>([]);

  React.useEffect(() => {
    api.get<{ data: SettingRow[] }>("/settings/settings?search=homepage_sections&limit=20")
      .then((response) => {
        const live = response.data.find((item) => item.group === "storefront" && item.key === "homepage_sections");
        const draft = response.data.find((item) => item.group === "storefront" && item.key === "homepage_sections_draft");
        if (live) setSettingId(live.id);
        if (draft) setDraftSettingId(draft.id);
        const source = draft?.value?.length ? draft.value : live?.value;
        if (source?.length) setSections(normalizeSections(source));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const persist = React.useCallback(async (value: HomepageSectionConfig[], publish = false) => {
    setSaving(true); setSaveState("saving");
    try {
      if (publish) {
        if (settingId) await api.patch(`/settings/settings/${settingId}`, { value });
        else {
          const created = await api.post<SettingRow>("/settings/settings", { group: "storefront", key: "homepage_sections", value });
          setSettingId(created.id);
        }
        if (draftSettingId) await api.patch(`/settings/settings/${draftSettingId}`, { value });
        else {
          const createdDraft = await api.post<SettingRow>("/settings/settings", { group: "storefront", key: "homepage_sections_draft", value });
          setDraftSettingId(createdDraft.id);
        }
      } else {
        if (draftSettingId) await api.patch(`/settings/settings/${draftSettingId}`, { value });
        else {
          const created = await api.post<SettingRow>("/settings/settings", { group: "storefront", key: "homepage_sections_draft", value });
          setDraftSettingId(created.id);
        }
      }
      setPageDirty(false); setSaveState("saved"); setLastSaved(new Date());
      toast.success(publish ? "Homepage published" : "Homepage draft saved", { description: publish ? "The latest sections are live on the storefront." : "Draft only — click Publish to go live." });
    } catch (error) { setSaveState("unsaved"); toast.error(error instanceof ApiError ? error.message : "Failed to save homepage"); }
    finally { setSaving(false); }
  }, [draftSettingId, settingId]);

  React.useEffect(() => {
    if (!pageDirty || isDirty || loading) return;
    const timer = window.setTimeout(() => void persist(sections), 1600);
    return () => window.clearTimeout(timer);
  }, [isDirty, loading, pageDirty, persist, sections]);

  React.useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (!isDirty && !pageDirty) return; event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, pageDirty]);

  const previewSections = React.useMemo(() => sections.map((section) => section.id === draftSectionData?.id ? draftSectionData : section), [draftSectionData, sections]);

  function checkpoint() { setHistory((current) => [...current.slice(-19), sections]); setFuture([]); }
  function commitSections(next: HomepageSectionConfig[]) { checkpoint(); setSections(next); setPageDirty(true); setSaveState("unsaved"); }

  function openEditor(section: HomepageSectionConfig) {
    const hydrated = hydrateHomepageSection(section);
    setSelectedSectionId(section.id); setOriginalSection(structuredClone(hydrated)); setDraftSectionData(structuredClone(hydrated)); setIsDirty(false); setSidebarMode("edit");
    requestAnimationFrame(() => document.getElementById(`preview-${section.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function requestBack() {
    if (isDirty && !window.confirm("Discard your unsaved section changes?")) return;
    setDraftSectionData(null); setOriginalSection(null); setIsDirty(false); setSidebarMode("list");
  }

  function saveSection() {
    if (!draftSectionData) return;
    const schema = SECTION_SCHEMAS[draftSectionData.type];
    const missing = schema.fields.filter((field) => field.required && !draftSectionData.data?.[field.key]);
    if (missing.length) { toast.error(`Complete required field: ${missing[0].label}`); return; }
    commitSections(sections.map((section) => section.id === draftSectionData.id ? { ...draftSectionData, status: "draft" } : section));
    setIsDirty(false); setOriginalSection(structuredClone(draftSectionData)); setSidebarMode("list");
    toast.success(`${draftSectionData.name} updated`);
  }

  function cancelEdit() {
    if (isDirty && !window.confirm("Cancel and discard your changes?")) return;
    setDraftSectionData(null); setOriginalSection(null); setIsDirty(false); setSidebarMode("list");
  }

  function updateDraft(patch: Partial<HomepageSectionConfig>) { setDraftSectionData((current) => current ? { ...current, ...patch } : current); setIsDirty(true); }
  function updateData(key: string, value: string | number | boolean | string[]) { setDraftSectionData((current) => current ? { ...current, data: { ...current.data, [key]: value } } : current); setIsDirty(true); }
  function updateSettings<K extends keyof HomepageSectionSettings>(key: K, value: HomepageSectionSettings[K]) { setDraftSectionData((current) => current ? { ...current, settings: { ...DEFAULT_SECTION_SETTINGS, ...current.settings, [key]: value } } : current); setIsDirty(true); }

  function move(index: number, direction: -1 | 1) {
    const next = [...sections]; const target = index + direction; if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]]; commitSections(next.map((section, order) => ({ ...section, order })));
  }

  function toggleVisible(id: string) { commitSections(sections.map((section) => section.id === id ? { ...section, visible: !section.visible, status: "draft" } : section)); }
  function duplicate(id: string) { const index = sections.findIndex((section) => section.id === id); if (index < 0) return; const copy = structuredClone(sections[index]); copy.id = `${copy.type}-${Date.now()}`; copy.name = `${copy.name} copy`; copy.status = "draft"; const next = [...sections.slice(0, index + 1), copy, ...sections.slice(index + 1)].map((section, order) => ({ ...section, order })); commitSections(next); setSelectedSectionId(copy.id); }
  function remove(id: string) { const section = sections.find((item) => item.id === id); if (!section || !window.confirm(`Delete “${section.name}”? This cannot be undone.`)) return; commitSections(sections.filter((item) => item.id !== id).map((item, order) => ({ ...item, order }))); if (selectedSectionId === id) setSelectedSectionId(null); }

  function addSection(type: HomepageSectionType) {
    const section = hydrateHomepageSection({ id: `${type}-${Date.now()}`, type, visible: true, order: sections.length, name: sectionLabel(type), status: "draft", data: sectionDefaultData(type), settings: DEFAULT_SECTION_SETTINGS });
    commitSections([...sections, section]); setSelectedSectionId(section.id); openEditor(section);
  }

  function undo() { const previous = history.at(-1); if (!previous) return; setFuture((current) => [sections, ...current]); setSections(previous); setHistory((current) => current.slice(0, -1)); setPageDirty(true); }
  function redo() { const next = future[0]; if (!next) return; setHistory((current) => [...current, sections]); setSections(next); setFuture((current) => current.slice(1)); setPageDirty(true); }

  async function publish() {
    if (isDirty) { toast.error("Save the open section before publishing."); return; }
    const incomplete = sections.find((section) => SECTION_SCHEMAS[section.type].fields.some((field) => field.required && !section.data?.[field.key]));
    if (incomplete) { toast.error(`${incomplete.name} is missing required content.`); return; }
    if (!window.confirm("Publish all homepage changes to the live storefront?")) return;
    const published = sections.map((section) => ({ ...section, status: section.visible ? "published" as const : section.status })); setSections(published); await persist(published, true);
  }

  return <div className="mx-auto flex max-w-[1750px] flex-col gap-4 pb-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div><h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[27px]"><LayoutTemplate className="size-6 text-primary" />Homepage Builder</h1><p className="mt-0.5 text-sm text-muted-foreground">Build, preview, and publish storefront sections from one visual workspace.</p></div>
      <div className="flex flex-wrap items-center gap-2"><div className="mr-1 flex items-center gap-1.5 text-xs text-muted-foreground">{saveState === "saving" ? <><Loader2 className="size-3.5 animate-spin" />Saving…</> : saveState === "unsaved" ? <><span className="size-2 rounded-full bg-warning" />Unsaved changes</> : <><Check className="size-3.5 text-success" />Saved{lastSaved ? ` ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</>}</div><Button variant="outline" size="icon-sm" onClick={undo} disabled={!history.length}><Undo2 className="size-4" /></Button><Button variant="outline" size="icon-sm" onClick={redo} disabled={!future.length}><Redo2 className="size-4" /></Button><Button variant="outline" onClick={() => toast.success("Version history opened")}><History className="size-4" />History</Button><Button variant="outline" disabled={saving || loading || isDirty} onClick={() => void persist(sections)}><Save className="size-4" />Save draft</Button><Button disabled={saving || loading} onClick={() => void publish()}><UploadCloud className="size-4" />Publish</Button></div>
    </header>

    <div className="grid min-h-[760px] gap-4 xl:grid-cols-[410px_1fr]">
      <Card className="overflow-hidden xl:sticky xl:top-4 xl:h-[calc(100vh-120px)]">
        {sidebarMode === "list" ? <SectionListView sections={sections} loading={loading} selectedId={selectedSectionId} onSelect={openEditor} onAdd={addSection} onMove={move} onToggle={toggleVisible} onDuplicate={duplicate} onDelete={remove} /> : draftSectionData ? <SectionEditorView section={draftSectionData} dirty={isDirty} onBack={requestBack} onSave={saveSection} onCancel={cancelEdit} onUpdate={updateDraft} onUpdateData={updateData} onUpdateSettings={updateSettings} onReset={() => { setDraftSectionData(originalSection ? structuredClone(originalSection) : draftSectionData); setIsDirty(Boolean(originalSection)); }} onDelete={() => { remove(draftSectionData.id); setSidebarMode("list"); setDraftSectionData(null); }} /> : null}
      </Card>

      <Card className="overflow-hidden xl:sticky xl:top-4 xl:h-[calc(100vh-120px)]"><div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-sm">Interactive preview</CardTitle><CardDescription>Click any section to edit it inline.</CardDescription></div><div className="flex flex-wrap items-center gap-1.5"><Select value={previewMode} onValueChange={(value: "draft" | "live") => setPreviewMode(value)}><SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="live">Live</SelectItem></SelectContent></Select><div className="flex rounded-lg border p-0.5">{([{ id: "desktop", icon: Monitor }, { id: "tablet", icon: Tablet }, { id: "mobile", icon: Smartphone }] as const).map((option) => <Button key={option.id} variant={device === option.id ? "secondary" : "ghost"} size="icon-sm" onClick={() => setDevice(option.id)} aria-label={`${option.id} preview`}><option.icon className="size-3.5" /></Button>)}</div><Button variant="ghost" size="icon-sm" onClick={() => setZoom((value) => Math.max(50, value - 10))}><ZoomOut className="size-4" /></Button><span className="w-9 text-center text-xs text-muted-foreground">{zoom}%</span><Button variant="ghost" size="icon-sm" onClick={() => setZoom((value) => Math.min(100, value + 10))}><ZoomIn className="size-4" /></Button><Button variant="ghost" size="icon-sm" onClick={() => toast.success("Preview refreshed")}><RefreshCw className="size-4" /></Button><Button variant="ghost" size="icon-sm" onClick={() => window.open("/", "_blank", "noopener,noreferrer")}><Maximize2 className="size-4" /></Button></div></div><div className="h-[calc(100%-69px)] overflow-auto bg-secondary/50 p-3 sm:p-6"><div className="mx-auto origin-top overflow-hidden rounded-xl bg-white shadow-lg transition-[width,transform] duration-300" style={{ width: DEVICE_WIDTH[device], maxWidth: "100%", transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}><BuilderPreview sections={previewMode === "draft" ? previewSections : sections} selectedId={selectedSectionId} device={device} onSelect={openEditor} onDuplicate={duplicate} onToggle={toggleVisible} onDelete={remove} /></div></div></Card>
    </div>
  </div>;
}

function SectionListView({ sections, loading, selectedId, onSelect, onAdd, onMove, onToggle, onDuplicate, onDelete }: { sections: HomepageSectionConfig[]; loading: boolean; selectedId: string | null; onSelect: (section: HomepageSectionConfig) => void; onAdd: (type: HomepageSectionType) => void; onMove: (index: number, direction: -1 | 1) => void; onToggle: (id: string) => void; onDuplicate: (id: string) => void; onDelete: (id: string) => void }) {
  return <div className="flex h-full flex-col"><div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card p-4"><div><CardTitle>Homepage sections</CardTitle><CardDescription>{sections.filter((section) => section.visible).length} visible of {sections.length}</CardDescription></div><DropdownMenu><DropdownMenuTrigger asChild><Button size="sm"><Plus className="size-3.5" />Add section</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">{HOMEPAGE_SECTION_TYPES.map((type) => <DropdownMenuItem key={type.type} onClick={() => onAdd(type.type)}>{type.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></div><ScrollArea className="flex-1"><div className="space-y-2 p-3">{loading ? [0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-16" />) : sections.map((section, index) => <div id={`section-list-${section.id}`} key={section.id} className={cn("group flex items-center gap-1 rounded-xl border p-2 transition-colors", selectedId === section.id && "border-primary bg-primary/5", !section.visible && "opacity-60")}><GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" /><button className="min-w-0 flex-1 px-1 text-left" onClick={() => onSelect(section)}><div className="flex items-center gap-2"><span className="truncate text-sm font-medium">{section.name || sectionLabel(section.type)}</span><StatusBadge section={section} /></div><p className="mt-0.5 text-[11px] text-muted-foreground">{SECTION_SCHEMAS[section.type].description}</p></button><div className="flex flex-col"><button aria-label="Move section up" disabled={index === 0} onClick={() => onMove(index, -1)} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronUp className="size-3.5" /></button><button aria-label="Move section down" disabled={index === sections.length - 1} onClick={() => onMove(index, 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronDown className="size-3.5" /></button></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Section actions"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onToggle(section.id)}>{section.visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{section.visible ? "Hide" : "Show"}</DropdownMenuItem><DropdownMenuItem onClick={() => onDuplicate(section.id)}><Copy className="size-4" />Duplicate</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => onDelete(section.id)}><Trash2 className="size-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>)}</div></ScrollArea></div>;
}

function SectionEditorView({ section, dirty, onBack, onSave, onCancel, onUpdate, onUpdateData, onUpdateSettings, onReset, onDelete }: { section: HomepageSectionConfig; dirty: boolean; onBack: () => void; onSave: () => void; onCancel: () => void; onUpdate: (patch: Partial<HomepageSectionConfig>) => void; onUpdateData: (key: string, value: string | number | boolean | string[]) => void; onUpdateSettings: <K extends keyof HomepageSectionSettings>(key: K, value: HomepageSectionSettings[K]) => void; onReset: () => void; onDelete: () => void }) {
  const schema = SECTION_SCHEMAS[section.type]; const settings = { ...DEFAULT_SECTION_SETTINGS, ...section.settings };
  return <div className="flex h-full flex-col"><div className="sticky top-0 z-20 border-b bg-card p-4"><button onClick={onBack} className="mb-3 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />Back to sections</button><div className="flex items-start justify-between gap-2"><div><CardTitle>{section.name}</CardTitle><CardDescription>{schema.label}</CardDescription></div><StatusBadge section={section} dirty={dirty} /></div></div><ScrollArea className="flex-1"><div className="p-4"><Tabs defaultValue="content"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="content">Content</TabsTrigger><TabsTrigger value="design">Design</TabsTrigger><TabsTrigger value="visibility">Visibility</TabsTrigger></TabsList><TabsContent value="content" className="space-y-4 pt-4"><Field label="Internal section name"><Input value={section.name || ""} onChange={(event) => onUpdate({ name: event.target.value })} /></Field>{schema.fields.map((field) => <SchemaField key={field.key} field={field} value={section.data?.[field.key]} sectionData={section.data} onChange={(value) => onUpdateData(field.key, value)} />)}</TabsContent><TabsContent value="design" className="space-y-4 pt-4"><Field label="Content width"><Select value={settings.width} onValueChange={(value: "contained" | "full") => onUpdateSettings("width", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="contained">Contained</SelectItem><SelectItem value="full">Full width</SelectItem></SelectContent></Select></Field><NumberField label="Maximum content width" value={settings.maxWidth} min={720} max={1800} onChange={(value) => onUpdateSettings("maxWidth", value)} /><div className="grid grid-cols-2 gap-3"><NumberField label="Top padding" value={settings.paddingTop} min={0} max={200} onChange={(value) => onUpdateSettings("paddingTop", value)} /><NumberField label="Bottom padding" value={settings.paddingBottom} min={0} max={200} onChange={(value) => onUpdateSettings("paddingBottom", value)} /></div><Field label="Background color"><div className="flex gap-2"><input type="color" value={settings.backgroundColor} onChange={(event) => onUpdateSettings("backgroundColor", event.target.value)} className="size-9 rounded-lg border p-0.5" /><Input value={settings.backgroundColor} onChange={(event) => onUpdateSettings("backgroundColor", event.target.value)} /></div></Field><MediaUploadField label="Background image" value={settings.backgroundImage} onChange={(value) => onUpdateSettings("backgroundImage", value)} /><MediaUploadField label="Background video" kind="video" value={settings.backgroundVideo} onChange={(value) => onUpdateSettings("backgroundVideo", value)} /><div className="grid grid-cols-2 gap-3"><Field label="Border color"><Input type="color" value={settings.borderColor} onChange={(event) => onUpdateSettings("borderColor", event.target.value)} /></Field><NumberField label="Border radius" value={settings.borderRadius} min={0} max={80} onChange={(value) => onUpdateSettings("borderRadius", value)} /></div><Field label="Section anchor ID"><Input value={settings.anchorId} onChange={(event) => onUpdateSettings("anchorId", event.target.value.replace(/\s+/g, "-"))} placeholder="featured-products" /></Field><Field label="Optional CSS class"><Input value={settings.cssClass} onChange={(event) => onUpdateSettings("cssClass", event.target.value)} /></Field></TabsContent><TabsContent value="visibility" className="space-y-4 pt-4"><ToggleRow label="Section visible" description="Show this section on the storefront" checked={section.visible} onChange={(value) => onUpdate({ visible: value })} /><ToggleRow label="Desktop" description="Visible on desktop screens" checked={settings.desktopVisible} onChange={(value) => onUpdateSettings("desktopVisible", value)} /><ToggleRow label="Tablet" description="Visible on tablet screens" checked={settings.tabletVisible} onChange={(value) => onUpdateSettings("tabletVisible", value)} /><ToggleRow label="Mobile" description="Visible on mobile screens" checked={settings.mobileVisible} onChange={(value) => onUpdateSettings("mobileVisible", value)} /><div className="grid grid-cols-1 gap-3"><Field label="Schedule start"><Input type="datetime-local" value={settings.startDate} onChange={(event) => onUpdateSettings("startDate", event.target.value)} /></Field><Field label="Schedule end"><Input type="datetime-local" value={settings.endDate} onChange={(event) => onUpdateSettings("endDate", event.target.value)} /></Field></div><div className="rounded-lg border border-warning/20 bg-warning/5 p-3 text-xs text-muted-foreground">Scheduled visibility uses the store timezone and is applied when the page is published.</div></TabsContent></Tabs><div className="mt-6 flex items-center justify-between border-t pt-4"><Button variant="ghost" size="sm" onClick={onReset}><RefreshCw className="size-3.5" />Reset</Button><Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive"><Trash2 className="size-3.5" />Delete section</Button></div></div></ScrollArea><div className="sticky bottom-0 z-20 flex items-center gap-2 border-t bg-card p-4"><Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button><Button className="flex-1" onClick={onSave} disabled={!dirty}><Save className="size-4" />Save changes</Button></div></div>;
}

function SchemaField({
  field,
  value,
  onChange,
  sectionData,
}: {
  field: SectionField;
  value: string | number | boolean | string[] | undefined;
  onChange: (value: string | number | boolean | string[]) => void;
  sectionData?: HomepageSectionConfig["data"];
}) {
  const source = String(sectionData?.productSource || "automatic");
  if (field.type === "product-picker") {
    if (source !== "manual") return null;
    return <ProductPickerField label={field.label} value={Array.isArray(value) ? value.map(String) : []} onChange={onChange} />;
  }
  if (field.type === "collection-picker") {
    if (source !== "collection") return null;
    return <CollectionPickerField label={field.label} value={String(value || "")} onChange={onChange} />;
  }
  if (field.type === "toggle") return <ToggleRow label={field.label} checked={Boolean(value)} onChange={onChange} />;
  if (field.type === "image" || field.type === "video") return <MediaUploadField label={field.label} kind={field.type} value={String(value || "")} onChange={onChange} required={field.required} />;
  if (field.type === "textarea") return <Field label={field.label} required={field.required}><Textarea value={String(value || "")} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} /></Field>;
  if (field.type === "select") return <Field label={field.label} required={field.required}><Select value={String(value || field.options?.[0]?.value || "")} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{field.options?.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></Field>;
  if (field.type === "number") return <NumberField label={field.label} value={Number(value || field.min || 0)} min={field.min} max={field.max} onChange={onChange} />;
  return <Field label={field.label} required={field.required}><Input type={field.type === "date" ? "datetime-local" : field.type === "color" ? "color" : "text"} value={String(value || "")} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} /></Field>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}{required && <span className="text-destructive"> *</span>}</Label>{children}</div> }
function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (value: number) => void }) { return <Field label={label}><Input type="number" value={value} min={min} max={max} onChange={(event) => onChange(Number(event.target.value))} /></Field> }
function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) { return <div className="flex items-center justify-between gap-3 rounded-lg border p-3"><div><p className="text-sm font-medium">{label}</p>{description && <p className="text-xs text-muted-foreground">{description}</p>}</div><Switch checked={checked} onCheckedChange={onChange} /></div> }

function StatusBadge({ section, dirty }: { section: HomepageSectionConfig; dirty?: boolean }) { if (dirty) return <Badge variant="outline" className="border-warning/20 bg-warning/10 text-warning-foreground">Draft changes</Badge>; if (!section.visible) return <Badge variant="secondary">Hidden</Badge>; if (section.settings?.startDate) return <Badge variant="outline" className="border-info/20 bg-info/10 text-info">Scheduled</Badge>; return <Badge variant="outline" className={section.status === "published" ? "border-success/20 bg-success/10 text-success" : "border-primary/20 bg-primary/10 text-primary"}>{section.status === "published" ? "Published" : "Draft"}</Badge> }

function BuilderPreview({ sections, selectedId, device, onSelect, onDuplicate, onToggle, onDelete }: { sections: HomepageSectionConfig[]; selectedId: string | null; device: Device; onSelect: (section: HomepageSectionConfig) => void; onDuplicate: (id: string) => void; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  return <StorefrontI18nProvider><div className="storefront-theme min-h-[850px] bg-background font-sans text-foreground antialiased"><CatalogLoader /><div className="flex h-20 items-center justify-between border-b bg-background px-10"><strong className="font-display text-2xl text-primary">halópeno</strong><div className="hidden gap-8 text-sm font-medium md:flex"><span className="text-primary">Home</span><span>Shop</span><span>Offers</span><span>About Us</span><span>Contact</span></div><div className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Shop Now</div></div>{sections.filter((section) => section.visible && (device === "desktop" ? section.settings?.desktopVisible !== false : device === "tablet" ? section.settings?.tabletVisible !== false : section.settings?.mobileVisible !== false)).sort((a, b) => a.order - b.order).map((section) => <PreviewSection key={section.id} section={section} selected={selectedId === section.id} onSelect={() => onSelect(section)} onDuplicate={() => onDuplicate(section.id)} onToggle={() => onToggle(section.id)} onDelete={() => onDelete(section.id)} />)}<footer className="bg-primary px-6 py-12 text-center text-xs text-primary-foreground/70">Halopeno · Small Jar. Big Kick.</footer></div></StorefrontI18nProvider>;
}

function PreviewSection({ section, selected, onSelect, onDuplicate, onToggle, onDelete }: { section: HomepageSectionConfig; selected: boolean; onSelect: () => void; onDuplicate: () => void; onToggle: () => void; onDelete: () => void }) {
  const settings = { ...DEFAULT_SECTION_SETTINGS, ...section.settings };
  return <section id={`preview-${section.id}`} onClick={onSelect} className={cn("group relative cursor-pointer border-2 border-transparent transition-colors hover:border-primary/50", selected && "z-10 border-primary ring-2 ring-primary/20")}><SectionShell settings={settings}><ActualStorefrontSection type={section.type} data={section.data} /></SectionShell>{selected && <div className="absolute right-2 top-2 z-30 flex items-center gap-1 rounded-lg border bg-white p-1 text-foreground shadow-lg"><Button size="sm" onClick={(event) => { event.stopPropagation(); onSelect(); }}>Edit</Button><Button variant="ghost" size="icon-sm" onClick={(event) => { event.stopPropagation(); onDuplicate(); }}><Copy className="size-3.5" /></Button><Button variant="ghost" size="icon-sm" onClick={(event) => { event.stopPropagation(); onToggle(); }}><EyeOff className="size-3.5" /></Button><Button variant="ghost" size="icon-sm" onClick={(event) => { event.stopPropagation(); onDelete(); }}><Trash2 className="size-3.5 text-destructive" /></Button></div>}</section>;
}

function ActualStorefrontSection({ type, data }: { type: HomepageSectionType; data?: HomepageSectionConfig["data"] }) {
  const components: Record<HomepageSectionType, React.ReactNode> = {
    hero: <Hero data={data} />,
    delivery_bar: <DeliveryBar data={data} />,
    signature_dishes: <SignatureDishes data={data} />,
    best_sellers: <BestSellers data={data} />,
    offers: <OffersSection data={data} />,
    why_choose_us: <WhyChooseUs data={data} />,
    about_teaser: <AboutTeaser data={data} />,
    reviews: <ReviewsSection data={data} />,
    blog_teaser: <BlogTeaser data={data} />,
  };
  return components[type];
}
