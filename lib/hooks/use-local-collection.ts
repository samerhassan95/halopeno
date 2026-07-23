"use client";

import * as React from "react";

/** Simple localStorage-backed collection for client-only prototypes (no backend entity yet). */
export function useLocalCollection<T extends { id: string }>(key: string, seed: T[]) {
  const [items, setItems] = React.useState<T[]>(seed);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [key]);

  React.useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(key, JSON.stringify(items));
  }, [key, items, hydrated]);

  const add = React.useCallback((item: T) => setItems((prev) => [item, ...prev]), []);
  const remove = React.useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const update = React.useCallback(
    (id: string, patch: Partial<T>) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    []
  );

  return { items, add, remove, update };
}
