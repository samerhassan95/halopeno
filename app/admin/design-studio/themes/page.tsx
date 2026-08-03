"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  Archive,
  ArrowDownToLine,
  BarChart3,
  CalendarClock,
  Check,
  ChevronDown,
  Clock3,
  Download,
  Eye,
  FileArchive,
  Gauge,
  GitCompareArrows,
  Globe2,
  LayoutGrid,
  List,
  Monitor,
  MoreHorizontal,
  Palette,
  Pencil,
  RefreshCw,
  Rocket,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  SwatchBook,
  Tablet,
  Upload,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api/client";
import { useLocalCollection } from "@/lib/hooks/use-local-collection";
import { THEME_REGISTRY, type ThemeDefinition as Theme, type ThemeStatus } from "@/lib/themes/registry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusStyles: Record<ThemeStatus, string> = {
  published: "border-success/20 bg-success/10 text-success",
  draft: "border-warning/20 bg-warning/10 text-warning-foreground",
  archived: "border-border bg-secondary text-muted-foreground",
};

const activity = [
  { icon: Rocket, title: "Halopeno Classic published", detail: "v4.8.2 deployed to Main Store", time: "2 min ago", tone: "bg-primary/10 text-primary" },
  { icon: RotateCcw, title: "Dark Harvest restored", detail: "Restored from automatic backup", time: "Yesterday", tone: "bg-info/10 text-info" },
  { icon: Palette, title: "Styles customized", detail: "Maya updated typography tokens", time: "2 days ago", tone: "bg-warning/10 text-warning-foreground" },
];

