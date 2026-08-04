"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  User,
  Heart,
  ShoppingBag,
  MapPin,
  ChevronDown,
  Languages,
  PackageSearch,
  Home,
  Tag,
  Info,
  Mail,
  Flame,
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useCartStore, cartItemCount } from "@/lib/storefront/store/cart-store";
import { cn } from "@/lib/utils";
import { useStorefrontI18n } from "@/lib/storefront/i18n/context";
import { AccountMenu } from "@/components/storefront/account/account-menu";

const DEFAULT_NAV = [
  { label: "Home", href: "/", key: "nav.home", icon: Home },
  { label: "Shop", href: "/shop", key: "nav.shop", icon: ShoppingBag },
  { label: "Offers", href: "/offers", key: "nav.offers", icon: Tag },
  { label: "About Us", href: "/about", key: "nav.about", icon: Info },
  { label: "Contact", href: "/contact", key: "nav.contact", icon: Mail },
];

export type HeaderNavLink = { label: string; href: string };
export type StorefrontHeaderConfig = {
  showSearch?: boolean;
  showAccountMenu?: boolean;
  showWishlist?: boolean;
  showCart?: boolean;
  stickyHeader?: boolean;
};

const ICON_BY_HREF: Record<string, typeof Home> = {
  "/": Home,
  "/shop": ShoppingBag,
  "/offers": Tag,
  "/about": Info,
  "/contact": Mail,
};

