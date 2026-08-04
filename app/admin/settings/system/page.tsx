"use client";

import * as React from "react";
import { Settings2, ShieldCheck, Mail, Database, Image as ImageIcon, Gauge, Search, Wrench, HeartPulse, Loader2, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";

const sections = [
  { value: "general", label: "General", icon: Settings2 },
  { value: "auth", label: "Security", icon: ShieldCheck },
  { value: "email", label: "Email", icon: Mail },
  { value: "storage", label: "Storage", icon: Database },
  { value: "media", label: "Media", icon: ImageIcon },
  { value: "performance", label: "Performance", icon: Gauge },
  { value: "search", label: "Search", icon: Search },
  { value: "maintenance", label: "Maintenance", icon: Wrench },
  { value: "health", label: "Health", icon: HeartPulse },
];

interface SystemConfig {
  siteName: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  timezone: string;
  dateFormat: string;
  weekStart: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

interface SettingRow {
  id: string;
  group: string;
  key: string;
  value: Partial<SystemConfig>;
}

const DEFAULTS: SystemConfig = {
  siteName: "Halopeno",
  tagline: "Small Jar. Big Kick.",
  metaTitle: "Halopeno | Small Jar. Big Kick.",
  metaDescription: "Small-batch pickled jalapeño flavors crafted for real heat and real flavor.",
  timezone: "Asia/Riyadh",
  dateFormat: "DD/MM/YYYY",
  weekStart: "Sunday",
  maintenanceMode: false,
  maintenanceMessage: "We are updating the kitchen. Back shortly.",
};

const healthChecks = [
  { name: "Application", ok: true },
  { name: "Database connection", ok: true },
  { name: "Queue workers", ok: true },
  { name: "Storage access", ok: true },
  { name: "Email provider", ok: false },
  { name: "Cron jobs", ok: true },
];

export default function SystemSettingsPage() {
  const [config, setConfig] = React.useState<SystemConfig>(DEFAULTS);
  const [settingId, setSettingId] = React.useState<string | null>(null);
  const [paymentSettingId, setPaymentSettingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [payments, setPayments] = React.useState([
    { id: "cod", label: "Cash on Delivery", enabled: true },
    { id: "card", label: "Card", enabled: true },
    { id: "apple_pay", label: "Apple Pay", enabled: true },
    { id: "google_pay", label: "Google Pay", enabled: true },
    { id: "wallet", label: "Wallet", enabled: false },
  ]);

  React.useEffect(() => {
    Promise.all([
      api.get<{ data: SettingRow[] }>("/settings/settings?search=storefront&limit=30"),
      api.get<{ data: SettingRow[] }>("/settings/settings?search=payment_methods&limit=10"),
    ])
      .then(([systemRes, paymentRes]) => {
        const row = systemRes.data.find((item) => item.group === "system" && item.key === "storefront");
        if (row) {
          setSettingId(row.id);
          setConfig({ ...DEFAULTS, ...row.value });
        }
        const pay = paymentRes.data.find((item) => item.group === "storefront" && item.key === "payment_methods");
        if (pay) {
          setPaymentSettingId(pay.id);
          const methods = (pay.value as { methods?: typeof payments })?.methods;
          if (Array.isArray(methods) && methods.length) setPayments(methods);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      if (settingId) await api.patch(`/settings/settings/${settingId}`, { value: config });
      else {
        const created = await api.post<SettingRow>("/settings/settings", {
          group: "system",
          key: "storefront",
          value: config,
        });
        setSettingId(created.id);
      }

      if (paymentSettingId) {
        await api.patch(`/settings/settings/${paymentSettingId}`, { value: { methods: payments } });
      } else {
        const created = await api.post<SettingRow>("/settings/settings", {
          group: "storefront",
          key: "payment_methods",
          value: { methods: payments },
        });
        setPaymentSettingId(created.id);
      }

      toast.success("System settings saved — live on the storefront");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">SEO, maintenance mode, and checkout payment methods</p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          {sections.map((s) => (
            <TabsTrigger key={s.value} value={s.value} className="gap-1.5">
              <s.icon className="size-3.5" />
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Core storefront identity and SEO defaults</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Application name</Label>
                <Input value={config.siteName} onChange={(e) => update("siteName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Tagline</Label>
                <Input value={config.tagline} onChange={(e) => update("tagline", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Meta title</Label>
                <Input value={config.metaTitle} onChange={(e) => update("metaTitle", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Meta description</Label>
                <Input value={config.metaDescription} onChange={(e) => update("metaDescription", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Default time zone</Label>
                <Input value={config.timezone} onChange={(e) => update("timezone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Date format</Label>
                <Input value={config.dateFormat} onChange={(e) => update("dateFormat", e.target.value)} />
              </div>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Checkout payment methods</CardTitle>
              <CardDescription>Toggle which methods appear on the storefront checkout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {payments.map((method, index) => (
                <div key={method.id} className="flex items-center justify-between rounded-[10px] border border-border p-3">
                  <span className="text-sm font-medium">{method.label}</span>
                  <Switch
                    checked={method.enabled}
                    onCheckedChange={(checked) =>
                      setPayments((prev) => prev.map((item, i) => (i === index ? { ...item, enabled: checked } : item)))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance</CardTitle>
              <CardDescription>Take the storefront offline for maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-[10px] border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Maintenance mode</p>
                  <p className="text-xs text-muted-foreground">Visitors see a maintenance message instead of the shop</p>
                </div>
                <Switch checked={config.maintenanceMode} onCheckedChange={(checked) => update("maintenanceMode", checked)} />
              </div>
              <div className="space-y-1.5">
                <Label>Maintenance message</Label>
                <Input value={config.maintenanceMessage} onChange={(e) => update("maintenanceMessage", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Health</CardTitle>
              <CardDescription>Infrastructure status snapshot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {healthChecks.map((check) => (
                <div key={check.name} className="flex items-center justify-between rounded-[10px] border border-border p-3 text-sm">
                  <span>{check.name}</span>
                  <span className={check.ok ? "text-success" : "text-warning-foreground"}>{check.ok ? "Healthy" : "Needs attention"}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {sections
          .filter((s) => !["general", "maintenance", "health"].includes(s.value))
          .map((section) => (
            <TabsContent key={section.value} value={section.value}>
              <Card>
                <CardHeader>
                  <CardTitle>{section.label}</CardTitle>
                  <CardDescription>Managed with the general storefront settings save action.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Use the General and Maintenance tabs for live storefront controls. Additional {section.label.toLowerCase()} knobs can be extended here later.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
      </Tabs>
    </div>
  );
}
