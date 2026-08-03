"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  ChevronDown,
  Gamepad2,
  Headphones,
  Heart,
  HelpCircle,
  Laptop,
  MapPin,
  Menu,
  Monitor,
  PackageCheck,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Star,
  Truck,
  UserRound,
  Watch,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { FoodImage } from "@/components/storefront/food-image";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import { cartItemCount, useCartStore } from "@/lib/storefront/store/cart-store";
import { useWishlistStore } from "@/lib/storefront/store/wishlist-store";
import { formatSAR } from "@/lib/storefront/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/storefront";

const categoryIcons = [Laptop, Smartphone, Gamepad2, Monitor, Camera, Watch, Headphones, Wifi];

export function ElectroHubHeader() {
  const categories = useCatalogStore((state) => state.categories);
  const products = useCatalogStore((state) => state.products);
  const items = useCartStore((state) => state.items);
  const openCart = useCartStore((state) => state.openDrawer);
  const wishlistCount = useWishlistStore((state) => state.productIds.length);
  const [query, setQuery] = React.useState("");
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const matches = query.trim() ? products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [];
  return <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white text-[#111827] shadow-sm">
    <div className="bg-[#163A8A] text-white"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-2 text-xs sm:px-6"><div className="flex items-center gap-4"><span>Support: +966 800 123 4567</span><span className="hidden sm:inline">Open daily 9:00–22:00</span></div><div className="flex items-center gap-4"><Link href="/track/order">Track Order</Link><span>EN / العربية</span><span>SAR</span></div></div></div>
    <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-4 sm:px-6"><button className="lg:hidden" onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? <X /> : <Menu />}</button><Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-[#163A8A]"><span className="flex size-9 items-center justify-center rounded-lg bg-[#2563EB] text-white"><Zap className="size-5" /></span>Electro<span className="text-[#06B6D4]">Hub</span></Link><div className="relative hidden flex-1 md:block"><div className="flex overflow-hidden rounded-xl border-2 border-[#2563EB]"><button className="flex items-center gap-1 border-r px-3 text-xs font-medium">All Categories<ChevronDown className="size-3" /></button><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 min-w-0 flex-1 px-4 text-sm outline-none" placeholder="Search products, brands and categories…" /><button className="bg-[#2563EB] px-5 text-white"><Search className="size-5" /></button></div>{matches.length > 0 && <div className="absolute inset-x-0 top-12 z-50 rounded-xl border bg-white p-2 shadow-xl">{matches.map((product) => <Link key={product.id} href={`/shop/${product.slug}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-[#EAF2FF]"><FoodImage src={product.image} alt={product.name} className="size-10 rounded-md" /><div><p className="text-sm font-medium">{product.name}</p><p className="text-xs text-[#6B7280]">{formatSAR(product.price)}</p></div></Link>)}</div>}</div><div className="ml-auto flex items-center gap-2"><HeaderAction icon={UserRound} label="Account" href="/account" /><HeaderAction icon={Heart} label={`Wishlist ${wishlistCount}`} href="/account?tab=wishlist" /><button onClick={openCart} className="relative flex items-center gap-2 rounded-xl p-2 hover:bg-[#EAF2FF]"><ShoppingCart className="size-5 text-[#2563EB]" /><span className="hidden text-xs font-medium xl:inline">Cart</span>{cartItemCount(items) > 0 && <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-[#EF4444] text-[9px] text-white">{cartItemCount(items)}</span>}</button></div></div>
    <nav className={cn("border-t", mobileOpen ? "block" : "hidden lg:block")}><div className="mx-auto flex max-w-[1500px] flex-col px-4 lg:flex-row lg:items-center lg:gap-7 sm:px-6"><button className="flex items-center gap-2 bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white"><Menu className="size-4" />Browse Categories</button>{["Home", "Shop", "Deals", "New Arrivals", "Best Sellers", "Brands", "Computers", "Mobile", "Gaming", "Blog", "Contact"].map((item) => <Link key={item} href={item === "Home" ? "/" : item === "Shop" ? "/shop" : `/${item.toLowerCase().replaceAll(" ", "-")}`} className="py-3 text-sm font-medium hover:text-[#2563EB]">{item}</Link>)}</div></nav>
    <div className="border-t bg-[#F5F7FB] md:hidden"><div className="flex p-3"><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 min-w-0 flex-1 rounded-l-lg border px-3 text-sm" placeholder="Search electronics…" /><button className="rounded-r-lg bg-[#2563EB] px-4 text-white"><Search className="size-4" /></button></div></div>
  </header>;
}

function HeaderAction({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) { return <Link href={href} className="hidden items-center gap-2 rounded-xl p-2 hover:bg-[#EAF2FF] sm:flex"><Icon className="size-5 text-[#2563EB]" /><span className="hidden text-xs font-medium xl:inline">{label}</span></Link> }

export function ElectroHubHomepage() {
  const products = useCatalogStore((state) => state.products);
  const categories = useCatalogStore((state) => state.categories);
  return <div className="bg-[#F5F7FB] text-[#111827]">
    <section className="border-b bg-white"><div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-5 lg:grid-cols-[230px_1fr_280px] sm:px-6"><div className="hidden rounded-xl border bg-white p-2 lg:block"><p className="border-b px-3 py-2 text-xs font-bold uppercase text-[#6B7280]">Top categories</p>{(categories.length ? categories.slice(0, 8) : ["Laptops", "Mobile Phones", "Gaming", "Monitors", "Cameras", "Smartwatches", "Audio", "Networking"]).map((category, index) => { const Icon = categoryIcons[index % categoryIcons.length]; const name = typeof category === "string" ? category : category.name; return <Link key={name} href="/shop" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-[#EAF2FF] hover:text-[#2563EB]"><Icon className="size-4" />{name}<ArrowRight className="ml-auto size-3" /></Link>; })}</div><div className="relative min-h-[390px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#163A8A] via-[#2563EB] to-[#06B6D4] p-8 text-white sm:p-12"><div className="relative z-10 max-w-lg"><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">NEW TECHNOLOGY · 2026</span><h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">Power your next big idea.</h1><p className="mt-4 text-sm leading-6 text-white/80 sm:text-base">Discover performance-ready technology, smart essentials, and dependable service—all in one place.</p><div className="mt-7 flex gap-3"><Link href="/shop" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#163A8A]">Shop new arrivals</Link><Link href="/offers" className="rounded-xl border border-white/40 px-5 py-3 text-sm font-bold">Explore deals</Link></div></div><Laptop className="absolute -bottom-10 -right-8 size-64 rotate-[-8deg] text-white/15 sm:size-80" /><div className="absolute right-20 top-12 size-32 rounded-full bg-cyan-300/20 blur-3xl" /></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"><PromoCard title="Gaming Week" text="Up to 35% off accessories" icon={Gamepad2} tone="bg-[#242631] text-white" /><PromoCard title="Smart Home" text="Connected living starts here" icon={Wifi} tone="bg-[#EAF2FF] text-[#163A8A]" /></div></div></section>
    <section className="mx-auto grid max-w-[1500px] grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-3 lg:grid-cols-6 sm:px-6">{[{ icon: Truck, title: "Free shipping", text: "Orders over 500 SAR" }, { icon: ShieldCheck, title: "Secure payment", text: "Protected checkout" }, { icon: RefreshCcw, title: "Easy returns", text: "14-day policy" }, { icon: BadgeCheck, title: "Genuine products", text: "Authorized sourcing" }, { icon: PackageCheck, title: "Warranty", text: "Official coverage" }, { icon: HelpCircle, title: "Expert support", text: "Here when needed" }].map((benefit) => <div key={benefit.title} className="flex gap-3 rounded-xl bg-white p-3"><benefit.icon className="size-5 shrink-0 text-[#2563EB]" /><div><p className="text-xs font-bold">{benefit.title}</p><p className="text-[10px] text-[#6B7280]">{benefit.text}</p></div></div>)}</section>
    <ProductRail title="Best Sellers" products={products.filter((product) => product.bestSeller).slice(0, 5).length ? products.filter((product) => product.bestSeller).slice(0, 5) : products.slice(0, 5)} />
    <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6"><div className="relative overflow-hidden rounded-2xl bg-[#242631] px-7 py-10 text-white sm:px-12"><span className="text-xs font-bold tracking-widest text-[#06B6D4]">LIMITED-TIME RELEASE</span><h2 className="mt-2 text-3xl font-black">Upgrade season starts now.</h2><p className="mt-2 max-w-xl text-sm text-white/65">Performance deals, smarter bundles, and fast delivery on the technology you have been waiting for.</p><Link href="/offers" className="mt-5 inline-flex rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold">See launch offers</Link><Monitor className="absolute -bottom-10 right-10 size-52 text-white/10" /></div></section>
    <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6"><SectionTitle title="Shop by Category" href="/shop" /><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">{categoryIcons.map((Icon, index) => <Link href="/shop" key={index} className="group rounded-xl bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"><Icon className="mx-auto size-8 text-[#2563EB]" /><p className="mt-3 text-xs font-bold">{["Laptops", "Mobile", "Gaming", "Monitors", "Cameras", "Watches", "Audio", "Networking"][index]}</p><p className="mt-1 text-[10px] text-[#6B7280]">Explore products</p></Link>)}</div></section>
    <ProductRail title="New Arrivals" products={products.filter((product) => product.isNew).slice(0, 5).length ? products.filter((product) => product.isNew).slice(0, 5) : products.slice(-5)} />
    <Newsletter />
  </div>;
}

function PromoCard({ title, text, icon: Icon, tone }: { title: string; text: string; icon: React.ElementType; tone: string }) { return <Link href="/offers" className={cn("relative min-h-44 overflow-hidden rounded-2xl p-6", tone)}><p className="text-xs font-semibold uppercase opacity-70">Featured</p><h3 className="mt-2 text-2xl font-black">{title}</h3><p className="mt-1 text-sm opacity-70">{text}</p><Icon className="absolute -bottom-5 -right-3 size-28 opacity-15" /></Link> }
function SectionTitle({ title, href }: { title: string; href: string }) { return <div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Curated technology</p><h2 className="mt-1 text-2xl font-black">{title}</h2></div><Link href={href} className="flex items-center gap-1 text-sm font-bold text-[#2563EB]">View all<ArrowRight className="size-4" /></Link></div> }
function ProductRail({ title, products }: { title: string; products: Product[] }) { return <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6"><SectionTitle title={title} href="/shop" /><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">{products.map((product) => <ElectroProductCard key={product.id} product={product} />)}</div></section> }
function ElectroProductCard({ product }: { product: Product }) { const favorite = useWishlistStore((state) => state.isFavorite(product.id)); const toggle = useWishlistStore((state) => state.toggle); const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0; return <article className="group relative overflow-hidden rounded-xl border border-[#E5E7EB] bg-white p-3 transition hover:border-[#2563EB]/40 hover:shadow-lg"><button onClick={() => toggle(product.id)} className="absolute right-3 top-3 z-10 rounded-full bg-white p-2 shadow"><Heart className={cn("size-4", favorite && "fill-[#EF4444] text-[#EF4444]")} /></button>{discount > 0 && <span className="absolute left-3 top-3 z-10 rounded-md bg-[#EF4444] px-2 py-1 text-[10px] font-bold text-white">-{discount}%</span>}<Link href={`/shop/${product.slug}`}><div className="aspect-square overflow-hidden rounded-lg bg-[#F5F7FB]"><FoodImage src={product.image} alt={product.name} className="size-full transition duration-300 group-hover:scale-105" /></div><p className="mt-3 text-[10px] font-bold uppercase text-[#2563EB]">In stock</p><h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold">{product.name}</h3><div className="mt-1 flex items-center gap-1"><Star className="size-3 fill-[#F59E0B] text-[#F59E0B]" /><span className="text-[10px] text-[#6B7280]">{product.rating} ({product.reviewCount})</span></div><div className="mt-3 flex items-end gap-2"><strong className="text-base text-[#163A8A]">{formatSAR(product.price)}</strong>{product.oldPrice && <span className="text-xs text-[#6B7280] line-through">{formatSAR(product.oldPrice)}</span>}</div></Link><Link href={`/shop/${product.slug}`} className="mt-3 flex w-full items-center justify-center rounded-lg bg-[#EAF2FF] py-2 text-xs font-bold text-[#2563EB] transition hover:bg-[#2563EB] hover:text-white">View product</Link></article> }

function Newsletter() { const [email, setEmail] = React.useState(""); const [done, setDone] = React.useState(false); return <section className="mt-8 bg-[#163A8A] px-4 py-12 text-white"><form onSubmit={(event) => { event.preventDefault(); if (email.includes("@")) setDone(true); }} className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center"><div><h2 className="text-2xl font-black">Technology worth knowing about.</h2><p className="mt-2 text-sm text-white/65">Get launch news, buying guides, and member-only offers.</p></div>{done ? <p className="rounded-xl bg-white/10 px-6 py-3 text-sm">Thanks—you are on the list.</p> : <div className="flex w-full max-w-lg"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 flex-1 rounded-l-xl px-4 text-sm text-[#111827] outline-none" placeholder="Email address" /><button className="rounded-r-xl bg-[#06B6D4] px-5 text-sm font-bold">Subscribe</button></div>}</form></section> }

export function ElectroHubFooter() { return <footer className="bg-[#242631] text-white"><div className="mx-auto grid max-w-[1500px] gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-5"><div className="lg:col-span-2"><p className="text-xl font-black">Electro<span className="text-[#06B6D4]">Hub</span></p><p className="mt-3 max-w-sm text-sm text-white/55">Reliable technology, expert support, secure shopping, and fast delivery for every setup.</p><div className="mt-5 flex items-center gap-2 text-xs text-white/70"><MapPin className="size-4" />Delivering across Saudi Arabia</div></div>{[{ title: "Shop", links: ["Computers", "Mobile", "Gaming", "Smart Home"] }, { title: "Support", links: ["Help Center", "Track Order", "Returns", "Warranty"] }, { title: "Company", links: ["About", "Contact", "Blog", "Careers"] }].map((group) => <div key={group.title}><h3 className="text-sm font-bold">{group.title}</h3><div className="mt-4 space-y-2">{group.links.map((link) => <Link key={link} href="/" className="block text-xs text-white/55 hover:text-white">{link}</Link>)}</div></div>)}</div><div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/40">© 2026 ElectroHub. Secure payments · Genuine products · Official warranty</div></footer> }
