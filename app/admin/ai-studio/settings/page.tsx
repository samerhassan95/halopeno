"use client";

import * as React from "react";
import { Cog, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AiSettings {
  provider: string;
  apiKey: string;
  defaultModel: string;
  monthlyLimit: number;
  blockedWords: string;
  brandVoice: string;
  rolePermissions: { admin: boolean; contentManager: boolean; marketingManager: boolean };
}

const DEFAULTS: AiSettings = {
  provider: "none",
  apiKey: "",
  defaultModel: "template-v1",
  monthlyLimit: 500,
  blockedWords: "",
  brandVoice: "Warm, confident, a little playful — like a small-batch food brand that knows its craft.",
  rolePermissions: { admin: true, contentManager: true, marketingManager: false },
};

export default function AiSettingsPage() {
  const [settings, setSettings] = React.useState<AiSettings>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    try {
      const raw = window.localStorage.getItem("ai-studio-settings");
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  function set<K extends keyof AiSettings>(key: K, value: AiSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    window.localStorage.setItem("ai-studio-settings", JSON.stringify(settings));
    toast.success("AI Studio settings saved");
  }

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]"><Cog className="size-6 text-primary" /> AI Settings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Provider, limits and content guardrails</p>
        </div>
        <Button onClick={save} className="gap-2"><Save className="size-4" /> Save</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Provider</CardTitle><CardDescription>Connect a real LLM provider to replace local templates with live generations</CardDescription></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select value={settings.provider} onValueChange={(v) => set("provider", v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (local templates)</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="google">Google</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Default model</Label>
            <Input value={settings.defaultModel} onChange={(e) => set("defaultModel", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>API key</Label>
            <Input type="password" value={settings.apiKey} onChange={(e) => set("apiKey", e.target.value)} placeholder="Stored locally in this browser only" />
          </div>
          <div className="space-y-1.5">
            <Label>Monthly generation limit</Label>
            <Input type="number" value={settings.monthlyLimit} onChange={(e) => set("monthlyLimit", Number(e.target.value) || 0)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Guardrails</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Blocked words</Label>
            <Input value={settings.blockedWords} onChange={(e) => set("blockedWords", e.target.value)} placeholder="comma, separated, words" />
          </div>
          <div className="space-y-1.5">
            <Label>Brand voice</Label>
            <textarea
              value={settings.brandVoice}
              onChange={(e) => set("brandVoice", e.target.value)}
              rows={3}
              className="w-full rounded-[10px] border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Role permissions</CardTitle><CardDescription>Who can use AI Studio</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {([
            ["admin", "Super Administrator"],
            ["contentManager", "Content Manager"],
            ["marketingManager", "Marketing Manager"],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between rounded-[10px] border border-border p-3">
              <span className="text-sm font-medium">{label}</span>
              <Switch checked={settings.rolePermissions[key]} onCheckedChange={(v) => set("rolePermissions", { ...settings.rolePermissions, [key]: v })} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
