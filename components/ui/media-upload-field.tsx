"use client";
/* eslint-disable @next/next/no-img-element -- previews use freshly uploaded, runtime URLs */

import * as React from "react";
import { FileVideo2, ImagePlus, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type MediaKind = "image" | "video";
type UploadedMedia = { id: string; fileName: string; url: string; mimeType?: string; size?: number };

const ACCEPT = {
  image: "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif",
  video: "video/mp4,video/webm,video/quicktime,video/ogg",
};

export function MediaUploadField({ label, value, onChange, kind = "image", required, error, className }: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind?: MediaKind;
  required?: boolean;
  error?: string;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [fileName, setFileName] = React.useState("");
  const maxSize = kind === "image" ? 5 * 1024 * 1024 : 50 * 1024 * 1024;

  async function select(file?: File) {
    if (!file) return;
    if (!file.type.startsWith(`${kind}/`)) {
      toast.error(`Select a valid ${kind} file.`);
      return;
    }
    if (file.size > maxSize) {
      toast.error(`${kind === "image" ? "Images" : "Videos"} must be ${kind === "image" ? "5" : "50"} MB or smaller.`);
      return;
    }
    setUploading(true);
    try {
      const media = await api.upload<UploadedMedia>("/content/media-files/upload", file);
      setFileName(media.fileName);
      onChange(media.url);
    } catch (uploadError) {
      toast.error(uploadError instanceof ApiError ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return <div className={cn("space-y-1.5", className)}>
    <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
    <div
      className={cn("group relative flex min-h-36 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-secondary/30 transition-colors hover:border-primary/60", error && "border-destructive")}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => { event.preventDefault(); void select(event.dataTransfer.files[0]); }}
    >
      {value ? <>
        {kind === "image" ? <img src={value} alt={`${label} preview`} className="max-h-64 w-full object-contain" /> : <video src={value} controls className="max-h-64 w-full" />}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/65 p-2 text-white">
          <span className="min-w-0 flex-1 truncate text-xs">{fileName || value.split("/").pop()}</span>
          <Button type="button" size="icon-sm" variant="secondary" onClick={() => inputRef.current?.click()} aria-label={`Replace ${label}`}><RefreshCw /></Button>
          <Button type="button" size="icon-sm" variant="destructive" onClick={() => { setFileName(""); onChange(""); }} aria-label={`Remove ${label}`}><Trash2 /></Button>
        </div>
      </> : <button type="button" className="flex min-h-36 w-full flex-col items-center justify-center p-4 text-center" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="mb-2 size-6 animate-spin text-primary" /> : kind === "image" ? <ImagePlus className="mb-2 size-6 text-primary" /> : <FileVideo2 className="mb-2 size-6 text-primary" />}
        <span className="text-sm font-medium">{uploading ? "Uploading…" : "Drop a file or browse"}</span>
        <span className="mt-1 text-xs text-muted-foreground">{kind === "image" ? "JPG, PNG, WebP, GIF, SVG or AVIF · max 5 MB" : "MP4, WebM, MOV or OGG · max 50 MB"}</span>
      </button>}
      <input ref={inputRef} type="file" className="hidden" accept={ACCEPT[kind]} onChange={(event) => void select(event.target.files?.[0])} />
      {uploading && value && <div className="absolute inset-0 flex items-center justify-center bg-background/75"><UploadCloud className="size-6 animate-pulse text-primary" /></div>}
    </div>
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>;
}

export function MediaUploadListField({ label, values, onChange, kind = "image", maxFiles = 12, className }: {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  kind?: MediaKind;
  maxFiles?: number;
  className?: string;
}) {
  return <div className={cn("space-y-3", className)}>
    <MediaUploadField label={label} value="" kind={kind} onChange={(url) => onChange([...values, url].slice(0, maxFiles))} />
    {values.length > 0 && <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{values.map((url, index) => <div key={`${url}-${index}`} className="relative overflow-hidden rounded-xl border bg-secondary/20">
      {kind === "image" ? <img src={url} alt={`${label} ${index + 1}`} className="aspect-video w-full object-cover" /> : <video src={url} controls className="aspect-video w-full" />}
      <Button type="button" size="icon-sm" variant="destructive" className="absolute end-2 top-2" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button>
      <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">{url.split("/").pop()}</p>
    </div>)}</div>}
  </div>;
}
