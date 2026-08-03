"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api/client";
import { MediaUploadField } from "@/components/ui/media-upload-field";

const PRODUCT_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "APPROVED",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
  "OUT_OF_STOCK",
  "DISABLED",
];

interface Option {
  id: string;
  name: string;
}

interface ProductImageRow {
  id?: string;
  url: string;
  altText: string;
  displayOrder: number;
}

interface ProductVariantRow {
  id?: string;
  label: string;
  sku: string;
  price: string;
  stock: string;
  barcode: string;
  weight: string;
  image: string;
  status: string;
}

export interface ProductFormValues {
  name: string;
  slug: string;
  sku: string;
  barcode: string;
  status: string;
  categoryId: string;
  brandId: string;
  shortDescription: string;
  description: string;
  regularPrice: string;
  salePrice: string;
  costPrice: string;
  wholesalePrice: string;
  stock: string;
  reservedStock: string;
  reorderLevel: string;
  warrantyInfo: string;
  returnEligible: boolean;
  shippingClass: string;
  metaTitle: string;
  metaDescription: string;
}

const emptyValues: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  barcode: "",
  status: "DRAFT",
  categoryId: "",
  brandId: "",
  shortDescription: "",
  description: "",
  regularPrice: "",
  salePrice: "",
  costPrice: "",
  wholesalePrice: "",
  stock: "0",
  reservedStock: "0",
  reorderLevel: "5",
  warrantyInfo: "",
  returnEligible: true,
  shippingClass: "",
  metaTitle: "",
  metaDescription: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function textareaClass() {
  return "flex w-full rounded-[10px] border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";
}

