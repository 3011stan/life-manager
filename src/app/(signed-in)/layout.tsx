"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ConnectivityBanner } from "@/components/ConnectivityBanner";
import { signOut } from "@/lib/api/auth";
import { useGetMe } from "@/lib/api/generated/account/account";
import { useGetWorkspaceSettings } from "@/lib/api/generated/settings/settings";
import { ApiError } from "@/lib/api/mutator";
import { useClearLocalData } from "@/lib/api/query-client";
import { browserLocale, I18nProvider, useT, type Locale } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";

const NAV: { href: string; label: MessageKey }[] = [
  { href: "/day", label: "nav.day" },
  { href: "/catalog", label: "nav.catalog" },
  { href: "/settings", label: "nav.settings" },
  { href: "/account", label: "nav.account" },
];

// Signed-in area: a 401 wipes local data and sends the user to sign-in and back.
// Offline, the persisted copy is shown read-only (FR-016).
export default function SignedInLayout({ children }: { children: ReactNode }) {
  const settings = useGetWorkspaceSettings({ query: { retry: false } });
  const locale: Locale = settings.data?.data.locale ?? browserLocale();
  return (
    <I18nProvider locale={locale}>
      <SignedInShell>{children}</SignedInShell>
    </I18nProvider>
  );
}

function SignedInShell({ children }: { children: ReactNode }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const clearLocalData = useClearLocalData();
  const me = useGetMe({ query: { retry: false } });
  const unauthorized = me.error instanceof ApiError && me.error.status === 401;

  useEffect(() => {
    if (!unauthorized) return;
    void clearLocalData().then(() => {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    });
  }, [unauthorized, pathname, router, clearLocalData]);

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      await clearLocalData();
      router.replace("/sign-in");
    }
  }

  if (!me.data || unauthorized) {
    const failed = me.isError && !unauthorized;
    return (
      <main className="app-shell">
        {failed ? <p className="notice">{t("common.connectOnce")}</p> : <p>{t("common.loading")}</p>}
      </main>
    );
  }

  return (
    <main className="app-shell app-shell--nav">
      <header className="top-bar">
        <nav className="top-bar__nav main-nav" aria-label={t("nav.main")}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>
              {t(item.label)}
            </Link>
          ))}
        </nav>
        <div className="top-bar__actions">
          <span className="top-bar__email">{me.data.data.account.email}</span>
          <button type="button" className="ghost-button" onClick={() => void handleSignOut()}>
            {t("nav.signOut")}
          </button>
        </div>
      </header>
      <ConnectivityBanner dataUpdatedAt={me.dataUpdatedAt} />
      {children}
    </main>
  );
}
