"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useGetCatalog } from "@/lib/api/generated/catalog/catalog";
import { closeDay, getGetDayCloseQueryKey, getGetDayQueryKey, updateEntry, useGetDayClose } from "@/lib/api/generated/days/days";
import { addDays, formatMinutes, isDate } from "@/lib/day/dates";
import type { Activity } from "@/lib/day/types";
import { formatDate, useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { useConnectivity } from "@/lib/offline/use-connectivity";

type Decision = "confirmed" | "dismissed";
type CheckInKey = "physicalEnergy" | "mentalEnergy" | "emotionalEnergy" | "satisfaction";
const CHECK_IN: CheckInKey[] = ["physicalEnergy", "mentalEnergy", "emotionalEnergy", "satisfaction"];

const percent = (value: number) => `${String(Math.round(value * 100))}%`;

// contracts/ui.md "Day close": resolve, scores with why, carries, check-in, notes.
export function CloseScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { readOnly } = useConnectivity();
  const date = isDate(params.get("date")) ? (params.get("date") ?? "") : "";
  const preview = useGetDayClose(date, { query: { enabled: date !== "" } });
  const catalog = useGetCatalog();
  const [decisions, setDecisions] = useState<Record<string, { decision: Decision; title: string; minutes: number }>>({});
  const [checkIn, setCheckIn] = useState<Record<CheckInKey, number | null>>({ physicalEnergy: null, mentalEnergy: null, emotionalEnergy: null, satisfaction: null });
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const data = preview.data?.data;
  if (!data) return <p>{t("common.loading")}</p>;

  const activities = new Map<string, Activity>((catalog.data?.data.activities ?? []).map((a) => [a.id, a]));
  const nameOf = (id: string) => {
    const e = [...data.unresolved, ...data.carryCandidates.map((c) => c.entry)].find((x) => x.id === id);
    const all = queryClient.getQueryData<{ data: { entries: { id: string; title: string; activityId: string | null }[] } }>(getGetDayQueryKey(date));
    const entry = e ?? all?.data.entries.find((x) => x.id === id);
    if (!entry) return "";
    return entry.activityId ? (activities.get(entry.activityId)?.name ?? entry.title) : entry.title;
  };
  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetDayCloseQueryKey(date) });

  async function resolve(id: string, status: "completed" | "skipped" | "cancelled") {
    await updateEntry(id, { status });
    await refresh();
  }

  async function submit() {
    if (!data) return;
    setBusy(true);
    setError(false);
    try {
      await closeDay(date, {
        notes,
        checkIn: CHECK_IN.some((k) => checkIn[k] !== null) ? checkIn : null,
        carries: data.carryCandidates
          .filter((c) => c.decision === null)
          .map((c) => {
            const d = decisions[c.entry.id];
            return { entryId: c.entry.id, decision: d?.decision ?? "dismissed", title: d?.title ?? c.suggestedTitle, plannedMinutes: d?.minutes ?? c.suggestedMinutes };
          }),
      });
      await queryClient.invalidateQueries({ queryKey: getGetDayQueryKey(date) });
      await queryClient.invalidateQueries({ queryKey: getGetDayQueryKey(addDays(date, 1)) });
      router.push(`/day?date=${date}`);
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  const pending = data.carryCandidates.filter((c) => c.decision === null);
  const undecided = pending.some((c) => !decisions[c.entry.id]);
  const label = formatDate(locale, date, { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="panel close">
      <Link href={`/day?date=${date}`} className="link-button">
        ‹ {t("close.back")}
      </Link>
      <h1>{t("close.title", { date: label })}</h1>

      {data.unresolved.length > 0 ? (
        <section className="stack">
          <h2>{t("close.unresolved")}</h2>
          <p className="muted">{t("close.unresolvedHint")}</p>
          <ul className="check-list">
            {data.unresolved.map((e) => (
              <li key={e.id} className="resolve-row">
                <span className="catalog-item__name">{nameOf(e.id)}</span>
                {(["completed", "skipped", "cancelled"] as const).map((s) => (
                  <button key={s} type="button" className="ghost-button" disabled={readOnly} onClick={() => void resolve(e.id, s)}>
                    {t(`status.${s}`)}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <section className="stack">
            <h2>{t("close.scores")}</h2>
            <ScoreLine label={t("close.execution")} value={data.scores.execution} empty={t("close.noPlanned")}>
              {data.explanation.execution.map((l) => (
                <li key={l.entryId}>
                  {t("close.executionLine", { title: nameOf(l.entryId), credited: formatMinutes(l.credited), minutes: formatMinutes(l.minutes) })}
                </li>
              ))}
            </ScoreLine>
            <ScoreLine label={t("close.alignment")} value={data.scores.alignment} empty={t("close.noWork")}>
              {data.explanation.alignment.map((l) => (
                <li key={l.entryId}>
                  {t("close.alignmentLine", { title: nameOf(l.entryId), credited: formatMinutes(l.credited), minutes: formatMinutes(l.minutes) })}
                </li>
              ))}
            </ScoreLine>
          </section>

          <section className="stack">
            <h2>{t("close.carries")}</h2>
            {data.carryCandidates.length === 0 ? <p className="muted">{t("close.noCarries")}</p> : null}
            <ul className="check-list">
              {data.carryCandidates.map((c) => {
                const d = decisions[c.entry.id] ?? { decision: undefined, title: c.suggestedTitle, minutes: c.suggestedMinutes };
                const set = (change: Partial<{ decision: Decision; title: string; minutes: number }>) =>
                  // Editing a carry implies keeping it.
                  setDecisions((all) => ({ ...all, [c.entry.id]: { decision: d.decision ?? "confirmed", title: d.title, minutes: d.minutes, ...change } }));
                if (c.decision) {
                  return (
                    <li key={c.entry.id} className="muted">
                      {nameOf(c.entry.id)} — {t(`close.decided.${c.decision}` as MessageKey)}
                    </li>
                  );
                }
                return (
                  <li key={c.entry.id} className="carry-row" data-testid="carry-row">
                    <input aria-label={t("entry.title")} value={d.title} maxLength={200} onChange={(e) => set({ title: e.target.value })} />
                    <input
                      aria-label={t("entry.planned")}
                      type="number"
                      min={1}
                      max={1440}
                      value={d.minutes}
                      onChange={(e) => set({ minutes: Number(e.target.value) })}
                    />
                    <button type="button" className={d.decision === "confirmed" ? "primary-button" : "ghost-button"} aria-pressed={d.decision === "confirmed"} onClick={() => set({ decision: "confirmed" })}>
                      {t("close.confirm")}
                    </button>
                    <button type="button" className={d.decision === "dismissed" ? "primary-button" : "ghost-button"} aria-pressed={d.decision === "dismissed"} onClick={() => set({ decision: "dismissed" })}>
                      {t("close.dismiss")}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <fieldset className="stack plain-fieldset">
            <legend>
              <h2>{t("close.checkIn")}</h2>
            </legend>
            {CHECK_IN.map((key) => (
              <div key={key} className="tap-scale" role="radiogroup" aria-label={t(`close.${key}`)}>
                <span>{t(`close.${key}`)}</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={checkIn[key] === n}
                    className={checkIn[key] === n ? "primary-button" : "ghost-button"}
                    onClick={() => setCheckIn((c) => ({ ...c, [key]: c[key] === n ? null : n }))}
                  >
                    {n}
                  </button>
                ))}
              </div>
            ))}
          </fieldset>

          <label className="field">
            {t("close.notes")}
            <textarea value={notes} rows={3} maxLength={10_000} onChange={(e) => setNotes(e.target.value)} />
          </label>
          {error ? (
            <p role="alert" className="notice notice--error">
              {t("close.failed")}
            </p>
          ) : null}
          <button type="button" className="primary-button" disabled={readOnly || busy || undecided} onClick={() => void submit()}>
            {busy ? t("close.closing") : t("close.submit")}
          </button>
        </>
      )}
    </section>
  );
}

function ScoreLine({ label, value, empty, children }: { label: string; value: number | null; empty: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <details className="score">
      <summary>
        <span>{label}</span> <strong>{value === null ? empty : percent(value)}</strong> <span className="muted small">{t("close.why")}</span>
      </summary>
      <ul>{children}</ul>
    </details>
  );
}
