"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ConnectivityBanner } from "@/components/ConnectivityBanner";
import { signOut } from "@/lib/api/auth";
import { useGetMe } from "@/lib/api/generated/account/account";
import { ApiError } from "@/lib/api/mutator";
import { useClearLocalData } from "@/lib/api/query-client";

const NAV = [
  { href: "/settings", label: "Settings" },
  { href: "/account", label: "Account" },
];

// Signed-in area: a 401 wipes local data and sends the user to sign-in and back.
// Offline, the persisted copy is shown read-only (FR-016).
export default function SignedInLayout({ children }: { children: ReactNode }) {
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
        {failed ? <p className="notice">Connect once to use Life Manager on this device.</p> : <p>Loading…</p>}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <nav className="top-bar__nav" aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="top-bar__actions">
          <span className="top-bar__email">{me.data.data.account.email}</span>
          <button type="button" className="ghost-button" onClick={() => void handleSignOut()}>
            Sign out
          </button>
        </div>
      </header>
      <ConnectivityBanner dataUpdatedAt={me.dataUpdatedAt} />
      {children}
    </main>
  );
}
