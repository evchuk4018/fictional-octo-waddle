import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-input w-full rounded-button border border-accent bg-white px-4 text-sm text-text-primary placeholder:text-text-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className
      )}
      {...props}
    />
  );
});
