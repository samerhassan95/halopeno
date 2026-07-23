"use client";

import * as React from "react";
import { Mail, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { FoodImage } from "./food-image";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    toast.success("You're subscribed! Watch your inbox for delicious offers.");
    setEmail("");
  }

  return (
    <section className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
      <div className="grid overflow-hidden rounded-[32px] bg-primary shadow-soft-lg lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-h-[260px] lg:min-h-[420px]">
          <FoodImage
            src="/images/lifestyle/family-table-vine-fire.jpg"
            alt="A family sharing Halopeno around the dinner table"
            containerClassName="size-full"
            className="size-full object-cover object-center"
          />
        </div>

        <div className="flex flex-col justify-center px-6 py-10 text-primary-foreground sm:px-10 lg:px-14">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
            <Mail className="size-5" />
          </div>
          <h2 className="mt-6 max-w-lg font-display text-3xl font-bold leading-tight sm:text-4xl">
            Bring More Flavor to Your Inbox
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-primary-foreground/75">
            Be first to hear about new jars, serving ideas and members-only offers.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 flex max-w-lg flex-col gap-2.5 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <Input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="h-12 rounded-full border-white/20 bg-white/95 px-5 text-[#173c28] placeholder:text-[#647067]"
            />
            <Button type="submit" variant="olive" className="shrink-0 gap-2">
              Subscribe <Send className="size-4" />
            </Button>
          </form>
          <p className="mt-3 text-xs text-primary-foreground/55">Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  );
}
