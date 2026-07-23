"use client";

import * as React from "react";
import { Puzzle, Download, CheckCircle2, Power, Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/empty-state";
import { toast } from "sonner";

interface Addon {
  id: string;
  name: string;
  description: string;
  version: string;
  developer: string;
  installed: boolean;
  active: boolean;
  updateAvailable?: string;
}

const initialAddons: Addon[] = [
  { id: "abandoned-cart-recovery", name: "Abandoned Cart Recovery", description: "Automated email/SMS win-back flows for abandoned carts.", version: "2.4.0", developer: "Vantage Labs", installed: true, active: true },
  { id: "advanced-seo", name: "Advanced SEO Toolkit", description: "Bulk meta editing, sitemap control and schema markup.", version: "1.8.2", developer: "Vantage Labs", installed: true, active: true, updateAvailable: "1.9.0" },
  { id: "loyalty-plus", name: "Loyalty Plus", description: "Tiered rewards, referral bonuses and gamified badges.", version: "3.1.0", developer: "Third Party Co.", installed: true, active: false },
  { id: "whatsapp-notify", name: "WhatsApp Notifications", description: "Order and shipping updates over WhatsApp Business API.", version: "1.2.1", developer: "Vantage Labs", installed: false, active: false },
  { id: "advanced-analytics", name: "Advanced Analytics Connector", description: "Push commerce events to GA4, Meta Pixel and TikTok.", version: "2.0.3", developer: "Third Party Co.", installed: false, active: false },
  { id: "live-chat-widget", name: "Live Chat Widget", description: "Embeddable real-time chat widget for the storefront.", version: "1.0.0", developer: "Vantage Labs", installed: false, active: false },
];

export default function AddonManagerPage() {
  const [addons, setAddons] = React.useState(initialAddons);

  function install(id: string) {
    setAddons((prev) => prev.map((a) => (a.id === id ? { ...a, installed: true, active: true } : a)));
    toast.success("Add-on installed and activated");
  }

  function toggleActive(id: string) {
    setAddons((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  }

  function update(id: string) {
    setAddons((prev) => prev.map((a) => (a.id === id ? { ...a, version: a.updateAvailable!, updateAvailable: undefined } : a)));
    toast.success("Add-on updated");
  }

  function uninstall(id: string) {
    setAddons((prev) => prev.map((a) => (a.id === id ? { ...a, installed: false, active: false } : a)));
    toast.success("Add-on uninstalled");
  }

  const installed = addons.filter((a) => a.installed);
  const available = addons.filter((a) => !a.installed);
  const updates = addons.filter((a) => a.updateAvailable);

  const AddonCard = ({ addon }: { addon: Addon }) => (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
            <Puzzle className="size-5" />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{addon.name}</p>
              {addon.updateAvailable && <Badge variant="warning">Update available</Badge>}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{addon.description}</p>
            <p className="mt-1 text-xs text-muted-foreground">v{addon.version} · {addon.developer}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {addon.installed ? (
            <div className="flex items-center gap-2">
              <Switch checked={addon.active} onCheckedChange={() => toggleActive(addon.id)} />
              <span className="text-sm text-muted-foreground">{addon.active ? "Active" : "Inactive"}</span>
            </div>
          ) : (
            <Badge variant="secondary">Not installed</Badge>
          )}
          <div className="flex gap-2">
            {addon.updateAvailable && (
              <Button size="sm" variant="outline" onClick={() => update(addon.id)}>Update</Button>
            )}
            {addon.installed ? (
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => uninstall(addon.id)}>
                Uninstall
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5" onClick={() => install(addon.id)}>
                <Download className="size-3.5" /> Install
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Add-on Manager</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Install, update and configure platform extensions</p>
      </div>

      <Tabs defaultValue="installed">
        <TabsList>
          <TabsTrigger value="installed" className="gap-1.5"><CheckCircle2 className="size-3.5" />Installed ({installed.length})</TabsTrigger>
          <TabsTrigger value="available" className="gap-1.5"><Puzzle className="size-3.5" />Available ({available.length})</TabsTrigger>
          <TabsTrigger value="updates" className="gap-1.5"><Settings2 className="size-3.5" />Updates ({updates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="installed">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {installed.map((a) => <AddonCard key={a.id} addon={a} />)}
          </div>
        </TabsContent>
        <TabsContent value="available">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {available.map((a) => <AddonCard key={a.id} addon={a} />)}
          </div>
        </TabsContent>
        <TabsContent value="updates">
          {updates.length === 0 ? (
            <EmptyState icon={Power} title="Everything is up to date" className="py-16" />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {updates.map((a) => <AddonCard key={a.id} addon={a} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
