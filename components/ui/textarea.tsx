import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-28 w-full rounded-card border border-accent bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          className
        )}
        {...props}
      />
    );
  }
);
