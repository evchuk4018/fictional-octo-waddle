"use client";

import { PropsWithChildren } from "react";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "./auth-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
