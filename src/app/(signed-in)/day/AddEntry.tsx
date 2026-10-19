"use client";

import { useState, type FormEvent } from "react";
import type { CreateEntryBody } from "@/lib/api/generated/lifeManagerAPI.schemas";
import { formatDate, useI18n } from "@/lib/i18n";
import type { Activity, Day } from "@/lib/day/types";

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export function matchActivities(activities: Activity[], query: string, limit = 5): Activity[] {
  const q = fold(query);
  if (!q) return [];
  const live = activities.filter((a) => !a.archivedAt);
  const starts = live.filter((a) => fold(a.name).startsWith(q));
  const contains = live.filter((a) => !fold(a.name).startsWith(q) && fold(a.name).includes(q));
  return [...starts, ...contains].slice(0, limit);
}

interface Props {
  activities: Activity[];
  closeRequired: Day["closeRequired"];
  disabled: boolean;
  onAdd: (body: CreateEntryBody) => Promise<void>;
}

// FR-002: a title is enough; the chosen activity fills everything else.
export function AddEntry({ activities, closeRequired, disabled, onAdd }: Props) {
  const { t, locale } = useI18n();
  const [title, setTitle] = useState("");
  const [logDone, setLogDone] = useState(false);
  const suggestions = matchActivities(activities, title);
  const gated = closeRequired !== null && !logDone;

  async function add(activity?: Activity) {
    const name = activity?.name ?? title.trim();
    if (!name) return;
    const exact = activity ?? activities.find((a) => !a.archivedAt && fold(a.name) === fold(name));
    await onAdd({
      id: crypto.randomUUID(),
      title: exact?.name ?? name,
      ...(exact ? { activityId: exact.id } : {}),
      ...(logDone ? { isUnplanned: true, actualMinutes: exact?.defaultMinutes ?? 30 } : {}),
    });
    setTitle("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void add();
  }

  return (
    <form className="add-entry" onSubmit={submit}>
      {closeRequired ? (
        <p className="notice" role="status">
          {t("day.closeFirst", { date: formatDate(locale, closeRequired.startDate, { day: "numeric", month: "short" }) })}
        </p>
      ) : null}
      <div className="add-entry__row">
        <label className="visually-hidden" htmlFor="add-entry">
          {t("day.addLabel")}
        </label>
        <input
          id="add-entry"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("day.addPlaceholder")}
          autoComplete="off"
          disabled={disabled || gated}
          maxLength={200}
        />
        <button type="submit" className="primary-button" disabled={disabled || gated || !title.trim()}>
          {t("common.add")}
        </button>
      </div>
      <label className="toggle">
        <input type="checkbox" checked={logDone} onChange={(e) => setLogDone(e.target.checked)} disabled={disabled} />
        {t("day.logDone")}
      </label>
      {suggestions.length > 0 && !gated ? (
        <ul className="suggestions">
          {suggestions.map((a) => (
            <li key={a.id}>
              <button type="button" className="suggestion" onClick={() => void add(a)} disabled={disabled}>
                <span>{a.name}</span>
                <span className="muted">{a.defaultMinutes} min</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
