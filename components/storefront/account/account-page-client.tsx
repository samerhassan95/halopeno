"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  MapPin,
  Package,
  Heart,
  CreditCard,
  TicketPercent,
  Award,
  Users,
  Bell,
  Headset,
  LogOut,
  RotateCcw,
  Plus,
  Copy,
  Download,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductCard } from "../product-card";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "../ui/badge";
import { useWishlistStore } from "@/lib/storefront/store/wishlist-store";
import { useOrderStore } from "@/lib/storefront/store/order-store";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import { useCustomerAuth } from "@/lib/storefront/customer-auth";
import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/storefront/format";
import { useStorefrontI18n } from "@/lib/storefront/i18n/context";
import { toast } from "sonner";

const tabDefs = [
  { value: "profile", labelKey: "account.profile", icon: User },
  { value: "orders", labelKey: "account.orders", icon: Package },
  { value: "addresses", labelKey: "account.addresses", icon: MapPin },
  { value: "favorites", labelKey: "account.favorites", icon: Heart },
  { value: "downloads", labelKey: "account.downloads", icon: Download },
  { value: "payments", labelKey: "account.payments", icon: CreditCard },
  { value: "coupons", labelKey: "account.coupons", icon: TicketPercent },
  { value: "loyalty", labelKey: "account.loyalty", icon: Award },
  { value: "referral", labelKey: "account.referral", icon: Users },
  { value: "notifications", labelKey: "account.notifications", icon: Bell },
  { value: "support", labelKey: "account.support", icon: Headset },
] as const;

