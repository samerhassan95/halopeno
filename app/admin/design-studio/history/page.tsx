"use client";

import * as React from "react";
import { History, Eye, GitCompare, RotateCcw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { toast } from "sonner";

interface Version {
  id: string;
  version: string;
  description: string;
  createdBy: string;
  createdAt: string;
  publishedAt: string | null;
  status: "published" | "draft";
}

const versions: Version[] = [
  { id: "v1.0", version: "v1.0", description: "Initial Halopeno Classic theme", createdBy: "Sarah Kim", createdAt: "Jul 1, 2026", publishedAt: "Jul 1, 2026", status: "published" },
  { id: "v0.9", version: "v0.9", description: "Updated hero copy and CTA color", createdBy: "Sarah Kim", createdAt: "Jun 20, 2026", publishedAt: "Jun 21, 2026", status: "draft" },
  { id: "v0.8", version: "v0.8", description: "Added testimonials section", createdBy: "Marcus Lee", createdAt: "Jun 10, 2026", publishedAt: "Jun 11, 2026", status: "draft" },
];

export default function VersionHistoryPage() {
  const [restoreTarget, setRestoreTarget] = React.useState<Version | null>(null);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]"><History className="size-6 text-primary" /> Theme Version History</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Preview, compare and restore previous theme versions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Versions</CardTitle>
          <CardDescription>{versions.length} recorded changes</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Change description</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Created date</TableHead>
                <TableHead>Published date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.version}</TableCell>
                  <TableCell className="max-w-[280px] truncate">{v.description}</TableCell>
                  <TableCell className="text-muted-foreground">{v.createdBy}</TableCell>
                  <TableCell className="text-muted-foreground">{v.createdAt}</TableCell>
                  <TableCell className="text-muted-foreground">{v.publishedAt ?? "—"}</TableCell>
                  <TableCell><Badge variant={v.status === "published" ? "success" : "secondary"}>{v.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" title="Preview" onClick={() => toast.info(`Previewing ${v.version}`)}><Eye className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon-sm" title="Compare" onClick={() => toast.info(`Comparing ${v.version} to current`)}><GitCompare className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon-sm" title="Restore" onClick={() => setRestoreTarget(v)}><RotateCcw className="size-3.5 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title={`Restore ${restoreTarget?.version}?`}
        description="This will replace the current draft with this version's configuration."
        confirmLabel="Restore"
        onConfirm={() => {
          toast.success(`Restored ${restoreTarget?.version}`);
          setRestoreTarget(null);
        }}
      />
    </div>
  );
}
