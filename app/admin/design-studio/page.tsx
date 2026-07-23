"use client";

import * as React from "react";
import Link from "next/link";
import { LayoutTemplate, SwatchBook, Palette, PanelTop, PanelBottom, History, Home, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const shortcuts = [
  { title: "Theme Library", description: "Browse, duplicate and activate themes", href: "/admin/design-studio/themes", icon: SwatchBook, tone: "primary" as const },
  { title: "Global Styles", description: "Brand colors and shape", href: "/admin/design-studio/global-styles", icon: Palette, tone: "accent" as const },
  { title: "Header Builder", description: "Logo, navigation and announcement bar", href: "/admin/design-studio/header", icon: PanelTop, tone: "success" as const },
  { title: "Footer Builder", description: "Columns, links and newsletter form", href: "/admin/design-studio/footer", icon: PanelBottom, tone: "warning" as const },
  { title: "Homepage Builder", description: "Drag, reorder and schedule sections", href: "/admin/homepage-builder", icon: Home, tone: "destructive" as const },
  { title: "Version History", description: "Preview, compare and restore", href: "/admin/design-studio/history", icon: History, tone: "primary" as const },
];

const iconTone = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-[#92640a] dark:text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export default function DesignStudioDashboard() {
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]">
          <LayoutTemplate className="size-6 text-primary" /> Design Studio
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Customize the Halopeno storefront's visual identity and layout without code</p>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">Halopeno Classic</p>
              <Badge variant="success">Published</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Current live theme · v1.0 · Last updated just now</p>
          </div>
          <Link href="/admin/design-studio/themes/classic/editor" className="flex items-center gap-1 text-sm text-primary hover:underline">
            Open theme editor <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full p-5 transition-shadow hover:shadow-soft-lg">
              <div className={`mb-3 flex size-10 items-center justify-center rounded-[11px] ${iconTone[s.tone]}`}>
                <s.icon className="size-[19px]" />
              </div>
              <p className="font-medium">{s.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently edited</CardTitle>
          <CardDescription>Components touched in this workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { name: "Global Styles", when: "Just now" },
            { name: "Homepage sections", when: "10 minutes ago" },
          ].map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-[8px] px-2 py-2 text-sm hover:bg-secondary">
              <span className="font-medium">{r.name}</span>
              <span className="text-xs text-muted-foreground">{r.when}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
