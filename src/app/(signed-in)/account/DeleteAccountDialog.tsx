"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { downloadExport } from "@/lib/api/export";
import { useDeleteAccount } from "@/lib/api/generated/account/account";
import { ApiError } from "@/lib/api/mutator";
import { useClearLocalData } from "@/lib/api/query-client";

const PHRASE = "DELETE MY ACCOUNT";

// contracts/ui.md: offer an export first, then require the confirmation
// phrase before Delete is enabled (FR-019).
export function DeleteAccountDialog({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const clearLocalData = useClearLocalData();
  const dialog = useRef<HTMLDialogElement>(null);
  const remove = useDeleteAccount();
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string>();

  function open() {
    setTyped("");
    setError(undefined);
    dialog.current?.showModal();
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    try {
      await remove.mutateAsync({ data: { confirmation: typed } });
    } catch (e) {
      // Already deleted or signed out elsewhere: this session no longer exists.
      if (e instanceof ApiError && e.status === 401) {
        await clearLocalData();
        router.replace("/sign-in");
        return;
      }
      setError("Could not delete your account. Nothing was removed; try again.");
      return;
    }
    await clearLocalData();
    router.replace("/sign-in?deleted=1");
  }

  return (
    <>
      <button type="button" className="danger-button" disabled={disabled} onClick={open}>
        Delete account
      </button>
      <dialog ref={dialog} className="dialog" aria-labelledby="delete-title">
        <form className="stack" onSubmit={(e) => void confirm(e)}>
          <h2 id="delete-title">Delete your account?</h2>
          <p>This permanently removes your account, workspace, and settings. It cannot be undone.</p>
          <p>Export a copy first if you want to keep your data.</p>
          <div className="button-row">
            <button type="button" className="ghost-button" onClick={() => void downloadExport("json")}>
              Export JSON
            </button>
            <button type="button" className="ghost-button" onClick={() => void downloadExport("markdown")}>
              Export Markdown
            </button>
          </div>
          <label className="field">
            Type {PHRASE} to confirm
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
          </label>
          {error ? (
            <p role="alert" className="notice notice--error">
              {error}
            </p>
          ) : null}
          <div className="button-row">
            <button type="button" className="ghost-button" onClick={() => dialog.current?.close()} disabled={remove.isPending}>
              Cancel
            </button>
            <button type="submit" className="danger-button" disabled={typed !== PHRASE || remove.isPending}>
              {remove.isPending ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
