import { Badge } from "@/components/ui/badge";

const SUCCESS_WORDS = ["active", "approved", "published", "delivered", "paid", "completed", "resolved", "connected", "verified", "in_house"];
const WARNING_WORDS = ["pending", "draft", "processing", "in_progress", "queued", "scheduled", "partial"];
const DESTRUCTIVE_WORDS = ["rejected", "cancelled", "failed", "inactive", "disabled", "suspended", "closed", "revoked", "out_of_stock", "returned"];

function variantFor(raw: string): "success" | "warning" | "destructive" | "secondary" {
  const v = raw.toLowerCase();
  if (SUCCESS_WORDS.some((w) => v.includes(w))) return "success";
  if (WARNING_WORDS.some((w) => v.includes(w))) return "warning";
  if (DESTRUCTIVE_WORDS.some((w) => v.includes(w))) return "destructive";
  return "secondary";
}

function formatLabel(raw: string) {
  return raw
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function StatusBadge({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  const raw = String(value);
  return <Badge variant={variantFor(raw)}>{formatLabel(raw)}</Badge>;
}
