"use client";

import * as React from "react";
import Link from "next/link";
import { SwatchBook, Copy, Archive, CheckCircle2, Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocalCollection } from "@/lib/hooks/use-local-collection";
import { toast } from "sonner";

interface Theme {
  id: string;
  name: string;
  version: string;
  status: "published" | "draft" | "archived";
  updatedAt: string;
  updatedBy: string;
}

const seed: Theme[] = [
  { id: "classic", name: "Halopeno Classic", version: "v1.0", status: "published", updatedAt: "Just now", updatedBy: "Sarah Kim" },
  { id: "dark-harvest", name: "Dark Harvest", version: "v0.3", status: "draft", updatedAt: "2 days ago", updatedBy: "Sarah Kim" },
  { id: "minimal-jar", name: "Minimal Jar", version: "v0.1", status: "archived", updatedAt: "3 weeks ago", updatedBy: "Marcus Lee" },
];

const statusVariant: Record<Theme["status"], "success" | "secondary" | "warning"> = {
  published: "success",
  draft: "secondary",
  archived: "warning",
};

export default function ThemeLibraryPage() {
  const { items, update } = useLocalCollection<Theme>("design-studio-themes", seed);

  function activate(id: string) {
    items.forEach((t) => update(t.id, { status: t.id === id ? "published" : t.status === "published" ? "draft" : t.status }));
    toast.success("Theme activated");
  }

  function duplicate(theme: Theme) {
    toast.success(`Duplicated "${theme.name}"`, { description: "New draft created — open it from the theme editor." });
  }

  function archive(id: string) {
    update(id, { status: "archived" });
    toast.success("Theme archived");
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]">
          <SwatchBook className="size-6 text-primary" /> Theme Library
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Manage every theme available to the storefront</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Themes</CardTitle>
          <CardDescription>{items.length} total</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Theme</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead>Updated by</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.version}</TableCell>
                  <TableCell><Badge variant={statusVariant[t.status]}>{t.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{t.updatedAt}</TableCell>
                  <TableCell className="text-muted-foreground">{t.updatedBy}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/design-studio/themes/${t.id}/editor`}>
                        <Button variant="ghost" size="icon-sm" title="Edit"><Pencil className="size-3.5" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon-sm" title="Duplicate" onClick={() => duplicate(t)}><Copy className="size-3.5" /></Button>
                      {t.status !== "published" && (
                        <Button variant="ghost" size="icon-sm" title="Activate" onClick={() => activate(t.id)}><CheckCircle2 className="size-3.5 text-success" /></Button>
                      )}
                      {t.status !== "archived" && (
                        <Button variant="ghost" size="icon-sm" title="Archive" onClick={() => archive(t.id)}><Archive className="size-3.5 text-muted-foreground" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
