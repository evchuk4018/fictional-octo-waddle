"use client";

import { motion } from "framer-motion";

type CircularProgressProps = {
  percent: number;
  size?: number;
  strokeWidth?: number;
};

export function CircularProgress({ percent, size = 84, strokeWidth = 8 }: CircularProgressProps) {
  const boundedPercent = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (boundedPercent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${boundedPercent}% complete`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#D5E4E1" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2F5D5A"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute text-sm font-semibold text-text-primary">{boundedPercent}%</span>
    </div>
  );
}
