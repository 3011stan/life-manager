"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { safeNext, startGoogleSignIn, testSignIn, testSignInEnabled } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/mutator";
import { useT, type Translate } from "@/lib/i18n";

function errorMessage(t: Translate, code: string): string {
  return code === "invitation_only" ? t("signIn.invitationOnly") : t("signIn.failed");
}

export function SignInForm() {
  const params = useSearchParams();
  const router = useRouter();
  const t = useT();
  const next = safeNext(params.get("next"));
  const errorCode = params.get("error");
  // Store the error code, not the text, so a locale switch re-translates it.
  const [error, setError] = useState<string | undefined>(errorCode ?? undefined);
  const [busy, setBusy] = useState(false);
  const deleted = params.get("deleted") === "1";

  async function google() {
    setBusy(true);
    try {
      await startGoogleSignIn(next);
    } catch {
      setError("unavailable");
      setBusy(false);
    }
  }

  async function submitTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const secret = String(form.get("secret") ?? "");
    setBusy(true);
    try {
      await testSignIn(email, secret);
      router.replace(next);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 403 ? "invitation_only" : "failed");
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      {deleted ? (
        <p role="status" className="notice notice--ok">
          {t("signIn.deleted")}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="notice notice--error">
          {error === "unavailable" ? t("signIn.unavailable") : errorMessage(t, error)}
        </p>
      ) : null}
      <button type="button" className="primary-button" onClick={() => void google()} disabled={busy}>
        {t("signIn.google")}
      </button>
      {testSignInEnabled ? (
        <form className="stack" onSubmit={(e) => void submitTest(e)}>
          <label className="field">
            {t("signIn.testEmail")}
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="field">
            {t("signIn.testSecret")}
            <input name="secret" type="password" required autoComplete="current-password" />
          </label>
          <button type="submit" className="ghost-button" disabled={busy}>
            {t("signIn.test")}
          </button>
        </form>
      ) : null}
    </section>
  );
}
