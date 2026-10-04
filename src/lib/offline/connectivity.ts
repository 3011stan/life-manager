// ADR 0006: one read-only flag for the whole app. It is true while the
// browser is offline or the API cannot be reached (including while a sleeping
// host wakes up), and every mutation is refused while it is true.
export interface ConnectivityState {
  browserOnline: boolean;
  apiReachable: boolean;
  readOnly: boolean;
}

type Listener = () => void;

function initialBrowserOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function compute(browserOnline: boolean, apiReachable: boolean): ConnectivityState {
  return { browserOnline, apiReachable, readOnly: !browserOnline || !apiReachable };
}

function createConnectivity() {
  let state = compute(initialBrowserOnline(), true);
  const listeners = new Set<Listener>();

  function set(browserOnline: boolean, apiReachable: boolean) {
    if (browserOnline === state.browserOnline && apiReachable === state.apiReachable) return;
    state = compute(browserOnline, apiReachable);
    for (const listener of listeners) listener();
  }

  return {
    getSnapshot: (): ConnectivityState => state,
    getServerSnapshot: (): ConnectivityState => compute(true, true),
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setBrowserOnline: (online: boolean) => {
      set(online, state.apiReachable);
    },
    markApiReachable: (reachable: boolean) => {
      set(state.browserOnline, reachable);
    },
    reset: () => {
      set(true, true);
    },
  };
}

export const connectivity = createConnectivity();

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    connectivity.setBrowserOnline(true);
  });
  window.addEventListener("offline", () => {
    connectivity.setBrowserOnline(false);
  });
}
