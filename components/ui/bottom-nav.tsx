"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Home, Target } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";
import { iconPopTransition, navIndicatorTransition } from "../../lib/motion";

const links: Array<{ href: Route; label: string; icon: typeof Home }> = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/goals", label: "Goals", icon: Target }
];

export function BottomNav() {
  const pathname = usePathname();
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-accent bg-card/95 backdrop-blur" aria-label="Primary navigation">
      <ul className="mx-auto flex max-w-xl items-center justify-around px-screen py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href} className="relative">
              {active ? (
                <motion.span
                  layoutId="bottom-nav-active-indicator"
                  className="absolute inset-x-2 -bottom-0.5 h-1 rounded-pill bg-primary"
                  transition={navIndicatorTransition(reducedMotion)}
                  aria-hidden
                />
              ) : null}
              <Link
                href={href}
                className={cn(
                  "relative flex min-w-20 flex-col items-center gap-1 rounded-button px-3 py-2 text-xs font-medium",
                  active ? "text-primary" : "text-text-secondary"
                )}
                aria-current={active ? "page" : undefined}
              >
                <motion.span
                  whileTap={reducedMotion ? undefined : { scale: [1, 1.18, 1] }}
                  transition={iconPopTransition(reducedMotion)}
                  className="inline-flex"
                >
                  <Icon size={16} aria-hidden />
                </motion.span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