export function AccountPageClient() {
  const { t } = useStorefrontI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "profile";
  const { customer, loading, logout, token, authHeaders, refresh } = useCustomerAuth();
  const { productIds } = useWishlistStore();
  const { orders: placedOrders } = useOrderStore();
  const products = useCatalogStore((s) => s.products);
  const favoriteProducts = products.filter((p) => productIds.includes(p.id));
  const tabs = tabDefs.map((item) => ({ ...item, label: t(item.labelKey) }));

  const [remoteOrders, setRemoteOrders] = React.useState<any[]>([]);
  const [addresses, setAddresses] = React.useState<any[]>([]);
  const [loyalty, setLoyalty] = React.useState<{ points: number; history: any[] }>({ points: 0, history: [] });
  const [downloads, setDownloads] = React.useState<any[]>([]);
  const [coupons, setCoupons] = React.useState<any[]>([]);
  const [newAddress, setNewAddress] = React.useState({ label: "home", line1: "", city: "", country: "SA", phone: "" });

  React.useEffect(() => {
    if (!loading && !customer) router.replace("/account/login");
  }, [customer, loading, router]);

  React.useEffect(() => {
    if (!token) return;
    const headers = authHeaders();
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/storefront/account/orders`, { headers }).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/storefront/account/addresses`, { headers }).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/storefront/account/loyalty`, { headers }).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/storefront/account/digital-downloads`, { headers }).then((r) => r.json()),
      api.get<{ data: any[] }>("/storefront/coupons").catch(() => ({ data: [] })),
    ]).then(([orders, addrs, loy, dig, coup]) => {
      setRemoteOrders(orders.data ?? []);
      setAddresses(addrs.data ?? []);
      setLoyalty({ points: loy.points ?? 0, history: loy.history ?? [] });
      setDownloads(dig.data ?? []);
      setCoupons(coup.data ?? []);
    });
  }, [token, authHeaders]);

  if (loading || !customer) {
    return <div className="mx-auto max-w-[1180px] px-4 py-20 text-center text-muted-foreground">Loading account…</div>;
  }

  const initials = customer.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function saveAddress() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/storefront/account/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ ...newAddress, isDefault: addresses.length === 0 }),
      });
      toast.success("Address saved");
      setNewAddress({ label: "home", line1: "", city: "", country: "SA", phone: "" });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/storefront/account/addresses`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      setAddresses(json.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save address");
    }
  }

  async function requestRefund(orderId: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/storefront/account/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ orderId, reason: "Customer request from account" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Failed");
      toast.success("Refund request submitted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not request refund");
    }
  }

  async function redeem(points: number, title: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/storefront/account/loyalty/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ points, reason: title }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Failed");
      toast.success(`Redeemed ${points} points`);
      await refresh();
      setLoyalty((prev) => ({ ...prev, points: json.remaining }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Redeem failed");
    }
  }

  const referralCode = `HALO-${customer.id.slice(-6).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <Tabs value={tab} onValueChange={(value) => router.replace(`/account?tab=${value}`, { scroll: false })}>
        <div className="grid items-start gap-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-8">
          <aside className="lg:sticky lg:top-24">
            <div className="flex items-center gap-3 rounded-[22px] bg-primary p-4 text-primary-foreground">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white/12 text-base font-bold">{initials}</span>
              <div className="min-w-0">
                <h1 className="truncate font-display text-base font-semibold">{customer.name}</h1>
                <p className="truncate text-xs text-white/65">{customer.email}</p>
              </div>
            </div>
            <TabsList className="mt-3 flex h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0 pb-2 lg:grid lg:grid-cols-1 lg:overflow-visible lg:pb-0">
              {tabs.map((item) => (
                <TabsTrigger key={item.value} value={item.value} className="justify-start gap-2 rounded-xl px-3 py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-soft">
                  <item.icon className="size-4" /> {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button variant="outline" className="mt-3 w-full gap-2" onClick={() => { logout(); router.push("/"); }}>
              <LogOut className="size-4" /> {t("account.signOut")}
            </Button>
          </aside>

          <div className="min-w-0">
            <TabsContent value="profile" className="mt-0 rounded-[28px] bg-card p-6 shadow-soft">
              <h2 className="font-display text-xl font-semibold text-brown">Profile</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><Label>Name</Label><Input value={customer.name} readOnly className="mt-1.5 h-11 rounded-xl" /></div>
                <div><Label>Email</Label><Input value={customer.email} readOnly className="mt-1.5 h-11 rounded-xl" /></div>
                <div><Label>Phone</Label><Input value={customer.phone || ""} readOnly className="mt-1.5 h-11 rounded-xl" /></div>
                <div><Label>Loyalty points</Label><Input value={String(loyalty.points || customer.loyaltyPoints)} readOnly className="mt-1.5 h-11 rounded-xl" /></div>
              </div>
            </TabsContent>

            <TabsContent value="orders" className="mt-0 space-y-3">
              {[...remoteOrders, ...placedOrders.map((o) => ({
                id: o.backendOrderId || o.id,
                orderNumber: o.id,
                status: o.stage,
                total: o.total,
                createdAt: o.createdAt,
                items: o.items.map((i) => ({ name: i.name, quantity: i.qty, unitPrice: i.unitPrice })),
              }))].length === 0 ? (
                <EmptyState icon={Package} title="No orders yet" description="Your purchases will appear here." />
              ) : (
                [...remoteOrders].map((order) => (
                  <div key={order.id} className="rounded-[24px] bg-card p-5 shadow-soft">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display font-semibold text-brown">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{order.status}</Badge>
                        <span className="font-semibold">{formatMoney(order.total)}</span>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                      {order.items?.map((item: any, idx: number) => (
                        <li key={idx}>{item.quantity}× {item.name}</li>
                      ))}
                    </ul>
                    <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => requestRefund(order.id)}>
                      <RotateCcw className="size-3.5" /> Request refund
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="addresses" className="mt-0 space-y-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="rounded-[24px] bg-card p-5 shadow-soft">
                  <p className="font-semibold capitalize text-brown">{addr.label}</p>
                  <p className="text-sm text-muted-foreground">{addr.line1}, {addr.city}, {addr.country}</p>
                </div>
              ))}
              <div className="rounded-[24px] bg-card p-5 shadow-soft">
                <p className="font-display font-semibold text-brown">Add address</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Label" value={newAddress.label} onChange={(e) => setNewAddress((s) => ({ ...s, label: e.target.value }))} className="h-11 rounded-xl" />
                  <Input placeholder="Phone" value={newAddress.phone} onChange={(e) => setNewAddress((s) => ({ ...s, phone: e.target.value }))} className="h-11 rounded-xl" />
                  <Input placeholder="Street" value={newAddress.line1} onChange={(e) => setNewAddress((s) => ({ ...s, line1: e.target.value }))} className="h-11 rounded-xl sm:col-span-2" />
                  <Input placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress((s) => ({ ...s, city: e.target.value }))} className="h-11 rounded-xl" />
                  <Input placeholder="Country" value={newAddress.country} onChange={(e) => setNewAddress((s) => ({ ...s, country: e.target.value }))} className="h-11 rounded-xl" />
                </div>
                <Button className="mt-3 gap-2" onClick={saveAddress}><Plus className="size-4" /> Save address</Button>
              </div>
            </TabsContent>

            <TabsContent value="favorites" className="mt-0">
              {favoriteProducts.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{favoriteProducts.map((p) => <ProductCard key={p.id} product={p} />)}</div>
              ) : (
                <EmptyState icon={Heart} title="No favorites" description="Tap the heart on products to save them." />
              )}
            </TabsContent>

            <TabsContent value="downloads" className="mt-0 space-y-3">
              {downloads.length ? downloads.map((file, i) => (
                <a key={i} href={file.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-[24px] bg-card p-4 shadow-soft hover:bg-secondary/40">
                  <div>
                    <p className="font-medium text-brown">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">{file.productName} · {file.orderNumber}</p>
                  </div>
                  <Download className="size-4 text-primary" />
                </a>
              )) : <EmptyState icon={Download} title="No digital downloads" description="Purchased digital products will appear here." />}
            </TabsContent>

            <TabsContent value="payments" className="mt-0 rounded-[28px] bg-card p-6 shadow-soft">
              <p className="text-sm text-muted-foreground">Payment methods are selected at checkout. Card/Apple Pay/Google Pay use the configured payment provider stub until live keys are added on the server.</p>
            </TabsContent>

            <TabsContent value="coupons" className="mt-0 space-y-3">
              {coupons.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-[24px] bg-card p-4 shadow-soft">
                  <div>
                    <p className="font-semibold text-brown">{c.code}</p>
                    <p className="text-xs text-muted-foreground">{c.discountType} · {c.discountValue}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(c.code); toast.success("Copied"); }}>
                    <Copy className="size-3.5" /> Copy
                  </Button>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="loyalty" className="mt-0 space-y-4">
              <div className="rounded-[28px] bg-primary p-6 text-primary-foreground">
                <p className="text-sm text-white/70">Available points</p>
                <p className="font-display text-4xl font-bold">{loyalty.points || customer.loyaltyPoints}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { title: "SAR 5 off", points: 300 },
                  { title: "Free delivery", points: 400 },
                  { title: "SAR 15 off", points: 900 },
                ].map((reward) => (
                  <div key={reward.title} className="flex items-center justify-between rounded-[24px] bg-card p-4 shadow-soft">
                    <div>
                      <p className="font-medium text-brown">{reward.title}</p>
                      <p className="text-xs text-muted-foreground">{reward.points} points</p>
                    </div>
                    <Button size="sm" onClick={() => redeem(reward.points, reward.title)}>Redeem</Button>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {loyalty.history.map((row) => (
                  <div key={row.id} className="flex justify-between rounded-2xl bg-card px-4 py-3 text-sm shadow-soft">
                    <span>{row.reason || row.type}</span>
                    <span className={row.points >= 0 ? "text-olive-dark" : "text-destructive"}>{row.points >= 0 ? "+" : ""}{row.points}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="referral" className="mt-0 rounded-[28px] bg-card p-6 shadow-soft">
              <p className="font-display text-xl font-semibold text-brown">Your referral code</p>
              <p className="mt-2 text-sm text-muted-foreground">Share this code. Affiliate conversions are tracked when friends checkout with it.</p>
              <Button className="mt-4 gap-2" variant="outline" onClick={() => { navigator.clipboard?.writeText(referralCode); toast.success("Copied"); }}>
                <Copy className="size-4" /> {referralCode}
              </Button>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 rounded-[28px] bg-card p-6 shadow-soft">
              <p className="text-sm text-muted-foreground">Order and loyalty updates will appear here as your account activity grows.</p>
            </TabsContent>

            <TabsContent value="support" className="mt-0 rounded-[28px] bg-card p-6 shadow-soft">
              <p className="text-sm text-muted-foreground">Need help? Use the live chat bubble or <Link href="/contact" className="text-primary underline">contact form</Link>.</p>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
