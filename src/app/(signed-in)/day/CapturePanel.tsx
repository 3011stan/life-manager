"use client";

import { useState } from "react";
import type { CreateEntryBody, UpdateDayBody } from "@/lib/api/generated/lifeManagerAPI.schemas";
import { parseCapture, type Suggestion } from "@/lib/capture/parse";
import type { Activity } from "@/lib/day/types";
import { useT } from "@/lib/i18n";
import { DurationInput } from "@/components/DurationInput";

interface Props {
  text: string;
  activities: Activity[];
  disabled: boolean;
  onSaveText: (body: UpdateDayBody) => Promise<unknown>;
  onAdd: (body: CreateEntryBody) => Promise<void>;
}

// US8: suggestions never change the day until each one is accepted (FR-042).
export function CapturePanel({ text, activities, disabled, onSaveText, onAdd }: Props) {
  const t = useT();
  const [open, setOpen] = useState(text.length > 0);
  const [draft, setDraft] = useState(text);
  const [suggestions, setSuggestions] = useState<(Suggestion & { key: string })[]>();

  function suggest() {
    void onSaveText({ captureText: draft });
    const live = activities.filter((a) => !a.archivedAt);
    setSuggestions(parseCapture(draft, live).map((s) => ({ ...s, key: crypto.randomUUID() })));
  }

  async function accept(s: Suggestion & { key: string }) {
    const activity = activities.find((a) => a.id === s.activityId);
    const minutes = s.minutes ?? activity?.defaultMinutes ?? 30;
    await onAdd({
      id: crypto.randomUUID(),
      title: s.title,
      ...(s.activityId ? { activityId: s.activityId } : {}),
      ...(s.startTime ? { startTime: s.startTime } : {}),
      ...(s.status === "completed" ? { isUnplanned: true, actualMinutes: minutes } : { plannedMinutes: minutes, status: s.status }),
    });
    setSuggestions((all) => all?.filter((x) => x.key !== s.key));
  }

  const update = (key: string, change: Partial<Suggestion>) => setSuggestions((all) => all?.map((x) => (x.key === key ? { ...x, ...change } : x)));

  if (!open) {
    return (
      <button type="button" className="ghost-button" onClick={() => setOpen(true)} disabled={disabled}>
        {t("capture.open")}
      </button>
    );
  }

  return (
    <section className="stack panel" aria-label={t("capture.title")}>
      <h2>{t("capture.title")}</h2>
      <label className="field">
        {t("capture.label")}
        <textarea value={draft} rows={4} maxLength={10_000} onChange={(e) => setDraft(e.target.value)} onBlur={() => draft !== text && void onSaveText({ captureText: draft })} disabled={disabled} />
      </label>
      <button type="button" className="ghost-button" onClick={suggest} disabled={disabled || !draft.trim()}>
        {t("capture.suggest")}
      </button>
      {suggestions?.length === 0 ? <p className="muted">{t("capture.none")}</p> : null}
      <ul className="check-list">
        {suggestions?.map((s) => (
          <li key={s.key} className="suggestion-edit" data-testid="suggestion">
            <span className="muted small">{t("capture.from", { source: s.source })}</span>
            <input aria-label={t("entry.title")} value={s.title} maxLength={200} onChange={(e) => update(s.key, { title: e.target.value })} />
            <div className="field-row">
              <label className="field">
                {t("entry.start")}
                <input type="time" value={s.startTime ?? ""} onChange={(e) => update(s.key, { startTime: e.target.value || null })} />
              </label>
              <label className="field">
                {t("entry.planned")}
                <DurationInput label={t("entry.planned")} value={s.minutes} allowEmpty onChange={(m) => update(s.key, { minutes: m })} />
              </label>
              <label className="field">
                {t("entry.status")}
                <select value={s.status} onChange={(e) => update(s.key, { status: e.target.value as Suggestion["status"] })}>
                  <option value="planned">{t("status.planned")}</option>
                  <option value="completed">{t("status.completed")}</option>
                  <option value="skipped">{t("status.skipped")}</option>
                </select>
              </label>
            </div>
            <div className="button-row">
              <button type="button" className="primary-button" disabled={disabled || !s.title.trim()} onClick={() => void accept(s)}>
                {t("capture.accept")}
              </button>
              <button type="button" className="ghost-button" onClick={() => setSuggestions((all) => all?.filter((x) => x.key !== s.key))}>
                {t("capture.dismiss")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
