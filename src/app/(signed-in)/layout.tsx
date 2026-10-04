"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { signOut } from "@/lib/api/auth";
import { useGetMe } from "@/lib/api/generated/account/account";
import { ApiError } from "@/lib/api/mutator";

// Signed-in area: any 401 sends the user to sign-in and back afterwards.
export default function SignedInLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const me = useGetMe({ query: { retry: false } });
  const unauthorized = me.error instanceof ApiError && me.error.status === 401;

  useEffect(() => {
    if (unauthorized) router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
  }, [unauthorized, pathname, router]);

  async function handleSignOut() {
    await signOut();
    queryClient.clear();
    router.replace("/sign-in");
  }

  if (!me.data) {
    return <main className="app-shell">{me.isError && !unauthorized ? <p role="alert">Could not reach Life Manager.</p> : <p>Loading…</p>}</main>;
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <span className="top-bar__email">{me.data.data.account.email}</span>
        <button type="button" className="ghost-button" onClick={() => void handleSignOut()}>
          Sign out
        </button>
      </header>
      {children}
    </main>
  );
}
