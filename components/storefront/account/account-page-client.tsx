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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FoodImage } from "../food-image";
import { ProductCard } from "../product-card";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "../ui/badge";
import { useWishlistStore } from "@/lib/storefront/store/wishlist-store";
import { useOrderStore } from "@/lib/storefront/store/order-store";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import { mockAddresses, mockPastOrders, mockPaymentMethods, mockCoupons, mockNotifications, mockSupportTickets } from "@/lib/storefront/data/account";
import { formatSAR } from "@/lib/storefront/format";
import { toast } from "sonner";

const tabs = [
  { value: "profile", label: "Profile", icon: User },
  { value: "orders", label: "Orders", icon: Package },
  { value: "addresses", label: "Addresses", icon: MapPin },
  { value: "favorites", label: "Favorites", icon: Heart },
  { value: "payments", label: "Payments", icon: CreditCard },
  { value: "coupons", label: "Coupons", icon: TicketPercent },
  { value: "loyalty", label: "Loyalty", icon: Award },
  { value: "referral", label: "Referral", icon: Users },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "support", label: "Support", icon: Headset },
];

export function AccountPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "profile";

  const { productIds } = useWishlistStore();
  const { orders: placedOrders } = useOrderStore();
  const products = useCatalogStore((s) => s.products);
  const favoriteProducts = products.filter((p) => productIds.includes(p.id));
  const allOrders = [...placedOrders, ...mockPastOrders.map((o) => ({ ...o, createdAt: o.date }))];

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <Tabs
        value={tab}
        onValueChange={(value) => router.replace(`/account?tab=${value}`, { scroll: false })}
      >
        <div className="grid items-start gap-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-8">
          <aside className="lg:sticky lg:top-24">
            <div className="flex items-center gap-3 rounded-[22px] bg-primary p-4 text-primary-foreground shadow-[0_22px_55px_-34px_rgba(18,75,45,0.9)]">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-base font-bold text-white ring-1 ring-white/15">
                AF
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-display text-base font-semibold text-white">Amelia Foster</h1>
                <p className="truncate text-xs text-white/65">amelia@example.com</p>
              </div>
            </div>

            <TabsList className="mt-3 flex h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0 pb-2 lg:grid lg:grid-cols-1 lg:overflow-visible lg:pb-0">
              {tabs.map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="shrink-0 justify-start gap-2 rounded-xl border border-transparent bg-card px-3.5 py-2.5 text-foreground/65 shadow-none transition-colors hover:bg-secondary/70 hover:text-primary data-[state=active]:border-primary/10 data-[state=active]:bg-secondary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  <item.icon className="size-4" /> {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </aside>

          <div className="min-w-0 rounded-[24px] bg-card p-5 shadow-soft sm:p-7 lg:p-8">
          <TabsContent value="profile" className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-brown">Profile Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input defaultValue="Amelia Foster" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input defaultValue="amelia@example.com" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input defaultValue="+1 555 123 4567" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Preferred language</Label>
                <Input defaultValue="English" className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-5">
              <Button onClick={() => toast.success("Profile updated")}>Save Changes</Button>
              <Button
                variant="outline"
                className="gap-2 text-destructive"
                onClick={() => {
                  toast.success("Signed out");
                  router.push("/");
                }}
              >
                <LogOut className="size-4" /> Logout
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-brown">Order History</h2>
            {allOrders.length === 0 ? (
              <EmptyState icon={Package} title="No orders yet" description="Your past orders will show up here." />
            ) : (
              <div className="space-y-3">
                {allOrders.map((o) => (
                  <div key={o.id} className="flex items-center gap-4 rounded-2xl border border-border/70 p-4">
                    {"image" in o && o.image ? (
                      <FoodImage src={o.image} alt="" containerClassName="size-14 shrink-0 rounded-xl" className="size-14 rounded-xl" />
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                        <Package className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brown">Order #{o.id}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {"items" in o && typeof o.items === "string" ? o.items : `${(o as { items: unknown[] }).items.length ?? 0} items`}
                      </p>
                    </div>
                    <Badge variant={"status" in o && o.status === "cancelled" ? "destructive" : "success"}>
                      {"status" in o ? o.status : "stage" in o ? o.stage : "delivered"}
                    </Badge>
                    <span className="font-semibold text-brown">{formatSAR(o.total)}</span>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.success("Items added to cart")}>
                      <RotateCcw className="size-3.5" /> Reorder
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="addresses" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-brown">Saved Addresses</h2>
              <Button size="sm" className="gap-1.5" onClick={() => toast.success("Address form opened")}>
                <Plus className="size-3.5" /> Add new
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {mockAddresses.map((a) => (
                <div key={a.id} className="rounded-2xl border border-border/70 p-4">
                  <p className="font-medium text-brown">
                    {a.label} {a.isDefault && <Badge variant="soft" className="ms-1">Default</Badge>}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.line1}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-brown">Favorites</h2>
            {favoriteProducts.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No favorites yet"
                description="Tap the heart icon on any dish to save it here."
                action={
                  <Button asChild>
                    <Link href="/shop">Browse Shop</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteProducts.map((p) => (
                  <ProductCard key={p.id} product={p} variant="compact" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-brown">Payment Methods</h2>
              <Button size="sm" className="gap-1.5" onClick={() => toast.success("Card form opened")}>
                <Plus className="size-3.5" /> Add card
              </Button>
            </div>
            <div className="space-y-3">
              {mockPaymentMethods.map((pm) => (
                <div key={pm.id} className="flex items-center justify-between rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="size-5 text-primary" />
                    <span className="font-medium text-brown">{pm.label}</span>
                  </div>
                  {pm.isDefault && <Badge variant="soft">Default</Badge>}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="coupons" className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-brown">Your Coupons</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {mockCoupons.map((c) => (
                <div key={c.id} className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
                  <p className="font-display font-semibold text-primary">{c.code}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Expires {c.expires}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="loyalty" className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-brown">Halopeno Rewards</h2>
            <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-accent to-[#516134] p-6 text-white">
              <Award className="size-8" />
              <div>
                <p className="text-sm text-white/70">Current points</p>
                <p className="font-display text-2xl font-bold">1,240</p>
              </div>
              <Button variant="white" className="ms-auto" asChild>
                <Link href="/loyalty">View Rewards</Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="referral" className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-brown">Referral Program</h2>
            <p className="text-sm text-muted-foreground">Share your code and you both earn 200 points.</p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText("SAFFRON-AMELIA10").catch(() => {});
                toast.success("Referral code copied");
              }}
              className="flex w-full max-w-sm items-center justify-between rounded-full border border-dashed border-foreground/25 bg-secondary/40 px-4 py-2.5 text-sm font-medium"
            >
              SAFFRON-AMELIA10 <Copy className="size-4" />
            </button>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-brown">Notifications</h2>
            {mockNotifications.map((n) => (
              <div key={n.id} className="flex items-center gap-3 rounded-2xl border border-border/70 p-4">
                <Bell className="size-4 text-primary" />
                <p className="flex-1 text-sm text-brown">{n.title}</p>
                <span className="text-xs text-muted-foreground">{n.time}</span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-brown">Support Tickets</h2>
              <Button size="sm" onClick={() => toast.success("Ticket form opened")}>
                New Ticket
              </Button>
            </div>
            <div className="space-y-3">
              {mockSupportTickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-2xl border border-border/70 p-4">
                  <p className="text-sm text-brown">{t.subject}</p>
                  <Badge variant={t.status === "open" ? "discount" : "success"}>{t.status}</Badge>
                </div>
              ))}
            </div>
          </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
