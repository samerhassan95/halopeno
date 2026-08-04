"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/storefront/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerAuth } from "@/lib/storefront/customer-auth";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function CustomerLoginPage() {
  const { login, customer } = useCustomerAuth();
  const router = useRouter();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (customer) router.replace("/account");
  }, [customer, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      toast.success("Welcome back");
      router.push("/account");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    }
  });

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-semibold text-brown">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">Access orders, loyalty points, and downloads.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-[28px] bg-card p-6 shadow-soft">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" {...form.register("email")} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <Input type="password" {...form.register("password")} className="h-11 rounded-xl" />
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New here? <Link href="/account/register" className="font-semibold text-primary">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
