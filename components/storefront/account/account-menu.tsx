"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  ChevronRight,
  Headset,
  Heart,
  LogOut,
  MapPin,
  Package,
  User,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/storefront/ui/button";
import { useOrderStore } from "@/lib/storefront/store/order-store";
import { useWishlistStore } from "@/lib/storefront/store/wishlist-store";
import { useStorefrontI18n } from "@/lib/storefront/i18n/context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const menuItems = [
  { key: "profile", href: "/account?tab=profile", icon: User },
  { key: "orders", href: "/account?tab=orders", icon: Package },
  { key: "favorites", href: "/account?tab=favorites", icon: Heart },
  { key: "addresses", href: "/account?tab=addresses", icon: MapPin },
  { key: "rewards", href: "/account?tab=loyalty", icon: Award },
  { key: "support", href: "/account?tab=support", icon: Headset },
] as const;

const copy = {
  en: {
    greeting: "Welcome back",
    profile: "Profile",
    orders: "Orders",
    favorites: "Favorites",
    addresses: "Addresses",
    rewards: "Rewards",
    support: "Support",
    recentOrder: "Latest order",
    noOrders: "No orders yet",
    track: "Track order",
    viewAccount: "View account",
    signOut: "Sign out",
    account: "Account",
  },
  ar: {
    greeting: "مرحباً بعودتك",
    profile: "الملف الشخصي",
    orders: "الطلبات",
    favorites: "المفضلة",
    addresses: "العناوين",
    rewards: "المكافآت",
    support: "الدعم",
    recentOrder: "أحدث طلب",
    noOrders: "لا توجد طلبات بعد",
    track: "تتبع الطلب",
    viewAccount: "عرض الحساب",
    signOut: "تسجيل الخروج",
    account: "الحساب",
  },
};

function AccountMenuPanel({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const { locale } = useStorefrontI18n();
  const text = copy[locale];
  const orders = useOrderStore((state) => state.orders);
  const favoriteCount = useWishlistStore((state) => state.productIds.length);
  const latestOrder = orders[0];

  return (
    <div className="text-start">
      <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-[0_8px_24px_-14px_rgba(18,75,45,0.9)]">
          AF
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{text.greeting}</p>
          <p className="truncate font-display text-base font-semibold text-primary">Amelia Foster</p>
          <p className="truncate text-xs text-muted-foreground">amelia@example.com</p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href="/account?tab=orders"
          onClick={onNavigate}
          className="rounded-2xl bg-secondary/70 px-3.5 py-3 transition-colors hover:bg-secondary active:scale-[0.98]"
        >
          <span className="text-xl font-semibold text-primary">{orders.length}</span>
          <span className="ms-2 text-xs font-medium text-muted-foreground">{text.orders}</span>
        </Link>
        <Link
          href="/account?tab=favorites"
          onClick={onNavigate}
          className="rounded-2xl bg-secondary/70 px-3.5 py-3 transition-colors hover:bg-secondary active:scale-[0.98]"
        >
          <span className="text-xl font-semibold text-primary">{favoriteCount}</span>
          <span className="ms-2 text-xs font-medium text-muted-foreground">{text.favorites}</span>
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {menuItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-secondary/70 hover:text-primary active:scale-[0.98]"
          >
            <item.icon className="size-[17px] text-primary/75 transition-colors group-hover:text-primary" />
            {text[item.key]}
          </Link>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-primary/10 bg-card p-3.5 shadow-[0_10px_30px_-26px_rgba(18,75,45,0.8)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">{text.recentOrder}</p>
            <p className="truncate text-sm font-semibold text-primary">
              {latestOrder ? `#${latestOrder.id}` : text.noOrders}
            </p>
          </div>
          {latestOrder && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/track/${latestOrder.id}`} onClick={onNavigate}>{text.track}</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button className="flex-1" size="sm" asChild>
          <Link href="/account" onClick={onNavigate}>{text.viewAccount}</Link>
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={text.signOut}
          title={text.signOut}
          onClick={() => {
            onNavigate();
            toast.success(text.signOut);
            router.push("/");
          }}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function AccountMenu({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { locale } = useStorefrontI18n();
  const text = copy[locale];

  if (mobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary",
              pathname === "/account" ? "text-primary" : "text-muted-foreground"
            )}
            aria-label={text.account}
          >
            <User className="size-5" />
            {text.account}
          </button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="storefront-theme max-h-[86dvh] rounded-t-[28px] bg-card px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3"
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-primary/15" />
          <div className="mx-auto max-w-md overflow-y-auto px-1 pb-2 pt-1">
            <AccountMenuPanel onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("hidden sm:inline-flex", open && "bg-secondary text-primary")}
          aria-label={text.account}
        >
          <User className="size-[18px]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={12} className="storefront-theme w-[340px] rounded-[20px] border-primary/10 p-4 shadow-[0_24px_70px_-32px_rgba(18,75,45,0.75)]">
        <AccountMenuPanel onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
