import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export default function SignInPage() {
  return (
    <main className="app-shell auth-shell">
      <h1>Life Manager</h1>
      <Suspense>
        <SignInForm />
      </Suspense>
    </main>
  );
}