function ThemePreview({ theme, className }: { theme: Theme; className?: string }) {
  const colors = theme.colors ?? ["#6d28d9", "#c4b5fd", "#f5f3ff"];
  if (theme.previewImage) {
    return <div className={cn("relative overflow-hidden rounded-lg border bg-muted", className)}><Image src={theme.previewImage} alt={`${theme.name} storefront preview`} fill sizes="240px" className="object-cover" /></div>;
  }
  return (
    <div className={cn("relative overflow-hidden rounded-lg border bg-muted", className)} style={{ background: colors[2] }}>
      <div className="flex h-3 items-center gap-1 border-b border-black/5 bg-white/90 px-1.5">
        <span className="size-1 rounded-full bg-red-300" /><span className="size-1 rounded-full bg-amber-300" /><span className="size-1 rounded-full bg-emerald-300" />
      </div>
      <div className="flex h-[calc(100%-12px)]">
        <div className="w-[27%] p-1.5" style={{ background: colors[0] }}><div className="h-1 w-5 rounded bg-white/70" /><div className="mt-2 space-y-1"><div className="h-0.5 rounded bg-white/35" /><div className="h-0.5 rounded bg-white/25" /><div className="h-0.5 rounded bg-white/25" /></div></div>
        <div className="flex-1 p-2"><div className="h-2 w-3/5 rounded" style={{ background: colors[0] }} /><div className="mt-1 h-1 w-4/5 rounded bg-black/10" /><div className="mt-2 grid grid-cols-3 gap-1">{[0, 1, 2].map((n) => <div key={n} className="aspect-square rounded-sm bg-white shadow-sm"><div className="h-2/3 rounded-t-sm" style={{ background: `${colors[1]}90` }} /></div>)}</div></div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, accent }: { icon: React.ElementType; label: string; value: string; detail: string; accent: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="relative p-4">
        <div className={cn("absolute -right-5 -top-5 size-20 rounded-full opacity-10", accent)} />
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-bold tracking-tight">{value}</p></div><div className={cn("rounded-lg p-2", accent)}><Icon className="size-4" /></div></div>
        <p className="mt-2 text-[11px] text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function themeViewHref(theme: Theme) {
  return theme.previewPath ?? "/";
}

function formatThemeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function ThemeActions({ theme, activating, onApply }: { theme: Theme; activating: boolean; onApply: () => void }) {
  return <div className="flex flex-wrap items-center justify-end gap-1.5">
    <Button asChild variant="outline" size="sm"><Link href={themeViewHref(theme)} target="_blank" rel="noreferrer"><Eye className="size-3.5" />View</Link></Button>
    <Button variant={theme.active ? "secondary" : "default"} size="sm" disabled={theme.active || activating} onClick={onApply}><Rocket className="size-3.5" />{activating ? "Applying…" : theme.active ? "Applied" : "Apply"}</Button>
    <Button asChild variant="outline" size="sm"><Link href={`/admin/design-studio/themes/${theme.id}/editor`}><Pencil className="size-3.5" />Customize</Link></Button>
  </div>;
}

export default function ThemeLibraryPage() {
  const { items, update } = useLocalCollection<Theme>("design-studio-themes", THEME_REGISTRY);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [store, setStore] = React.useState("all");
  const [view, setView] = React.useState<"table" | "grid">("table");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [previewTheme, setPreviewTheme] = React.useState<Theme | null>(null);
  const [previewDevice, setPreviewDevice] = React.useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activatingId, setActivatingId] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    api.get<{ data: { id: string; group: string; key: string; value: { id?: string } }[] }>("/settings/settings?search=active_theme&limit=5")
      .then((response) => {
        const row = response.data.find((item) => item.group === "storefront" && item.key === "active_theme");
        if (row?.value?.id) setActiveId(row.value.id);
      })
      .catch(() => {});
  }, []);

  const enhanced = React.useMemo(() => {
    const saved = new Map(items.map((theme) => [theme.id, theme]));
    const registered = THEME_REGISTRY.map((theme) => ({ ...theme, ...saved.get(theme.id), active: activeId ? theme.id === activeId : (saved.get(theme.id)?.active ?? theme.active) }));
    return [...registered, ...items.filter((theme) => !THEME_REGISTRY.some((registeredTheme) => registeredTheme.id === theme.id))];
  }, [activeId, items]);

  const filtered = enhanced.filter((theme) => {
    const query = search.toLowerCase();
    return (!query || `${theme.name} ${theme.version} ${theme.updatedBy}`.toLowerCase().includes(query))
      && (status === "all" || theme.status === status)
      && (type === "all" || theme.type === type)
      && (store === "all" || theme.store === store);
  });

  const activeTheme = enhanced.find((theme) => theme.active) ?? enhanced[0];
  const drafts = enhanced.filter((theme) => theme.status === "draft").length;
  const published = enhanced.filter((theme) => theme.status === "published").length;
  const archived = enhanced.filter((theme) => theme.status === "archived").length;

  async function activate(theme: Theme) {
    setActivatingId(theme.id);
    try {
      const response = await api.get<{ data: { id: string; group: string; key: string }[] }>("/settings/settings?search=active_theme&limit=5");
      const row = response.data.find((item) => item.group === "storefront" && item.key === "active_theme");
      const value = { id: theme.id, deployedAt: new Date().toISOString(), deployedBy: "Sarah Kim" };
      if (row) await api.patch(`/settings/settings/${row.id}`, { value });
      else await api.post("/settings/settings", { group: "storefront", key: "active_theme", value });
      enhanced.forEach((item) => update(item.id, { active: item.id === theme.id, status: item.id === theme.id ? "published" : item.status }));
      setActiveId(theme.id);
      toast.success(`${theme.name} is now active`, { description: "The storefront design has been switched successfully." });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not activate theme");
    } finally {
      setActivatingId(null);
    }
  }

  function importTheme(file?: File) {
    if (!file) return;
    toast.success(`${file.name} uploaded`, { description: "Theme package validation has started." });
  }

  function clearFilters() { setSearch(""); setStatus("all"); setType("all"); setStore("all"); }
  const allSelected = filtered.length > 0 && filtered.every((theme) => selected.includes(theme.id));

  return (
    <div className="mx-auto flex max-w-[1680px] flex-col gap-5 pb-10">
      <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={(event) => importTheme(event.target.files?.[0])} />

      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="flex items-center gap-2"><div className="rounded-xl bg-primary/10 p-2 text-primary"><SwatchBook className="size-5" /></div><div><h1 className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">Theme Library</h1><p className="text-sm text-muted-foreground">Build, govern, and deploy storefront experiences from one workspace.</p></div></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="size-4" /> Upload ZIP</Button>
          <Button variant="outline" onClick={() => toast.success("Marketplace opened")}><ShoppingBag className="size-4" /> Marketplace</Button>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline"><MoreHorizontal className="size-4" /> More <ChevronDown className="size-3.5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => toast.success("Theme manifest exported")}><Download className="size-4" /> Export library</DropdownMenuItem><DropdownMenuItem onClick={() => toast.success("Library synchronized")}><RefreshCw className="size-4" /> Refresh data</DropdownMenuItem><DropdownMenuItem><Settings2 className="size-4" /> Library settings</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={LayoutGrid} label="Total themes" value={String(enhanced.length)} detail={`${published} published · ${drafts} drafts · ${archived} archived`} accent="bg-primary/10 text-primary" />
        <MetricCard icon={Globe2} label="Active storefront" value="Main Store" detail={`${activeTheme?.name ?? "No theme"} · ${activeTheme?.version ?? "—"}`} accent="bg-success/10 text-success" />
        <MetricCard icon={GitCompareArrows} label="Managed versions" value="18" detail="3 versions created this month" accent="bg-info/10 text-info" />
        <MetricCard icon={Clock3} label="Last deployment" value="2m ago" detail="Successful · deployed by Sarah Kim" accent="bg-warning/10 text-warning-foreground" />
      </div>

      <Tabs defaultValue="library" className="space-y-4">
        <div className="overflow-x-auto"><TabsList className="h-auto min-w-max"><TabsTrigger value="overview"><BarChart3 className="mr-1.5 size-4" />Overview</TabsTrigger><TabsTrigger value="library"><SwatchBook className="mr-1.5 size-4" />Theme library</TabsTrigger><TabsTrigger value="deployments"><Rocket className="mr-1.5 size-4" />Deployments</TabsTrigger><TabsTrigger value="marketplace"><ShoppingBag className="mr-1.5 size-4" />Marketplace</TabsTrigger></TabsList></div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="size-4 text-primary" />Publishing activity</CardTitle><CardDescription>Theme deployments during the last 12 weeks</CardDescription></CardHeader><CardContent><div className="flex h-52 items-end gap-2 sm:gap-3">{[31, 44, 28, 58, 48, 67, 54, 73, 61, 82, 70, 92].map((height, index) => <div key={index} className="group flex flex-1 flex-col items-center gap-2"><div className="relative flex h-40 w-full items-end rounded-md bg-secondary/60"><div className="w-full rounded-md bg-primary/75 transition-all group-hover:bg-primary" style={{ height: `${height}%` }} /></div><span className="text-[9px] text-muted-foreground">W{index + 1}</span></div>)}</div></CardContent></Card>
            <Card><CardHeader><CardTitle>Recent activity</CardTitle><CardDescription>Changes across every store</CardDescription></CardHeader><CardContent className="space-y-4">{activity.map((item) => <div key={item.title} className="flex gap-3"><div className={cn("mt-0.5 rounded-lg p-2", item.tone)}><item.icon className="size-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.title}</p><p className="truncate text-xs text-muted-foreground">{item.detail}</p></div><span className="whitespace-nowrap text-[10px] text-muted-foreground">{item.time}</span></div>)}</CardContent></Card>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[{ label: "Performance score", value: 96, detail: "+4 since last release", icon: Gauge, color: "text-success" }, { label: "Compatible themes", value: 80, detail: "4 of 5 themes ready", icon: ShieldCheck, color: "text-info" }, { label: "Customization coverage", value: 72, detail: "Tokens, templates & sections", icon: WandSparkles, color: "text-primary" }].map((metric) => <Card key={metric.label}><CardContent className="p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-medium">{metric.label}</p><p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p></div><metric.icon className={cn("size-5", metric.color)} /></div><div className="flex items-end gap-3"><span className="font-display text-3xl font-bold">{metric.value}</span><span className="mb-1 text-xs text-muted-foreground">/ 100</span></div><Progress value={metric.value} className="mt-3" /></CardContent></Card>)}
          </div>
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <Card><CardContent className="p-3 sm:p-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-center"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search themes, versions, or owners…" className="pl-9" /></div><div className="grid grid-cols-2 gap-2 sm:flex"><Select value={status} onValueChange={setStatus}><SelectTrigger className="min-w-32"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select><Select value={type} onValueChange={setType}><SelectTrigger className="min-w-32"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="Custom">Custom</SelectItem><SelectItem value="Marketplace">Marketplace</SelectItem><SelectItem value="System">System</SelectItem></SelectContent></Select><Select value={store} onValueChange={setStore}><SelectTrigger className="min-w-32"><SelectValue placeholder="Store" /></SelectTrigger><SelectContent><SelectItem value="all">All stores</SelectItem><SelectItem value="Main Store">Main Store</SelectItem><SelectItem value="EU Store">EU Store</SelectItem><SelectItem value="Outlet">Outlet</SelectItem></SelectContent></Select></div><div className="flex items-center justify-between gap-2"><Button variant="ghost" size="sm" onClick={clearFilters}><X className="size-3.5" /> Clear</Button><div className="flex rounded-lg border p-0.5"><Button variant={view === "table" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("table")} title="Table view"><List className="size-4" /></Button><Button variant={view === "grid" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("grid")} title="Grid view"><LayoutGrid className="size-4" /></Button></div></div></div></CardContent></Card>

          {selected.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm"><span className="font-medium">{selected.length} selected</span><Button size="sm" variant="outline" onClick={() => { selected.forEach((id) => update(id, { status: "archived", active: false })); setSelected([]); toast.success("Themes archived"); }}><Archive className="size-3.5" />Archive</Button><Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear selection</Button></div>}

          {filtered.length === 0 ? <Card><CardContent className="flex flex-col items-center py-16 text-center"><Search className="mb-3 size-8 text-muted-foreground" /><h3 className="font-display font-semibold">No themes found</h3><p className="mt-1 text-sm text-muted-foreground">Try changing your search or filters.</p><Button variant="outline" className="mt-4" onClick={clearFilters}>Reset filters</Button></CardContent></Card> : view === "table" ? (
            <Card className="overflow-hidden"><div className="overflow-x-auto"><Table><TableHeader className="sticky top-0 z-10 bg-card"><TableRow><TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={(checked) => setSelected(checked ? filtered.map((theme) => theme.id) : [])} /></TableHead><TableHead className="min-w-[260px]">Theme</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Store</TableHead><TableHead>Compatibility</TableHead><TableHead>Performance</TableHead><TableHead className="min-w-[150px]">Last updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((theme) => <TableRow key={theme.id} className={cn(theme.active && "bg-primary/[0.025]")}><TableCell><Checkbox checked={selected.includes(theme.id)} onCheckedChange={(checked) => setSelected((current) => checked ? [...current, theme.id] : current.filter((id) => id !== theme.id))} /></TableCell><TableCell><div className="flex items-center gap-3"><button onClick={() => setPreviewTheme(theme)} className="shrink-0 rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"><ThemePreview theme={theme} className="h-14 w-24" /></button><div><div className="flex items-center gap-2"><Link href={`/admin/design-studio/themes/${theme.id}/editor`} className="font-medium hover:text-primary hover:underline">{theme.name}</Link>{theme.active && <Badge className="border-primary/20 bg-primary/10 text-primary">Active</Badge>}</div><p className="mt-0.5 text-xs text-muted-foreground">{theme.version}</p></div></div></TableCell><TableCell><Badge variant="outline">{theme.type}</Badge></TableCell><TableCell><Badge variant="outline" className={cn("capitalize", statusStyles[theme.status])}>{theme.status}</Badge></TableCell><TableCell className="text-sm text-muted-foreground">{theme.store}</TableCell><TableCell>{theme.compatible ? <span className="inline-flex items-center gap-1.5 text-xs text-success"><Check className="size-3.5" />Ready</span> : <span className="text-xs text-warning-foreground">Update needed</span>}</TableCell><TableCell><div className="flex items-center gap-2"><Progress value={theme.performance} className="w-14" /><span className="text-xs font-medium">{theme.performance}</span></div></TableCell><TableCell><p className="text-sm">{formatThemeDate(theme.updatedAt)}</p><p className="text-xs text-muted-foreground">by {theme.updatedBy}</p></TableCell><TableCell className="text-right"><ThemeActions theme={theme} activating={activatingId === theme.id} onApply={() => void activate(theme)} /></TableCell></TableRow>)}</TableBody></Table></div><div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground"><span>Showing {filtered.length} of {enhanced.length} themes</span><span>Saved view: All themes</span></div></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((theme) => <Card key={theme.id} className={cn("overflow-hidden transition-shadow hover:shadow-md", theme.active && "ring-1 ring-primary")}><button className="block w-full p-3 pb-0" onClick={() => setPreviewTheme(theme)}><ThemePreview theme={theme} className="h-44 w-full" /></button><CardContent className="p-4"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><h3 className="font-display font-semibold">{theme.name}</h3>{theme.active && <Badge className="bg-primary text-primary-foreground">Active</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{theme.version} · {theme.type}</p></div></div><div className="mt-4 border-t pt-3"><ThemeActions theme={theme} activating={activatingId === theme.id} onApply={() => void activate(theme)} /></div></CardContent></Card>)}</div>
          )}
        </TabsContent>

        <TabsContent value="deployments"><div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"><Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>Deployment timeline</CardTitle><CardDescription>Release history across connected storefronts</CardDescription></div><Button onClick={() => toast.success("Deployment scheduled")}><CalendarClock className="size-4" />Schedule</Button></div></CardHeader><CardContent className="space-y-1">{[{ v: "v4.8.2", name: "Halopeno Classic", store: "Main Store", state: "Live", time: "Today, 14:42" }, { v: "v3.1.1", name: "Atelier Commerce", store: "EU Store", state: "Live", time: "Yesterday, 09:18" }, { v: "v4.8.1", name: "Halopeno Classic", store: "Main Store", state: "Replaced", time: "Jul 28, 16:04" }, { v: "v2.2.8", name: "Dark Harvest", store: "Preview", state: "Rolled back", time: "Jul 24, 11:32" }].map((release, index) => <div key={`${release.v}-${release.store}`} className="relative flex gap-4 py-4 pl-1"><div className="relative z-10 mt-1 flex size-7 items-center justify-center rounded-full border bg-card">{index === 0 ? <Zap className="size-3.5 text-success" /> : <Clock3 className="size-3.5 text-muted-foreground" />}</div>{index < 3 && <div className="absolute bottom-0 left-[18px] top-10 w-px bg-border" />}<div className="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:flex-row"><div><p className="text-sm font-medium">{release.name} <span className="text-muted-foreground">{release.v}</span></p><p className="text-xs text-muted-foreground">{release.store} · {release.time}</p></div><Badge variant="outline" className={release.state === "Live" ? "border-success/20 bg-success/10 text-success" : "self-start"}>{release.state}</Badge></div></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Deployment safeguards</CardTitle><CardDescription>Controls applied before every publish</CardDescription></CardHeader><CardContent className="space-y-4">{[{ icon: ShieldCheck, title: "Pre-flight checks", text: "Assets, routes, and compatibility" }, { icon: FileArchive, title: "Automatic backup", text: "Current theme saved before deploy" }, { icon: Users, title: "Approval workflow", text: "2 reviewers required for production" }, { icon: RotateCcw, title: "One-click rollback", text: "Last 10 releases available" }].map((item) => <div key={item.title} className="flex gap-3 rounded-lg border p-3"><item.icon className="mt-0.5 size-4 text-primary" /><div><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.text}</p></div></div>)}</CardContent></Card></div></TabsContent>

        <TabsContent value="marketplace"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[{ name: "Nordic Editorial", category: "Fashion", installs: "18.2k", score: 98, colors: ["#1c1917", "#a8a29e", "#fafaf9"] as [string,string,string] }, { name: "Neon Supply", category: "Technology", installs: "9.7k", score: 94, colors: ["#312e81", "#22d3ee", "#ecfeff"] as [string,string,string] }, { name: "Sage & Stone", category: "Home & Living", installs: "14.1k", score: 96, colors: ["#365314", "#bef264", "#f7fee7"] as [string,string,string] }].map((theme, index) => <Card key={theme.name} className="overflow-hidden"><div className="p-3 pb-0"><ThemePreview theme={{ ...THEME_REGISTRY[index], name: theme.name, colors: theme.colors }} className="h-40 w-full" /></div><CardContent className="p-4"><div className="flex justify-between"><div><h3 className="font-display font-semibold">{theme.name}</h3><p className="text-xs text-muted-foreground">{theme.category} · {theme.installs} installs</p></div><Badge variant="outline"><Gauge className="mr-1 size-3" />{theme.score}</Badge></div><Button className="mt-4 w-full" variant="outline" onClick={() => toast.success(`${theme.name} added as a draft`)}><ArrowDownToLine className="size-4" />Add to library</Button></CardContent></Card>)}</div></TabsContent>
      </Tabs>

      <Dialog open={Boolean(previewTheme)} onOpenChange={(open) => !open && setPreviewTheme(null)}><DialogContent className="max-w-5xl"><DialogHeader><div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-center sm:justify-between"><div><DialogTitle>{previewTheme?.name}</DialogTitle><DialogDescription>Responsive storefront preview · {previewTheme?.version}</DialogDescription></div><div className="flex rounded-lg border p-0.5">{([{ id: "desktop", icon: Monitor }, { id: "tablet", icon: Tablet }, { id: "mobile", icon: Smartphone }] as const).map((device) => <Button key={device.id} variant={previewDevice === device.id ? "secondary" : "ghost"} size="icon-sm" onClick={() => setPreviewDevice(device.id)}><device.icon className="size-4" /></Button>)}</div></div></DialogHeader><div className="flex min-h-[430px] items-center justify-center rounded-xl bg-secondary/60 p-4 sm:p-8"><ThemePreview theme={previewTheme ?? THEME_REGISTRY[0]} className={cn("max-h-[500px] shadow-xl transition-all duration-300", previewDevice === "desktop" && "aspect-[16/9] w-full", previewDevice === "tablet" && "aspect-[3/4] w-[390px]", previewDevice === "mobile" && "aspect-[9/18] w-[220px]")} /></div><DialogFooter><Button variant="outline" onClick={() => toast.success("RTL preview enabled")}><Globe2 className="size-4" />RTL preview</Button><Button asChild><Link href={`/admin/design-studio/themes/${previewTheme?.id}/editor`}><Pencil className="size-4" />Open editor</Link></Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
