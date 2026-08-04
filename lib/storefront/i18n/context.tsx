"use client";

import * as React from "react";
import { dictionaries, type Locale } from "./dictionary";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`
  );
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "halopeno-locale";

export function StorefrontI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en");

  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") setLocaleState(saved);
  }, []);

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  React.useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [dir, locale]);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleLocale = React.useCallback(() => {
    setLocale(locale === "en" ? "ar" : "en");
  }, [locale, setLocale]);

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const count = typeof vars?.count === "number" ? vars.count : undefined;
      const pluralKey = count !== undefined && count !== 1 ? `${key}_plural` : key;
      const raw =
        dictionaries[locale][pluralKey] ??
        dictionaries[locale][key] ??
        dictionaries.en[pluralKey] ??
        dictionaries.en[key] ??
        key;
      return interpolate(raw, vars);
    },
    [locale]
  );

  const value = React.useMemo(
    () => ({ locale, setLocale, toggleLocale, t, dir }),
    [locale, setLocale, toggleLocale, t, dir]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useStorefrontI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useStorefrontI18n must be used within StorefrontI18nProvider");
  return ctx;
}

export function localizedName(product: { name: string; nameAr?: string }, locale: Locale) {
  return locale === "ar" && product.nameAr ? product.nameAr : product.name;
}

export function localizedDescription(product: { description: string; descriptionAr?: string }, locale: Locale) {
  return locale === "ar" && product.descriptionAr ? product.descriptionAr : product.description;
}

export function localizedLongDescription(
  product: { longDescription: string; longDescriptionAr?: string },
  locale: Locale
) {
  return locale === "ar" && product.longDescriptionAr ? product.longDescriptionAr : product.longDescription;
}
