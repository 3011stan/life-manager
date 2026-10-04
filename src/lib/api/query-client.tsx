"use client";

import { useQueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useCallback, useState, type ReactNode } from "react";
import { CACHE_BUSTER, CACHE_MAX_AGE_MS, clearPersistedCache, persister } from "@/lib/offline/persist";
import { createQueryClient } from "./create-query-client";

export function ApiProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_AGE_MS,
        buster: CACHE_BUSTER,
        dehydrateOptions: { shouldDehydrateQuery: (query) => query.state.status === "success" },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

// Sign-out and 401 both remove every copy of user data from the device.
export function useClearLocalData(): () => Promise<void> {
  const client = useQueryClient();
  return useCallback(async () => {
    client.clear();
    await clearPersistedCache();
  }, [client]);
}
