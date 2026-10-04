import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";

// ADR 0006: the only place user data is kept on the device. One slot per
// device, wiped on sign-out and whenever the API says the session is gone.
const CACHE_KEY = "life-manager-query-cache";

// 7 days. Must stay below the 2^31-1 ms setTimeout limit (about 24.8 days):
// it is also the query gcTime, and larger values fire immediately. iOS Safari
// also clears site storage after 7 days without use.
export const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Bump when cached response shapes change, so old caches are discarded.
export const CACHE_BUSTER = "002-v1";

export const persister = createAsyncStoragePersister({
  key: CACHE_KEY,
  storage: { getItem: get, setItem: set, removeItem: del },
});

export async function clearPersistedCache(): Promise<void> {
  await del(CACHE_KEY);
}
