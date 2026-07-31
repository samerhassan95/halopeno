"use client";

import * as React from "react";
import { Building2, FolderTree, Layers3, MoreHorizontal, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { BrandDialog } from "@/components/wholesale/brand-dialog";
import { CategoryDialog } from "@/components/wholesale/category-dialog";
import { CollectionDialog } from "@/components/wholesale/collection-dialog";

type ResourceKind = "category" | "brand" | "collection";
interface DirectoryItem { id: string; name: string; slug: string; description?: string | null; image?: string | null; logo?: string | null; website?: string | null; status: string; parentId?: string | null; displayOrder?: number; isFeatured?: boolean; }

const resourceConfig = {
  category: { title: "Wholesale Categories", singular: "Category", endpoint: "/commerce/categories", icon: FolderTree },
  brand: { title: "Wholesale Brands", singular: "Brand", endpoint: "/commerce/brands", icon: Building2 },
  collection: { title: "Wholesale Collections", singular: "Collection", endpoint: "/commerce/collections", icon: Layers3 },
};

export function WholesaleDirectory({ kind, scope = "Wholesale" }: { kind: ResourceKind; scope?: "Wholesale" | "Digital" | "Auction" }) {
  const config = resourceConfig[kind];
  const Icon = config.icon;
  const [items, setItems] = React.useState<DirectoryItem[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DirectoryItem | null>(null);
  const [form, setForm] = React.useState({ name: "", description: "", image: "", website: "", status: "active", parentId: "", displayOrder: "0", featured: false });

  React.useEffect(() => {
    api.get<{ data: DirectoryItem[] }>(`${config.endpoint}?limit=100`).then((res) => setItems(res.data)).catch(() => setItems([])).finally(() => setLoading(false));
  }, [config.endpoint]);

  function openForm(item?: DirectoryItem) {
    setEditing(item ?? null);
    setForm(item ? { name: item.name, description: item.description ?? "", image: item.image ?? item.logo ?? "", website: item.website ?? "", status: item.status, parentId: item.parentId ?? "", displayOrder: String(item.displayOrder ?? 0), featured: item.isFeatured ?? false } : { name: "", description: "", image: "", website: "", status: "active", parentId: "", displayOrder: "0", featured: false });
    setDialogOpen(true);
  }

  async function save() {
    const payload = { name: form.name, slug: `${form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}-${editing ? editing.id.slice(-4) : Date.now().toString().slice(-5)}`, description: form.description || undefined, status: form.status, ...(kind === "brand" ? { logo: form.image || undefined, website: form.website || undefined, isFeatured: form.featured } : kind === "category" ? { image: form.image || undefined, parentId: form.parentId || undefined, displayOrder: Number(form.displayOrder), isFeatured: form.featured } : { image: form.image || undefined }) };
    try {
      const saved = editing ? await api.patch<DirectoryItem>(`${config.endpoint}/${editing.id}`, payload) : await api.post<DirectoryItem>(config.endpoint, payload);
      setItems((current) => editing ? current.map((item) => item.id === editing.id ? saved : item) : [saved, ...current]);
      setDialogOpen(false); toast.success(`${config.singular} ${editing ? "updated" : "created"}`);
    } catch (error) { toast.error(error instanceof ApiError ? error.message : `Could not save ${config.singular.toLowerCase()}`); }
  }

  const filtered = items.filter((item) => !query || item.name.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold">{config.title.replace("Wholesale", scope)}</h2><p className="text-sm text-muted-foreground">Organize the {scope.toLowerCase()} catalog for faster discovery and merchandising.</p></div><Button onClick={() => openForm()}><Plus className="size-4" />Add {config.singular}</Button></div>
    <Card className="overflow-hidden"><div className="border-b border-border p-4"><div className="relative max-w-sm"><Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} className="ps-9" /></div></div>
      {loading ? <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary" />)}</div> : filtered.length === 0 ? <div className="flex flex-col items-center gap-2 py-16 text-center"><Icon className="size-10 text-muted-foreground/50" /><p className="font-semibold">No {config.title.toLowerCase()} found</p><p className="text-sm text-muted-foreground">Create one to start organizing your wholesale catalog.</p></div> : <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <div key={item.id} className="group flex items-start gap-3 rounded-[14px] border border-border p-4 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]">{item.image || item.logo ? <img src={item.image ?? item.logo ?? ""} alt="" className="size-12 rounded-xl border object-cover" /> : <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>}<div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate font-semibold">{item.name}</p>{item.isFeatured && <Star className="size-3.5 fill-warning text-warning" />}</div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description || "No description provided"}</p><Badge className="mt-2" variant={item.status === "active" ? "success" : "secondary"}>{item.status}</Badge></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => openForm(item)}><Pencil />Edit</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={async () => { try { await api.delete(`${config.endpoint}/${item.id}`); setItems((current) => current.filter((currentItem) => currentItem.id !== item.id)); toast.success(`${config.singular} deleted`); } catch { toast.error("Delete failed"); } }}><Trash2 />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>)}</div>}
    </Card>
    {kind === "brand" ? <BrandDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} brands={items} onSaved={(saved, wasEditing) => setItems((current) => wasEditing ? current.map((item) => item.id === saved.id ? {...item,...saved} : item) : [{...saved}, ...current])} /> : kind === "category" ? <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} categories={items} onSaved={(saved, wasEditing) => setItems((current) => wasEditing ? current.map((item) => item.id === saved.id ? {...item,...saved} : item) : [{...saved},...current])} /> : <CollectionDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} collections={items} onSaved={(saved,wasEditing)=>setItems(current=>wasEditing?current.map(item=>item.id===saved.id?{...item,...saved}:item):[{...saved},...current])}/>} 
  </div>;
}
