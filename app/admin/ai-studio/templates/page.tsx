"use client";

import * as React from "react";
import { FileSliders, Plus, Trash2, Share2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { AI_TOOLS } from "@/lib/ai-studio/tools";
import { useLocalCollection } from "@/lib/hooks/use-local-collection";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  contentType: string;
  defaultTone: string;
  variables: string;
  shared: boolean;
}

export default function AiTemplatesPage() {
  const { items, add, remove, update } = useLocalCollection<Template>("ai-studio-templates", []);
  const [open, setOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Template | null>(null);
  const [name, setName] = React.useState("");
  const [contentType, setContentType] = React.useState<string>(AI_TOOLS[0].type);
  const [defaultTone, setDefaultTone] = React.useState("friendly");
  const [variables, setVariables] = React.useState("");

  function create() {
    if (!name.trim()) {
      toast.error("Give the template a name");
      return;
    }
    add({ id: crypto.randomUUID(), name, contentType, defaultTone, variables, shared: false });
    toast.success(`Template "${name}" created`);
    setOpen(false);
    setName("");
    setVariables("");
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]"><FileSliders className="size-6 text-primary" /> AI Templates</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Reusable prompt templates for the content generator</p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}><Plus className="size-4" /> New template</Button>
      </div>

      {items.length === 0 ? (
        <Card><EmptyState icon={FileSliders} title="No templates yet" description="Create a reusable prompt template for your team." className="py-16" /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-[10px] bg-primary/10 text-primary"><FileSliders className="size-4" /></div>
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(t)}><Trash2 className="size-4 text-muted-foreground" /></Button>
              </div>
              <p className="font-medium">{t.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{AI_TOOLS.find((x) => x.type === t.contentType)?.label} · {t.defaultTone}</p>
              {t.variables && <p className="mt-1 text-xs text-muted-foreground">Variables: {t.variables}</p>}
              <div className="mt-3 flex items-center justify-between">
                <Badge variant={t.shared ? "success" : "secondary"}>{t.shared ? "Shared" : "Private"}</Badge>
                <button
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                  onClick={() => { update(t.id, { shared: !t.shared }); toast.success(t.shared ? "Made private" : "Shared with staff"); }}
                >
                  <Share2 className="size-3" /> {t.shared ? "Unshare" : "Share"}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New AI template</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Template name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Flash sale banner copy" />
            </div>
            <div className="space-y-1.5">
              <Label>Content type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{AI_TOOLS.map((t) => <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Default tone</Label>
              <Select value={defaultTone} onValueChange={setDefaultTone}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="playful">Playful</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Variables</Label>
              <Input value={variables} onChange={(e) => setVariables(e.target.value)} placeholder="e.g. {product}, {discount}" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This template will no longer be available in the content generator."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            remove(deleteTarget.id);
            toast.success("Template deleted");
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
