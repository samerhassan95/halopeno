"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Bike,
  Store,
  CalendarClock,
  MapPin,
  Plus,
  Banknote,
  CreditCard,
  Wallet,
  Smartphone,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/storefront/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/common/empty-state";
import {
  useCartStore,
  cartSubtotal,
} from "@/lib/storefront/store/cart-store";
import { useCommerceConfigStore } from "@/lib/storefront/store/commerce-config-store";
import { useOrderStore } from "@/lib/storefront/store/order-store";
import { useStorefrontI18n } from "@/lib/storefront/i18n/context";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { formatSAR } from "@/lib/storefront/format";
import { toast } from "sonner";

type FormData = {
  deliveryMethod: "delivery" | "pickup" | "scheduled";
  name: string;
  phone: string;
  email: string;
  addressChoice: "home" | "work" | "new";
  newLine1?: string;
  newCity?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  instructions?: string;
  deliveryTime: "now" | "scheduled";
  scheduledAt?: string;
  paymentMethod: string;
};

const savedAddresses = {
  home: "42 Cedar Lane, Springfield",
  work: "108 Market Street, Springfield",
};

const PAYMENT_ICONS: Record<string, typeof Banknote> = {
  cod: Banknote,
  card: CreditCard,
  apple_pay: Smartphone,
  google_pay: Smartphone,
  wallet: Wallet,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border pb-8 last:border-0 last:pb-0">
      <h2 className="mb-5 font-display text-xl font-semibold text-brown">{title}</h2>
      {children}
    </section>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useStorefrontI18n();
  const { items, coupon, clear } = useCartStore();
  const { placeOrder } = useOrderStore();
  const quote = useCommerceConfigStore((s) => s.quote);
  const site = useCommerceConfigStore((s) => s.site);
  const refreshQuote = useCommerceConfigStore((s) => s.refreshQuote);
  const [submitting, setSubmitting] = React.useState(false);
  const [pickupLocations, setPickupLocations] = React.useState<Array<{ id: string; name: string; address: string; city: string }>>([]);
  const [pickupLocationId, setPickupLocationId] = React.useState<string>("");

  const paymentOptions = (site?.paymentMethods ?? []).filter((m) => m.enabled !== false);
  const defaultPayment = paymentOptions[0]?.id ?? "cod";

  const schema = React.useMemo(
    () =>
      z.object({
        deliveryMethod: z.enum(["delivery", "pickup", "scheduled"]),
        name: z.string().min(2, t("checkout.err.name")),
        phone: z.string().min(7, t("checkout.err.phone")),
        email: z.string().email(t("checkout.err.email")),
        addressChoice: z.enum(["home", "work", "new"]),
        newLine1: z.string().optional(),
        newCity: z.string().optional(),
        building: z.string().optional(),
        floor: z.string().optional(),
        apartment: z.string().optional(),
        instructions: z.string().optional(),
        deliveryTime: z.enum(["now", "scheduled"]),
        scheduledAt: z.string().optional(),
        paymentMethod: z.string().min(1),
      }),
    [t]
  );

  React.useEffect(() => {
    api
      .get<{ data: Array<{ id: string; name: string; address: string; city: string }> }>("/storefront/pickup-locations")
      .then((res) => {
        setPickupLocations(res.data ?? []);
        if (res.data?.[0]) setPickupLocationId(res.data[0].id);
      })
      .catch(() => undefined);
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      deliveryMethod: "delivery",
      name: "",
      phone: "",
      email: "",
      addressChoice: "home",
      deliveryTime: "now",
      paymentMethod: defaultPayment,
    },
  });

  const { register, watch, setValue, handleSubmit, formState } = form;
  const values = watch();

  React.useEffect(() => {
    void refreshQuote(cartSubtotal(items));
  }, [items, refreshQuote]);

  React.useEffect(() => {
    if (paymentOptions.length && !paymentOptions.some((m) => m.id === values.paymentMethod)) {
      setValue("paymentMethod", defaultPayment);
    }
  }, [defaultPayment, paymentOptions, setValue, values.paymentMethod]);

  const subtotal = cartSubtotal(items);
  const discount = coupon ? subtotal * (coupon.discountPct / 100) : 0;
  const deliveryFee =
    values.deliveryMethod === "pickup" || coupon?.freeShipping || subtotal >= quote.freeThreshold || subtotal === 0
      ? 0
      : quote.deliveryFee;
  const tax = (subtotal - discount) * quote.taxRate;
  const total = Math.max(0, subtotal - discount + deliveryFee + tax);

  function resolvedAddress() {
    if (values.addressChoice === "new") {
      return [values.newLine1, values.building && `Bldg ${values.building}`, values.floor && `Floor ${values.floor}`, values.newCity]
        .filter(Boolean)
        .join(", ");
    }
    return savedAddresses[values.addressChoice as "home" | "work"];
  }

  const onSubmit = handleSubmit(
    async (data) => {
      setSubmitting(true);
      try {
        let paymentIntentId: string | undefined;
        if (data.paymentMethod !== "cod") {
          const intent = await api.post<{ intentId: string }>("/storefront/payments/intent", {
            amount: total,
            currency: site?.currencyCode || "SAR",
            method: data.paymentMethod,
          });
          paymentIntentId = intent.intentId;
        }

        const selectedPickup = pickupLocations.find((p) => p.id === pickupLocationId);
        const orderId = await placeOrder({
          items,
          subtotal,
          discount,
          deliveryFee,
          tax,
          total,
          deliveryMethod: data.deliveryMethod,
          scheduledTime: data.deliveryTime === "scheduled" ? data.scheduledAt : undefined,
          address:
            data.deliveryMethod === "pickup"
              ? selectedPickup
                ? `${selectedPickup.name} — ${selectedPickup.address}, ${selectedPickup.city}`
                : t("checkout.pickupAt")
              : resolvedAddress(),
          paymentMethod: data.paymentMethod,
          customerName: data.name,
          customerEmail: data.email,
          customerPhone: data.phone,
          pickupLocationId: data.deliveryMethod === "pickup" ? pickupLocationId : undefined,
          paymentIntentId,
        });
        clear();
        toast.success(t("checkout.success"));
        router.push(`/checkout/confirmation?order=${orderId}`);
      } catch {
        toast.error(t("checkout.failed"));
      } finally {
        setSubmitting(false);
      }
    },
    () => {
      toast.error(t("checkout.err.name"));
    }
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EmptyState
          icon={ShoppingBag}
          title={t("checkout.emptyTitle")}
          description={t("checkout.emptyHint")}
          action={
            <Button asChild>
              <Link href="/shop">{t("cart.browseShop")}</Link>
            </Button>
          }
          className="rounded-[32px] bg-card py-20 shadow-soft"
        />
      </div>
    );
  }

  const methodOptions = [
    { value: "delivery" as const, label: t("checkout.method.delivery"), desc: t("checkout.method.deliveryDesc"), icon: Bike },
    { value: "pickup" as const, label: t("checkout.method.pickup"), desc: t("checkout.method.pickupDesc"), icon: Store },
    { value: "scheduled" as const, label: t("checkout.method.scheduled"), desc: t("checkout.method.scheduledDesc"), icon: CalendarClock },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="font-display text-3xl font-semibold text-brown sm:text-4xl">{t("checkout.title")}</h1>

      <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8 rounded-[28px] bg-card p-6 shadow-soft sm:p-8">
          <Section title={t("checkout.howDelivery")}>
            <div className="grid gap-3 sm:grid-cols-3">
              {methodOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("deliveryMethod", opt.value)}
                  className={cn(
                    "rounded-2xl border p-5 text-start transition-colors",
                    values.deliveryMethod === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-foreground/20"
                  )}
                >
                  <opt.icon className={cn("size-6", values.deliveryMethod === opt.value ? "text-primary" : "text-muted-foreground")} />
                  <p className="mt-3 font-display font-semibold text-brown">{opt.label}</p>
                  <p className="text-sm text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </Section>

          <Section title={t("checkout.yourInfo")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("checkout.name")}</Label>
                <Input id="name" {...register("name")} className="h-11 rounded-xl" />
                {formState.errors.name && <p className="text-xs text-destructive">{formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t("checkout.phone")}</Label>
                <Input id="phone" {...register("phone")} className="h-11 rounded-xl" placeholder="+966 5X XXX XXXX" />
                {formState.errors.phone && <p className="text-xs text-destructive">{formState.errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="email">{t("checkout.email")}</Label>
                <Input id="email" type="email" {...register("email")} className="h-11 rounded-xl" />
                {formState.errors.email && <p className="text-xs text-destructive">{formState.errors.email.message}</p>}
              </div>
            </div>
          </Section>

          {values.deliveryMethod !== "pickup" ? (
            <Section title={t("checkout.deliveryAddress")}>
              <div className="space-y-3">
                {(["home", "work"] as const).map((key) => (
                  <label
                    key={key}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors",
                      values.addressChoice === key ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <input type="radio" className="sr-only" checked={values.addressChoice === key} onChange={() => setValue("addressChoice", key)} />
                    <MapPin className="size-5 text-primary" />
                    <div>
                      <p className="font-medium text-brown">{t(`checkout.address.${key}`)}</p>
                      <p className="text-sm text-muted-foreground">{savedAddresses[key]}</p>
                    </div>
                  </label>
                ))}
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors",
                    values.addressChoice === "new" ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <input type="radio" className="sr-only" checked={values.addressChoice === "new"} onChange={() => setValue("addressChoice", "new")} />
                  <Plus className="size-5 text-primary" />
                  <p className="font-medium text-brown">{t("checkout.address.new")}</p>
                </label>

                {values.addressChoice === "new" && (
                  <div className="grid gap-3 rounded-2xl bg-secondary/40 p-4 sm:grid-cols-2">
                    <Input placeholder={t("checkout.line1")} {...register("newLine1")} className="h-11 rounded-xl sm:col-span-2" />
                    <Input placeholder={t("checkout.city")} {...register("newCity")} className="h-11 rounded-xl" />
                    <Input placeholder={t("checkout.building")} {...register("building")} className="h-11 rounded-xl" />
                    <Input placeholder={t("checkout.floor")} {...register("floor")} className="h-11 rounded-xl" />
                    <Input placeholder={t("checkout.apartment")} {...register("apartment")} className="h-11 rounded-xl" />
                    <textarea
                      placeholder={t("checkout.instructions")}
                      {...register("instructions")}
                      rows={2}
                      className="rounded-xl border border-input bg-white px-3 py-2 text-sm sm:col-span-2"
                    />
                  </div>
                )}
              </div>
            </Section>
          ) : (
            <Section title={t("checkout.pickupLocation")}>
              <div className="space-y-3">
                {(pickupLocations.length
                  ? pickupLocations
                  : [{ id: "default", name: "Halopeno", address: "King Fahd Rd", city: "Riyadh" }]
                ).map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setPickupLocationId(loc.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-4 text-start",
                      pickupLocationId === loc.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <Store className="size-5 text-primary" />
                    <div>
                      <p className="font-medium text-brown">{loc.name}</p>
                      <p className="text-sm text-muted-foreground">{loc.address}, {loc.city}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Section>
          )}

          <Section title={t("checkout.time.now")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setValue("deliveryTime", "now")}
                className={cn(
                  "rounded-2xl border p-5 text-start",
                  values.deliveryTime === "now" ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <p className="font-display font-semibold text-brown">{t("checkout.time.now")}</p>
              </button>
              <button
                type="button"
                onClick={() => setValue("deliveryTime", "scheduled")}
                className={cn(
                  "rounded-2xl border p-5 text-start",
                  values.deliveryTime === "scheduled" ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <p className="font-display font-semibold text-brown">{t("checkout.time.scheduled")}</p>
              </button>
            </div>
            {values.deliveryTime === "scheduled" && (
              <Input type="datetime-local" {...register("scheduledAt")} className="mt-4 h-11 max-w-xs rounded-xl" aria-label={t("checkout.scheduledAt")} />
            )}
          </Section>

          <Section title={t("checkout.paymentMethod")}>
            <div className="grid gap-3 sm:grid-cols-2">
              {(paymentOptions.length
                ? paymentOptions
                : [
                    { id: "cod", label: "Cash on Delivery" },
                    { id: "card", label: "Credit / Debit Card" },
                    { id: "apple_pay", label: "Apple Pay" },
                    { id: "google_pay", label: "Google Pay" },
                  ]
              ).map((opt) => {
                const Icon = PAYMENT_ICONS[opt.id] ?? CreditCard;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setValue("paymentMethod", opt.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-4 text-start",
                      values.paymentMethod === opt.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <Icon className="size-5 text-primary" />
                    <span className="font-medium text-brown">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-accent" /> {t("checkout.secure")}
            </p>
          </Section>
        </div>

        <div className="h-fit space-y-3 rounded-[28px] bg-card p-6 shadow-soft lg:sticky lg:top-28">
          <p className="font-display text-lg font-semibold text-brown">{t("checkout.orderSummary")}</p>
          {items.map((i) => (
            <div key={i.lineId} className="flex justify-between text-sm text-muted-foreground">
              <span className="truncate pe-2">
                {i.qty}× {i.name}
              </span>
              <span className="shrink-0">{formatSAR((i.unitPrice + i.addons.reduce((s, a) => s + a.price, 0)) * i.qty)}</span>
            </div>
          ))}
          <div className="space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{t("cart.subtotal")}</span>
              <span>{formatSAR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-olive-dark">
                <span>{t("cart.discount")}</span>
                <span>-{formatSAR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>{t("cart.delivery")}</span>
              <span>{deliveryFee === 0 ? t("cart.deliveryFree") : formatSAR(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t("cart.tax")}</span>
              <span>{formatSAR(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-semibold text-brown">
              <span>{t("cart.total")}</span>
              <span>{formatSAR(total)}</span>
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? t("checkout.placing") : t("checkout.placeOrder", { total: formatSAR(total) })}
          </Button>
        </div>
      </form>
    </div>
  );
}
