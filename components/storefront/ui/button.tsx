import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-[0_10px_28px_-12px_rgba(18,75,45,0.72)] hover:bg-primary/92 active:scale-[0.98]",
        olive: "bg-accent text-accent-foreground shadow-[0_10px_28px_-12px_rgba(181,42,36,0.58)] hover:bg-accent/92 active:scale-[0.98]",
        dark: "bg-foreground text-background hover:brightness-125 active:scale-[0.98]",
        outline: "border border-primary/30 bg-card/50 text-primary hover:border-primary/55 hover:bg-secondary",
        ghost: "bg-transparent text-foreground hover:bg-foreground/[0.05]",
        white: "bg-white text-foreground shadow-md hover:brightness-95 active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 rounded-full px-4 text-sm has-[>svg]:px-3.5",
        default: "h-12 rounded-full px-6 text-[15px] has-[>svg]:px-5",
        lg: "h-14 rounded-full px-8 text-base has-[>svg]:px-6",
        icon: "size-11 rounded-full",
        "icon-sm": "size-9 rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
