"use client";

import * as React from "react";
import {
  Accessibility,
  Bot,
  Check,
  ChevronDown,
  CircleAlert,
  CloudUpload,
  Code2,
  Copy,
  Download,
  Eye,
  FileJson,
  Fullscreen,
  History,
  Laptop,
  LayoutGrid,
  Monitor,
  Moon,
  MoreHorizontal,
  Palette,
  PanelTop,
  Redo2,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Type,
  Undo2,
  Upload,
  WandSparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { DEFAULT_GLOBAL_STYLES, type GlobalStylesConfig } from "@/lib/storefront/global-styles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EnterpriseStyles extends GlobalStylesConfig {
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  headingFont: string;
  bodyFont: string;
  baseFontSize: number;
  lineHeight: number;
  letterSpacing: number;
  containerWidth: number;
  gridGap: number;
  sectionPadding: number;
  buttonRadius: number;
  cardRadius: number;
  inputRadius: number;
  shadow: "none" | "soft" | "medium" | "bold";
  animationSpeed: number;
  reducedMotion: boolean;
  iconSize: number;
  iconStroke: number;
  customCss: string;
}

interface SettingRow { id: string; group: string; key: string; value: Partial<EnterpriseStyles> }

const defaults: EnterpriseStyles = {
  ...DEFAULT_GLOBAL_STYLES,
  secondary: "#7c3aed", success: "#16a34a", warning: "#d97706", error: "#dc2626", info: "#0284c7",
  surface: "#f8fafc", text: "#172033", mutedText: "#64748b", border: "#e2e8f0",
  headingFont: "Inter", bodyFont: "Inter", baseFontSize: 16, lineHeight: 1.6, letterSpacing: 0,
  containerWidth: 1280, gridGap: 24, sectionPadding: 64, buttonRadius: 10, cardRadius: 16, inputRadius: 10,
  shadow: "soft", animationSpeed: 220, reducedMotion: false, iconSize: 20, iconStroke: 2, customCss: "",
};

const colorGroups = [
  { key: "primary", label: "Primary", description: "Brand actions" },
  { key: "secondary", label: "Secondary", description: "Supporting brand" },
  { key: "accent", label: "Accent", description: "Highlights" },
  { key: "success", label: "Success", description: "Positive states" },
  { key: "warning", label: "Warning", description: "Attention states" },
  { key: "error", label: "Error", description: "Critical states" },
  { key: "info", label: "Info", description: "Information" },
  { key: "background", label: "Background", description: "Page canvas" },
  { key: "surface", label: "Surface", description: "Cards and inputs" },
  { key: "text", label: "Text primary", description: "Body and headings" },
  { key: "mutedText", label: "Text secondary", description: "Supporting copy" },
  { key: "border", label: "Border", description: "Dividers and outlines" },
] as const;

const navSections = [
  { id: "brand", label: "Brand identity", icon: Sparkles },
  { id: "colors", label: "Color system", icon: Palette },
  { id: "typography", label: "Typography", icon: Type },
  { id: "components", label: "Components", icon: LayoutGrid },
  { id: "layout", label: "Layout & spacing", icon: PanelTop },
  { id: "motion", label: "Icons & motion", icon: Zap },
  { id: "tokens", label: "Design tokens", icon: Code2 },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "ai", label: "AI assistant", icon: Bot },
] as const;

const previewPages = ["Homepage", "Product", "Collection", "Cart", "Checkout"];

