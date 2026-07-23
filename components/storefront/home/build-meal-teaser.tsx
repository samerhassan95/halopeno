import Link from "next/link";
import { Utensils } from "lucide-react";
import { Button } from "../ui/button";
import { Reveal } from "../reveal";

export function BuildMealTeaser() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
      <Reveal>
        <div className="relative overflow-hidden rounded-[32px] bg-primary px-6 py-14 text-center sm:px-16">
          <span className="absolute left-8 top-8 text-4xl opacity-15 sm:text-6xl">🍚</span>
          <span className="absolute bottom-8 right-10 text-4xl opacity-15 sm:text-6xl">🌶️</span>
          <div className="relative mx-auto flex size-14 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Utensils className="size-6" />
          </div>
          <h2 className="relative mt-5 font-display text-3xl font-semibold text-white sm:text-4xl">
            Build Your Own Meal
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm text-white/70">
            Pick your base, your protein, your spice level and your favourite extras. Your perfect bowl, exactly
            the way you like it.
          </p>
          <Button size="lg" variant="primary" className="relative mt-7" asChild>
            <Link href="/build-a-meal">Start Building</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
