"use client";

import { useI18n } from "@/lib/i18n";
import { useConnectivity } from "@/lib/offline/use-connectivity";

// contracts/ui.md: offline shows when the data is from; a waking API shows
// "Connecting…" instead of an error.
export function ConnectivityBanner({ dataUpdatedAt }: { dataUpdatedAt: number }) {
  const { browserOnline, readOnly } = useConnectivity();
  const { locale, t } = useI18n();
  if (!readOnly) return null;
  const when =
    dataUpdatedAt > 0 ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(dataUpdatedAt) : undefined;
  return (
    <p role="status" className="notice notice--offline">
      {browserOnline ? t("common.connecting") : t("common.offline")}
      {when ? t("common.dataFrom", { when }) : ""}
    </p>
  );
}
