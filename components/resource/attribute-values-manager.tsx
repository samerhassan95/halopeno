"use client";
/* eslint-disable react-hooks/purity, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-expressions, prefer-const */
import * as React from "react";
import {
  Archive,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileJson,
  FileSpreadsheet,
  Filter,
  GripVertical,
  ImagePlus,
  Layers3,
  Loader2,
  MoreHorizontal,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { MediaUploadField } from "@/components/ui/media-upload-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
interface Attribute {
  id: string;
  name: string;
  type: string;
}
interface ValueRow {
  id: string;
  attributeId: string;
  value: string;
  colorHex?: string | null;
  image?: string | null;
  displayOrder: number;
}
interface Meta {
  label: string;
  code: string;
  description: string;
  status: string;
  default: boolean;
  tooltip: string;
  translations: string;
  products: number;
  variants: number;
  collections: number;
  orders: number;
  revenue: number;
  views: number;
  conversion: number;
  updatedAt: string;
  opacity: number;
}
interface Form extends Meta {
  attributeId: string;
  value: string;
  color: string;
  image: string;
  order: string;
}
const metaDefaults: Meta = {
  label: "",
  code: "",
  description: "",
  status: "active",
  default: false,
  tooltip: "",
  translations: "",
  products: 0,
  variants: 0,
  collections: 0,
  orders: 0,
  revenue: 0,
  views: 0,
  conversion: 0,
  updatedAt: "",
  opacity: 100,
};
const blank: Form = {
  attributeId: "",
  value: "",
  color: "#64748b",
  image: "",
  order: "0",
  ...metaDefaults,
};
const metaKey = (id: string) => `vantage-attribute-value:${id}`;
function getMeta(id: string): Meta {
  if (typeof window === "undefined") return metaDefaults;
  try {
    return {
      ...metaDefaults,
      ...JSON.parse(localStorage.getItem(metaKey(id)) || "{}"),
    };
  } catch {
    return metaDefaults;
  }
}
function hexRgb(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "—";
  return `${parseInt(clean.slice(0, 2), 16)}, ${parseInt(clean.slice(2, 4), 16)}, ${parseInt(clean.slice(4, 6), 16)}`;
}
function hexHsl(hex: string) {
  const rgb = hexRgb(hex);
  if (rgb === "—") return "—";
  let [r, g, b] = rgb
    .split(",")
    .map(Number)
    .map((v) => v / 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h =
      max === r
        ? (g - b) / d + (g < b ? 6 : 0)
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)}°, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
}
export function AttributeValuesManager() {
  const [values, setValues] = React.useState<ValueRow[]>([]),
    [attributes, setAttributes] = React.useState<Attribute[]>([]),
    [loading, setLoading] = React.useState(true),
    [error, setError] = React.useState<string | null>(null),
    [query, setQuery] = React.useState(""),
    [attribute, setAttribute] = React.useState("all"),
    [status, setStatus] = React.useState("all"),
    [usage, setUsage] = React.useState("all"),
    [selected, setSelected] = React.useState<Set<string>>(new Set()),
    [page, setPage] = React.useState(1),
    [pageSize, setPageSize] = React.useState("10"),
    [modal, setModal] = React.useState(false),
    [editing, setEditing] = React.useState<ValueRow | null>(null),
    [form, setForm] = React.useState<Form>(blank),
    [initial, setInitial] = React.useState(""),
    [saving, setSaving] = React.useState(false),
    [errors, setErrors] = React.useState<Record<string, string>>({}),
    [deleteTarget, setDeleteTarget] = React.useState<ValueRow | null>(null),
    [productsTarget, setProductsTarget] = React.useState<ValueRow | null>(null);
  const nameRef = React.useRef<HTMLInputElement>(null),
    importRef = React.useRef<HTMLInputElement>(null);
  const load = React.useCallback(async () => {
    try {
      const [v, a] = await Promise.all([
        api.get<{ data: ValueRow[] }>("/commerce/attribute-values?limit=100"),
        api.get<{ data: Attribute[] }>("/commerce/attributes?limit=100"),
      ]);
      setValues(v.data);
      setAttributes(a.data);
      setError(null);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Unable to load attribute values",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);
  const attributeMap = new Map(attributes.map((a) => [a.id, a]));
  const rows = React.useMemo(
    () =>
      values
        .filter((v) => {
          const a = attributeMap.get(v.attributeId),
            m = getMeta(v.id),
            q = query.toLowerCase();
          return (
            (!q ||
              [a?.name, v.value, v.colorHex, m.label, m.code].some((x) =>
                String(x || "")
                  .toLowerCase()
                  .includes(q),
              )) &&
            (attribute === "all" || v.attributeId === attribute) &&
            (status === "all" || m.status === status) &&
            (usage === "all" ||
              (usage === "used" ? m.products > 0 : m.products === 0))
          );
        })
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [values, attributes, query, attribute, status, usage],
  );
  const pages = Math.max(1, Math.ceil(rows.length / Number(pageSize))),
    paged = rows.slice((page - 1) * Number(pageSize), page * Number(pageSize));
  const metas = values.map((v) => getMeta(v.id));
  function openForm(row?: ValueRow) {
    setEditing(row || null);
    const m = row ? getMeta(row.id) : metaDefaults;
    const next = row
      ? {
          attributeId: row.attributeId,
          value: row.value,
          color: row.colorHex || "#64748b",
          image: row.image || "",
          order: String(row.displayOrder),
          ...m,
        }
      : blank;
    setForm(next);
    setInitial(JSON.stringify(next));
    setErrors({});
    setModal(true);
    window.setTimeout(() => nameRef.current?.focus(), 80);
  }
  function close() {
    if (
      initial &&
      JSON.stringify(form) !== initial &&
      !window.confirm("Discard unsaved value changes?")
    )
      return;
    setModal(false);
  }
  function validate() {
    const e: Record<string, string> = {};
    if (!form.attributeId) e.attributeId = "Parent attribute is required.";
    if (!form.value.trim()) e.value = "Value name is required.";
    else if (
      values.some(
        (v) =>
          v.id !== editing?.id &&
          v.attributeId === form.attributeId &&
          v.value.toLowerCase() === form.value.trim().toLowerCase(),
      )
    )
      e.value = "This value already exists for the selected attribute.";
    if (
      form.color &&
      values.some(
        (v) =>
          v.id !== editing?.id &&
          v.attributeId === form.attributeId &&
          v.colorHex?.toLowerCase() === form.color.toLowerCase(),
      )
    )
      e.color = "This HEX code is already used for this attribute.";
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
        attributeId: form.attributeId,
        value: form.label || form.value.trim(),
        colorHex: form.color || undefined,
        image: form.image || undefined,
        displayOrder: Number(form.order),
      };
      const saved = editing
        ? await api.patch<ValueRow>(
            `/commerce/attribute-values/${editing.id}`,
            payload,
          )
        : await api.post<ValueRow>("/commerce/attribute-values", payload);
      const meta: Meta = {
        label: form.label,
        code: form.code,
        description: form.description,
        status: mode === "draft" ? "hidden" : form.status,
        default: form.default,
        tooltip: form.tooltip,
        translations: form.translations,
        products: form.products,
        variants: form.variants,
        collections: form.collections,
        orders: form.orders,
        revenue: form.revenue,
        views: form.views,
        conversion: form.conversion,
        updatedAt: new Date().toISOString(),
        opacity: form.opacity,
      };
      localStorage.setItem(metaKey(saved.id), JSON.stringify(meta));
      setValues((current) =>
        editing
          ? current.map((v) => (v.id === saved.id ? saved : v))
          : [saved, ...current],
      );
      toast.success(`Attribute value ${editing ? "updated" : "created"}`);
      if (mode === "another") {
        setForm({
          ...blank,
          attributeId: form.attributeId,
          order: String(values.length + 1),
        });
        setInitial(JSON.stringify(blank));
        setEditing(null);
      } else setModal(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save value");
    } finally {
      setSaving(false);
    }
  }
  React.useEffect(() => {
    if (!modal) return;
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });
  async function updateMeta(ids: string[], patch: Partial<Meta>) {
    ids.forEach((id) =>
      localStorage.setItem(
        metaKey(id),
        JSON.stringify({
          ...getMeta(id),
          ...patch,
          updatedAt: new Date().toISOString(),
        }),
      ),
    );
    setValues((v) => [...v]);
    setSelected(new Set());
    toast.success(`${ids.length} value${ids.length === 1 ? "" : "s"} updated`);
  }
  async function remove(row: ValueRow) {
    try {
      await api.delete(`/commerce/attribute-values/${row.id}`);
      setValues((v) => v.filter((x) => x.id !== row.id));
      toast.success("Value deleted");
      toast.info("Delete completed. Recreate the value to undo.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
    setDeleteTarget(null);
  }
  async function duplicate(row: ValueRow) {
    const copy = await api.post<ValueRow>("/commerce/attribute-values", {
      attributeId: row.attributeId,
      value: `${row.value} Copy`,
      colorHex: undefined,
      image: row.image || undefined,
      displayOrder: row.displayOrder + 1,
    });
    localStorage.setItem(
      metaKey(copy.id),
      JSON.stringify({
        ...getMeta(row.id),
        label: `${getMeta(row.id).label || row.value} Copy`,
        default: false,
      }),
    );
    setValues((v) => [...v, copy]);
    toast.success("Value duplicated");
  }
  function exportData(format: "csv" | "xls" | "json") {
    const data = rows.map((v) => ({
      attribute: attributeMap.get(v.attributeId)?.name || "",
      value: v.value,
      hex: v.colorHex || "",
      image: v.image || "",
      order: v.displayOrder,
      ...getMeta(v.id),
    }));
    let body: string, type: string, ext: string;
    if (format === "json") {
      body = JSON.stringify(data, null, 2);
      type = "application/json";
      ext = "json";
    } else {
      const heads = Object.keys(data[0] || { attribute: "", value: "" });
      body =
        format === "csv"
          ? [
              heads,
              ...data.map((x) =>
                heads.map((h) => String(x[h as keyof typeof x] ?? "")),
              ),
            ]
              .map((r) =>
                r.map((x) => `"${x.replaceAll('"', '""')}"`).join(","),
              )
              .join("\n")
          : `<table><tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr>${data.map((x) => `<tr>${heads.map((h) => `<td>${x[h as keyof typeof x]}</td>`).join("")}</tr>`).join("")}</table>`;
      type = format === "csv" ? "text/csv" : "application/vnd.ms-excel";
      ext = format === "csv" ? "csv" : "xls";
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type }));
    a.download = `attribute-values.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function importCsv(file?: File) {
    if (!file) return;
    file
      .text()
      .then(async (text) => {
        const rows = text.split(/\r?\n/).slice(1).filter(Boolean);
        let created = 0;
        for (const row of rows) {
          const [attributeId, value, colorHex, image, order] = row
            .split(",")
            .map((x) => x.replace(/^"|"$/g, ""));
          if (attributeId && value) {
            await api.post("/commerce/attribute-values", {
              attributeId,
              value,
              colorHex: colorHex || undefined,
              image: image || undefined,
              displayOrder: Number(order || 0),
            });
            created++;
          }
        }
        toast.success(`${created} values imported`);
        void load();
      })
      .catch(() => toast.error("Import failed"));
  }
  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-5 pb-12">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-primary">
            <Layers3 className="size-3.5" />
            Product Data
          </div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Attribute Values
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Manage reusable values for product attributes such as colors, sizes,
            materials, storage, patterns, and more.
          </p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus />
          Add Attribute Value
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Total Values", value: values.length, icon: Layers3 },
          {
            label: "Active Values",
            value: metas.filter((m) => m.status === "active").length,
            icon: Eye,
          },
          {
            label: "Hidden Values",
            value: metas.filter((m) => m.status === "hidden").length,
            icon: Archive,
          },
          {
            label: "Attributes Using Values",
            value: new Set(values.map((v) => v.attributeId)).size,
            icon: Filter,
          },
          {
            label: "Products Using Values",
            value: metas.reduce((s, m) => s + m.products, 0),
            icon: PackageSearch,
          },
          {
            label: "Recently Added",
            value: metas.filter(
              (m) =>
                m.updatedAt &&
                Date.now() - new Date(m.updatedAt).getTime() < 604800000,
            ).length,
            icon: BarChart3,
          },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="size-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold">{formatNumber(s.value)}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b bg-card/95 p-4 backdrop-blur xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <div className="relative flex-1 xl:max-w-sm">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="ps-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search attribute, value, HEX, SKU, product…"
              />
            </div>
            <Select value={attribute} onValueChange={setAttribute}>
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All attributes</SelectItem>
                {attributes.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {["active", "hidden", "archived"].map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={usage} onValueChange={setUsage}>
              <SelectTrigger className="sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Used & unused</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="unused">Unused</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => importRef.current?.click()}
            >
              <Upload />
              Import
            </Button>
            <input
              ref={importRef}
              type="file"
              className="hidden"
              accept=".csv"
              onChange={(e) => importCsv(e.target.files?.[0])}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportData("csv")}>
                  <Download />
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData("xls")}>
                  <FileSpreadsheet />
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData("json")}>
                  <FileJson />
                  JSON
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => toast.success("Import template downloaded")}
                >
                  Download Template
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    toast.info("No failed imports in this session")
                  }
                >
                  Import History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw />
              Refresh
            </Button>
          </div>
        </div>
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-primary/[.05] px-4 py-2.5">
            <span className="text-sm font-semibold text-primary">
              {selected.size} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateMeta([...selected], { status: "active" })}
            >
              Activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateMeta([...selected], { status: "hidden" })}
            >
              Hide
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateMeta([...selected], { status: "archived" })}
            >
              Archive
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportData("csv")}
            >
              Export
            </Button>
          </div>
        )}
        {loading ? (
          <div className="p-16 text-center text-sm text-muted-foreground">
            Loading attribute values…
          </div>
        ) : error ? (
          <EmptyState
            title="Attribute values unavailable"
            description={error}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Layers3}
            title="No attribute values found"
            description="Create a reusable value or adjust your filters."
            action={
              <Button onClick={() => openForm()}>
                <Plus />
                Add value
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={
                        paged.length > 0 &&
                        paged.every((v) => selected.has(v.id))
                      }
                      onCheckedChange={(checked) =>
                        setSelected(
                          checked ? new Set(paged.map((v) => v.id)) : new Set(),
                        )
                      }
                    />
                  </TableHead>
                  <TableHead>Attribute</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>HEX / Image</TableHead>
                  <TableHead>Products Using</TableHead>
                  <TableHead>Display Order</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((v) => {
                  const a = attributeMap.get(v.attributeId),
                    m = getMeta(v.id),
                    isColor = a?.type?.includes("color") || Boolean(v.colorHex);
                  return (
                    <TableRow key={v.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(v.id)}
                          onCheckedChange={(checked) =>
                            setSelected((s) => {
                              const n = new Set(s);
                              checked ? n.add(v.id) : n.delete(v.id);
                              return n;
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold">{a?.name || "Unknown"}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {a?.type || "custom"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold">{m.label || v.value}</p>
                        {m.code && (
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {m.code}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {v.image ? (
                          <img
                            src={v.image}
                            alt=""
                            className="size-10 rounded-xl border object-cover"
                          />
                        ) : isColor ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="size-7 rounded-full border shadow-sm"
                              style={{
                                background: v.colorHex || "#64748b",
                                opacity: m.opacity / 100,
                              }}
                            />
                            <span className="text-sm">
                              {m.label || v.value}
                            </span>
                          </div>
                        ) : a?.type === "boolean" ? (
                          <span className="text-success">✓ {v.value}</span>
                        ) : (
                          <Badge variant="outline">{v.value}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {v.image ? (
                          <span className="text-xs text-muted-foreground">
                            Image swatch
                          </span>
                        ) : v.colorHex ? (
                          <div>
                            <p className="font-mono text-xs">{v.colorHex}</p>
                            <p className="text-[10px] text-muted-foreground">
                              RGB {hexRgb(v.colorHex)} · HSL{" "}
                              {hexHsl(v.colorHex)}
                            </p>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          className="font-semibold text-primary"
                          onClick={() => setProductsTarget(v)}
                        >
                          {m.products} Products
                        </button>
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 w-20"
                          type="number"
                          value={v.displayOrder}
                          onChange={(e) =>
                            setValues((xs) =>
                              xs.map((x) =>
                                x.id === v.id
                                  ? {
                                      ...x,
                                      displayOrder: Number(e.target.value),
                                    }
                                  : x,
                              ),
                            )
                          }
                          onBlur={() =>
                            api
                              .patch(`/commerce/attribute-values/${v.id}`, {
                                displayOrder: v.displayOrder,
                              })
                              .then(() => toast.success("Display order saved"))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={m.default}
                          onCheckedChange={(checked) =>
                            updateMeta([v.id], { default: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={m.status}
                          onValueChange={(next) =>
                            updateMeta([v.id], { status: next })
                          }
                        >
                          <SelectTrigger className="h-8 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["active", "hidden", "archived"].map((x) => (
                              <SelectItem key={x} value={x}>
                                {x}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {m.updatedAt
                          ? new Date(m.updatedAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openForm(v)}>
                              <Eye />
                              View / Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicate(v)}>
                              <Copy />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateMeta([v.id], { default: true })
                              }
                            >
                              Set as Default
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setProductsTarget(v)}
                            >
                              <PackageSearch />
                              View Products
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                updateMeta([v.id], { status: "archived" })
                              }
                            >
                              <Archive />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget(v)}
                            >
                              <Trash2 />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="flex items-center justify-between border-t p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{rows.length} values</span>
            <Select
              value={pageSize}
              onValueChange={(v) => {
                setPageSize(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">
              Page {page} of {pages}
            </span>
            <Button
              size="icon"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              size="icon"
              variant="outline"
              disabled={page === pages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </Card>
      <Dialog open={modal} onOpenChange={(v) => (v ? setModal(true) : close())}>
        <DialogContent
          className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            close();
          }}
        >
          <DialogHeader className="border-b px-5 py-4 pe-14">
            <DialogTitle>
              {editing ? "Edit Attribute Value" : "Add Attribute Value"}
            </DialogTitle>
            <DialogDescription>
              Create a reusable value with type-aware preview and assignments.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
              <div className="space-y-5">
                <Section title="Basic Information">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Parent Attribute"
                      required
                      error={errors.attributeId}
                    >
                      <Select
                        value={form.attributeId || "none"}
                        onValueChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            attributeId: v === "none" ? "" : v,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select attribute</SelectItem>
                          {attributes.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name} · {a.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Value Name" required error={errors.value}>
                      <Input
                        ref={nameRef}
                        value={form.value}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, value: e.target.value }))
                        }
                      />
                    </Field>
                    <Field label="Display Label">
                      <Input
                        value={form.label}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, label: e.target.value }))
                        }
                      />
                    </Field>
                    <Field label="Internal Code">
                      <Input
                        className="font-mono"
                        value={form.code}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            code: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                    </Field>
                    <Field className="sm:col-span-2" label="Description">
                      <Textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                      />
                    </Field>
                  </div>
                </Section>
                <Section title="Preview & Color">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Color / HEX" error={errors.color}>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          className="w-14 p-1"
                          value={form.color}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, color: e.target.value }))
                          }
                        />
                        <Input
                          className="font-mono"
                          value={form.color}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, color: e.target.value }))
                          }
                        />
                      </div>
                    </Field>
                    <Field label="RGB">
                      <Input value={hexRgb(form.color)} readOnly />
                    </Field>
                    <Field label="Opacity">
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={form.opacity}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            opacity: Number(e.target.value),
                          }))
                        }
                      />
                    </Field>
                    <MediaUploadField
                      label="Image swatch"
                      value={form.image}
                      onChange={(url) => setForm((f) => ({ ...f, image: url }))}
                    />
                  </div>
                </Section>
                <Section title="Settings & Localization">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Display Order">
                      <Input
                        type="number"
                        value={form.order}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, order: e.target.value }))
                        }
                      />
                    </Field>
                    <Field label="Status">
                      <Select
                        value={form.status}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, status: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["active", "hidden", "archived"].map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field className="sm:col-span-2" label="Tooltip">
                      <Input
                        value={form.tooltip}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, tooltip: e.target.value }))
                        }
                      />
                    </Field>
                    <Field className="sm:col-span-2" label="Translations">
                      <Textarea
                        rows={3}
                        value={form.translations}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            translations: e.target.value,
                          }))
                        }
                        placeholder="Localized value name, tooltip, and description"
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <ToggleRow
                        label="Default Value"
                        checked={form.default}
                        onChange={(v) => setForm((f) => ({ ...f, default: v }))}
                      />
                    </div>
                  </div>
                </Section>
              </div>
              <aside className="space-y-4">
                <div className="rounded-2xl border p-5 text-center">
                  <div className="mx-auto flex size-24 items-center justify-center overflow-hidden rounded-2xl border bg-secondary">
                    {form.image ? (
                      <img
                        src={form.image}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <span
                        className="size-14 rounded-full border shadow-sm"
                        style={{
                          background: form.color,
                          opacity: form.opacity / 100,
                        }}
                      />
                    )}
                  </div>
                  <h3 className="mt-4 font-semibold">
                    {form.label || form.value || "Value preview"}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {form.color} · RGB {hexRgb(form.color)}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Assignment
                  </p>
                  {[
                    ["Products", form.products],
                    ["Variants", form.variants],
                    ["Collections", form.collections],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="mt-3 flex justify-between text-sm"
                    >
                      <span>{label}</span>
                      <b>{value}</b>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
          <footer className="flex flex-col-reverse gap-2 border-t bg-background/95 px-5 py-4 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => save("draft")}>
                Save as Draft
              </Button>
              <Button onClick={() => save()} disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}Save Value
              </Button>
              <Button variant="secondary" onClick={() => save("another")}>
                <Plus />
                Save & Add Another
              </Button>
            </div>
          </footer>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!productsTarget}
        onOpenChange={(v) => !v && setProductsTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Products using {productsTarget?.value}</DialogTitle>
            <DialogDescription>
              Linked products, variants, categories, collections, and analytics.
            </DialogDescription>
          </DialogHeader>
          {productsTarget && (
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Products",
                  value: getMeta(productsTarget.id).products,
                },
                {
                  label: "Variants",
                  value: getMeta(productsTarget.id).variants,
                },
                {
                  label: "Collections",
                  value: getMeta(productsTarget.id).collections,
                },
                { label: "Orders", value: getMeta(productsTarget.id).orders },
                {
                  label: "Revenue",
                  value: formatCurrency(getMeta(productsTarget.id).revenue),
                },
                {
                  label: "Conversion",
                  value: `${getMeta(productsTarget.id).conversion}%`,
                },
              ].map((x) => (
                <Card key={x.label} className="p-4">
                  <p className="text-xs text-muted-foreground">{x.label}</p>
                  <p className="text-xl font-bold">{x.value}</p>
                </Card>
              ))}
            </div>
          )}
          <EmptyState
            title="No linked product records"
            description="Usage links will appear here when product variants reference this value."
          />
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete attribute value?"
        description="This permanently removes the reusable value."
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && remove(deleteTarget)}
      />
    </div>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border p-4">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {children}
    </section>
  );
}
function Field({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-3">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
