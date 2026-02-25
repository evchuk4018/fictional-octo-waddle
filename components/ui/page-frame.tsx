"use client";

import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/ui/bottom-nav";

export function PageFrame({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const showNav = pathname !== "/login";

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-xl px-screen pb-24 pt-6">{children}</main>
      {showNav ? <BottomNav /> : null}
    </>
  );
}
