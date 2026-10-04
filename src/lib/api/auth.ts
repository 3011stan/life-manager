import { apiFetch } from "./mutator";

// Authentication endpoints belong to the auth library and are not part of the
// generated contract; they still go through the shared mutator (ADR 0007).
interface SocialSignIn {
  url: string;
  redirect: boolean;
}

export async function startGoogleSignIn(next: string): Promise<void> {
  const origin = window.location.origin;
  const result = await apiFetch<{ data: SocialSignIn }>("/auth/sign-in/social", {
    method: "POST",
    body: JSON.stringify({ provider: "google", callbackURL: `${origin}${next}`, errorCallbackURL: `${origin}/sign-in` }),
  });
  window.location.assign(result.data.url);
}

export async function signOut(): Promise<void> {
  await apiFetch("/auth/sign-out", { method: "POST", body: "{}" });
}

// Local and staging only (ADR 0003). The API refuses it in production.
export async function testSignIn(email: string): Promise<void> {
  await apiFetch("/test/sign-in", { method: "POST", body: JSON.stringify({ email }) });
}

export const testSignInEnabled = process.env.NEXT_PUBLIC_TEST_SIGN_IN === "true";

export function safeNext(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/settings";
}
