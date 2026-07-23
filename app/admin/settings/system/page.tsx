"use client";

import * as React from "react";
import { Settings2, ShieldCheck, Mail, Database, Image as ImageIcon, Gauge, Search, Wrench, HeartPulse } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

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

function saveToast() {
  toast.success("Settings saved");
}

const healthChecks = [
  { name: "Application", ok: true },
  { name: "Database connection", ok: true },
  { name: "Queue workers", ok: true },
  { name: "Storage access", ok: true },
  { name: "Email provider", ok: false },
  { name: "Cron jobs", ok: true },
];

export default function SystemSettingsPage() {
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Global application behavior, security and infrastructure</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          {sections.map((s) => (
            <TabsTrigger key={s.value} value={s.value} className="gap-1.5"><s.icon className="size-3.5" />{s.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle>General</CardTitle><CardDescription>Core application defaults</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Application name</Label><Input defaultValue="Vantage Commerce OS" /></div>
              <div className="space-y-1.5"><Label>Default time zone</Label><Input defaultValue="Asia/Riyadh" /></div>
              <div className="space-y-1.5"><Label>Date format</Label><Input defaultValue="DD/MM/YYYY" /></div>
              <div className="space-y-1.5"><Label>Week start day</Label><Input defaultValue="Sunday" /></div>
              <div className="flex items-center justify-between rounded-[10px] border border-border p-3 sm:col-span-2">
                <div><p className="text-sm font-medium">Maintenance mode</p><p className="text-xs text-muted-foreground">Take the storefront offline for maintenance</p></div>
                <Switch />
              </div>
              <div className="sm:col-span-2"><Button onClick={saveToast}>Save changes</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth">
          <Card>
            <CardHeader><CardTitle>Authentication</CardTitle><CardDescription>Password policy and session behavior</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Minimum password length</Label><Input type="number" defaultValue={10} /></div>
              <div className="space-y-1.5"><Label>Login attempt limit</Label><Input type="number" defaultValue={5} /></div>
              <div className="space-y-1.5"><Label>Session duration (minutes)</Label><Input type="number" defaultValue={60} /></div>
              <div className="space-y-1.5"><Label>Account lock duration (minutes)</Label><Input type="number" defaultValue={15} /></div>
              <div className="flex items-center justify-between rounded-[10px] border border-border p-3 sm:col-span-2">
                <div><p className="text-sm font-medium">Require two-factor authentication</p><p className="text-xs text-muted-foreground">Enforced for all staff with admin access</p></div>
                <Switch defaultChecked />
              </div>
              <div className="sm:col-span-2"><Button onClick={saveToast}>Save changes</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader><CardTitle>Email</CardTitle><CardDescription>Outbound transactional email provider</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>SMTP host</Label><Input placeholder="smtp.sendgrid.net" /></div>
              <div className="space-y-1.5"><Label>SMTP port</Label><Input type="number" defaultValue={587} /></div>
              <div className="space-y-1.5"><Label>Default sender name</Label><Input defaultValue="Halopeno" /></div>
              <div className="space-y-1.5"><Label>Default sender email</Label><Input placeholder="no-reply@halopeno.com" /></div>
              <div className="flex gap-2 sm:col-span-2">
                <Button variant="outline" onClick={() => toast.success("Test connection succeeded")}>Test connection</Button>
                <Button onClick={saveToast}>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader><CardTitle>Storage</CardTitle><CardDescription>Object storage for media and uploads</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Storage provider</Label><Input defaultValue="S3-compatible" /></div>
              <div className="space-y-1.5"><Label>Bucket name</Label><Input placeholder="halopeno-media" /></div>
              <div className="space-y-1.5"><Label>Region</Label><Input placeholder="me-central-1" /></div>
              <div className="space-y-1.5"><Label>Maximum file size (MB)</Label><Input type="number" defaultValue={25} /></div>
              <div className="sm:col-span-2"><Button onClick={saveToast}>Save changes</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader><CardTitle>Media</CardTitle><CardDescription>Image processing defaults</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-[10px] border border-border p-3"><p className="text-sm font-medium">Automatic WebP conversion</p><Switch defaultChecked /></div>
              <div className="flex items-center justify-between rounded-[10px] border border-border p-3"><p className="text-sm font-medium">Image lazy loading</p><Switch defaultChecked /></div>
              <div className="space-y-1.5"><Label>Maximum image width (px)</Label><Input type="number" defaultValue={2048} /></div>
              <div className="space-y-1.5"><Label>Video size limit (MB)</Label><Input type="number" defaultValue={100} /></div>
              <div className="sm:col-span-2"><Button onClick={saveToast}>Save changes</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader><CardTitle>Performance</CardTitle><CardDescription>Caching and background processing</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-[10px] border border-border p-3"><p className="text-sm font-medium">Page cache</p><Switch defaultChecked /></div>
              <div className="flex items-center justify-between rounded-[10px] border border-border p-3"><p className="text-sm font-medium">API response cache</p><Switch defaultChecked /></div>
              <div className="space-y-1.5"><Label>Cache duration (minutes)</Label><Input type="number" defaultValue={15} /></div>
              <div className="flex gap-2 sm:col-span-2">
                <Button variant="outline" onClick={() => toast.success("Cache cleared")}>Clear cache</Button>
                <Button onClick={saveToast}>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search">
          <Card>
            <CardHeader><CardTitle>Search</CardTitle><CardDescription>Storefront search behavior</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Minimum search characters</Label><Input type="number" defaultValue={2} /></div>
              <div className="flex items-center justify-between rounded-[10px] border border-border p-3"><p className="text-sm font-medium">Fuzzy search</p><Switch defaultChecked /></div>
              <div className="sm:col-span-2"><Button onClick={saveToast}>Save changes</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader><CardTitle>Maintenance</CardTitle><CardDescription>Take the storefront offline for planned work</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-[10px] border border-warning/30 bg-warning/10 p-3">
                <p className="text-sm font-medium">Maintenance mode is currently off</p>
                <Switch />
              </div>
              <div className="space-y-1.5"><Label>Maintenance message</Label><Input defaultValue="We'll be back shortly." /></div>
              <Button onClick={saveToast}>Save changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader><CardTitle>System health</CardTitle><CardDescription>Live status of critical dependencies</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {healthChecks.map((h) => (
                <div key={h.name} className="flex items-center justify-between rounded-[10px] border border-border p-3 text-sm">
                  <span>{h.name}</span>
                  <Badge variant={h.ok ? "success" : "destructive"}>{h.ok ? "Healthy" : "Disconnected"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
