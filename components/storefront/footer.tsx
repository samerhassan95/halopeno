"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Apple, PlayCircle, Camera, Users } from "lucide-react";
import { Newsletter } from "./newsletter";
import { useStorefrontI18n } from "@/lib/storefront/i18n/context";

const menuLinks = [
  { label: "Home", href: "/" },
  { label: "Shop All Flavors", href: "/shop" },
  { label: "Offers", href: "/offers" },
  { label: "Blog", href: "/blog" },
];

const serviceLinks = [
  { label: "Track Your Order", href: "/track/demo" },
  { label: "Contact Us", href: "/contact" },
  { label: "About Us", href: "/about" },
  { label: "Halopeno Rewards", href: "/loyalty" },
  { label: "FAQs", href: "/contact" },
];

const accountLinks = [
  { label: "My Account", href: "/account" },
  { label: "Order History", href: "/account?tab=orders" },
  { label: "Favorites", href: "/account?tab=favorites" },
  { label: "Saved Addresses", href: "/account?tab=addresses" },
  { label: "Coupons", href: "/account?tab=coupons" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/contact" },
  { label: "Terms & Conditions", href: "/contact" },
  { label: "Refund Policy", href: "/contact" },
];

export function StorefrontFooter() {
  const { t } = useStorefrontI18n();
  return (
    <footer className="mt-20">
      <div className="space-y-16 pb-14">
        <Newsletter />

        <div className="rounded-t-[40px] bg-[#0c3822] px-4 pb-8 pt-14 text-[#f6efd9] sm:px-6 lg:px-10">
          <div className="mx-auto grid max-w-[1440px] gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2 lg:col-span-2">
              <Link
                href="/"
                className="inline-flex rounded-2xl bg-[#f6efd9] px-4 py-2"
                aria-label="Halopeno home"
              >
                <Image
                  src="/images/brand/halopeno-wordmark-web.png"
                  alt="Halopeno"
                  width={300}
                  height={100}
                  unoptimized
                  className="h-12 w-auto"
                />
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#f6efd9]/70">
                Small-batch pickled jalapeño flavors, crafted for real heat and real flavor. {t("footer.tagline")}
              </p>
              <div className="mt-5 flex items-center gap-3">
                {[Camera, Users, PlayCircle].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors hover:border-accent hover:bg-accent"
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <a href="#" className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-medium hover:bg-white/15">
                  <Apple className="size-4" /> App Store
                </a>
                <a href="#" className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-medium hover:bg-white/15">
                  <PlayCircle className="size-4" /> Google Play
                </a>
              </div>
            </div>

            <div>
              <p className="mb-4 font-display text-sm font-semibold text-white">Shop</p>
              <ul className="space-y-2.5 text-sm text-[#f6efd9]/70">
                {menuLinks.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition-colors hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 font-display text-sm font-semibold text-white">Customer Service</p>
              <ul className="space-y-2.5 text-sm text-[#f6efd9]/70">
                {serviceLinks.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition-colors hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 font-display text-sm font-semibold text-white">My Account</p>
              <ul className="space-y-2.5 text-sm text-[#f6efd9]/70">
                {accountLinks.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition-colors hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mx-auto mt-10 grid max-w-[1440px] gap-6 border-t border-white/10 pt-8 sm:grid-cols-3">
            <div className="flex items-start gap-3 text-sm text-[#f6efd9]/70">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              Delivering across Riyadh, Jeddah &amp; Dammam
            </div>
            <div className="flex items-start gap-3 text-sm text-[#f6efd9]/70">
              <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                +966 5 5019 2837
                <br />
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5" /> hello@halopeno.example
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm text-[#f6efd9]/70">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
              Customer support: Daily 9:00 AM - 9:00 PM
            </div>
          </div>

          <div className="mx-auto mt-8 flex max-w-[1440px] flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-[#f6efd9]/50 sm:flex-row">
            <p>© 2026 Halopeno. {t("footer.rights")}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {legalLinks.map((l) => (
                <Link key={l.label} href={l.href} className="hover:text-primary">
                  {l.label}
                </Link>
              ))}
              <span className="text-[#f6efd9]/40">Visa / Mastercard / mada / Apple Pay / Cash on Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
