"use client";

import { Award, Gift, Users, Cake, Trophy, Copy, Star } from "lucide-react";
import { Button } from "@/components/storefront/ui/button";
import { SectionHeading } from "@/components/storefront/section-heading";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const currentPoints = 1240;
const currentTier = "Gold";

const tiers = [
  { name: "Bronze", min: 0, perk: "5% birthday reward" },
  { name: "Silver", min: 500, perk: "Free delivery on weekends" },
  { name: "Gold", min: 1000, perk: "10% off every 5th order" },
  { name: "Platinum", min: 2500, perk: "Priority support + exclusive tastings" },
];

const rewards = [
  { id: "r1", title: "Free Garlic Naan", points: 150 },
  { id: "r2", title: "$5 Off Your Order", points: 300 },
  { id: "r3", title: "Free Dessert", points: 400 },
  { id: "r4", title: "$15 Off Your Order", points: 900 },
  { id: "r5", title: "Free Family Biryani", points: 1500 },
];

const history = [
  { id: "h1", label: "Order #SC48213", points: 45, date: "Jul 18, 2026" },
  { id: "h2", label: "Referral bonus: Priya M.", points: 200, date: "Jul 10, 2026" },
  { id: "h3", label: "Order #SC48012", points: 32, date: "Jul 2, 2026" },
  { id: "h4", label: "Redeemed: Free Garlic Naan", points: -150, date: "Jun 28, 2026" },
];

const milestones = [10, 25, 50, 100];

export default function LoyaltyPage() {
  const nextTier = tiers.find((t) => t.min > currentPoints);
  const progress = nextTier ? (currentPoints / nextTier.min) * 100 : 100;

  function copyReferral() {
    navigator.clipboard?.writeText("SAFFRON-AMELIA10").catch(() => {});
    toast.success("Referral code copied");
  }

  function redeem(title: string) {
    toast.success(`${title} redeemed! Look for it at checkout.`);
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
            <p className="font-display text-3xl font-bold">{currentPoints.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/70">
            {nextTier ? `${nextTier.min - currentPoints} points to ${nextTier.name}` : "You've reached the top tier!"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              "rounded-2xl border p-4 text-center",
              tier.name === currentTier ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <Trophy className={cn("mx-auto size-5", tier.name === currentTier ? "text-primary" : "text-muted-foreground")} />
            <p className="mt-2 font-display font-semibold text-brown">{tier.name}</p>
            <p className="text-xs text-muted-foreground">{tier.min.toLocaleString()}+ pts</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{tier.perk}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-brown">Redeem Your Points</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((r) => {
            const canRedeem = currentPoints >= r.points;
            return (
              <div key={r.id} className="flex flex-col gap-3 rounded-[24px] bg-card p-5 shadow-soft">
                <Gift className="size-6 text-primary" />
                <p className="font-display font-semibold text-brown">{r.title}</p>
                <p className="text-sm text-muted-foreground">{r.points} points</p>
                <Button size="sm" disabled={!canRedeem} onClick={() => redeem(r.title)} className="mt-auto">
                  {canRedeem ? "Redeem" : "Not enough points"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] bg-card p-6 shadow-soft">
          <p className="flex items-center gap-2 font-display text-lg font-semibold text-brown">
            <Users className="size-5 text-primary" /> Refer a Friend
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Give friends 10% off their first order and you both earn 200 points.</p>
          <button
            onClick={copyReferral}
            className="mt-4 flex w-full items-center justify-between rounded-full border border-dashed border-foreground/25 bg-secondary/40 px-4 py-2.5 text-sm font-medium"
          >
            SAFFRON-AMELIA10 <Copy className="size-4" />
          </button>
        </div>
        <div className="rounded-[24px] bg-card p-6 shadow-soft">
          <p className="flex items-center gap-2 font-display text-lg font-semibold text-brown">
            <Cake className="size-5 text-primary" /> Birthday Rewards
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Add your birthday to your profile and get a free dessert during your birthday month.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {milestones.map((m) => (
              <span key={m} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-brown">
                <Star className="size-3" /> {m} orders milestone
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-brown">
          <Award className="size-6 text-primary" /> Rewards History
        </h2>
        <div className="mt-5 divide-y divide-border rounded-[24px] bg-card shadow-soft">
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-brown">{h.label}</p>
                <p className="text-xs text-muted-foreground">{h.date}</p>
              </div>
              <span className={cn("font-semibold", h.points > 0 ? "text-olive-dark" : "text-destructive")}>
                {h.points > 0 ? `+${h.points}` : h.points}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
