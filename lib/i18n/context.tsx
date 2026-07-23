"use client";

import * as React from "react";
import { dictionaries, type Locale } from "./dictionaries";

type I18nContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

function getFromPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem("vantage-locale") as Locale | null;
    if (stored === "en" || stored === "ar") {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  React.useEffect(() => {
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", locale);
  }, [dir, locale]);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("vantage-locale", next);
  }, []);

  const t = React.useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      const dict = dictionaries[locale];
      let value = getFromPath(dict, path);
      if (typeof value !== "string") {
        value = getFromPath(dictionaries.en, path);
      }
      if (typeof value !== "string") return path;
      if (vars) {
        return Object.entries(vars).reduce(
          (str, [k, v]) => str.replace(`{${k}}`, String(v)),
          value
        );
      }
      return value;
    },
    [locale]
  );

  const value = React.useMemo(() => ({ locale, dir, setLocale, t }), [locale, dir, setLocale, t]);

  if (!mounted) {
    return (
      <I18nContext.Provider value={value}>
        <div style={{ visibility: "hidden" }}>{children}</div>
      </I18nContext.Provider>
    );
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
