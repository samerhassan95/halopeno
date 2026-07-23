"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/resource/status-badge";
import { formatCurrency } from "@/lib/utils";
import type { ResourceColumn } from "@/lib/resource-pages";

type Row = Record<string, unknown>;

function renderValue(row: Row, key: string, type: string | undefined) {
  const value = row[key];
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  switch (type) {
    case "currency":
      return formatCurrency(Number(value));
    case "number":
      return Number(value).toLocaleString();
    case "date":
      return new Date(String(value)).toLocaleString();
    case "boolean":
      return value ? "Yes" : "No";
    case "badge":
      return <StatusBadge value={value} />;
    default:
      return Array.isArray(value) ? value.join(", ") : String(value);
  }
}

interface ResourceViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  columns: ResourceColumn[];
  row: Row | null;
  onEdit?: () => void;
}

export function ResourceViewDialog({ open, onOpenChange, title, columns, row, onEdit }: ResourceViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Record details</DialogDescription>
        </DialogHeader>

        {row && (
          <div className="grid max-h-[60vh] gap-3 overflow-y-auto scrollbar-thin px-0.5 py-1 text-sm">
            {columns.map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0">
                <span className="text-muted-foreground">{col.label}</span>
                <span className="max-w-[60%] text-right font-medium">{renderValue(row, col.key, col.type)}</span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onEdit && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }}
            >
              Edit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
