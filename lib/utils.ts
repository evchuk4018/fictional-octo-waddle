import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function toPercent(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}
