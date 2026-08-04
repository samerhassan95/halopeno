"use client";

import { useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ADMIN_PAGES_AR } from "@/lib/i18n/admin-pages";
import { ADMIN_COLUMN_AR, ADMIN_LABEL_AR } from "@/lib/i18n/admin-columns";
import { ADMIN_PHRASES_AR } from "@/lib/i18n/admin-phrases";

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : `{${key}}`
  );
}

function currentAdminLocale(): "en" | "ar" {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("vantage-locale");
  return stored === "ar" ? "ar" : "en";
}

/** Works outside React hooks (nested manager helpers, one-line components). */
export function adminTr(phrase: string, vars?: Record<string, string | number>) {
  const locale = currentAdminLocale();
  const raw =
    locale === "ar"
      ? ADMIN_PHRASES_AR[phrase] ?? ADMIN_LABEL_AR[phrase] ?? phrase
      : phrase;
  return interpolate(raw, vars);
}

/** Translate free-form English admin UI phrases when locale is Arabic. */
export function useAdminTr() {
  const { locale } = useI18n();

  return useCallback(
    (phrase: string, vars?: Record<string, string | number>) => {
      const raw =
        locale === "ar"
          ? ADMIN_PHRASES_AR[phrase] ?? ADMIN_LABEL_AR[phrase] ?? phrase
          : phrase;
      return interpolate(raw, vars);
    },
    [locale]
  );
}

export function useAdminPageCopy(route: string, fallbackTitle: string, fallbackSubtitle?: string) {
  const { locale } = useI18n();
  if (locale !== "ar") {
    return { title: fallbackTitle, subtitle: fallbackSubtitle };
  }
  const ar = ADMIN_PAGES_AR[route];
  return {
    title: ar?.title ?? fallbackTitle,
    subtitle: ar?.subtitle ?? fallbackSubtitle,
  };
}

export function useAdminColumnLabel() {
  const { locale } = useI18n();
  return useCallback(
    (key: string, fallbackLabel: string) => {
      if (locale !== "ar") return fallbackLabel;
      return ADMIN_COLUMN_AR[key] ?? ADMIN_LABEL_AR[fallbackLabel] ?? fallbackLabel;
    },
    [locale]
  );
}
