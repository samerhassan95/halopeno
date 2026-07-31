"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Minus, Trash2, ShoppingCart, User, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { cn, formatCurrency } from "@/lib/utils";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  regularPrice: string;
  salePrice: string | null;
  stock: number;
  categoryId: string | null;
  brandId: string | null;
  images?: { url: string }[];
}

interface CategoryRow {
  id: string;
  name: string;
}

interface BrandRow {
  id: string;
  name: string;
}

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface CartLine {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  price: number;
  image: string | null;
  stock: number;
  quantity: number;
}

export default function PosPage() {
  const router = useRouter();

  const [products, setProducts] = React.useState<ProductRow[]>([]);
  const [categories, setCategories] = React.useState<CategoryRow[]>([]);
  const [brands, setBrands] = React.useState<BrandRow[]>([]);
  const [search, setSearch] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string>("all");
  const [brandId, setBrandId] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(true);

  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [customerMode, setCustomerMode] = React.useState<"walk-in" | "registered">("walk-in");
  const [customerSearch, setCustomerSearch] = React.useState("");
  const [customerMatches, setCustomerMatches] = React.useState<CustomerRow[]>([]);
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerRow | null>(null);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("In-store pickup");
  const [shipping, setShipping] = React.useState(0);
  const [discount, setDiscount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [placingOrder, setPlacingOrder] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      api.get<{ data: CategoryRow[] }>("/commerce/categories?limit=100"),
      api.get<{ data: BrandRow[] }>("/commerce/brands?limit=100"),
    ])
      .then(([cats, brs]) => {
        setCategories(cats.data);
        setBrands(brs.data);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ page: "1", limit: "60" });
    if (search) params.set("search", search);
    api
      .get<{ data: ProductRow[] }>(`/commerce/products?${params.toString()}`)
      .then((res) => {
        if (!cancelled) setProducts(res.data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err instanceof ApiError ? err.message : "Failed to load products");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search]);

  const filteredProducts = React.useMemo(
    () =>
      products.filter(
        (p) => (categoryId === "all" || p.categoryId === categoryId) && (brandId === "all" || p.brandId === brandId)
      ),
    [products, categoryId, brandId]
  );

  function addToCart(product: ProductRow) {
    if (product.stock <= 0) {
      toast.error("Out of stock");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("No more stock available");
          return prev;
        }
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          sku: product.sku,
          price: Number(product.salePrice ?? product.regularPrice),
          image: product.images?.[0]?.url ?? null,
          stock: product.stock,
          quantity: 1,
        },
      ];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: Math.min(l.stock, Math.max(0, l.quantity + delta)) } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  React.useEffect(() => {
    if (customerMode !== "registered" || customerSearch.trim().length < 2) {
      setCustomerMatches([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      api
        .get<{ data: CustomerRow[] }>(`/customers/customers?page=1&limit=5&search=${encodeURIComponent(customerSearch)}`)
        .then((res) => {
          if (!cancelled) setCustomerMatches(res.data);
        })
        .catch(() => {});
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [customerMode, customerSearch]);

  function selectCustomer(c: CustomerRow) {
    setSelectedCustomer(c);
    setName(c.name);
    setEmail(c.email);
    setPhone(c.phone ?? "");
    setCustomerMatches([]);
    setCustomerSearch(c.name);
  }

  const subtotal = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const total = Math.max(0, subtotal + shipping - discount);

  async function placeOrder() {
    if (cart.length === 0) {
      toast.error("Add at least one product to the cart");
      return;
    }
    if (!name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    const customerEmail = email.trim() || `walkin+${Date.now()}@pos.internal`;

    setPlacingOrder(true);
    try {
      const order = await api.post<{ id: string; orderNumber: string }>("/sales/orders/storefront", {
        orderNumber: `POS-${Date.now()}`,
        customerName: name.trim(),
        customerEmail,
        customerPhone: phone.trim() || undefined,
        items: cart.map((l) => ({
          productSlug: l.slug,
          name: l.name,
          sku: l.sku,
          quantity: l.quantity,
          unitPrice: l.price,
        })),
        subtotal,
        discountTotal: discount,
        taxTotal: 0,
        shippingTotal: shipping,
        total,
        deliveryMethod: "pickup",
        address: address.trim() || "In-store pickup",
        paymentMethod,
      });
      toast.success(`Order ${order.orderNumber} created`);
      setCart([]);
      setDiscount(0);
      setShipping(0);
      router.push(`/admin/orders/all/${order.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">POS System</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Build an in-person order and check out a customer</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-3 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name or SKU"
                className="h-9 ps-8 text-sm"
              />
            </div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={brandId} onValueChange={setBrandId}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All brands</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="p-4">
            {loading ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Loading products…</p>
            ) : filteredProducts.length === 0 ? (
              <EmptyState title="No products found" description="Try adjusting your search or filters." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((p) => {
                  const price = Number(p.salePrice ?? p.regularPrice);
                  const outOfStock = p.stock <= 0;
                  const imageUrl = p.images?.[0]?.url;
                  return (
                    <button
                      key={p.id}
                      disabled={outOfStock}
                      onClick={() => addToCart(p)}
                      className={cn(
                        "flex flex-col items-start gap-1.5 rounded-[12px] border border-border p-2.5 text-start transition-colors hover:border-primary hover:bg-primary/[0.04]",
                        outOfStock && "cursor-not-allowed opacity-50 hover:border-border hover:bg-transparent"
                      )}
                    >
                      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[8px] bg-secondary">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">{p.name.slice(0, 2).toUpperCase()}</span>
                        )}
                        <Badge
                          variant={outOfStock ? "destructive" : "success"}
                          className="absolute start-1.5 top-1.5 text-[10px]"
                        >
                          {outOfStock ? "Out of stock" : `In stock: ${p.stock}`}
                        </Badge>
                      </div>
                      <span className="line-clamp-2 text-xs font-medium">{p.name}</span>
                      <span className="text-sm font-semibold">{formatCurrency(price)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <Card className="flex h-fit flex-col gap-4 p-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={customerMode === "walk-in" ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setCustomerMode("walk-in");
                setSelectedCustomer(null);
              }}
            >
              <User className="size-4" />
              Walk-in
            </Button>
            <Button
              variant={customerMode === "registered" ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setCustomerMode("registered")}
            >
              <UserPlus className="size-4" />
              Registered
            </Button>
          </div>

          {customerMode === "registered" && (
            <div className="relative">
              <Input
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomer(null);
                }}
                placeholder="Search by name, email or phone"
                className="text-sm"
              />
              {customerMatches.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-[10px] border border-border bg-card shadow-soft-lg">
                  {customerMatches.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-start text-xs last:border-0 hover:bg-secondary/50"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground">{c.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedCustomer && (
                <p className="mt-1.5 text-xs text-success">Selected: {selectedCustomer.name}</p>
              )}
            </div>
          )}

          <div className="space-y-2.5">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional for walk-in)" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Delivery / pickup address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="size-4" />
              Cart ({cart.length})
            </div>
            {cart.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No products added</p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-thin pe-1">
                {cart.map((l) => (
                  <div key={l.productId} className="flex items-center gap-2 rounded-[10px] border border-border p-2">
                    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-secondary">
                      {l.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.image} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold">{l.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{l.name}</p>
                      <p className="text-[11px] text-muted-foreground">{formatCurrency(l.price)}</p>
                    </div>
                    <Button variant="outline" size="icon-sm" className="size-6" onClick={() => changeQty(l.productId, -1)}>
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-4 text-center text-xs font-medium">{l.quantity}</span>
                    <Button variant="outline" size="icon-sm" className="size-6" onClick={() => changeQty(l.productId, 1)}>
                      <Plus className="size-3" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="size-6 text-destructive" onClick={() => removeLine(l.productId)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <label className="text-muted-foreground">Shipping</label>
              <Input
                type="number"
                min={0}
                value={shipping}
                onChange={(e) => setShipping(Number(e.target.value) || 0)}
                className="h-8 w-24 text-right"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-muted-foreground">Discount</label>
              <Input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="h-8 w-24 text-right"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-muted-foreground">Payment method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-8 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 font-display text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <Button size="lg" className="w-full" disabled={placingOrder} onClick={placeOrder}>
            {placingOrder ? "Placing order…" : "Place Order"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
