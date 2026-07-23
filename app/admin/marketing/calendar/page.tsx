"use client";

import * as React from "react";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
}

interface Coupon { id: string; code: string; startsAt?: string; expiresAt?: string }
interface FlashDeal { id: string; title: string; startsAt: string; endsAt: string }

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "campaign" | "coupon" | "flash_deal";
}

const typeColor: Record<CalendarEvent["type"], string> = {
  campaign: "bg-primary/15 text-primary",
  coupon: "bg-success/15 text-success",
  flash_deal: "bg-warning/15 text-[#92640a] dark:text-warning",
};

export default function MarketingCalendarPage() {
  const [month, setMonth] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);

  React.useEffect(() => {
    Promise.all([
      api.get<{ data: Campaign[] }>("/marketing/campaigns").catch(() => ({ data: [] as Campaign[] })),
      api.get<{ data: Coupon[] }>("/marketing/coupons").catch(() => ({ data: [] as Coupon[] })),
      api.get<{ data: FlashDeal[] }>("/marketing/flash-deals").catch(() => ({ data: [] as FlashDeal[] })),
    ]).then(([campaigns, coupons, deals]) => {
      const evs: CalendarEvent[] = [];
      for (const c of campaigns.data) {
        if (c.startsAt) evs.push({ id: `camp-start-${c.id}`, title: `${c.name} starts`, date: new Date(c.startsAt), type: "campaign" });
        if (c.endsAt) evs.push({ id: `camp-end-${c.id}`, title: `${c.name} ends`, date: new Date(c.endsAt), type: "campaign" });
      }
      for (const c of coupons.data) {
        if (c.expiresAt) evs.push({ id: `coup-${c.id}`, title: `${c.code} expires`, date: new Date(c.expiresAt), type: "coupon" });
      }
      for (const d of deals.data) {
        evs.push({ id: `deal-${d.id}`, title: `${d.title}`, date: new Date(d.startsAt), type: "flash_deal" });
      }
      setEvents(evs);
    });
  }, []);

  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const firstDay = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventsByDay = React.useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (const e of events) {
      if (e.date.getFullYear() === year && e.date.getMonth() === monthIdx) {
        const day = e.date.getDate();
        map.set(day, [...(map.get(day) ?? []), e]);
      }
    }
    return map;
  }, [events, year, monthIdx]);

  const today = new Date();
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === monthIdx && today.getDate() === day;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]">
            <CalendarRange className="size-6 text-primary" /> Marketing Calendar
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Campaigns, coupons and flash deals in one timeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth(new Date(year, monthIdx - 1, 1))}><ChevronLeft className="size-4" /></Button>
          <p className="w-40 text-center text-sm font-medium">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
          <Button variant="outline" size="icon" onClick={() => setMonth(new Date(year, monthIdx + 1, 1))}><ChevronRight className="size-4" /></Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> Campaigns</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-success" /> Coupons</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-warning" /> Flash deals</span>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-1.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "min-h-[92px] rounded-[8px] border border-border p-1.5 text-xs",
                  day === null && "border-transparent",
                  day !== null && isToday(day) && "border-primary bg-primary/5"
                )}
              >
                {day !== null && (
                  <>
                    <p className={cn("mb-1 font-medium", isToday(day) && "text-primary")}>{day}</p>
                    <div className="space-y-1">
                      {(eventsByDay.get(day) ?? []).slice(0, 3).map((e) => (
                        <div key={e.id} className={cn("truncate rounded px-1 py-0.5", typeColor[e.type])} title={e.title}>
                          {e.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This month</CardTitle>
          <CardDescription>All marketing events happening in {month.toLocaleDateString(undefined, { month: "long" })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from(eventsByDay.entries())
            .sort(([a], [b]) => a - b)
            .flatMap(([day, evs]) => evs.map((e) => ({ day, e })))
            .map(({ day, e }) => (
              <div key={e.id} className="flex items-center justify-between rounded-[8px] px-2 py-1.5 text-sm hover:bg-secondary">
                <span>{e.title}</span>
                <Badge variant="secondary">{month.toLocaleDateString(undefined, { month: "short" })} {day}</Badge>
              </div>
            ))}
          {eventsByDay.size === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No events this month</p>}
        </CardContent>
      </Card>
    </div>
  );
}
