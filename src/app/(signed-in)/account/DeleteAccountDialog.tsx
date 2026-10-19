"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { downloadExport } from "@/lib/api/export";
import { useDeleteAccount } from "@/lib/api/generated/account/account";
import { ApiError } from "@/lib/api/mutator";
import { useClearLocalData } from "@/lib/api/query-client";
import { useT } from "@/lib/i18n";

// API contract: stays literal in every language.
const PHRASE = "DELETE MY ACCOUNT";

// contracts/ui.md: offer an export first, then require the confirmation
// phrase before Delete is enabled (FR-019).
export function DeleteAccountDialog({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const t = useT();
  const clearLocalData = useClearLocalData();
  const dialog = useRef<HTMLDialogElement>(null);
  const remove = useDeleteAccount();
  const [typed, setTyped] = useState("");
  const [error, setError] = useState(false);

  function open() {
    setTyped("");
    setError(false);
    dialog.current?.showModal();
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(false);
    try {
      await remove.mutateAsync({ data: { confirmation: typed } });
    } catch (e) {
      // Already deleted or signed out elsewhere: this session no longer exists.
      if (e instanceof ApiError && e.status === 401) {
        await clearLocalData();
        router.replace("/sign-in");
        return;
      }
      setError(true);
      return;
    }
    await clearLocalData();
    router.replace("/sign-in?deleted=1");
  }

  return (
    <>
      <button type="button" className="danger-button" disabled={disabled} onClick={open}>
        {t("account.deleteButton")}
      </button>
      <dialog ref={dialog} className="dialog" aria-labelledby="delete-title">
        <form className="stack" onSubmit={(e) => void confirm(e)}>
          <h2 id="delete-title">{t("account.deleteConfirmTitle")}</h2>
          <p>{t("account.deleteConfirmText")}</p>
          <p>{t("account.deleteExportFirst")}</p>
          <div className="button-row">
            <button type="button" className="ghost-button" onClick={() => void downloadExport("json")}>
              {t("account.exportJson")}
            </button>
            <button type="button" className="ghost-button" onClick={() => void downloadExport("markdown")}>
              {t("account.exportMarkdown")}
            </button>
          </div>
          <label className="field">
            {t("account.deleteTypePhrase", { phrase: PHRASE })}
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
          </label>
          {error ? (
            <p role="alert" className="notice notice--error">
              {t("account.deleteFailed")}
            </p>
          ) : null}
          <div className="button-row">
            <button type="button" className="ghost-button" onClick={() => dialog.current?.close()} disabled={remove.isPending}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="danger-button" disabled={typed !== PHRASE || remove.isPending}>
              {remove.isPending ? t("account.deleting") : t("account.deleteButton")}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
