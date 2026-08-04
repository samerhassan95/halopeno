"use client";

import * as React from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/storefront/ui/button";

interface PopupRow {
  id: string;
  title: string;
  content: string | null;
  trigger: string;
}

export function StorefrontPopupHost() {
  const [popup, setPopup] = React.useState<PopupRow | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: PopupRow[] }>("/storefront/popups")
      .then((res) => {
        const first = res.data?.[0];
        if (!first || cancelled) return;
        const key = `halopeno-popup-dismissed-${first.id}`;
        if (typeof window !== "undefined" && window.localStorage.getItem(key)) return;
        setPopup(first);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!popup) return null;

  function dismiss() {
    if (popup) window.localStorage.setItem(`halopeno-popup-dismissed-${popup.id}`, "1");
    setPopup(null);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
      <div className="relative w-full max-w-md rounded-[28px] bg-card p-6 shadow-soft">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <h3 className="pr-8 font-display text-2xl font-semibold text-brown">{popup.title}</h3>
        {popup.content ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{popup.content}</p> : null}
        <Button className="mt-5 w-full rounded-full" onClick={dismiss}>
          Continue shopping
        </Button>
      </div>
    </div>
  );
}
