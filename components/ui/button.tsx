"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-button px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 h-button",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary/90",
        secondary: "border border-accent bg-transparent text-primary hover:bg-accent/20"
      }
    },
    defaultVariants: {
      variant: "primary"
    }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant }), className)} ref={ref} {...props} />;
});
