"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { safeNext, startGoogleSignIn, testSignIn, testSignInEnabled } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/mutator";

const MESSAGES: Record<string, string> = {
  invitation_only: "Access is by invitation only.",
};

export function SignInForm() {
  const params = useSearchParams();
  const router = useRouter();
  const next = safeNext(params.get("next"));
  const errorCode = params.get("error");
  const [error, setError] = useState<string | undefined>(
    errorCode ? (MESSAGES[errorCode] ?? "Sign-in failed. Try again.") : undefined,
  );
  const [busy, setBusy] = useState(false);
  const deleted = params.get("deleted") === "1";

  async function google() {
    setBusy(true);
    try {
      await startGoogleSignIn(next);
    } catch {
      setError("Sign-in is temporarily unavailable. Try again in a moment.");
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
      setError(e instanceof ApiError && e.status === 403 ? MESSAGES.invitation_only : "Sign-in failed. Try again.");
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      {deleted ? (
        <p role="status" className="notice notice--ok">
          Your account was deleted.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="notice notice--error">
          {error}
        </p>
      ) : null}
      <button type="button" className="primary-button" onClick={() => void google()} disabled={busy}>
        Continue with Google
      </button>
      {testSignInEnabled ? (
        <form className="stack" onSubmit={(e) => void submitTest(e)}>
          <label className="field">
            Test sign-in email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="field">
            Test sign-in secret
            <input name="secret" type="password" required autoComplete="current-password" />
          </label>
          <button type="submit" className="ghost-button" disabled={busy}>
            Test sign-in
          </button>
        </form>
      ) : null}
    </section>
  );
}
