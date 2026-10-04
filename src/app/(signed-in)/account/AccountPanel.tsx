"use client";

import { useState } from "react";
import { downloadExport, type ExportFormat } from "@/lib/api/export";
import { useGetMe } from "@/lib/api/generated/account/account";
import { ApiError } from "@/lib/api/mutator";
import { useConnectivity } from "@/lib/offline/use-connectivity";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

export function AccountPanel() {
  const me = useGetMe({ query: { retry: false } });
  const { readOnly } = useConnectivity();
  const [pending, setPending] = useState<ExportFormat>();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string }>();

  async function runExport(format: ExportFormat) {
    setPending(format);
    setMessage(undefined);
    try {
      await downloadExport(format);
      setMessage({ kind: "ok", text: "Export downloaded." });
    } catch (error) {
      const text =
        error instanceof ApiError && error.status === 409
          ? "An export is already running. Try again in a moment."
          : "Could not export. Check your connection and try again.";
      setMessage({ kind: "error", text });
    } finally {
      setPending(undefined);
    }
  }

  const account = me.data?.data.account;
  return (
    <section className="panel">
      <h1>Account</h1>
      {account ? (
        <dl className="details">
          <dt>Email</dt>
          <dd>{account.email}</dd>
          <dt>Name</dt>
          <dd>{account.name}</dd>
        </dl>
      ) : null}

      <h2>Export your data</h2>
      <p>Everything stored for your account, as JSON or as a Markdown document.</p>
      <div className="button-row">
        <button type="button" className="primary-button" disabled={readOnly || pending !== undefined} onClick={() => void runExport("json")}>
          {pending === "json" ? "Exporting…" : "Export JSON"}
        </button>
        <button type="button" className="primary-button" disabled={readOnly || pending !== undefined} onClick={() => void runExport("markdown")}>
          {pending === "markdown" ? "Exporting…" : "Export Markdown"}
        </button>
      </div>
      {message ? (
        <p role="status" className={`notice ${message.kind === "ok" ? "notice--ok" : "notice--error"}`}>
          {message.text}
        </p>
      ) : null}

      <h2>Delete account</h2>
      <p>Permanently remove your account and everything stored for it.</p>
      <div className="button-row">
        <DeleteAccountDialog disabled={readOnly} />
      </div>
    </section>
  );
}
