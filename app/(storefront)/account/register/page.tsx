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
import { useStorefrontI18n } from "@/lib/storefront/i18n/context";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function CustomerRegisterPage() {
  const { t } = useStorefrontI18n();
  const { register: registerCustomer, customer } = useCustomerAuth();
  const router = useRouter();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (customer) router.replace("/account");
  }, [customer, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await registerCustomer(values);
      toast.success(t("account.registerTitle"));
      router.push("/account");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("checkout.failed"));
    }
  });

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-semibold text-brown">{t("account.registerTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("account.registerSubtitle")}</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-[28px] bg-card p-6 shadow-soft">
        <div className="space-y-1.5">
          <Label>{t("account.name")}</Label>
          <Input {...form.register("name")} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("checkout.email")}</Label>
          <Input type="email" {...form.register("email")} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("checkout.phone")}</Label>
          <Input {...form.register("phone")} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("account.password")}</Label>
          <Input type="password" {...form.register("password")} className="h-11 rounded-xl" />
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {t("account.registerCta")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("account.hasAccount")}{" "}
          <Link href="/account/login" className="font-semibold text-primary">
            {t("account.signIn")}
          </Link>
        </p>
      </form>
    </div>
  );
}
