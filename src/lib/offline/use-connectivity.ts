"use client";

import { useSyncExternalStore } from "react";
import { connectivity, type ConnectivityState } from "./connectivity";

export function useConnectivity(): ConnectivityState {
  return useSyncExternalStore(connectivity.subscribe, connectivity.getSnapshot, connectivity.getServerSnapshot);
}