export default function GlobalStylesPage() {
  const [styles, setStyles] = React.useState<EnterpriseStyles>(defaults);
  const [settingId, setSettingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("brand");
  const [search, setSearch] = React.useState("");
  const [device, setDevice] = React.useState<"desktop" | "laptop" | "tablet" | "mobile">("desktop");
  const [previewPage, setPreviewPage] = React.useState("Homepage");
  const [zoom, setZoom] = React.useState("85");
  const [darkPreview, setDarkPreview] = React.useState(false);
  const [history, setHistory] = React.useState<EnterpriseStyles[]>([]);
  const [future, setFuture] = React.useState<EnterpriseStyles[]>([]);
  const importRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    api.get<{ data: SettingRow[] }>("/settings/settings?search=global_styles&limit=5")
      .then((res) => {
        const row = res.data.find((item) => item.group === "storefront" && item.key === "global_styles");
        if (row?.value) { setSettingId(row.id); setStyles({ ...defaults, ...row.value }); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof EnterpriseStyles>(key: K, value: EnterpriseStyles[K]) {
    setHistory((current) => [...current.slice(-29), styles]);
    setFuture([]);
    setStyles((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function undo() {
    const previous = history.at(-1); if (!previous) return;
    setFuture((current) => [styles, ...current]); setStyles(previous); setHistory((current) => current.slice(0, -1)); setDirty(true);
  }

  function redo() {
    const next = future[0]; if (!next) return;
    setHistory((current) => [...current, styles]); setStyles(next); setFuture((current) => current.slice(1)); setDirty(true);
  }

  async function save(publish: boolean) {
    setSaving(true);
    try {
      if (settingId) await api.patch(`/settings/settings/${settingId}`, { value: styles });
      else {
        const created = await api.post<SettingRow>("/settings/settings", { group: "storefront", key: "global_styles", value: styles });
        setSettingId(created.id);
      }
      setDirty(false);
      toast.success(publish ? "Global design system published" : "Draft saved", { description: publish ? "Changes are now synchronized with the storefront." : "Your working version is safe." });
    } catch (error) { toast.error(error instanceof ApiError ? error.message : "Failed to save global styles"); }
    finally { setSaving(false); }
  }

  function exportTokens(format: string) {
    const content = format === "CSS" ? `:root {\n${Object.entries(styles).filter(([, value]) => typeof value !== "boolean").map(([key, value]) => `  --${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}: ${value};`).join("\n")}\n}` : JSON.stringify(styles, null, 2);
    const blob = new Blob([content], { type: format === "CSS" ? "text/css" : "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `storefront-tokens.${format === "CSS" ? "css" : "json"}`; anchor.click(); URL.revokeObjectURL(url);
    toast.success(`${format} tokens exported`);
  }

  function importPreset(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { setHistory((current) => [...current, styles]); setStyles({ ...defaults, ...JSON.parse(String(reader.result)) }); setDirty(true); toast.success("Style preset imported"); } catch { toast.error("This preset is not valid JSON"); } };
    reader.readAsText(file);
  }

  const previewWidth = { desktop: "100%", laptop: "88%", tablet: "620px", mobile: "360px" }[device];
  const shadowValue = { none: "none", soft: "0 8px 30px rgba(15,23,42,.08)", medium: "0 14px 40px rgba(15,23,42,.14)", bold: "0 20px 60px rgba(15,23,42,.22)" }[styles.shadow];

  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-4 pb-8">
      <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => importPreset(event.target.files?.[0])} />
      <header className="sticky top-0 z-30 -mx-2 flex flex-col gap-3 border-b bg-background/95 px-2 pb-3 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div><div className="flex items-center gap-2"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Palette className="size-5" /></div><div><div className="flex items-center gap-2"><h1 className="font-display text-2xl font-bold tracking-tight sm:text-[27px]">Global Styles</h1>{dirty && <Badge variant="outline" className="border-warning/20 bg-warning/10 text-warning-foreground">Unsaved</Badge>}</div><p className="text-sm text-muted-foreground">Manage your store&apos;s global design system, brand identity, and reusable visual styles.</p></div></div></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border p-0.5"><Button variant="ghost" size="icon-sm" disabled={!history.length} onClick={undo} title="Undo"><Undo2 className="size-4" /></Button><Button variant="ghost" size="icon-sm" disabled={!future.length} onClick={redo} title="Redo"><Redo2 className="size-4" /></Button></div>
          <Button variant="outline" onClick={() => setStyles(defaults)}><RotateCcw className="size-4" />Reset</Button>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline"><MoreHorizontal className="size-4" />More<ChevronDown className="size-3.5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => importRef.current?.click()}><Upload className="size-4" />Import preset</DropdownMenuItem><DropdownMenuItem onClick={() => exportTokens("JSON")}><FileJson className="size-4" />Export JSON tokens</DropdownMenuItem><DropdownMenuItem onClick={() => exportTokens("CSS")}><Code2 className="size-4" />Export CSS variables</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => toast.success("Version history opened")}><History className="size-4" />Version history</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          <Button variant="outline" disabled={saving || loading} onClick={() => save(false)}><Save className="size-4" />Save draft</Button>
          <Button disabled={saving || loading} onClick={() => save(true)}><CloudUpload className="size-4" />{saving ? "Publishing…" : "Publish changes"}</Button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-180px)] gap-4 xl:grid-cols-[minmax(440px,520px)_1fr]">
        <Card className="overflow-hidden xl:sticky xl:top-[92px] xl:h-[calc(100vh-112px)]">
          <div className="border-b p-3"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search design settings…" className="pl-9" /></div></div>
          <div className="grid h-[calc(100%-65px)] grid-cols-[150px_1fr] sm:grid-cols-[175px_1fr]">
            <nav className="border-r bg-secondary/30 p-2">{navSections.filter((item) => item.label.toLowerCase().includes(search.toLowerCase())).map((item) => <button key={item.id} onClick={() => setActiveSection(item.id)} className={cn("mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors", activeSection === item.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:bg-card/70 hover:text-foreground")}><item.icon className="size-3.5 shrink-0" /><span>{item.label}</span></button>)}</nav>
            <ScrollArea className="h-full"><div className="p-4 sm:p-5">
              {activeSection === "brand" && <Section title="Brand identity" description="Core visual identity shared by every storefront."><div className="grid grid-cols-2 gap-3"><UploadTile label="Brand logo" initials="V" /><UploadTile label="Favicon" initials="V" /></div><Field label="Brand name"><Input defaultValue="Vantage Commerce" /></Field><ColorField label="Primary color" value={styles.primary} onChange={(value) => update("primary", value)} /><ColorField label="Secondary color" value={styles.secondary} onChange={(value) => update("secondary", value)} /><ColorField label="Accent color" value={styles.accent} onChange={(value) => update("accent", value)} /></Section>}
              {activeSection === "colors" && <Section title="Semantic color system" description="Reusable color roles with instant preview.">{colorGroups.map((color) => <ColorField key={color.key} label={color.label} description={color.description} value={styles[color.key]} onChange={(value) => update(color.key, value)} />)}</Section>}
              {activeSection === "typography" && <Section title="Typography" description="Define a readable, responsive type system."><Field label="Heading font"><Select value={styles.headingFont} onValueChange={(value) => update("headingFont", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Inter", "Manrope", "DM Sans", "Playfair Display", "Space Grotesk"].map((font) => <SelectItem key={font} value={font}>{font}</SelectItem>)}</SelectContent></Select></Field><Field label="Body font"><Select value={styles.bodyFont} onValueChange={(value) => update("bodyFont", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Inter", "Manrope", "DM Sans", "Source Sans 3", "Lato"].map((font) => <SelectItem key={font} value={font}>{font}</SelectItem>)}</SelectContent></Select></Field><RangeField label="Base font size" value={styles.baseFontSize} min={12} max={22} unit="px" onChange={(value) => update("baseFontSize", value)} /><RangeField label="Line height" value={styles.lineHeight} min={1} max={2} step={0.1} unit="×" onChange={(value) => update("lineHeight", value)} /><RangeField label="Letter spacing" value={styles.letterSpacing} min={-1} max={3} step={0.1} unit="px" onChange={(value) => update("letterSpacing", value)} /><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Live type sample</p><p className="mt-2 text-2xl font-bold" style={{ fontFamily: styles.headingFont }}>Everything your store needs.</p><p className="mt-1 text-sm" style={{ fontFamily: styles.bodyFont, lineHeight: styles.lineHeight }}>A flexible typography scale keeps every shopping experience clear and consistent.</p></div></Section>}
              {activeSection === "components" && <Section title="Component styles" description="Shape and behavior for reusable interface elements."><Tabs defaultValue="buttons"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="buttons">Buttons</TabsTrigger><TabsTrigger value="forms">Forms</TabsTrigger><TabsTrigger value="cards">Cards</TabsTrigger></TabsList><TabsContent value="buttons" className="space-y-4 pt-4"><RangeField label="Button radius" value={styles.buttonRadius} min={0} max={28} unit="px" onChange={(value) => update("buttonRadius", value)} /><div className="grid grid-cols-2 gap-2"><Button style={{ borderRadius: styles.buttonRadius, background: styles.primary }}>Primary</Button><Button variant="outline" style={{ borderRadius: styles.buttonRadius }}>Outline</Button><Button variant="secondary" style={{ borderRadius: styles.buttonRadius }}>Secondary</Button><Button variant="ghost" style={{ borderRadius: styles.buttonRadius }}>Ghost</Button></div></TabsContent><TabsContent value="forms" className="space-y-4 pt-4"><RangeField label="Input radius" value={styles.inputRadius} min={0} max={28} unit="px" onChange={(value) => update("inputRadius", value)} /><Input placeholder="Example input" style={{ borderRadius: styles.inputRadius }} /><div className="flex items-center justify-between rounded-lg border p-3"><span className="text-sm">Example switch</span><Switch defaultChecked /></div></TabsContent><TabsContent value="cards" className="space-y-4 pt-4"><RangeField label="Card radius" value={styles.cardRadius} min={0} max={32} unit="px" onChange={(value) => update("cardRadius", value)} /><Field label="Shadow preset"><Select value={styles.shadow} onValueChange={(value: EnterpriseStyles["shadow"]) => update("shadow", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="soft">Soft</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="bold">Bold</SelectItem></SelectContent></Select></Field></TabsContent></Tabs></Section>}
              {activeSection === "layout" && <Section title="Layout & spacing" description="Responsive dimensions for storefront pages."><RangeField label="Container width" value={styles.containerWidth} min={960} max={1600} step={20} unit="px" onChange={(value) => update("containerWidth", value)} /><RangeField label="Grid gap" value={styles.gridGap} min={8} max={48} unit="px" onChange={(value) => update("gridGap", value)} /><RangeField label="Section padding" value={styles.sectionPadding} min={16} max={120} step={4} unit="px" onChange={(value) => update("sectionPadding", value)} /><div className="grid grid-cols-4 gap-2">{[4, 8, 16, 24, 32, 48, 64, 96].map((space) => <div key={space} className="rounded-lg border p-2 text-center"><div className="mx-auto bg-primary/30" style={{ width: Math.min(space, 48), height: 8 }} /><span className="mt-1 block text-[10px] text-muted-foreground">{space}px</span></div>)}</div></Section>}
              {activeSection === "motion" && <Section title="Icons & motion" description="Consistent iconography and interaction feedback."><RangeField label="Icon size" value={styles.iconSize} min={12} max={36} unit="px" onChange={(value) => update("iconSize", value)} /><RangeField label="Stroke width" value={styles.iconStroke} min={1} max={3} step={0.25} unit="px" onChange={(value) => update("iconStroke", value)} /><RangeField label="Animation speed" value={styles.animationSpeed} min={0} max={800} step={20} unit="ms" onChange={(value) => update("animationSpeed", value)} /><div className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">Reduce motion</p><p className="text-xs text-muted-foreground">Disable non-essential animations</p></div><Switch checked={styles.reducedMotion} onCheckedChange={(checked) => update("reducedMotion", checked)} /></div></Section>}
              {activeSection === "tokens" && <Section title="Design tokens" description="Portable variables for every channel and theme."><div className="grid grid-cols-2 gap-2">{[{ label: "Colors", value: "12 tokens" }, { label: "Typography", value: "9 tokens" }, { label: "Spacing", value: "8 tokens" }, { label: "Radius", value: "5 tokens" }, { label: "Shadows", value: "5 tokens" }, { label: "Breakpoints", value: "4 tokens" }].map((token) => <div key={token.label} className="rounded-lg border p-3"><p className="text-sm font-medium">{token.label}</p><p className="text-xs text-muted-foreground">{token.value}</p></div>)}</div><div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => exportTokens("JSON")}><FileJson className="size-4" />Export JSON</Button><Button variant="outline" onClick={() => exportTokens("CSS")}><Code2 className="size-4" />CSS variables</Button></div><Field label="Custom CSS"><Textarea value={styles.customCss} onChange={(event) => update("customCss", event.target.value)} className="min-h-32 font-mono text-xs" placeholder=".storefront-theme { }" /></Field></Section>}
              {activeSection === "accessibility" && <Section title="Accessibility checker" description="Automated WCAG and usability validation."><div className="rounded-xl border border-success/20 bg-success/5 p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-success" /><span className="font-medium">Accessibility score</span></div><span className="font-display text-2xl font-bold text-success">94</span></div><Progress value={94} className="mt-3" /></div>{[{ title: "Text contrast", state: "Passed", tone: "text-success", icon: Check }, { title: "Focus indicators", state: "Passed", tone: "text-success", icon: Check }, { title: "Muted text contrast", state: "Review", tone: "text-warning-foreground", icon: CircleAlert }, { title: "Touch target size", state: "Passed", tone: "text-success", icon: Check }].map((check) => <div key={check.title} className="flex items-center justify-between rounded-lg border p-3"><span className="text-sm">{check.title}</span><span className={cn("flex items-center gap-1 text-xs font-medium", check.tone)}><check.icon className="size-3.5" />{check.state}</span></div>)}</Section>}
              {activeSection === "ai" && <Section title="AI design assistant" description="Generate and optimize a cohesive visual system.">{[{ icon: Palette, title: "Generate color palette", text: "Create accessible colors from your brand" }, { icon: Accessibility, title: "Improve accessibility", text: "Automatically resolve WCAG warnings" }, { icon: Moon, title: "Create dark theme", text: "Generate a balanced dark color system" }, { icon: Type, title: "Suggest font pairing", text: "Find a stronger heading and body pair" }, { icon: WandSparkles, title: "Modernize components", text: "Refresh radius, spacing, and shadows" }].map((action) => <button key={action.title} onClick={() => toast.success(`${action.title} complete`, { description: "Suggestions are ready to review." })} className="flex w-full gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"><div className="rounded-lg bg-primary/10 p-2 text-primary"><action.icon className="size-4" /></div><div><p className="text-sm font-medium">{action.title}</p><p className="text-xs text-muted-foreground">{action.text}</p></div></button>)}</Section>}
            </div></ScrollArea>
          </div>
        </Card>

        <Card className="overflow-hidden xl:sticky xl:top-[92px] xl:h-[calc(100vh-112px)]">
          <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><Eye className="size-4 text-primary" /><div><p className="text-sm font-semibold">Live storefront preview</p><p className="text-[11px] text-muted-foreground">Updates instantly · Main Store</p></div></div><div className="flex flex-wrap items-center gap-1.5"><Select value={previewPage} onValueChange={setPreviewPage}><SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger><SelectContent>{previewPages.map((page) => <SelectItem key={page} value={page}>{page}</SelectItem>)}</SelectContent></Select><div className="flex rounded-lg border p-0.5">{([{ id: "desktop", icon: Monitor }, { id: "laptop", icon: Laptop }, { id: "tablet", icon: Tablet }, { id: "mobile", icon: Smartphone }] as const).map((option) => <Button key={option.id} variant={device === option.id ? "secondary" : "ghost"} size="icon-sm" onClick={() => setDevice(option.id)} title={option.id}><option.icon className="size-3.5" /></Button>)}</div><Select value={zoom} onValueChange={setZoom}><SelectTrigger className="h-8 w-[72px] text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="65">65%</SelectItem><SelectItem value="85">85%</SelectItem><SelectItem value="100">100%</SelectItem></SelectContent></Select><Button variant={darkPreview ? "secondary" : "ghost"} size="icon-sm" onClick={() => setDarkPreview((value) => !value)}><Moon className="size-4" /></Button><Button variant="ghost" size="icon-sm" onClick={() => toast.success("Preview refreshed")}><RefreshCw className="size-4" /></Button><Button variant="ghost" size="icon-sm" onClick={() => toast.success("Fullscreen preview opened")}><Fullscreen className="size-4" /></Button></div></div>
          <div className="h-[calc(100%-69px)] overflow-auto bg-secondary/50 p-3 sm:p-6"><div className="mx-auto origin-top transition-all duration-300" style={{ width: previewWidth, transform: `scale(${Number(zoom) / 100})`, transformOrigin: "top center" }}><StorefrontPreview styles={styles} page={previewPage} dark={darkPreview} shadow={shadowValue} /></div></div>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div className="space-y-4"><div><h2 className="font-display text-lg font-semibold">{title}</h2><p className="text-xs text-muted-foreground">{description}</p></div>{children}</div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div> }

function ColorField({ label, description, value, onChange }: { label: string; description?: string; value: string; onChange: (value: string) => void }) {
  return <div className="flex items-center gap-3"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="size-10 shrink-0 cursor-pointer rounded-lg border bg-transparent p-0.5" /><div className="min-w-0 flex-1"><Label className="text-xs">{label}</Label>{description && <p className="text-[10px] text-muted-foreground">{description}</p>}</div><Input value={value} onChange={(event) => onChange(event.target.value)} className="h-8 w-24 font-mono text-[11px] uppercase" /><Button variant="ghost" size="icon-sm" title={`Reset ${label}`} onClick={() => onChange((defaults as unknown as Record<string, string>)[colorGroups.find((item) => item.label === label)?.key ?? "primary"] ?? value)}><RotateCcw className="size-3" /></Button></div>;
}

function RangeField({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (value: number) => void }) {
  return <div className="space-y-2"><div className="flex items-center justify-between"><Label>{label}</Label><span className="rounded bg-secondary px-2 py-0.5 font-mono text-[11px]">{value}{unit}</span></div><input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} className="h-1.5 w-full cursor-pointer accent-primary" /></div>;
}

function UploadTile({ label, initials }: { label: string; initials: string }) { return <button onClick={() => toast.info(`${label} upload ready`)} className="flex flex-col items-center rounded-xl border border-dashed p-4 text-center transition-colors hover:border-primary hover:bg-primary/5"><div className="flex size-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">{initials}</div><span className="mt-2 text-xs font-medium">{label}</span><span className="text-[10px] text-muted-foreground">Click to replace</span></button> }

function StorefrontPreview({ styles, page, dark, shadow }: { styles: EnterpriseStyles; page: string; dark: boolean; shadow: string }) {
  const background = dark ? "#111827" : styles.background; const surface = dark ? "#1f2937" : styles.surface; const text = dark ? "#f8fafc" : styles.text; const muted = dark ? "#94a3b8" : styles.mutedText;
  return <div className="min-h-[690px] overflow-hidden border" style={{ background, color: text, fontFamily: styles.bodyFont, fontSize: styles.baseFontSize, lineHeight: styles.lineHeight, letterSpacing: styles.letterSpacing, borderRadius: styles.cardRadius, borderColor: styles.border, boxShadow: shadow, transition: styles.reducedMotion ? "none" : `all ${styles.animationSpeed}ms ease` }}><div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: styles.border }}><div className="flex items-center gap-2"><div className="flex size-8 items-center justify-center text-sm font-bold text-white" style={{ background: styles.primary, borderRadius: styles.buttonRadius }}>V</div><strong style={{ fontFamily: styles.headingFont }}>Vantage</strong></div><div className="hidden items-center gap-5 text-xs sm:flex"><span>New arrivals</span><span>Collections</span><span>About</span></div><div className="flex items-center gap-2"><Search className="size-4" /><div className="rounded-full px-2 py-0.5 text-[10px] text-white" style={{ background: styles.accent }}>2</div></div></div><main><section className="grid min-h-64 items-center gap-5 px-6 py-10 sm:grid-cols-2" style={{ background: `linear-gradient(135deg, ${styles.primary}18, ${styles.secondary}12)` }}><div><Badge className="mb-3 border-0 text-white" style={{ background: styles.accent }}>NEW COLLECTION</Badge><h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: styles.headingFont }}>{page === "Product" ? "Essential everyday carry." : page === "Collection" ? "Objects for modern living." : page === "Cart" ? "Your thoughtfully chosen items." : page === "Checkout" ? "Secure, simple checkout." : "Design your everyday."}</h2><p className="mt-3 max-w-sm text-sm" style={{ color: muted }}>Thoughtful essentials, beautifully made. Discover pieces designed to feel at home in your life.</p><div className="mt-5 flex gap-2"><button className="px-4 py-2 text-xs font-semibold text-white" style={{ background: styles.primary, borderRadius: styles.buttonRadius }}>Shop collection</button><button className="border px-4 py-2 text-xs font-semibold" style={{ borderColor: styles.border, borderRadius: styles.buttonRadius }}>Learn more</button></div></div><div className="relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden" style={{ background: `linear-gradient(145deg, ${styles.secondary}55, ${styles.primary}aa)`, borderRadius: styles.cardRadius, boxShadow: shadow }}><div className="absolute inset-8 rotate-6 rounded-[35%] bg-white/25" /><Sparkles className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 text-white/80" /></div></section><section style={{ padding: `${Math.min(styles.sectionPadding, 72)}px 24px` }}><div className="flex items-end justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: styles.primary }}>Curated for you</p><h3 className="mt-1 text-xl font-bold" style={{ fontFamily: styles.headingFont }}>Featured products</h3></div><span className="text-xs" style={{ color: muted }}>View all →</span></div><div className="mt-5 grid grid-cols-2 sm:grid-cols-3" style={{ gap: Math.min(styles.gridGap, 28) }}>{["Form Chair", "Arc Lamp", "Carry Tote"].map((name, index) => <article key={name} className="overflow-hidden border" style={{ background: surface, borderColor: styles.border, borderRadius: styles.cardRadius, boxShadow: shadow }}><div className="aspect-square" style={{ background: `linear-gradient(145deg, ${[styles.primary, styles.secondary, styles.accent][index]}18, ${[styles.primary, styles.secondary, styles.accent][index]}55)` }} /><div className="p-3"><p className="text-xs font-semibold">{name}</p><p className="mt-1 text-[10px]" style={{ color: muted }}>$128.00</p></div></article>)}</div></section></main></div>;
}
