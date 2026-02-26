"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Home, Target } from "lucide-react";
import { cn } from "../../lib/utils";

const links: Array<{ href: Route; label: string; icon: typeof Home }> = [
  { href: "/", label: "Home", icon: Home },
  { href: "/goals", label: "Goals", icon: Target }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-accent bg-card/95 backdrop-blur" aria-label="Primary navigation">
      <ul className="mx-auto flex max-w-xl items-center justify-around px-screen py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/"
            ? pathname === "/" || pathname.startsWith("/dashboard")
            : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex min-w-20 flex-col items-center gap-1 rounded-button px-3 py-2 text-xs font-medium",
                  active ? "text-primary" : "text-text-secondary"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={16} aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
