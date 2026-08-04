"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/storefront/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeading } from "@/components/storefront/section-heading";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  subject: z.string().min(2, "Add a subject"),
  message: z.string().min(10, "Message should be at least 10 characters"),
});
type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const { register, handleSubmit, formState, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/storefront/contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Failed to send");
      toast.success("Message sent! We'll get back to you within 24 hours.");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message");
    }
  });

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
      <SectionHeading eyebrow="We'd love to hear from you" title="Contact Us" />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {[
            { icon: MapPin, label: "Visit us", value: "12 Spice Market Rd, Springfield" },
            { icon: Phone, label: "Call us", value: "+1 (555) 019-2837" },
            { icon: Mail, label: "Email us", value: "hello@saffroncourt.example" },
            { icon: Clock, label: "Opening hours", value: "Daily, 11:00 AM - 11:30 PM" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-4 rounded-[24px] bg-card p-5 shadow-soft">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="font-display font-semibold text-brown">{item.value}</p>
              </div>
            </div>
          ))}
          <div className="flex h-40 items-center justify-center rounded-[24px] bg-secondary/60 text-sm text-muted-foreground">
            Map preview placeholder
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-[28px] bg-card p-6 shadow-soft sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} className="h-11 rounded-xl" />
              {formState.errors.name && <p className="text-xs text-destructive">{formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} className="h-11 rounded-xl" />
              {formState.errors.email && <p className="text-xs text-destructive">{formState.errors.email.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" {...register("subject")} className="h-11 rounded-xl" />
            {formState.errors.subject && <p className="text-xs text-destructive">{formState.errors.subject.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              {...register("message")}
              rows={5}
              className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
            {formState.errors.message && <p className="text-xs text-destructive">{formState.errors.message.message}</p>}
          </div>
          <Button type="submit" size="lg" className="w-full">
            Send Message
          </Button>
        </form>
      </div>
    </div>
  );
}
