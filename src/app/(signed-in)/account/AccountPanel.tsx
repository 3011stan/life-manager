"use client";

import { useState } from "react";
import { downloadExport, type ExportFormat } from "@/lib/api/export";
import { useGetMe } from "@/lib/api/generated/account/account";
import { ApiError } from "@/lib/api/mutator";
import { useT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { useConnectivity } from "@/lib/offline/use-connectivity";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

export function AccountPanel() {
  const t = useT();
  const me = useGetMe({ query: { retry: false } });
  const { readOnly } = useConnectivity();
  const [pending, setPending] = useState<ExportFormat>();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; key: MessageKey }>();

  async function runExport(format: ExportFormat) {
    setPending(format);
    setMessage(undefined);
    try {
      await downloadExport(format);
      setMessage({ kind: "ok", key: "account.exported" });
    } catch (error) {
      const key: MessageKey = error instanceof ApiError && error.status === 409 ? "account.exportBusy" : "account.exportFailed";
      setMessage({ kind: "error", key });
    } finally {
      setPending(undefined);
    }
  }

  const account = me.data?.data.account;
  return (
    <section className="panel">
      <h1>{t("account.title")}</h1>
      {account ? (
        <dl className="details">
          <dt>{t("account.email")}</dt>
          <dd>{account.email}</dd>
          <dt>{t("account.name")}</dt>
          <dd>{account.name}</dd>
        </dl>
      ) : null}

      <h2>{t("account.exportTitle")}</h2>
      <p>{t("account.exportText")}</p>
      <div className="button-row">
        <button type="button" className="primary-button" disabled={readOnly || pending !== undefined} onClick={() => void runExport("json")}>
          {pending === "json" ? t("account.exporting") : t("account.exportJson")}
        </button>
        <button type="button" className="primary-button" disabled={readOnly || pending !== undefined} onClick={() => void runExport("markdown")}>
          {pending === "markdown" ? t("account.exporting") : t("account.exportMarkdown")}
        </button>
      </div>
      {message ? (
        <p role="status" className={`notice ${message.kind === "ok" ? "notice--ok" : "notice--error"}`}>
          {t(message.key)}
        </p>
      ) : null}

      <h2>{t("account.deleteTitle")}</h2>
      <p>{t("account.deleteText")}</p>
      <div className="button-row">
        <DeleteAccountDialog disabled={readOnly} />
      </div>
    </section>
  );
}
