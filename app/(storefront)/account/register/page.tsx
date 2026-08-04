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
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function CustomerRegisterPage() {
  const { register: registerCustomer, customer } = useCustomerAuth();
  const router = useRouter();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (customer) router.replace("/account");
  }, [customer, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await registerCustomer(values);
      toast.success("Account created");
      router.push("/account");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    }
  });

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-semibold text-brown">Create account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Track orders and earn Halopeno Rewards.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-[28px] bg-card p-6 shadow-soft">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input {...form.register("name")} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" {...form.register("email")} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input {...form.register("phone")} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <Input type="password" {...form.register("password")} className="h-11 rounded-xl" />
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating…" : "Create account"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/account/login" className="font-semibold text-primary">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