export function ProductForm({
  productId,
  initialValues,
  initialImages,
  initialVariants,
}: {
  productId?: string;
  initialValues?: Partial<ProductFormValues>;
  initialImages?: ProductImageRow[];
  initialVariants?: ProductVariantRow[];
}) {
  const router = useRouter();
  const isEdit = Boolean(productId);

  const [values, setValues] = React.useState<ProductFormValues>({ ...emptyValues, ...initialValues });
  const [slugTouched, setSlugTouched] = React.useState(isEdit);
  const [categories, setCategories] = React.useState<Option[]>([]);
  const [brands, setBrands] = React.useState<Option[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const [images, setImages] = React.useState<ProductImageRow[]>(initialImages ?? []);
  const [newImageUrl, setNewImageUrl] = React.useState("");
  const [newImageAlt, setNewImageAlt] = React.useState("");
  const [imageBusy, setImageBusy] = React.useState(false);

  const [variants, setVariants] = React.useState<ProductVariantRow[]>(initialVariants ?? []);
  const [variantDraft, setVariantDraft] = React.useState<ProductVariantRow>({
    label: "",
    sku: "",
    price: "",
    stock: "0",
    barcode: "",
    weight: "",
    image: "",
    status: "active",
  });
  const [variantBusy, setVariantBusy] = React.useState(false);

  React.useEffect(() => {
    api
      .get<{ data: Option[] }>("/commerce/categories?limit=200")
      .then((res) => setCategories(res.data))
      .catch(() => {});
    api
      .get<{ data: Option[] }>("/commerce/brands?limit=200")
      .then((res) => setBrands(res.data))
      .catch(() => {});
  }, []);

  function setField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(name: string) {
    setField("name", name);
    if (!slugTouched) setField("slug", slugify(name));
  }

  function buildPayload() {
    return {
      name: values.name,
      slug: values.slug,
      sku: values.sku,
      barcode: values.barcode || undefined,
      status: values.status,
      categoryId: values.categoryId || undefined,
      brandId: values.brandId || undefined,
      shortDescription: values.shortDescription || undefined,
      description: values.description || undefined,
      regularPrice: values.regularPrice ? Number(values.regularPrice) : 0,
      salePrice: values.salePrice ? Number(values.salePrice) : undefined,
      costPrice: values.costPrice ? Number(values.costPrice) : undefined,
      wholesalePrice: values.wholesalePrice ? Number(values.wholesalePrice) : undefined,
      stock: values.stock ? Number(values.stock) : 0,
      reservedStock: values.reservedStock ? Number(values.reservedStock) : 0,
      reorderLevel: values.reorderLevel ? Number(values.reorderLevel) : 5,
      warrantyInfo: values.warrantyInfo || undefined,
      returnEligible: values.returnEligible,
      shippingClass: values.shippingClass || undefined,
      metaTitle: values.metaTitle || undefined,
      metaDescription: values.metaDescription || undefined,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/commerce/products/${productId}`, buildPayload());
        toast.success("Product updated");
        router.refresh();
      } else {
        const created = await api.post<{ id: string }>("/commerce/products", buildPayload());
        toast.success("Product created — now add images and variations");
        router.push(`/admin/products/all/${created.id}`);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  async function addImage() {
    if (!productId || !newImageUrl.trim()) return;
    setImageBusy(true);
    try {
      const created = await api.post<ProductImageRow>("/commerce/product-images", {
        productId,
        url: newImageUrl.trim(),
        altText: newImageAlt.trim() || undefined,
        displayOrder: images.length,
      });
      setImages((prev) => [...prev, created]);
      setNewImageUrl("");
      setNewImageAlt("");
      toast.success("Image added");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add image");
    } finally {
      setImageBusy(false);
    }
  }

  async function removeImage(img: ProductImageRow) {
    if (!img.id) return;
    try {
      await api.delete(`/commerce/product-images/${img.id}`);
      setImages((prev) => prev.filter((i) => i.id !== img.id));
      toast.success("Image removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove image");
    }
  }

  async function addVariant() {
    if (!productId || !variantDraft.sku.trim() || !variantDraft.price) return;
    setVariantBusy(true);
    try {
      const created = await api.post<{ id: string }>("/commerce/product-variants", {
        productId,
        sku: variantDraft.sku.trim(),
        barcode: variantDraft.barcode || undefined,
        optionsJson: { label: variantDraft.label || variantDraft.sku },
        price: Number(variantDraft.price),
        stock: variantDraft.stock ? Number(variantDraft.stock) : 0,
        weight: variantDraft.weight ? Number(variantDraft.weight) : undefined,
        image: variantDraft.image || undefined,
        status: variantDraft.status,
      });
      setVariants((prev) => [...prev, { ...variantDraft, id: created.id }]);
      setVariantDraft({ label: "", sku: "", price: "", stock: "0", barcode: "", weight: "", image: "", status: "active" });
      toast.success("Variation added");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add variation");
    } finally {
      setVariantBusy(false);
    }
  }

  async function removeVariant(v: ProductVariantRow) {
    if (!v.id) return;
    try {
      await api.delete(`/commerce/product-variants/${v.id}`);
      setVariants((prev) => prev.filter((i) => i.id !== v.id));
      toast.success("Variation removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove variation");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-[1100px] flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core details shoppers see first.</CardDescription>
        </CardHeader>
        <div className="grid gap-4 p-5 pt-0 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Product name *</Label>
            <Input id="name" required value={values.name} onChange={(e) => handleNameChange(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              required
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setField("slug", e.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU *</Label>
            <Input id="sku" required value={values.sku} onChange={(e) => setField("sku", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="barcode">Barcode</Label>
            <Input id="barcode" value={values.barcode} onChange={(e) => setField("barcode", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={values.categoryId} onValueChange={(v) => setField("categoryId", v)}>
              <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Brand</Label>
            <Select value={values.brandId} onValueChange={(v) => setField("brandId", v)}>
              <SelectTrigger><SelectValue placeholder="Select brand…" /></SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={values.status} onValueChange={(v) => setField("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRODUCT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="shortDescription">Short description</Label>
            <Input id="shortDescription" value={values.shortDescription} onChange={(e) => setField("shortDescription", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={4}
              className={textareaClass()}
              value={values.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing &amp; Inventory</CardTitle>
          <CardDescription>What it costs, and how much is in stock.</CardDescription>
        </CardHeader>
        <div className="grid gap-4 p-5 pt-0 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="regularPrice">Regular price *</Label>
            <Input id="regularPrice" type="number" step="0.01" required value={values.regularPrice} onChange={(e) => setField("regularPrice", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salePrice">Sale price</Label>
            <Input id="salePrice" type="number" step="0.01" value={values.salePrice} onChange={(e) => setField("salePrice", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="costPrice">Cost price</Label>
            <Input id="costPrice" type="number" step="0.01" value={values.costPrice} onChange={(e) => setField("costPrice", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wholesalePrice">Wholesale price</Label>
            <Input id="wholesalePrice" type="number" step="0.01" value={values.wholesalePrice} onChange={(e) => setField("wholesalePrice", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock">Stock</Label>
            <Input id="stock" type="number" value={values.stock} onChange={(e) => setField("stock", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reservedStock">Reserved stock</Label>
            <Input id="reservedStock" type="number" value={values.reservedStock} onChange={(e) => setField("reservedStock", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reorderLevel">Reorder level</Label>
            <Input id="reorderLevel" type="number" value={values.reorderLevel} onChange={(e) => setField("reorderLevel", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warranty, Returns &amp; Shipping</CardTitle>
        </CardHeader>
        <div className="grid gap-4 p-5 pt-0 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="warrantyInfo">Warranty info</Label>
            <textarea
              id="warrantyInfo"
              rows={2}
              className={textareaClass()}
              value={values.warrantyInfo}
              onChange={(e) => setField("warrantyInfo", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shippingClass">Shipping class</Label>
            <Input id="shippingClass" value={values.shippingClass} onChange={(e) => setField("shippingClass", e.target.value)} />
          </div>
          <div className="flex items-end gap-2 pb-1.5">
            <Checkbox
              id="returnEligible"
              checked={values.returnEligible}
              onCheckedChange={(v) => setField("returnEligible", Boolean(v))}
            />
            <label htmlFor="returnEligible" className="text-sm text-muted-foreground">Eligible for returns</label>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
          <CardDescription>How this product appears in search results.</CardDescription>
        </CardHeader>
        <div className="grid gap-4 p-5 pt-0 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="metaTitle">Meta title</Label>
            <Input id="metaTitle" value={values.metaTitle} onChange={(e) => setField("metaTitle", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="metaDescription">Meta description</Label>
            <Input id="metaDescription" value={values.metaDescription} onChange={(e) => setField("metaDescription", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>
            {isEdit ? "Manage the product gallery." : "Save the product first to start adding images."}
          </CardDescription>
        </CardHeader>
        <div className="space-y-4 p-5 pt-0">
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-[10px] border border-border">
                  {img.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.url} alt={img.altText} className="aspect-square w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-secondary text-muted-foreground">
                      <ImageOff className="size-5" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(img)}
                    className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-destructive/90 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <MediaUploadField label="Product image" value={newImageUrl} onChange={setNewImageUrl} />
            <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="Alt text" value={newImageAlt} onChange={(e) => setNewImageAlt(e.target.value)} disabled={!isEdit} className="sm:max-w-[220px]" />
            <Button type="button" variant="outline" className="shrink-0 gap-1.5" onClick={addImage} disabled={!isEdit || imageBusy || !newImageUrl.trim()}>
              <Plus className="size-4" /> Add image
            </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variations</CardTitle>
          <CardDescription>
            {isEdit ? "Color, size, or other options with their own price and stock." : "Save the product first to start adding variations."}
          </CardDescription>
        </CardHeader>
        <div className="space-y-4 p-5 pt-0">
          {variants.length > 0 && (
            <div className="overflow-x-auto rounded-[10px] border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Label</th>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-left">Price</th>
                    <th className="px-3 py-2 text-left">Stock</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id} className="border-t border-border">
                      <td className="px-3 py-2">{v.label}</td>
                      <td className="px-3 py-2 text-muted-foreground">{v.sku}</td>
                      <td className="px-3 py-2">{v.price}</td>
                      <td className="px-3 py-2">{v.stock}</td>
                      <td className="px-3 py-2">{v.status}</td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" onClick={() => removeVariant(v)} className="text-muted-foreground hover:text-destructive" aria-label="Remove variation">
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-6">
            <Input placeholder="Label (e.g. Red / L)" value={variantDraft.label} onChange={(e) => setVariantDraft((p) => ({ ...p, label: e.target.value }))} disabled={!isEdit} className="sm:col-span-2" />
            <Input placeholder="SKU" value={variantDraft.sku} onChange={(e) => setVariantDraft((p) => ({ ...p, sku: e.target.value }))} disabled={!isEdit} />
            <Input placeholder="Price" type="number" step="0.01" value={variantDraft.price} onChange={(e) => setVariantDraft((p) => ({ ...p, price: e.target.value }))} disabled={!isEdit} />
            <Input placeholder="Stock" type="number" value={variantDraft.stock} onChange={(e) => setVariantDraft((p) => ({ ...p, stock: e.target.value }))} disabled={!isEdit} />
            <Button type="button" variant="outline" className="gap-1.5" onClick={addVariant} disabled={!isEdit || variantBusy || !variantDraft.sku.trim() || !variantDraft.price}>
              <Plus className="size-4" /> Add
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3 pb-6">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products/all")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
