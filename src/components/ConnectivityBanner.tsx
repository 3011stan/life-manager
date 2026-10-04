"use client";

import { useConnectivity } from "@/lib/offline/use-connectivity";

const timeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

// contracts/ui.md: offline shows when the data is from; a waking API shows
// "Connecting…" instead of an error.
export function ConnectivityBanner({ dataUpdatedAt }: { dataUpdatedAt: number }) {
  const { browserOnline, readOnly } = useConnectivity();
  if (!readOnly) return null;
  const when = dataUpdatedAt > 0 ? timeFormat.format(dataUpdatedAt) : undefined;
  return (
    <p role="status" className="notice notice--offline">
      {browserOnline ? "Connecting…" : "Offline"}
      {when ? ` — showing data from ${when}` : ""}
    </p>
  );
}
