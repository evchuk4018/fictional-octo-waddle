"use client";

import * as Progress from "@radix-ui/react-progress";
import { motion, useReducedMotion } from "framer-motion";
import { progressFillTransition } from "../../lib/motion";

type ProgressBarProps = {
  value: number;
  label: string;
};

export function ProgressBar({ value, label }: ProgressBarProps) {
  const boundedValue = Math.max(0, Math.min(100, value));
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <div className="space-y-2" aria-label={`${label} completion`}>
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>{label}</span>
        <span>{boundedValue}%</span>
      </div>
      <Progress.Root className="relative h-2 w-full overflow-hidden rounded-pill bg-progress-empty" value={boundedValue}>
        <Progress.Indicator asChild>
          <motion.div
            className="h-full bg-progress-filled"
            initial={{ width: reducedMotion ? `${boundedValue}%` : 0 }}
            animate={{ width: `${boundedValue}%` }}
            transition={progressFillTransition(reducedMotion)}
          />
        </Progress.Indicator>
      </Progress.Root>
    </div>
  );
}
