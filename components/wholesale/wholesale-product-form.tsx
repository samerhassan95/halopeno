"use client";

import {
  MediaUploadField,
  MediaUploadListField,
} from "@/components/ui/media-upload-field";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Box,
  Boxes,
  ChevronLeft,
  CircleDollarSign,
  GripVertical,
  ImagePlus,
  Layers3,
  Link2,
  Package,
  Plus,
  Save,
  SearchCheck,
  ShieldCheck,
  Trash2,
  Truck,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  defaultWholesaleConfig,
  type WholesaleBundleItem,
  type WholesaleConfig,
  type WholesalePricingTier,
  type WholesaleVariant,
} from "./types";

interface Option {
  id: string;
  name: string;
}
interface ProductInitialValues {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode?: string | null;
  status: string;
  shortDescription?: string | null;
  description?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  regularPrice: string;
  wholesalePrice?: string | null;
  stock: number;
  reservedStock: number;
  reorderLevel: number;
  shippingClass?: string | null;
  taxClassId?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  wholesaleConfig?: Partial<WholesaleConfig> | null;
  images?: { id: string; url: string }[];
}

const newId = () => Math.random().toString(36).slice(2, 10);
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const number = (value: string | number | null | undefined) =>
  Number(value || 0);

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn("overflow-hidden border-border/70 shadow-sm", className)}
    >
      <CardHeader className="border-b border-border/70 bg-secondary/20">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
            <Icon className="size-4.5" />
          </span>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <div className="p-5">{children}</div>
    </Card>
  );
}
function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {hint && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

export function WholesaleProductForm({
  initialProduct,
}: {
  initialProduct?: ProductInitialValues;
}) {
  const router = useRouter();
  const isEdit = Boolean(initialProduct);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [categories, setCategories] = React.useState<Option[]>([]);
  const [brands, setBrands] = React.useState<Option[]>([]);
  const [collections, setCollections] = React.useState<Option[]>([]);
  const [name, setName] = React.useState(initialProduct?.name ?? "");
  const [slug, setSlug] = React.useState(initialProduct?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(isEdit);
  const [sku, setSku] = React.useState(initialProduct?.sku ?? "");
  const [barcode, setBarcode] = React.useState(initialProduct?.barcode ?? "");
  const [shortDescription, setShortDescription] = React.useState(
    initialProduct?.shortDescription ?? "",
  );
  const [description, setDescription] = React.useState(
    initialProduct?.description ?? "",
  );
  const [categoryId, setCategoryId] = React.useState(
    initialProduct?.categoryId ?? "",
  );
  const [brandId, setBrandId] = React.useState(initialProduct?.brandId ?? "");
  const [basePrice, setBasePrice] = React.useState(
    initialProduct?.wholesalePrice ?? "",
  );
  const [retailPrice, setRetailPrice] = React.useState(
    initialProduct?.regularPrice ?? "",
  );
  const [stock, setStock] = React.useState(String(initialProduct?.stock ?? 0));
  const [reservedStock, setReservedStock] = React.useState(
    String(initialProduct?.reservedStock ?? 0),
  );
  const [reorderLevel, setReorderLevel] = React.useState(
    String(initialProduct?.reorderLevel ?? 5),
  );
  const [shippingClass, setShippingClass] = React.useState(
    initialProduct?.shippingClass ?? "Standard freight",
  );
  const [metaTitle, setMetaTitle] = React.useState(
    initialProduct?.metaTitle ?? "",
  );
  const [metaDescription, setMetaDescription] = React.useState(
    initialProduct?.metaDescription ?? "",
  );
  const [status, setStatus] = React.useState(initialProduct?.status ?? "DRAFT");
  const [config, setConfig] = React.useState<WholesaleConfig>({
    ...defaultWholesaleConfig,
    ...(initialProduct?.wholesaleConfig ?? {}),
  });

  React.useEffect(() => {
    Promise.all([
      api.get<{ data: Option[] }>("/commerce/categories?limit=200"),
      api.get<{ data: Option[] }>("/commerce/brands?limit=200"),
      api.get<{ data: Option[] }>("/commerce/collections?limit=200"),
    ])
      .then(([categoryResult, brandResult, collectionResult]) => {
        setCategories(categoryResult.data);
        setBrands(brandResult.data);
        setCollections(collectionResult.data);
      })
      .catch(() => {});
  }, []);

  function setConfigField<K extends keyof WholesaleConfig>(
    key: K,
    value: WholesaleConfig[K],
  ) {
    setConfig((current) => ({ ...current, [key]: value }));
  }
  function updateTier(id: string, patch: Partial<WholesalePricingTier>) {
    setConfigField(
      "pricingTiers",
      config.pricingTiers.map((tier) =>
        tier.id === id ? { ...tier, ...patch } : tier,
      ),
    );
  }
  function updateVariant(id: string, patch: Partial<WholesaleVariant>) {
    setConfigField(
      "variants",
      config.variants.map((variant) =>
        variant.id === id ? { ...variant, ...patch } : variant,
      ),
    );
  }
  function updateBundleItem(id: string, patch: Partial<WholesaleBundleItem>) {
    setConfigField(
      "bundleItems",
      config.bundleItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    );
  }

  async function save(nextStatus?: string) {
    if (!name.trim() || !sku.trim() || !slug.trim()) {
      toast.error("Product name, SKU, and URL slug are required");
      setActiveTab("overview");
      return;
    }
    setSaving(true);
    const resolvedStatus = nextStatus ?? status;
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      sku: sku.trim(),
      barcode: barcode || undefined,
      type: "WHOLESALE",
      status: resolvedStatus,
      shortDescription: shortDescription || undefined,
      description: description || undefined,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      regularPrice: number(retailPrice),
      wholesalePrice: number(basePrice),
      stock: number(stock),
      reservedStock: number(reservedStock),
      reorderLevel: number(reorderLevel),
      shippingClass: shippingClass || undefined,
      taxClassId: undefined,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      wholesaleConfig: { ...config, suggestedRetailPrice: number(retailPrice) },
    };
    try {
      let productId = initialProduct?.id;
      if (productId)
        await api.patch(`/commerce/products/${productId}`, payload);
      else {
        const created = await api.post<{ id: string }>(
          "/commerce/products",
          payload,
        );
        productId = created.id;
      }
      if (
        !initialProduct?.images?.length &&
        config.galleryUrls.trim() &&
        productId
      ) {
        const imageUrls = config.galleryUrls
          .split(/[\n,]/)
          .map((value) => value.trim())
          .filter(Boolean)
          .slice(0, 12);
        await Promise.all(
          imageUrls.map((url, index) =>
            api
              .post("/commerce/product-images", {
                productId,
                url,
                altText: name,
                displayOrder: index,
              })
              .catch(() => null),
          ),
        );
      }
      setStatus(resolvedStatus);
      toast.success(
        isEdit ? "Wholesale product updated" : "Wholesale product created",
      );
      if (!isEdit) router.push(`/admin/products/wholesale/${productId}`);
      else router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not save wholesale product",
      );
    } finally {
      setSaving(false);
    }
  }

  const tabItems = [
    { value: "overview", label: "Overview" },
    { value: "pricing", label: "Pricing" },
    {
      value: "variants",
      label: `Variants ${config.variants.length ? `(${config.variants.length})` : ""}`,
    },
    { value: "bundles", label: "Bundles" },
    { value: "inventory", label: "Inventory & Shipping" },
    { value: "media", label: "Media & SEO" },
  ];

  return (
    <div className="mx-auto max-w-[1500px] pb-28">
      <div className="sticky top-0 z-30 mb-5 border-b border-border bg-background/90 px-1 py-3 backdrop-blur-xl sm:px-3">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admin/products/wholesale")}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-xl font-bold sm:text-2xl">
                  {isEdit ? `Edit ${name}` : "Add Wholesale Product"}
                </h1>
                <Badge
                  variant={
                    status === "PUBLISHED"
                      ? "success"
                      : status === "ARCHIVED"
                        ? "secondary"
                        : "warning"
                  }
                >
                  {status.replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Configure catalog, commercial, inventory, and fulfillment
                details.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden sm:inline-flex"
              onClick={() => save("DRAFT")}
              disabled={saving}
            >
              <Archive className="size-4" />
              Save draft
            </Button>
            <Button onClick={() => save()} disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving…" : "Save product"}
            </Button>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="min-w-0 space-y-5"
      >
        <div className="w-full max-w-[calc(100vw-2rem)] overflow-x-auto pb-1 lg:max-w-none">
          <TabsList className="min-w-max">
            {tabItems.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="overview" className="space-y-5">
          <SectionCard
            title="Basic Information"
            description="Core product identity and buyer-facing content."
            icon={Package}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Product name" required>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. Premium Cotton T-Shirts — Case of 48"
                />
              </Field>
              <Field label="SKU" required>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="WHS-TSHIRT-048"
                />
              </Field>
              <Field label="Barcode">
                <Input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Optional UPC / EAN"
                />
              </Field>
              <Field label="Collection">
                <Select
                  value={config.collection || "none"}
                  onValueChange={(value) =>
                    setConfigField("collection", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No collection</SelectItem>
                    {collections.map((item) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Category">
                <Select
                  value={categoryId || "none"}
                  onValueChange={(value) =>
                    setCategoryId(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Brand">
                <Select
                  value={brandId || "none"}
                  onValueChange={(value) =>
                    setBrandId(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No brand</SelectItem>
                    {brands.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label="Product tags"
                className="md:col-span-2"
                hint="Separate tags with commas for filtering and search."
              >
                <Input
                  value={config.tags}
                  onChange={(e) => setConfigField("tags", e.target.value)}
                  placeholder="bulk, apparel, cotton, private-label"
                />
              </Field>
              <Field label="Short description" className="md:col-span-2">
                <Textarea
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="A concise wholesale proposition for product cards and search."
                />
              </Field>
              <Field label="Full description" className="md:col-span-2">
                <Textarea
                  rows={7}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Materials, manufacturing details, carton contents, buyer benefits…"
                />
              </Field>
            </div>
          </SectionCard>
          <SectionCard
            title="Wholesale Configuration"
            description="Control purchasing rules, packaging, and buyer access."
            icon={Boxes}
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Minimum order quantity (MOQ)" required>
                <Input
                  type="number"
                  min="1"
                  value={config.moq}
                  onChange={(e) =>
                    setConfigField("moq", number(e.target.value))
                  }
                />
              </Field>
              <Field label="Maximum order quantity">
                <Input
                  type="number"
                  min="1"
                  value={config.maxOrderQuantity ?? ""}
                  onChange={(e) =>
                    setConfigField(
                      "maxOrderQuantity",
                      e.target.value ? number(e.target.value) : null,
                    )
                  }
                  placeholder="Unlimited"
                />
              </Field>
              <Field label="Quantity increment">
                <Input
                  type="number"
                  min="1"
                  value={config.quantityIncrement}
                  onChange={(e) =>
                    setConfigField("quantityIncrement", number(e.target.value))
                  }
                />
              </Field>
              <Field label="Packaging unit">
                <Select
                  value={config.packagingUnit}
                  onValueChange={(value) =>
                    setConfigField("packagingUnit", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Piece",
                      "Box",
                      "Pack",
                      "Carton",
                      "Bundle",
                      "Pallet",
                      "Container",
                    ].map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Units per package">
                <Input
                  type="number"
                  min="1"
                  value={config.unitsPerPackage}
                  onChange={(e) =>
                    setConfigField("unitsPerPackage", number(e.target.value))
                  }
                />
              </Field>
              <Field label="Wholesale visibility" className="sm:col-span-2">
                <Select
                  value={config.visibility}
                  onValueChange={(value) => setConfigField("visibility", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Public",
                      "Registered Businesses Only",
                      "Customer Groups Only",
                      "Hidden",
                    ].map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <Label>Featured wholesale</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Promote to B2B buyers
                  </p>
                </div>
                <Switch
                  checked={config.featured}
                  onCheckedChange={(checked) =>
                    setConfigField("featured", checked)
                  }
                />
              </div>
            </div>
          </SectionCard>
          <SectionCard
            title="Publishing Status"
            description="Set catalog availability and lifecycle state."
            icon={ShieldCheck}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "DRAFT",
                      "PUBLISHED",
                      "DISABLED",
                      "ARCHIVED",
                      "OUT_OF_STOCK",
                    ].map((item) => (
                      <SelectItem key={item} value={item}>
                        {item.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
                <p className="text-sm font-semibold">
                  Buyer visibility preview
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {config.visibility === "Public"
                    ? "Visible to all storefront visitors."
                    : config.visibility === "Hidden"
                      ? "Only visible to administrators."
                      : `Visible to ${config.visibility.toLowerCase()}.`}
                </p>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-5">
          <SectionCard
            title="Base Pricing"
            description="Set commercial anchors before quantity discounts."
            icon={CircleDollarSign}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Base wholesale price" required>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                />
              </Field>
              <Field label="Suggested retail price">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value)}
                />
              </Field>
              <Field label="Tax class">
                <Select
                  value={config.taxClass}
                  onValueChange={(value) => setConfigField("taxClass", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Reduced">Reduced</SelectItem>
                    <SelectItem value="Zero rated">Zero rated</SelectItem>
                    <SelectItem value="Exempt">Tax exempt</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="rounded-xl border border-border bg-secondary/30 p-3">
                <p className="text-xs text-muted-foreground">Base margin</p>
                <p className="mt-1 text-xl font-bold text-success">
                  {number(retailPrice)
                    ? Math.max(
                        0,
                        Math.round(
                          (1 - number(basePrice) / number(retailPrice)) * 100,
                        ),
                      )
                    : 0}
                  %
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Buyer resale potential
                </p>
              </div>
            </div>
          </SectionCard>
          <SectionCard
            title="Bulk Pricing Tiers"
            description="Add unlimited volume prices with optional customer-group targeting."
            icon={Layers3}
          >
            <div className="space-y-3">
              <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_1.4fr_40px] gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
                <span>Min quantity</span>
                <span>Max quantity</span>
                <span>Unit price</span>
                <span>Discount %</span>
                <span>Customer group</span>
                <span />
              </div>
              {config.pricingTiers.map((tier, index) => (
                <div
                  key={tier.id}
                  className="grid gap-2 rounded-xl border border-border p-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1.4fr_40px]"
                >
                  <Field label="Min" className="lg:[&_label]:sr-only">
                    <Input
                      type="number"
                      min="1"
                      value={tier.minQuantity}
                      onChange={(e) =>
                        updateTier(tier.id, {
                          minQuantity: number(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field label="Max" className="lg:[&_label]:sr-only">
                    <Input
                      type="number"
                      min="1"
                      value={tier.maxQuantity ?? ""}
                      placeholder="Unlimited"
                      onChange={(e) =>
                        updateTier(tier.id, {
                          maxQuantity: e.target.value
                            ? number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </Field>
                  <Field label="Unit price" className="lg:[&_label]:sr-only">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tier.unitPrice}
                      onChange={(e) =>
                        updateTier(tier.id, {
                          unitPrice: number(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field label="Discount %" className="lg:[&_label]:sr-only">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={tier.discount}
                      onChange={(e) =>
                        updateTier(tier.id, {
                          discount: number(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field
                    label="Customer group"
                    className="lg:[&_label]:sr-only"
                  >
                    <Select
                      value={tier.customerGroup || "all"}
                      onValueChange={(value) =>
                        updateTier(tier.id, {
                          customerGroup: value === "all" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All business buyers</SelectItem>
                        <SelectItem value="vip">VIP wholesale</SelectItem>
                        <SelectItem value="distributors">
                          Distributors
                        </SelectItem>
                        <SelectItem value="retailers">Retailers</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="self-end text-destructive"
                    onClick={() =>
                      setConfigField(
                        "pricingTiers",
                        config.pricingTiers.filter(
                          (item) => item.id !== tier.id,
                        ),
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() =>
                  setConfigField("pricingTiers", [
                    ...config.pricingTiers,
                    {
                      id: newId(),
                      minQuantity: config.pricingTiers.at(-1)?.maxQuantity
                        ? Number(config.pricingTiers.at(-1)?.maxQuantity) + 1
                        : config.moq,
                      maxQuantity: null,
                      unitPrice: number(basePrice),
                      discount: 0,
                      customerGroup: "",
                    },
                  ])
                }
              >
                <Plus className="size-4" />
                Add pricing tier
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="variants">
          <SectionCard
            title="Product Variants"
            description="Create unlimited wholesale variants. Drag handles communicate ordering for merchandising teams."
            icon={Box}
          >
            <div className="space-y-4">
              {config.variants.map((variant, index) => (
                <div
                  key={variant.id}
                  className="rounded-[14px] border border-border bg-card p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="size-4 cursor-grab text-muted-foreground" />
                      <Badge variant="outline">Variant {index + 1}</Badge>
                      <span className="font-semibold">
                        {variant.name || "Untitled variant"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() =>
                        setConfigField(
                          "variants",
                          config.variants.filter(
                            (item) => item.id !== variant.id,
                          ),
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Variant name">
                      <Input
                        value={variant.name}
                        onChange={(e) =>
                          updateVariant(variant.id, { name: e.target.value })
                        }
                        placeholder="Navy / Large"
                      />
                    </Field>
                    <Field label="SKU">
                      <Input
                        value={variant.sku}
                        onChange={(e) =>
                          updateVariant(variant.id, { sku: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Barcode">
                      <Input
                        value={variant.barcode}
                        onChange={(e) =>
                          updateVariant(variant.id, { barcode: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Size">
                      <Input
                        value={variant.size}
                        onChange={(e) =>
                          updateVariant(variant.id, { size: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Color">
                      <Input
                        value={variant.color}
                        onChange={(e) =>
                          updateVariant(variant.id, { color: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Material">
                      <Input
                        value={variant.material}
                        onChange={(e) =>
                          updateVariant(variant.id, {
                            material: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Weight">
                      <Input
                        value={variant.weight}
                        onChange={(e) =>
                          updateVariant(variant.id, { weight: e.target.value })
                        }
                        placeholder="1.4 kg"
                      />
                    </Field>
                    <Field label="Dimensions">
                      <Input
                        value={variant.dimensions}
                        onChange={(e) =>
                          updateVariant(variant.id, {
                            dimensions: e.target.value,
                          })
                        }
                        placeholder="40 × 30 × 20 cm"
                      />
                    </Field>
                    <Field label="Packaging type">
                      <Input
                        value={variant.packagingType}
                        onChange={(e) =>
                          updateVariant(variant.id, {
                            packagingType: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Stock">
                      <Input
                        type="number"
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(variant.id, {
                            stock: number(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field label="Retail price">
                      <Input
                        type="number"
                        value={variant.price}
                        onChange={(e) =>
                          updateVariant(variant.id, {
                            price: number(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field label="Wholesale price">
                      <Input
                        type="number"
                        value={variant.wholesalePrice}
                        onChange={(e) =>
                          updateVariant(variant.id, {
                            wholesalePrice: number(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <MediaUploadField
                      label="Variant image"
                      className="sm:col-span-2 lg:col-span-4"
                      value={variant.image}
                      onChange={(url) => updateVariant(variant.id, { image: url })}
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full border-dashed py-8"
                onClick={() =>
                  setConfigField("variants", [
                    ...config.variants,
                    {
                      id: newId(),
                      name: "",
                      sku: `${sku || "WHS"}-${String(config.variants.length + 1).padStart(2, "0")}`,
                      barcode: "",
                      size: "",
                      color: "",
                      material: "",
                      weight: "",
                      dimensions: "",
                      packagingType: config.packagingUnit,
                      stock: 0,
                      price: number(retailPrice),
                      wholesalePrice: number(basePrice),
                      image: "",
                    },
                  ])
                }
              >
                <Plus className="size-4" />
                Add product variant
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="bundles">
          <SectionCard
            title="Product Bundles"
            description="Combine products and quantities into ready-to-buy wholesale assortments."
            icon={Boxes}
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bundle discount %">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={config.bundleDiscount}
                    onChange={(e) =>
                      setConfigField("bundleDiscount", number(e.target.value))
                    }
                  />
                </Field>
                <Field label="Bundle price">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={config.bundlePrice}
                    onChange={(e) =>
                      setConfigField("bundlePrice", number(e.target.value))
                    }
                  />
                </Field>
              </div>
              <Separator />
              {config.bundleItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-end"
                >
                  <Field label={`Product ${index + 1}`} className="flex-1">
                    <Input
                      value={item.product}
                      onChange={(e) =>
                        updateBundleItem(item.id, { product: e.target.value })
                      }
                      placeholder="Search by product name or SKU"
                    />
                  </Field>
                  <Field label="Quantity" className="sm:w-32">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateBundleItem(item.id, {
                          quantity: number(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() =>
                      setConfigField(
                        "bundleItems",
                        config.bundleItems.filter(
                          (current) => current.id !== item.id,
                        ),
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() =>
                  setConfigField("bundleItems", [
                    ...config.bundleItems,
                    { id: newId(), product: "", quantity: 1 },
                  ])
                }
              >
                <Plus className="size-4" />
                Add bundle product
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-5">
          <SectionCard
            title="Inventory"
            description="Manage availability, reservation, replenishment, and tracking controls."
            icon={Warehouse}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Current stock">
                <Input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </Field>
              <Field label="Reserved stock">
                <Input
                  type="number"
                  min="0"
                  value={reservedStock}
                  onChange={(e) => setReservedStock(e.target.value)}
                />
              </Field>
              <Field label="Warehouse">
                <Input
                  value={config.warehouse}
                  onChange={(e) => setConfigField("warehouse", e.target.value)}
                />
              </Field>
              <Field label="Low stock alert">
                <Input
                  type="number"
                  min="0"
                  value={config.lowStockAlert}
                  onChange={(e) =>
                    setConfigField("lowStockAlert", number(e.target.value))
                  }
                />
              </Field>
              <Field label="Reorder level">
                <Input
                  type="number"
                  min="0"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                />
              </Field>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <Label>Backorders</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Sell beyond available stock
                  </p>
                </div>
                <Switch
                  checked={config.backorderAllowed}
                  onCheckedChange={(checked) =>
                    setConfigField("backorderAllowed", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <Label>Inventory tracking</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Track every stock movement
                  </p>
                </div>
                <Switch
                  checked={config.trackInventory}
                  onCheckedChange={(checked) =>
                    setConfigField("trackInventory", checked)
                  }
                />
              </div>
            </div>
          </SectionCard>
          <SectionCard
            title="Shipping & Fulfillment"
            description="Define logistics data used for freight rates and delivery promises."
            icon={Truck}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Weight">
                <Input
                  value={config.weight}
                  onChange={(e) => setConfigField("weight", e.target.value)}
                  placeholder="kg"
                />
              </Field>
              <Field label="Length">
                <Input
                  value={config.length}
                  onChange={(e) => setConfigField("length", e.target.value)}
                  placeholder="cm"
                />
              </Field>
              <Field label="Width">
                <Input
                  value={config.width}
                  onChange={(e) => setConfigField("width", e.target.value)}
                  placeholder="cm"
                />
              </Field>
              <Field label="Height">
                <Input
                  value={config.height}
                  onChange={(e) => setConfigField("height", e.target.value)}
                  placeholder="cm"
                />
              </Field>
              <Field label="Shipping class" className="sm:col-span-2">
                <Input
                  value={shippingClass}
                  onChange={(e) => setShippingClass(e.target.value)}
                />
              </Field>
              <Field label="Delivery type" className="sm:col-span-2">
                <Select
                  value={config.deliveryType}
                  onValueChange={(value) =>
                    setConfigField("deliveryType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Standard freight",
                      "Express freight",
                      "Pallet delivery",
                      "Container shipping",
                      "Pickup only",
                      "Digital delivery",
                    ].map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="media" className="space-y-5">
          <SectionCard
            title="Product Media"
            description="Centralize imagery, video, sales documents, datasheets, and certificates."
            icon={ImagePlus}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <MediaUploadListField
                label="Product images & gallery"
                values={config.galleryUrls.split("\n").filter(Boolean)}
                onChange={(urls) =>
                  setConfigField("galleryUrls", urls.join("\n"))
                }
                className="md:col-span-2"
              />
              <MediaUploadField
                label="Product video"
                kind="video"
                value={config.videoUrl}
                onChange={(url) => setConfigField("videoUrl", url)}
              />
              <MediaUploadField
                label="Open Graph image"
                value={config.openGraphImage}
                onChange={(url) => setConfigField("openGraphImage", url)}
              />
              <Field
                label="Documents, datasheets & certificates"
                hint="One document URL per line. PDF, DOCX, XLSX, or certificate links."
                className="md:col-span-2"
              >
                <Textarea
                  rows={5}
                  value={config.documentUrls}
                  onChange={(e) =>
                    setConfigField("documentUrls", e.target.value)
                  }
                  placeholder={
                    "Product datasheet PDF\nCompliance certificate\nWholesale line sheet"
                  }
                />
              </Field>
            </div>
          </SectionCard>
          <SectionCard
            title="Search & SEO"
            description="Optimize product discovery across search engines and B2B catalogs."
            icon={SearchCheck}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="URL slug" required>
                <div className="relative">
                  <Link2 className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="ps-9"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                  />
                </div>
              </Field>
              <Field label="Canonical URL">
                <Input
                  value={config.canonicalUrl}
                  onChange={(e) =>
                    setConfigField("canonicalUrl", e.target.value)
                  }
                  placeholder="https://store.com/wholesale/…"
                />
              </Field>
              <Field
                label="Meta title"
                className="md:col-span-2"
                hint={`${metaTitle.length}/60 characters`}
              >
                <Input
                  maxLength={60}
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={name || "SEO title"}
                />
              </Field>
              <Field
                label="Meta description"
                className="md:col-span-2"
                hint={`${metaDescription.length}/160 characters`}
              >
                <Textarea
                  maxLength={160}
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                />
              </Field>
              <div className="rounded-xl border border-border p-4 md:col-span-2">
                <p className="text-xs text-muted-foreground">
                  Search result preview
                </p>
                <p className="mt-2 text-lg font-medium text-[#1a0dab] dark:text-blue-400">
                  {metaTitle || name || "Wholesale product title"}
                </p>
                <p className="text-xs text-success">
                  store.example.com/wholesale/{slug || "product-slug"}
                </p>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {metaDescription ||
                    shortDescription ||
                    "Add a meta description to preview how this product may appear in search."}
                </p>
              </div>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
      <Button
        size="lg"
        className="fixed bottom-6 end-6 z-40 rounded-full px-5 shadow-soft-lg sm:hidden"
        onClick={() => save()}
        disabled={saving}
      >
        <Save className="size-4" />
        Save
      </Button>
    </div>
  );
}
