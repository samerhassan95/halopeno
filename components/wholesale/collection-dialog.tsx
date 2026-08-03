"use client";
import * as React from "react";
import { MediaUploadField } from "@/components/ui/media-upload-field";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  ImagePlus,
  Link2,
  Loader2,
  PackageSearch,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
export interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  status: string;
}
interface Product {
  id: string;
  name: string;
  sku: string;
  type: string;
  status: string;
  regularPrice: string;
  stock: number;
  images?: { url: string }[];
  category?: { name: string } | null;
  brand?: { name: string } | null;
}
interface Rule {
  id: string;
  field: string;
  condition: string;
  value: string;
}
interface Extra {
  type: string;
  parentId: string;
  shortDescription: string;
  notes: string;
  desktopBanner: string;
  mobileBanner: string;
  icon: string;
  products: string[];
  rules: Rule[];
  match: string;
  include: string;
  exclude: string;
  featured: boolean;
  homepage: boolean;
  navigation: boolean;
  search: boolean;
  mobile: boolean;
  wholesale: boolean;
  publishMode: string;
  publishAt: string;
  expireAt: string;
  timezone: string;
  autoUnpublish: boolean;
  badge: string;
  badgeText: string;
  countdown: string;
  discount: string;
  discountType: string;
  coupon: string;
  cta: string;
  ctaLink: string;
  layout: string;
  sorting: string;
  perPage: string;
  showFilters: boolean;
  showCount: boolean;
  showRatings: boolean;
  showPrices: boolean;
  showStock: boolean;
  audience: string;
  seoTitle: string;
  metaDescription: string;
  canonical: string;
  openGraph: string;
  channels: string[];
  views: number;
  orders: number;
  revenue: number;
  conversion: number;
}
interface Form extends Extra {
  name: string;
  slug: string;
  description: string;
  image: string;
  status: string;
}
const defaults: Extra = {
  type: "Manual Collection",
  parentId: "",
  shortDescription: "",
  notes: "",
  desktopBanner: "",
  mobileBanner: "",
  icon: "",
  products: [],
  rules: [{ id: "rule-1", field: "Category", condition: "Equals", value: "" }],
  match: "all",
  include: "",
  exclude: "",
  featured: false,
  homepage: false,
  navigation: true,
  search: true,
  mobile: true,
  wholesale: false,
  publishMode: "immediate",
  publishAt: "",
  expireAt: "",
  timezone: "Africa/Cairo",
  autoUnpublish: false,
  badge: "None",
  badgeText: "",
  countdown: "",
  discount: "0",
  discountType: "Percentage",
  coupon: "",
  cta: "Shop collection",
  ctaLink: "",
  layout: "Grid",
  sorting: "Featured",
  perPage: "24",
  showFilters: true,
  showCount: true,
  showRatings: true,
  showPrices: true,
  showStock: false,
  audience: "Public",
  seoTitle: "",
  metaDescription: "",
  canonical: "",
  openGraph: "",
  channels: ["Website"],
  views: 0,
  orders: 0,
  revenue: 0,
  conversion: 0,
};
const blank: Form = {
  name: "",
  slug: "",
  description: "",
  image: "",
  status: "active",
  ...defaults,
};
const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const storage = (id: string) => `vantage-collection-admin:${id}`;
function read(id?: string) {
  if (!id || typeof window === "undefined") return defaults;
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem(storage(id)) || "{}"),
    };
  } catch {
    return defaults;
  }
}
export function CollectionDialog({
  open,
  onOpenChange,
  editing,
  collections,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: CollectionItem | null;
  collections: CollectionItem[];
  onSaved: (item: CollectionItem, editing: boolean) => void;
}) {
  const [form, setForm] = React.useState<Form>(blank),
    [initial, setInitial] = React.useState(""),
    [slugTouched, setSlugTouched] = React.useState(false),
    [saving, setSaving] = React.useState(false),
    [errors, setErrors] = React.useState<Record<string, string>>({}),
    [products, setProducts] = React.useState<Product[]>([]),
    [productQuery, setProductQuery] = React.useState(""),
    [panels, setPanels] = React.useState<Record<string, boolean>>({});
  const nameRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const task = window.setTimeout(() => {
      const next: Form = editing
        ? {
            ...blank,
            ...read(editing.id),
            name: editing.name,
            slug: editing.slug,
            description: editing.description || "",
            image: editing.image || "",
            status: editing.status,
          }
        : blank;
      setForm(next);
      setInitial(JSON.stringify(next));
      setSlugTouched(Boolean(editing));
      setErrors({});
      setPanels({});
      nameRef.current?.focus();
    }, 0);
    api
      .get<{ data: Product[] }>("/commerce/products?limit=100")
      .then((r) => setProducts(r.data))
      .catch(() => setProducts([]));
    return () => window.clearTimeout(task);
  }, [open, editing]);
  const dirty = initial !== "" && JSON.stringify(form) !== initial;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };
  function close() {
    if (dirty && !window.confirm("Discard your unsaved collection changes?"))
      return;
    onOpenChange(false);
  }
  function validate() {
    const e: Record<string, string> = {};
    const n = form.name.trim(),
      s = form.slug.trim();
    if (!n) e.name = "Collection name is required.";
    else if (n.length > 100) e.name = "Use 100 characters or fewer.";
    else if (
      collections.some(
        (c) => c.id !== editing?.id && c.name.toLowerCase() === n.toLowerCase(),
      )
    )
      e.name = "A collection with this name already exists.";
    if (!s) e.slug = "Slug is required.";
    else if (s !== s.toLowerCase() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))
      e.slug = "Use lowercase letters, numbers, and single hyphens.";
    else if (collections.some((c) => c.id !== editing?.id && c.slug === s))
      e.slug = "This slug is already in use.";
    setErrors(e);
    return !Object.keys(e).length;
  }
  async function save(mode: "normal" | "draft" | "another" = "normal") {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description || form.shortDescription || undefined,
        image: form.image || undefined,
        status: mode === "draft" ? "draft" : form.status,
      };
      const saved = editing
        ? await api.patch<CollectionItem>(
            `/commerce/collections/${editing.id}`,
            payload,
          )
        : await api.post<CollectionItem>("/commerce/collections", payload);
      const {
        name: _,
        slug: __,
        description: ___,
        image: ____,
        status: _____,
        ...admin
      } = form;
      localStorage.setItem(storage(saved.id), JSON.stringify(admin));
      onSaved(
        { ...saved, status: mode === "draft" ? "draft" : saved.status },
        Boolean(editing),
      );
      toast.success(`Collection ${editing ? "updated" : "created"}`);
      if (mode === "another") {
        setForm(blank);
        setInitial(JSON.stringify(blank));
        setSlugTouched(false);
      } else onOpenChange(false);
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Could not save collection",
      );
    } finally {
      setSaving(false);
    }
  }
  React.useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });
  async function upload(
    k: "image" | "desktopBanner" | "mobileBanner" | "icon",
    file?: File,
  ) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/svg+xml", "image/webp"].includes(
        file.type,
      )
    ) {
      setErrors((e) => ({ ...e, [k]: "Use JPG, PNG, SVG, or WebP." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((e) => ({ ...e, [k]: "Maximum file size is 5 MB." }));
      return;
    }
    try {
      const media = await api.upload<{ url: string }>(
        "/content/media-files/upload",
        file,
      );
      set(k, media.url);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [k]: error instanceof ApiError ? error.message : "Upload failed.",
      }));
    }
  }
  const selected = form.products
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];
  const matches = products.filter(
    (p) =>
      !productQuery ||
      [p.name, p.sku, p.category?.name, p.brand?.name].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(productQuery.toLowerCase()),
      ),
  );
  function move(index: number, direction: -1 | 1) {
    const next = [...form.products],
      target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set("products", next);
  }
  function panel(key: string) {
    setPanels((p) => ({ ...p, [key]: !p[key] }));
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (v ? onOpenChange(true) : close())}
    >
      <DialogContent
        className="flex max-h-[92vh] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <DialogHeader className="border-b px-5 py-4 pe-14 sm:px-6">
          <div className="flex gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderKanban className="size-4.5" />
            </span>
            <div>
              <DialogTitle>
                {editing ? "Edit Collection" : "Add Collection"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Build a curated or automated merchandising destination across
                every sales channel.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5">
              <Section
                title="Basic Information"
                description="Essential collection identity and merchandising context."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Collection Name"
                    required
                    error={errors.name}
                    counter={`${form.name.length}/100`}
                  >
                    <Input
                      ref={nameRef}
                      maxLength={100}
                      value={form.name}
                      onChange={(e) => {
                        set("name", e.target.value);
                        if (!slugTouched) set("slug", slugify(e.target.value));
                      }}
                      placeholder="e.g. Summer Essentials"
                    />
                  </Field>
                  <Field label="Slug" required error={errors.slug}>
                    <div className="relative">
                      <Link2 className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="ps-9"
                        value={form.slug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          set("slug", e.target.value);
                        }}
                        placeholder="summer-essentials"
                      />
                    </div>
                  </Field>
                  <Field label="Collection Type">
                    <Select
                      value={form.type}
                      onValueChange={(v) => set("type", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Manual Collection",
                          "Automated Collection",
                          "Featured Collection",
                          "Seasonal Collection",
                          "Promotional Collection",
                          "Brand Collection",
                          "Category Collection",
                          "Wholesale Collection",
                          "Digital Collection",
                          "Auction Collection",
                          "Custom Collection",
                        ].map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Parent Collection">
                    <Select
                      value={form.parentId || "none"}
                      onValueChange={(v) =>
                        set("parentId", v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No parent</SelectItem>
                        {collections
                          .filter((c) => c.id !== editing?.id)
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field
                    className="sm:col-span-2"
                    label="Short Description"
                    counter={`${form.shortDescription.length}/160`}
                  >
                    <Textarea
                      rows={2}
                      maxLength={160}
                      value={form.shortDescription}
                      onChange={(e) => set("shortDescription", e.target.value)}
                    />
                  </Field>
                  <Field
                    className="sm:col-span-2"
                    label="Description"
                    counter={`${form.description.length}/800`}
                  >
                    <Textarea
                      rows={4}
                      maxLength={800}
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                    />
                  </Field>
                  <Field className="sm:col-span-2" label="Internal Notes">
                    <Textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      placeholder="Visible only to administrators"
                    />
                  </Field>
                </div>
              </Section>
              <Section
                title="Collection Media"
                description="Responsive creative assets for cards, desktop, and mobile."
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <ImageField
                    label="Thumbnail"
                    value={form.image}
                    error={errors.image}
                    onFile={(f) => upload("image", f)}
                    onRemove={() => set("image", "")}
                  />
                  <ImageField
                    label="Desktop Banner"
                    value={form.desktopBanner}
                    onFile={(f) => upload("desktopBanner", f)}
                    onRemove={() => set("desktopBanner", "")}
                  />
                  <ImageField
                    label="Mobile Banner"
                    value={form.mobileBanner}
                    onFile={(f) => upload("mobileBanner", f)}
                    onRemove={() => set("mobileBanner", "")}
                  />
                  <ImageField
                    label="Collection Icon"
                    value={form.icon}
                    onFile={(f) => upload("icon", f)}
                    onRemove={() => set("icon", "")}
                  />
                </div>
              </Section>
              <Expandable
                title="Products"
                description={`${selected.length} manually assigned products`}
                open={Boolean(panels.products)}
                onOpenChange={() => panel("products")}
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <div className="relative mb-3">
                      <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="ps-9"
                        value={productQuery}
                        onChange={(e) => setProductQuery(e.target.value)}
                        placeholder="Search product, SKU, category, brand…"
                      />
                    </div>
                    <div className="max-h-72 space-y-2 overflow-y-auto">
                      {matches.map((p) => (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border p-3"
                        >
                          <Checkbox
                            checked={form.products.includes(p.id)}
                            onCheckedChange={(checked) =>
                              set(
                                "products",
                                checked
                                  ? [...form.products, p.id]
                                  : form.products.filter((id) => id !== p.id),
                              )
                            }
                          />
                          {p.images?.[0]?.url ? (
                            <img
                              src={p.images[0].url}
                              alt=""
                              className="size-9 rounded-lg object-cover"
                            />
                          ) : (
                            <PackageSearch className="size-5 text-muted-foreground" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {p.sku} · {p.type}
                            </p>
                          </div>
                          <p className="text-xs font-semibold">
                            {formatCurrency(Number(p.regularPrice))}
                          </p>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 text-sm font-semibold">
                      Selected product order
                    </p>
                    <div className="space-y-2">
                      {selected.length ? (
                        selected.map((p, i) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-2 rounded-xl border p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {p.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                Stock {p.stock}
                              </p>
                            </div>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => move(i, -1)}
                            >
                              <ChevronUp />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => move(i, 1)}
                            >
                              <ChevronDown />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() =>
                                set(
                                  "products",
                                  form.products.filter((id) => id !== p.id),
                                )
                              }
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                          No products assigned
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Expandable>
              {form.type === "Automated Collection" && (
                <Expandable
                  title="Automated Rules"
                  description={`Live preview: ${products.length} catalog products available`}
                  open={Boolean(panels.rules)}
                  onOpenChange={() => panel("rules")}
                >
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Select
                        value={form.match}
                        onValueChange={(v) => set("match", v)}
                      >
                        <SelectTrigger className="w-52">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Match all rules</SelectItem>
                          <SelectItem value="any">Match any rule</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={() =>
                          set("rules", [
                            ...form.rules,
                            {
                              id: crypto.randomUUID(),
                              field: "Category",
                              condition: "Equals",
                              value: "",
                            },
                          ])
                        }
                      >
                        <Plus />
                        Add rule
                      </Button>
                    </div>
                    {form.rules.map((r, i) => (
                      <div
                        key={r.id}
                        className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]"
                      >
                        <Select
                          value={r.field}
                          onValueChange={(v) =>
                            set(
                              "rules",
                              form.rules.map((x, n) =>
                                n === i ? { ...x, field: v } : x,
                              ),
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "Category",
                              "Brand",
                              "Product Type",
                              "Tags",
                              "Price",
                              "Sale Price",
                              "Stock",
                              "Rating",
                              "Sales Count",
                              "Created Date",
                              "Vendor",
                              "Status",
                              "Featured Products",
                            ].map((v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={r.condition}
                          onValueChange={(v) =>
                            set(
                              "rules",
                              form.rules.map((x, n) =>
                                n === i ? { ...x, condition: v } : x,
                              ),
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "Equals",
                              "Not Equals",
                              "Greater Than",
                              "Less Than",
                              "Between",
                              "Contains",
                              "Starts With",
                              "Ends With",
                            ].map((v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={r.value}
                          onChange={(e) =>
                            set(
                              "rules",
                              form.rules.map((x, n) =>
                                n === i ? { ...x, value: e.target.value } : x,
                              ),
                            )
                          }
                          placeholder="Rule value"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            set(
                              "rules",
                              form.rules.filter((_, n) => n !== i),
                            )
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ))}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Always Include Products">
                        <Input
                          value={form.include}
                          onChange={(e) => set("include", e.target.value)}
                          placeholder="Product IDs or SKUs"
                        />
                      </Field>
                      <Field label="Exclude Products">
                        <Input
                          value={form.exclude}
                          onChange={(e) => set("exclude", e.target.value)}
                          placeholder="Product IDs or SKUs"
                        />
                      </Field>
                    </div>
                  </div>
                </Expandable>
              )}
              <Expandable
                title="Visibility & Channels"
                description="Publication status, audiences, and sales channels."
                open={Boolean(panels.visibility)}
                onOpenChange={() => panel("visibility")}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Status">
                    <Select
                      value={form.status}
                      onValueChange={(v) => set("status", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "draft",
                          "active",
                          "scheduled",
                          "hidden",
                          "archived",
                        ].map((v) => (
                          <SelectItem key={v} value={v}>
                            {v[0].toUpperCase() + v.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Customer Visibility">
                    <Select
                      value={form.audience}
                      onValueChange={(v) => set("audience", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Public",
                          "Logged-in Customers",
                          "Customer Groups",
                          "Wholesale Customers",
                          "Members Only",
                          "Private",
                        ].map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  {[
                    ["Featured Collection", "featured"],
                    ["Show on Homepage", "homepage"],
                    ["Show in Navigation", "navigation"],
                    ["Show in Search", "search"],
                    ["Show in Mobile App", "mobile"],
                    ["Show in Wholesale Portal", "wholesale"],
                  ].map(([label, k]) => (
                    <Toggle
                      key={k}
                      label={label}
                      value={Boolean(form[k as "featured"])}
                      onChange={(v) => set(k as "featured", v)}
                    />
                  ))}
                  <div className="sm:col-span-2">
                    <Label>Multi-Channel Availability</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[
                        "Website",
                        "Mobile App",
                        "POS",
                        "Marketplace",
                        "Wholesale Portal",
                        "Future Sales Channels",
                      ].map((v) => (
                        <button
                          type="button"
                          key={v}
                          onClick={() =>
                            set(
                              "channels",
                              form.channels.includes(v)
                                ? form.channels.filter((x) => x !== v)
                                : [...form.channels, v],
                            )
                          }
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs",
                            form.channels.includes(v) &&
                              "border-primary bg-primary/10 text-primary",
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Expandable>
              <Expandable
                title="Scheduling"
                description="Publish immediately or coordinate a timed campaign."
                open={Boolean(panels.schedule)}
                onOpenChange={() => panel("schedule")}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Publication">
                    <Select
                      value={form.publishMode}
                      onValueChange={(v) => set("publishMode", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">
                          Publish Immediately
                        </SelectItem>
                        <SelectItem value="scheduled">
                          Schedule Publication
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Timezone">
                    <Input
                      value={form.timezone}
                      onChange={(e) => set("timezone", e.target.value)}
                    />
                  </Field>
                  <Field label="Publish Date & Time">
                    <Input
                      type="datetime-local"
                      value={form.publishAt}
                      onChange={(e) => set("publishAt", e.target.value)}
                    />
                  </Field>
                  <Field label="Expiration Date & Time">
                    <Input
                      type="datetime-local"
                      value={form.expireAt}
                      onChange={(e) => set("expireAt", e.target.value)}
                    />
                  </Field>
                  <Toggle
                    label="Automatically Unpublish"
                    value={form.autoUnpublish}
                    onChange={(v) => set("autoUnpublish", v)}
                  />
                </div>
              </Expandable>
              <Expandable
                title="Promotions"
                description="Badge, countdown, discount, coupon, and call-to-action."
                open={Boolean(panels.promo)}
                onOpenChange={() => panel("promo")}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Promotional Badge">
                    <Select
                      value={form.badge}
                      onValueChange={(v) => set("badge", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "None",
                          "New",
                          "Sale",
                          "Best Seller",
                          "Limited Edition",
                          "Black Friday",
                          "Summer Sale",
                        ].map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Badge Text">
                    <Input
                      value={form.badgeText}
                      onChange={(e) => set("badgeText", e.target.value)}
                    />
                  </Field>
                  <Field label="Countdown Timer">
                    <Input
                      type="datetime-local"
                      value={form.countdown}
                      onChange={(e) => set("countdown", e.target.value)}
                    />
                  </Field>
                  <Field label="Coupon Code">
                    <Input
                      value={form.coupon}
                      onChange={(e) => set("coupon", e.target.value)}
                    />
                  </Field>
                  <Field label="Collection Discount">
                    <Input
                      type="number"
                      value={form.discount}
                      onChange={(e) => set("discount", e.target.value)}
                    />
                  </Field>
                  <Field label="Discount Type">
                    <Select
                      value={form.discountType}
                      onValueChange={(v) => set("discountType", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Percentage">Percentage</SelectItem>
                        <SelectItem value="Fixed Amount">
                          Fixed Amount
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Call-to-Action Text">
                    <Input
                      value={form.cta}
                      onChange={(e) => set("cta", e.target.value)}
                    />
                  </Field>
                  <Field label="Call-to-Action Link">
                    <Input
                      value={form.ctaLink}
                      onChange={(e) => set("ctaLink", e.target.value)}
                    />
                  </Field>
                </div>
              </Expandable>
              <Expandable
                title="Display Settings"
                description="Layout, sorting, pagination, and product-card details."
                open={Boolean(panels.display)}
                onOpenChange={() => panel("display")}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Layout">
                    <Select
                      value={form.layout}
                      onValueChange={(v) => set("layout", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Grid", "List", "Carousel", "Masonry"].map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Default Sorting">
                    <Select
                      value={form.sorting}
                      onValueChange={(v) => set("sorting", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Featured",
                          "Best Selling",
                          "Newest",
                          "Highest Rated",
                          "Price Low to High",
                          "Price High to Low",
                        ].map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Products Per Page">
                    <Input
                      type="number"
                      value={form.perPage}
                      onChange={(e) => set("perPage", e.target.value)}
                    />
                  </Field>
                  <div />
                  {[
                    ["Show Filters", "showFilters"],
                    ["Show Product Count", "showCount"],
                    ["Show Ratings", "showRatings"],
                    ["Show Prices", "showPrices"],
                    ["Show Stock Status", "showStock"],
                  ].map(([label, k]) => (
                    <Toggle
                      key={k}
                      label={label}
                      value={Boolean(form[k as "showFilters"])}
                      onChange={(v) => set(k as "showFilters", v)}
                    />
                  ))}
                </div>
              </Expandable>
              <Expandable
                title="SEO Settings"
                description="Search metadata, canonical URL, and Open Graph preview."
                open={Boolean(panels.seo)}
                onOpenChange={() => panel("seo")}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    className="sm:col-span-2"
                    label="SEO Title"
                    counter={`${form.seoTitle.length}/60`}
                  >
                    <Input
                      maxLength={60}
                      value={form.seoTitle}
                      onChange={(e) => set("seoTitle", e.target.value)}
                    />
                  </Field>
                  <Field
                    className="sm:col-span-2"
                    label="Meta Description"
                    counter={`${form.metaDescription.length}/160`}
                  >
                    <Textarea
                      rows={3}
                      maxLength={160}
                      value={form.metaDescription}
                      onChange={(e) => set("metaDescription", e.target.value)}
                    />
                  </Field>
                  <Field label="Canonical URL">
                    <Input
                      value={form.canonical}
                      onChange={(e) => set("canonical", e.target.value)}
                    />
                  </Field>
                  <MediaUploadField
                    label="Open Graph Image"
                    value={form.openGraph}
                    onChange={(url) => set("openGraph", url)}
                  />
                </div>
              </Expandable>
            </div>
            <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
              <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="h-32 bg-gradient-to-br from-primary to-accent">
                  {form.desktopBanner && (
                    <img
                      src={form.desktopBanner}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  {form.image && (
                    <img
                      src={form.image}
                      alt=""
                      className="mb-3 size-14 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">
                      {form.name || "Collection preview"}
                    </h3>
                    {form.badge !== "None" && (
                      <Badge variant="warning">
                        {form.badgeText || form.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                    {form.shortDescription ||
                      "Your merchandising story will appear here."}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span>{selected.length} products</span>
                    <Badge
                      variant={
                        form.status === "active" ? "success" : "secondary"
                      }
                    >
                      {form.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recently used
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {collections.slice(0, 5).map((c) => (
                    <Badge key={c.id} variant="outline">
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </div>
              {editing && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Products", value: selected.length },
                    { label: "Views", value: formatNumber(form.views) },
                    { label: "Orders", value: formatNumber(form.orders) },
                    { label: "Revenue", value: formatCurrency(form.revenue) },
                    { label: "Conversion", value: `${form.conversion}%` },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border p-3">
                      <BarChart3 className="mb-2 size-3.5 text-primary" />
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="font-bold">{m.value}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-2xl border bg-primary/[.03] p-4 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Keyboard shortcut
                </p>
                <p className="mt-1">Press ⌘/Ctrl + Enter to save.</p>
              </div>
            </aside>
          </div>
        </div>
        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t bg-background/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => save("draft")}
              disabled={saving}
            >
              Save as Draft
            </Button>
            <Button onClick={() => save()} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}Save
              Collection
            </Button>
            <Button
              variant="secondary"
              onClick={() => save("another")}
              disabled={saving}
            >
              <Plus />
              Save & Add Another
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="mb-4 mt-0.5 text-xs text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}
function Field({
  label,
  required,
  error,
  counter,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  counter?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between gap-2">
        <Label>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
        {counter && (
          <span className="text-[10px] text-muted-foreground">{counter}</span>
        )}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-3">
      <Label>{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
function Expandable({
  title,
  description,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="rounded-2xl border bg-card shadow-sm"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-start sm:p-5">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t p-4 sm:p-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
function ImageField({
  label,
  value,
  error,
  onFile,
  onRemove,
}: {
  label: string;
  value: string;
  error?: string;
  onFile: (f?: File) => void;
  onRemove: () => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div
        className={cn(
          "group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-dashed bg-secondary/30",
          error && "border-destructive",
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files[0]);
        }}
      >
        {value ? (
          <>
            <img src={value} alt="" className="size-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => ref.current?.click()}
              >
                Replace
              </Button>
              <Button size="sm" variant="secondary">
                Crop
              </Button>
              <Button size="icon-sm" variant="destructive" onClick={onRemove}>
                <Trash2 />
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="flex size-full flex-col items-center justify-center"
            onClick={() => ref.current?.click()}
          >
            <ImagePlus className="mb-2 size-5 text-primary" />
            <span className="text-xs">Drop or browse</span>
          </button>
        )}
        <input
          ref={ref}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/svg+xml,image/webp"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
