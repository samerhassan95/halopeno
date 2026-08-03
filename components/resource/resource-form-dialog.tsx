"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResourceField } from "@/lib/resource-pages";
import { MediaUploadField } from "@/components/ui/media-upload-field";

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: ResourceField[];
  initialValues?: Record<string, unknown>;
  submitting?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}

export function ResourceFormDialog({
  open,
  onOpenChange,
  title,
  fields,
  initialValues,
  submitting,
  onSubmit,
}: ResourceFormDialogProps) {
  const [values, setValues] = React.useState<Record<string, unknown>>({});

  React.useEffect(() => {
    if (!open) return;
    const task = window.setTimeout(() => setValues(initialValues ?? {}), 0);
    return () => window.clearTimeout(task);
  }, [open, initialValues]);

  function setField(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Fields are validated and sent directly to the API.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid max-h-[60vh] gap-4 overflow-y-auto scrollbar-thin px-0.5 py-1">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              {field.type !== "image" && field.type !== "video" && <Label htmlFor={field.key}>
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>}

              {field.type === "image" || field.type === "video" ? (
                <MediaUploadField
                  label={field.label}
                  kind={field.type}
                  value={(values[field.key] as string) ?? ""}
                  onChange={(url) => setField(field.key, url)}
                  required={field.required}
                />
              ) : field.type === "textarea" ? (
                <textarea
                  id={field.key}
                  required={field.required}
                  value={(values[field.key] as string) ?? ""}
                  onChange={(e) => setField(field.key, e.target.value)}
                  rows={3}
                  className="flex w-full rounded-[10px] border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              ) : field.type === "select" ? (
                <Select
                  value={(values[field.key] as string) ?? ""}
                  onValueChange={(v) => setField(field.key, v)}
                >
                  <SelectTrigger id={field.key}>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "checkbox" ? (
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id={field.key}
                    checked={Boolean(values[field.key])}
                    onCheckedChange={(v) => setField(field.key, Boolean(v))}
                  />
                  <label htmlFor={field.key} className="text-sm text-muted-foreground">
                    Enabled
                  </label>
                </div>
              ) : (
                <Input
                  id={field.key}
                  type={field.type === "number" ? "number" : "text"}
                  required={field.required}
                  value={(values[field.key] as string | number) ?? ""}
                  onChange={(e) =>
                    setField(field.key, field.type === "number" ? Number(e.target.value) : e.target.value)
                  }
                />
              )}
            </div>
          ))}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
