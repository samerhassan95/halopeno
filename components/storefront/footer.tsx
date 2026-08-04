"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Apple, PlayCircle, Camera, Users } from "lucide-react";
import { Newsletter } from "./newsletter";
import { useStorefrontI18n } from "@/lib/storefront/i18n/context";

export type FooterNavLink = { label: string; href: string };
export type StorefrontFooterConfig = {
  showNewsletter?: boolean;
  showSocialLinks?: boolean;
  showPaymentLogos?: boolean;
  copyrightText?: string;
};

export function StorefrontFooter({
  menuLinks: menuFromCms,
  config,
}: {
  menuLinks?: FooterNavLink[];
  config?: StorefrontFooterConfig;
} = {}) {
  const { t } = useStorefrontI18n();

  const defaultShopLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("footer.shopAll"), href: "/shop" },
    { label: t("nav.offers"), href: "/offers" },
    { label: t("nav.blog"), href: "/blog" },
  ];
  const serviceLinks = [
    { label: t("footer.track"), href: "/track/demo" },
    { label: t("footer.contact"), href: "/contact" },
    { label: t("footer.about"), href: "/about" },
    { label: t("footer.rewards"), href: "/loyalty" },
    { label: t("footer.faqs"), href: "/faq" },
  ];
  const accountLinks = [
    { label: t("account.myAccount"), href: "/account" },
    { label: t("footer.orderHistory"), href: "/account?tab=orders" },
    { label: t("account.favorites"), href: "/account?tab=favorites" },
    { label: t("footer.savedAddresses"), href: "/account?tab=addresses" },
    { label: t("account.coupons"), href: "/account?tab=coupons" },
  ];
  const legalLinks = [
    { label: t("footer.privacy"), href: "/pages/privacy" },
    { label: t("footer.terms"), href: "/pages/terms" },
    { label: t("footer.refund"), href: "/pages/refund" },
    { label: t("footer.faqs"), href: "/faq" },
  ];

  const shopLinks = menuFromCms?.length ? menuFromCms : defaultShopLinks;
  const showNewsletter = config?.showNewsletter !== false;
  const showSocial = config?.showSocialLinks !== false;
  const showPayment = config?.showPaymentLogos !== false;
  const copyright = config?.copyrightText || `© 2026 Halopeno. ${t("footer.rights")}`;

  return (
    <footer className="mt-20">
      <div className="space-y-16 pb-14">
        {showNewsletter ? <Newsletter /> : null}

        <div className="rounded-t-[40px] bg-[#0c3822] px-4 pb-8 pt-14 text-[#f6efd9] sm:px-6 lg:px-10">
          <div className="mx-auto grid max-w-[1440px] gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2 lg:col-span-2">
              <Link
                href="/"
                className="inline-flex rounded-2xl bg-[#f6efd9] px-4 py-2"
                aria-label="Halopeno"
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
                {t("footer.blurb")} {t("footer.tagline")}
              </p>
              {showSocial ? (
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
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2.5">
                <a href="#" className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-medium hover:bg-white/15">
                  <Apple className="size-4" /> {t("footer.appStore")}
                </a>
                <a href="#" className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-medium hover:bg-white/15">
                  <PlayCircle className="size-4" /> {t("footer.googlePlay")}
                </a>
              </div>
            </div>

            <div>
              <p className="mb-4 font-display text-sm font-semibold text-white">{t("footer.shop")}</p>
              <ul className="space-y-2.5 text-sm text-[#f6efd9]/70">
                {shopLinks.map((l) => (
                  <li key={`${l.href}-${l.label}`}>
                    <Link href={l.href} className="transition-colors hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 font-display text-sm font-semibold text-white">{t("footer.service")}</p>
              <ul className="space-y-2.5 text-sm text-[#f6efd9]/70">
                {serviceLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 font-display text-sm font-semibold text-white">{t("footer.account")}</p>
              <ul className="space-y-2.5 text-sm text-[#f6efd9]/70">
                {accountLinks.map((l) => (
                  <li key={l.href}>
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
              {t("footer.delivery")}
            </div>
            <div className="flex items-start gap-3 text-sm text-[#f6efd9]/70">
              <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                +966 5 5019 2837
                <br />
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5" /> hello@halopeno.com
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm text-[#f6efd9]/70">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
              {t("footer.supportHours")}
            </div>
          </div>

          <div className="mx-auto mt-8 flex max-w-[1440px] flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-[#f6efd9]/50 sm:flex-row">
            <p>{copyright}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {legalLinks.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-primary">
                  {l.label}
                </Link>
              ))}
              {showPayment ? (
                <span className="text-[#f6efd9]/40">Visa / Mastercard / mada / Apple Pay / COD</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
