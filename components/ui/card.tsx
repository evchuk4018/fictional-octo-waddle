import { PropsWithChildren } from "react";
import { cn } from "../../lib/utils";

type CardProps = PropsWithChildren<{ className?: string }>;

export function Card({ className, children }: CardProps) {
  return <section className={cn("rounded-card bg-card p-card shadow-sm", className)}>{children}</section>;
}
