"use client";

import * as React from "react";
import { DatabaseBackup, Download, RotateCw, HardDrive, CheckCircle2, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { StatCard } from "@/components/dashboard/stat-card";
import { toast } from "sonner";

interface Backup {
  id: string;
  name: string;
  type: string;
  size: string;
  createdAt: string;
  status: "completed" | "in_progress" | "failed";
}

const initialBackups: Backup[] = [
  { id: "1", name: "Nightly full backup", type: "Full backup", size: "1.2 GB", createdAt: "2026-07-23 03:00", status: "completed" },
  { id: "2", name: "Pre-release snapshot", type: "Database backup", size: "480 MB", createdAt: "2026-07-21 14:32", status: "completed" },
  { id: "3", name: "Weekly media backup", type: "Media backup", size: "3.6 GB", createdAt: "2026-07-19 03:00", status: "completed" },
  { id: "4", name: "Config snapshot", type: "Configuration backup", size: "4 MB", createdAt: "2026-07-18 09:12", status: "failed" },
];

export default function DatabaseBackupPage() {
  const [backups, setBackups] = React.useState(initialBackups);
  const [creating, setCreating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [restoreTarget, setRestoreTarget] = React.useState<Backup | null>(null);
  const [restoring, setRestoring] = React.useState(false);

  function createBackup() {
    setCreating(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setCreating(false);
          setBackups((prev) => [
            { id: crypto.randomUUID(), name: "Manual backup", type: "Full backup", size: "1.3 GB", createdAt: new Date().toISOString().slice(0, 16).replace("T", " "), status: "completed" },
            ...prev,
          ]);
          toast.success("Backup completed successfully");
          return 100;
        }
        return p + 20;
      });
    }, 400);
  }

  function restore() {
    if (!restoreTarget) return;
    setRestoring(true);
    setTimeout(() => {
      setRestoring(false);
      setRestoreTarget(null);
      toast.success(`Restored from "${restoreTarget.name}"`);
    }, 1500);
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Database Backup</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Create, store and restore full or partial backups</p>
        </div>
        <Button className="gap-2" onClick={createBackup} disabled={creating}>
          <DatabaseBackup className="size-4" />
          {creating ? "Creating…" : "Create backup"}
        </Button>
      </div>

      {creating && (
        <Card>
          <CardContent className="space-y-2 pt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium"><Clock className="size-4" /> Backup in progress…</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard icon={CheckCircle2} tone="success" title="Last successful backup" value="3h ago" />
        <StatCard icon={Clock} tone="primary" title="Next scheduled" value="Tonight 3:00 AM" />
        <StatCard icon={HardDrive} tone="accent" title="Storage used" value="12.4 GB" />
        <StatCard icon={HardDrive} tone="warning" title="Available storage" value="87.6 GB" />
      </div>

      <Card>
        <CardHeader><CardTitle>Backups</CardTitle><CardDescription>Stored on S3-compatible object storage</CardDescription></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Size</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-muted-foreground">{b.type}</TableCell>
                  <TableCell>{b.size}</TableCell>
                  <TableCell className="text-muted-foreground">{b.createdAt}</TableCell>
                  <TableCell>
                    <Badge variant={b.status === "completed" ? "success" : b.status === "failed" ? "destructive" : "secondary"}>
                      {b.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5" disabled={b.status !== "completed"} onClick={() => toast.success(`Downloading ${b.name}…`)}>
                        <Download className="size-3.5" /> Download
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" disabled={b.status !== "completed"} onClick={() => setRestoreTarget(b)}>
                        <RotateCw className="size-3.5" /> Restore
                      </Button>
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
        title={`Restore from "${restoreTarget?.name}"?`}
        description="This puts the store in maintenance mode, creates a pre-restore safety backup, and replaces current data with the selected backup. This cannot be undone."
        confirmLabel={restoring ? "Restoring…" : "Restore backup"}
        onConfirm={restore}
      />
    </div>
  );
}
