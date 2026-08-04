"use client";

import * as React from "react";
import { Award, Gift, Users, Cake, Trophy, Copy, Star } from "lucide-react";
import { Button } from "@/components/storefront/ui/button";
import { SectionHeading } from "@/components/storefront/section-heading";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

type Tier = { name: string; min: number; perk: string };
type Reward = { id: string; title: string; points: number };
type Activity = { id: string; label: string; points: number; date: string };

const fallbackTiers: Tier[] = [
  { name: "Bronze", min: 0, perk: "5% birthday reward" },
  { name: "Silver", min: 500, perk: "Free delivery on weekends" },
  { name: "Gold", min: 1000, perk: "10% off every 5th order" },
  { name: "Platinum", min: 2500, perk: "Priority support + exclusive tastings" },
];

const fallbackRewards: Reward[] = [
  { id: "r1", title: "SAR 5 Off Your Order", points: 300 },
  { id: "r2", title: "Free delivery", points: 400 },
  { id: "r3", title: "SAR 15 Off Your Order", points: 900 },
];

export default function LoyaltyPage() {
  const [tiers, setTiers] = React.useState<Tier[]>(fallbackTiers);
  const [rewards, setRewards] = React.useState<Reward[]>(fallbackRewards);
  const [history, setHistory] = React.useState<Activity[]>([]);
  const [currentPoints, setCurrentPoints] = React.useState(0);

  React.useEffect(() => {
    api
      .get<{
        program: { tiers?: Tier[]; rewards?: Reward[]; startingPoints?: number };
        recentActivity: Array<{ id: string; label: string; points: number; date: string }>;
      }>("/storefront/loyalty")
      .then((res) => {
        if (res.program?.tiers?.length) setTiers(res.program.tiers);
        if (res.program?.rewards?.length) setRewards(res.program.rewards);
        if (typeof res.program?.startingPoints === "number") setCurrentPoints(res.program.startingPoints);
        setHistory(
          (res.recentActivity ?? []).map((row) => ({
            id: row.id,
            label: row.label,
            points: row.points,
            date: new Date(row.date).toLocaleDateString(),
          }))
        );
      })
      .catch(() => undefined);
  }, []);

  const currentTier = [...tiers].reverse().find((t) => currentPoints >= t.min)?.name ?? tiers[0]?.name ?? "Member";
  const nextTier = tiers.find((t) => t.min > currentPoints);
  const progress = nextTier ? (currentPoints / nextTier.min) * 100 : 100;

  function copyReferral() {
    navigator.clipboard?.writeText("HALOPENO-FRIEND").catch(() => {});
    toast.success("Referral code copied");
  }

  function redeem(title: string) {
    toast.success(`${title} marked for checkout — use your points when signed in.`);
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 lg:px-10">
      <SectionHeading eyebrow="Loyalty program" title="Halopeno Rewards" description="Earn points with every order and unlock exclusive perks." />

      <div className="mt-10 rounded-[32px] bg-gradient-to-br from-accent to-[#516134] p-8 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/70">Your current tier</p>
            <p className="font-display text-3xl font-bold">{currentTier}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/70">Available points</p>
            <p className="font-display text-3xl font-bold">{currentPoints}</p>
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs text-white/70">
            <span>Progress to {nextTier?.name ?? "max tier"}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <div key={tier.name} className={cn("rounded-[24px] bg-card p-5 shadow-soft", currentTier === tier.name && "ring-2 ring-primary")}>
            <Trophy className="size-5 text-primary" />
            <p className="mt-3 font-display text-lg font-semibold text-brown">{tier.name}</p>
            <p className="text-xs text-muted-foreground">{tier.min}+ points</p>
            <p className="mt-2 text-sm text-muted-foreground">{tier.perk}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl font-semibold text-brown">Redeem rewards</h2>
          <div className="mt-4 space-y-3">
            {rewards.map((reward) => (
              <div key={reward.id} className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <Gift className="size-5 text-primary" />
                  <div>
                    <p className="font-medium text-brown">{reward.title}</p>
                    <p className="text-xs text-muted-foreground">{reward.points} points</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => redeem(reward.title)}>
                  Redeem
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-brown">Recent club activity</h2>
          <div className="mt-4 space-y-3">
            {history.length ? (
              history.map((row) => (
                <div key={row.id} className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-soft">
                  <div>
                    <p className="font-medium text-brown">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{row.date}</p>
                  </div>
                  <span className={cn("font-semibold", row.points >= 0 ? "text-olive-dark" : "text-destructive")}>
                    {row.points >= 0 ? "+" : ""}
                    {row.points}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-soft">
                Club point activity from admin will appear here as members earn and redeem.
              </p>
            )}
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-primary/30 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-brown">
              <Users className="size-4 text-primary" /> Refer a friend
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Share your code and earn bonus points.</p>
            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={copyReferral}>
              <Copy className="size-3.5" /> HALOPENO-FRIEND
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Star, title: "Earn on every order", text: "Points sync from admin loyalty transactions." },
          { icon: Cake, title: "Birthday treats", text: "Tier perks are managed in storefront loyalty settings." },
          { icon: Award, title: "Member exclusives", text: "Rewards listed above come from the admin program config." },
        ].map((item) => (
          <div key={item.title} className="rounded-[24px] bg-card p-5 shadow-soft">
            <item.icon className="size-5 text-primary" />
            <p className="mt-3 font-display font-semibold text-brown">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
