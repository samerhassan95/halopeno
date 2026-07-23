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
  FREE_DELIVERY_THRESHOLD,
  DELIVERY_FEE,
  TAX_RATE,
} from "@/lib/storefront/store/cart-store";
import { useOrderStore } from "@/lib/storefront/store/order-store";
import { cn } from "@/lib/utils";
import { formatSAR } from "@/lib/storefront/format";
import { toast } from "sonner";

const schema = z.object({
  deliveryMethod: z.enum(["delivery", "pickup", "scheduled"]),
  name: z.string().min(2, "Enter your full name"),
  phone: z.string().min(7, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email"),
  addressChoice: z.enum(["home", "work", "new"]),
  newLine1: z.string().optional(),
  newCity: z.string().optional(),
  building: z.string().optional(),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  instructions: z.string().optional(),
  deliveryTime: z.enum(["now", "scheduled"]),
  scheduledAt: z.string().optional(),
  paymentMethod: z.enum(["cod", "card", "apple_pay", "google_pay", "wallet"]),
});

type FormData = z.infer<typeof schema>;

const savedAddresses = {
  home: "42 Cedar Lane, Springfield",
  work: "108 Market Street, Springfield",
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
  const { items, coupon, clear } = useCartStore();
  const { placeOrder } = useOrderStore();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      deliveryMethod: "delivery",
      name: "",
      phone: "",
      email: "",
      addressChoice: "home",
      deliveryTime: "now",
      paymentMethod: "cod",
    },
  });

  const { register, watch, setValue, handleSubmit, formState } = form;
  const values = watch();

  const subtotal = cartSubtotal(items);
  const discount = coupon ? subtotal * (coupon.discountPct / 100) : 0;
  const deliveryFee = values.deliveryMethod === "pickup" || subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FEE;
  const tax = (subtotal - discount) * TAX_RATE;
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
        const orderId = await placeOrder({
          items,
          subtotal,
          discount,
          deliveryFee,
          tax,
          total,
          deliveryMethod: data.deliveryMethod,
          scheduledTime: data.deliveryTime === "scheduled" ? data.scheduledAt : undefined,
          address: data.deliveryMethod === "pickup" ? "Pickup at Halopeno, King Fahd Rd, Riyadh" : resolvedAddress(),
          paymentMethod: data.paymentMethod,
          customerName: data.name,
          customerEmail: data.email,
          customerPhone: data.phone,
        });
        clear();
        router.push(`/checkout/confirmation?order=${orderId}`);
      } catch {
        toast.error("Couldn't place your order. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    () => {
      toast.error("Please check the highlighted fields");
    }
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add something from the menu before checking out."
          action={
            <Button asChild>
              <Link href="/shop">Browse Shop</Link>
            </Button>
          }
          className="rounded-[32px] bg-card py-20 shadow-soft"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="font-display text-3xl font-semibold text-brown sm:text-4xl">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">Everything on one page. Review and place your order below.</p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8 rounded-[28px] bg-card p-6 shadow-soft sm:p-8">
          <Section title="How would you like your order?">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: "delivery", label: "Delivery", desc: "Delivered to your door", icon: Bike },
                { value: "pickup", label: "Pickup", desc: "Collect in-store", icon: Store },
                { value: "scheduled", label: "Scheduled", desc: "Choose a later time", icon: CalendarClock },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("deliveryMethod", opt.value as FormData["deliveryMethod"])}
                  className={cn(
                    "rounded-2xl border p-5 text-left transition-colors",
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

          <Section title="Your information">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" {...register("name")} className="h-11 rounded-xl" />
                {formState.errors.name && <p className="text-xs text-destructive">{formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" {...register("phone")} className="h-11 rounded-xl" placeholder="+1 555 000 0000" />
                {formState.errors.phone && <p className="text-xs text-destructive">{formState.errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} className="h-11 rounded-xl" />
                {formState.errors.email && <p className="text-xs text-destructive">{formState.errors.email.message}</p>}
              </div>
            </div>
          </Section>

          {values.deliveryMethod !== "pickup" ? (
            <Section title="Delivery address">
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
                      <p className="font-medium capitalize text-brown">{key}</p>
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
                  <p className="font-medium text-brown">Add a new address</p>
                </label>

                {values.addressChoice === "new" && (
                  <div className="grid gap-3 rounded-2xl bg-secondary/40 p-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-white p-4 text-center text-xs text-muted-foreground sm:col-span-2">
                      <MapPin className="mx-auto mb-1 size-5 text-primary" /> Map preview placeholder. Drag the pin to set your exact location.
                    </div>
                    <Input placeholder="Street address" {...register("newLine1")} className="h-11 rounded-xl sm:col-span-2" />
                    <Input placeholder="City" {...register("newCity")} className="h-11 rounded-xl" />
                    <Input placeholder="Building" {...register("building")} className="h-11 rounded-xl" />
                    <Input placeholder="Floor" {...register("floor")} className="h-11 rounded-xl" />
                    <Input placeholder="Apartment number" {...register("apartment")} className="h-11 rounded-xl" />
                    <textarea
                      placeholder="Delivery instructions (optional)"
                      {...register("instructions")}
                      rows={2}
                      className="rounded-xl border border-input bg-white px-3 py-2 text-sm sm:col-span-2"
                    />
                  </div>
                )}
              </div>
            </Section>
          ) : (
            <Section title="Pickup location">
              <div className="flex items-center gap-3 rounded-2xl border border-primary bg-primary/5 p-4">
                <Store className="size-5 text-primary" />
                <div>
                  <p className="font-medium text-brown">Halopeno Pickup Point</p>
                  <p className="text-sm text-muted-foreground">12 Spice Market Rd, Springfield · Ready in 15-20 min</p>
                </div>
              </div>
            </Section>
          )}

          <Section title={`When should we ${values.deliveryMethod === "pickup" ? "have it ready" : "deliver"}?`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setValue("deliveryTime", "now")}
                className={cn(
                  "rounded-2xl border p-5 text-left",
                  values.deliveryTime === "now" ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <p className="font-display font-semibold text-brown">As soon as possible</p>
                <p className="text-sm text-muted-foreground">30-45 minutes</p>
              </button>
              <button
                type="button"
                onClick={() => setValue("deliveryTime", "scheduled")}
                className={cn(
                  "rounded-2xl border p-5 text-left",
                  values.deliveryTime === "scheduled" ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <p className="font-display font-semibold text-brown">Schedule for later</p>
                <p className="text-sm text-muted-foreground">Pick a date and time</p>
              </button>
            </div>
            {values.deliveryTime === "scheduled" && (
              <Input type="datetime-local" {...register("scheduledAt")} className="mt-4 h-11 max-w-xs rounded-xl" />
            )}
          </Section>

          <Section title="Payment method">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: "cod", label: "Cash on Delivery", icon: Banknote },
                { value: "card", label: "Credit / Debit Card", icon: CreditCard },
                { value: "apple_pay", label: "Apple Pay", icon: Smartphone },
                { value: "google_pay", label: "Google Pay", icon: Smartphone },
                { value: "wallet", label: "Wallet Balance", icon: Wallet },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("paymentMethod", opt.value as FormData["paymentMethod"])}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-4 text-left",
                    values.paymentMethod === opt.value ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <opt.icon className="size-5 text-primary" />
                  <span className="font-medium text-brown">{opt.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-accent" /> All payments are encrypted and processed securely.
            </p>
          </Section>
        </div>

        <div className="h-fit space-y-3 rounded-[28px] bg-card p-6 shadow-soft lg:sticky lg:top-28">
          <p className="font-display text-lg font-semibold text-brown">Order Summary</p>
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
              <span>Subtotal</span>
              <span>{formatSAR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-olive-dark">
                <span>Discount</span>
                <span>-{formatSAR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery</span>
              <span>{deliveryFee === 0 ? "Free" : formatSAR(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>{formatSAR(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-semibold text-brown">
              <span>Total</span>
              <span>{formatSAR(total)}</span>
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Placing order…" : `Place Order · ${formatSAR(total)}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
