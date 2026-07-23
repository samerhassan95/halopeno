"use client";

import * as React from "react";
import { Users2, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { useLocalCollection } from "@/lib/hooks/use-local-collection";
import { toast } from "sonner";

const CONDITIONS = [
  "Customer group", "Location", "Order count", "Lifetime value", "Last purchase date",
  "Purchased products", "Abandoned cart", "Loyalty tier", "Email engagement",
];
const OPERATORS = ["equals", "greater than", "less than", "contains", "in the last"];

interface Segment {
  id: string;
  name: string;
  condition: string;
  operator: string;
  value: string;
  estimatedSize: number;
}

const seed: Segment[] = [
  { id: "s1", name: "High-value repeat buyers", condition: "Lifetime value", operator: "greater than", value: "$500", estimatedSize: 812 },
  { id: "s2", name: "Abandoned cart (7 days)", condition: "Abandoned cart", operator: "in the last", value: "7 days", estimatedSize: 214 },
  { id: "s3", name: "New this month", condition: "Order count", operator: "equals", value: "1", estimatedSize: 342 },
  { id: "s4", name: "Dormant customers", condition: "Last purchase date", operator: "greater than", value: "90 days ago", estimatedSize: 1203 },
];

export default function AudienceSegmentsPage() {
  const { items, add, remove } = useLocalCollection<Segment>("marketing-segments", seed);
  const [open, setOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Segment | null>(null);
  const [name, setName] = React.useState("");
  const [condition, setCondition] = React.useState(CONDITIONS[0]);
  const [operator, setOperator] = React.useState(OPERATORS[0]);
  const [value, setValue] = React.useState("");

  function createSegment() {
    if (!name.trim() || !value.trim()) {
      toast.error("Give the segment a name and a value");
      return;
    }
    add({
      id: crypto.randomUUID(),
      name,
      condition,
      operator,
      value,
      estimatedSize: Math.floor(Math.random() * 900) + 50,
    });
    toast.success(`Segment "${name}" created`);
    setOpen(false);
    setName("");
    setValue("");
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]">
            <Users2 className="size-6 text-primary" /> Audience Segments
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Build reusable customer segments for campaigns and promotions</p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New segment
        </Button>
      </div>

      {items.length === 0 ? (
        <Card><EmptyState icon={Users2} title="No segments yet" description="Create your first audience segment." className="py-16" /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-[10px] bg-primary/10 text-primary"><Users2 className="size-4" /></div>
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(s)}><Trash2 className="size-4 text-muted-foreground" /></Button>
              </div>
              <p className="font-medium">{s.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.condition} {s.operator} {s.value}</p>
              <Badge variant="secondary" className="mt-3">~{s.estimatedSize.toLocaleString()} customers</Badge>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New audience segment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Segment name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Big spenders" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Operator</Label>
                <Select value={operator} onValueChange={setOperator}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{OPERATORS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Value</Label>
              <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 500 or 30 days" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createSegment}>Create segment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This segment will no longer be available for campaigns or promotions."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            remove(deleteTarget.id);
            toast.success("Segment deleted");
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
