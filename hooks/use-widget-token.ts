"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { WIDGET_TOKEN_QUERY_KEY } from "./query-keys";

type WidgetTokenResponse = { token: string };

async function fetchWidgetToken(): Promise<WidgetTokenResponse> {
  const response = await fetch("/api/widgets/token", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch widget token");
  }
  return response.json() as Promise<WidgetTokenResponse>;
}

export function useWidgetToken() {
  return useQuery({
    queryKey: WIDGET_TOKEN_QUERY_KEY,
    queryFn: fetchWidgetToken
  });
}

export function useRevokeWidgetToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/widgets/token", { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to revoke token");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WIDGET_TOKEN_QUERY_KEY });
    }
  });
}
