import { QueryClient } from "@tanstack/react-query";
import { CACHE_MAX_AGE_MS } from "@/lib/offline/persist";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // gcTime must be at least the persisted maxAge, or restored queries are
      // collected before a screen subscribes to them.
      queries: { retry: 1, gcTime: CACHE_MAX_AGE_MS },
    },
  });
}
