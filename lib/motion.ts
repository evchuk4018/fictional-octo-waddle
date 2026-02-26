import { type Transition } from "framer-motion";

const STANDARD_EASE = [0.22, 1, 0.36, 1] as const;

export function progressFillTransition(reducedMotion: boolean): Transition {
  if (reducedMotion) return { duration: 0 };
  return { duration: 0.4, ease: STANDARD_EASE };
}

export function navIndicatorTransition(reducedMotion: boolean): Transition {
  if (reducedMotion) return { duration: 0 };
  return { type: "spring", stiffness: 420, damping: 32, mass: 0.65 };
}

export function iconPopTransition(reducedMotion: boolean): Transition {
  if (reducedMotion) return { duration: 0 };
  return { type: "spring", stiffness: 520, damping: 24, mass: 0.6 };
}

export function reorderLiftTransition(reducedMotion: boolean): Transition {
  if (reducedMotion) return { duration: 0 };
  return { type: "spring", stiffness: 480, damping: 32, mass: 0.7 };
}

export function reorderLayoutTransition(reducedMotion: boolean): Transition {
  if (reducedMotion) return { duration: 0 };
  return { type: "spring", stiffness: 540, damping: 36, mass: 0.8 };
}

export function highlightPulseTransition(reducedMotion: boolean): Transition {
  if (reducedMotion) return { duration: 0 };
  return { duration: 0.5, ease: STANDARD_EASE };
}