export function StorefrontHeader({
  navLinks: navFromCms,
  config,
}: {
  navLinks?: HeaderNavLink[];
  config?: StorefrontHeaderConfig;
} = {}) {
  const pathname = usePathname();
  const { items, openDrawer } = useCartStore();
  const count = cartItemCount(items);
  const { locale, toggleLocale, t } = useStorefrontI18n();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const navLinks = (navFromCms?.length ? navFromCms : DEFAULT_NAV).map((link) => {
    const defaults = DEFAULT_NAV.find((d) => d.href === link.href);
    return {
      label: link.label,
      href: link.href,
      key: defaults?.key,
      icon: ICON_BY_HREF[link.href] ?? Flame,
    };
  });

  const showSearch = config?.showSearch !== false;
  const showAccount = config?.showAccountMenu !== false;
  const showWishlist = config?.showWishlist !== false;
  const showCart = config?.showCart !== false;
  const sticky = config?.stickyHeader !== false;

  return (
    <header
      className={cn(
        "z-40 border-b border-primary/10 bg-card/90 shadow-[0_8px_28px_-24px_rgba(18,75,45,0.8)] backdrop-blur-xl",
        sticky ? "sticky top-0" : "relative"
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="shrink-0 rounded-xl bg-[#f6efd9] px-1.5 py-1" aria-label="Halopeno home">
          <Image
            src="/images/brand/halopeno-wordmark-web.png"
            alt="Halopeno"
            width={300}
            height={100}
            loading="eager"
            unoptimized
            className="h-9 w-auto sm:h-10"
          />
        </Link>

        <nav className="ms-6 hidden flex-1 items-center justify-center gap-1 xl:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-[14px] font-medium transition-colors after:absolute after:inset-x-4 after:-bottom-0.5 after:h-0.5 after:origin-center after:rounded-full after:bg-accent after:transition-transform",
                  active
                    ? "text-primary after:scale-x-100"
                    : "text-foreground/70 after:scale-x-0 hover:text-primary hover:after:scale-x-100"
                )}
              >
                {link.key ? t(link.key) : link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-1 sm:gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <button className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm text-foreground/70 hover:bg-secondary/60 md:flex">
                <MapPin className="size-4 text-primary" />
                <span className="max-w-[120px] truncate">{t("nav.deliverTo")}</span>
                <ChevronDown className="size-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Delivery address
              </p>
              <div className="space-y-1.5">
                <button className="w-full rounded-xl bg-secondary px-3 py-2 text-left text-sm">
                  <span className="font-medium">Home</span> - 42 Cedar Lane, Springfield
                </button>
                <button className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary/60">
                  <span className="font-medium">Work</span> - 108 Market Street
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {showSearch ? (
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Search">
                  <Search className="size-[18px]" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    window.location.href = `/shop?search=${encodeURIComponent(query)}`;
                  }}
                  className="flex gap-2"
                >
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("search.placeholder")}
                    className="rounded-full"
                  />
                  <Button type="submit" size="icon" className="shrink-0">
                    <Search className="size-4" />
                  </Button>
                </form>
              </PopoverContent>
            </Popover>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            onClick={toggleLocale}
            aria-label="Toggle language"
            title={locale === "en" ? t("language.arabic") : t("language.english")}
          >
            <Languages className="size-[18px]" />
          </Button>

          {showWishlist ? (
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex" asChild aria-label="Favorites">
              <Link href="/account?tab=favorites">
                <Heart className="size-[18px]" />
              </Link>
            </Button>
          ) : null}

          {showAccount ? <AccountMenu /> : null}

          {showCart ? (
            <Button variant="ghost" size="icon" className="relative" onClick={openDrawer} aria-label="Cart">
              <ShoppingBag className="size-[18px]" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Button>
          ) : null}

          <Button className="hidden lg:inline-flex" asChild>
            <Link href="/shop">{t("nav.orderNow")}</Link>
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="storefront-theme w-[340px] max-w-[88vw] bg-card">
              <div className="flex h-full flex-col overflow-y-auto p-6 pt-16">
                <Link href="/" onClick={() => setMobileOpen(false)} className="mb-7 inline-flex self-start rounded-xl bg-[#f6efd9] px-2.5 py-1.5" aria-label="Halopeno home">
                  <Image
                    src="/images/brand/halopeno-wordmark-web.png"
                    alt="Halopeno"
                    width={300}
                    height={100}
                    unoptimized
                    className="h-11 w-auto"
                  />
                </Link>
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Browse</p>
                {navLinks.map((link) => (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "mb-1 flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "bg-secondary text-primary"
                        : "text-foreground/75 hover:bg-secondary/60 hover:text-primary"
                    )}
                  >
                    <link.icon className="size-[18px]" />
                    {link.key ? t(link.key) : link.label}
                  </Link>
                ))}
                <div className="my-4 h-px bg-primary/10" />
                <div className="rounded-[20px] bg-secondary/55 p-2">
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-foreground/75 hover:bg-card hover:text-primary"
                  >
                    <User className="size-[18px]" /> {t("account.myAccount")}
                  </Link>
                  <Link
                    href="/account?tab=orders"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-foreground/75 hover:bg-card hover:text-primary"
                  >
                    <PackageSearch className="size-[18px]" /> {t("account.trackOrder")}
                  </Link>
                  <button
                    onClick={toggleLocale}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start text-sm text-foreground/75 hover:bg-card hover:text-primary"
                  >
                    <Languages className="size-[18px]" /> {locale === "en" ? t("language.arabic") : t("language.english")}
                  </button>
                </div>

                <div className="mt-5 rounded-[22px] bg-primary p-4 text-primary-foreground">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Flame className="size-4 text-accent" /> {t("cart.title")}
                  </div>
                  <p className="mt-1 text-xs text-primary-foreground/65">
                    {count > 0 ? `${count} ${count === 1 ? "item" : "items"} waiting for you` : "Your next favorite flavor is one tap away"}
                  </p>
                  <Button
                    variant="olive"
                    className="mt-3 w-full"
                    size="sm"
                    onClick={() => {
                      setMobileOpen(false);
                      openDrawer();
                    }}
                  >
                    {t("cart.viewCart")}
                  </Button>
                </div>

                <p className="mt-auto pt-8 text-center text-xs font-medium text-muted-foreground">Small Jar. Big Kick.</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
