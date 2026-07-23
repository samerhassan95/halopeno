"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Rocket } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatCurrency } from "@/lib/utils";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "sonner";

const STEPS = ["Campaign details", "Audience", "Channels", "Content", "Schedule", "Goals", "Review"] as const;

const CHANNELS = ["email", "push", "sms", "social"];
const SEGMENTS = ["All customers", "New customers", "Returning customers", "Abandoned cart", "B2B leads", "Spice lovers"];

export default function CampaignBuilderPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("seasonal");
  const [description, setDescription] = React.useState("");
  const [segment, setSegment] = React.useState(SEGMENTS[0]);
  const [channels, setChannels] = React.useState<string[]>(["email"]);
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");
  const [budget, setBudget] = React.useState("1000");
  const [goal, setGoal] = React.useState("");

  function toggleChannel(ch: string) {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  }

  function canProceed() {
    if (step === 0) return name.trim().length > 0;
    if (step === 2) return channels.length > 0;
    return true;
  }

  async function handleSubmit(status: "draft" | "scheduled") {
    setSubmitting(true);
    try {
      await api.post("/marketing/campaigns", {
        name,
        type,
        channels,
        segment,
        goal,
        status,
        budget: Number(budget) || 0,
        spend: 0,
        revenue: 0,
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
      });
      toast.success(`"${name}" ${status === "draft" ? "saved as draft" : "scheduled"}`);
      router.push("/admin/marketing/campaigns");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]">
          <Rocket className="size-6 text-primary" /> Campaign Builder
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Set up a new multi-channel marketing campaign</p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => i < step && setStep(i)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-success/10 text-success cursor-pointer" : "bg-secondary text-muted-foreground"
            )}
          >
            {i < step ? <Check className="size-3" /> : <span>{i + 1}</span>}
            {s}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
          <CardDescription>Step {step + 1} of {STEPS.length}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-1.5">
                <Label>Campaign name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ramadan Flavor Festival" />
              </div>
              <div className="space-y-1.5">
                <Label>Campaign type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="product_launch">Product launch</SelectItem>
                    <SelectItem value="retention">Retention</SelectItem>
                    <SelectItem value="acquisition">Acquisition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Internal description</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this campaign for?"
                  rows={3}
                  className="flex w-full rounded-[10px] border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <div className="space-y-1.5">
              <Label>Audience segment</Label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Manage reusable segments in Audience Segments.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <Label>Channels</Label>
              {CHANNELS.map((ch) => (
                <label key={ch} className="flex items-center gap-2.5 rounded-[8px] border border-border p-2.5 text-sm capitalize">
                  <Checkbox checked={channels.includes(ch)} onCheckedChange={() => toggleChannel(ch)} />
                  {ch}
                </label>
              ))}
            </div>
          )}

          {step === 3 && (
            <>
              <div className="space-y-1.5">
                <Label>Subject / headline</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Spice up your Ramadan table 🌶️" />
              </div>
              <div className="space-y-1.5">
                <Label>Message body</Label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="Write your campaign content…"
                  className="flex w-full rounded-[10px] border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>
            </>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </div>
            </div>
          )}

          {step === 5 && (
            <>
              <div className="space-y-1.5">
                <Label>Budget (USD)</Label>
                <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Goal</Label>
                <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Drive repeat purchases" />
              </div>
            </>
          )}

          {step === 6 && (
            <div className="space-y-3 text-sm">
              <Row label="Name" value={name || "—"} />
              <Row label="Type" value={type} />
              <Row label="Audience" value={segment} />
              <Row label="Channels" value={channels.length ? channels.join(", ") : "—"} />
              <Row label="Subject" value={subject || "—"} />
              <Row label="Schedule" value={startsAt || endsAt ? `${startsAt || "—"} → ${endsAt || "—"}` : "Not scheduled"} />
              <Row label="Budget" value={formatCurrency(Number(budget) || 0)} />
              <Row label="Goal" value={goal || "—"} />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <Button variant="outline" className="gap-2" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="size-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button className="gap-2" disabled={!canProceed()} onClick={() => setStep((s) => s + 1)}>
              Next <ChevronRight className="size-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" disabled={submitting} onClick={() => handleSubmit("draft")}>
                Save draft
              </Button>
              <Button disabled={submitting} onClick={() => handleSubmit("scheduled")}>
                {submitting ? "Publishing…" : "Publish campaign"}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
