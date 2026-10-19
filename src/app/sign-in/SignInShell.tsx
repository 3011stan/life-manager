"use client";

import { Suspense, useSyncExternalStore } from "react";
import { browserLocale, I18nProvider, useT, type Locale } from "@/lib/i18n";
import { SignInForm } from "./SignInForm";

const noSubscription = () => () => {};

// Outside the signed-in area there are no settings: follow the browser.
// The server snapshot is English so prerendered markup hydrates cleanly.
export function useBrowserLocale(): Locale {
  return useSyncExternalStore(noSubscription, browserLocale, () => "en");
}

function SignInContent() {
  const t = useT();
  return (
    <main className="app-shell auth-shell">
      <h1>{t("app.name")}</h1>
      <Suspense>
        <SignInForm />
      </Suspense>
    </main>
  );
}

export function SignInShell() {
  return (
    <I18nProvider locale={useBrowserLocale()}>
      <SignInContent />
    </I18nProvider>
  );
}
