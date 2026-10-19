"use client";

import { I18nProvider, useT } from "@/lib/i18n";
import { useBrowserLocale } from "../sign-in/SignInShell";

function OfflineContent() {
  const t = useT();
  return (
    <main className="app-shell auth-shell">
      <h1>{t("app.name")}</h1>
      <p className="panel">{t("common.connectOnce")}</p>
    </main>
  );
}

// No settings here either: follow the browser like the sign-in page.
export default function OfflinePage() {
  return (
    <I18nProvider locale={useBrowserLocale()}>
      <OfflineContent />
    </I18nProvider>
  );
}
