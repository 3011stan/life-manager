"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ActivityPicker } from "@/components/ActivityPicker";
import { closeOnBackdrop } from "@/components/dialog";
import { DurationInput } from "@/components/DurationInput";
import { GoalPicker } from "@/components/GoalPicker";
import { Trash } from "@/components/icons";
import { createEvent, deleteEvent, updateEvent } from "@/lib/api/generated/agenda/agenda";
import { createActivity, getGetCatalogQueryKey, useGetCatalog } from "@/lib/api/generated/catalog/catalog";
import type { CreateEventBody, GetAgenda200EventsItem } from "@/lib/api/generated/lifeManagerAPI.schemas";
import { useGetGoalsTree } from "@/lib/api/generated/objectives/objectives";
import { ApiError } from "@/lib/api/mutator";
import { weekdayNames } from "@/lib/day/agenda";
import { goalOptions } from "@/lib/day/chain";
import { useI18n } from "@/lib/i18n";

export type AgendaEvent = GetAgenda200EventsItem;
type Repeat = AgendaEvent["repeat"];

export interface EventPreset {
  title?: string;
  onDate?: string;
  startTime?: string | null;
  minutes?: number | null;
  activityId?: string | null;
  repeat?: Repeat;
  weekdays?: number[];
  fromEntryId?: string;
}

interface Props {
  event: AgendaEvent | undefined;
  preset?: EventPreset;
  today: string;
  disabled: boolean;
  onClose: () => void;
  // The save's result, so the caller can offer Undo for archived templates (D7).
  onSaved: (archivedTemplates: { id: string; title: string }[]) => Promise<void> | void;
}

const REPEATS: Repeat[] = ["none", "yearly", "weekly"];
const REPEAT_LABEL = { none: "event.repeatNone", yearly: "event.repeatYearly", weekly: "event.repeatWeekly" } as const;

// 006 FR-001: one sheet for a one-off event, a yearly one, and a task that
// repeats on days of the week.
export function EventSheet({ event, preset, today, disabled, onClose, onSaved }: Props) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const dialog = useRef<HTMLDialogElement>(null);
  const catalog = useGetCatalog();
  const [form, setForm] = useState({
    title: event?.title ?? preset?.title ?? "",
    onDate: event?.onDate ?? preset?.onDate ?? today,
    startTime: event?.startTime ?? preset?.startTime ?? null,
    minutes: event?.minutes ?? preset?.minutes ?? null,
    activityId: event?.activityId ?? preset?.activityId ?? null,
    repeat: event?.repeat ?? preset?.repeat ?? ("none" as Repeat),
    weekdays: event?.weekdays ?? preset?.weekdays ?? [],
    untilDate: event?.untilDate ?? null,
    makesWeekGoal: event?.makesWeekGoal ?? true,
    notes: event?.notes ?? "",
    objectiveIds: event?.objectiveIds ?? [],
  });
  const [error, setError] = useState<string>();
  const names = weekdayNames(locale);
  // 007 FR-007: month and year goals of the periods holding the first date;
  // applying the week builds the chain between (R6).
  const tree = useGetGoalsTree({ date: form.onDate });
  const all = tree.data?.data.objectives ?? [];
  const active = all.filter((o) => o.status === "active");
  const goals = [...goalOptions(active, "month"), ...goalOptions(active, "year")];
  const chosenGoals = form.objectiveIds.flatMap((id) => goalOptions(all, all.find((o) => o.id === id)?.horizon ?? "").filter((o) => o.id === id));

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggleDay = (d: number) => set("weekdays", form.weekdays.includes(d) ? form.weekdays.filter((x) => x !== d) : [...form.weekdays, d].sort((a, b) => a - b));

  function close() {
    dialog.current?.close();
    onClose();
  }

  async function run(action: () => Promise<{ data: unknown }>) {
    setError(undefined);
    try {
      const res = await action();
      const archived = (res.data as { archivedTemplates?: { id: string; title: string }[] } | null)?.archivedTemplates ?? [];
      await onSaved(archived);
      close();
    } catch (e) {
      setError(e instanceof ApiError ? (e.problem?.errors?.[0]?.message ?? e.message) : t("common.saveFailed"));
    }
  }

  function body(): Omit<CreateEventBody, "id"> {
    const repeating = form.repeat !== "none";
    return {
      title: form.title.trim(),
      onDate: form.onDate,
      startTime: form.startTime,
      minutes: form.minutes,
      activityId: form.activityId,
      repeat: form.repeat,
      weekdays: form.repeat === "weekly" ? form.weekdays : [],
      untilDate: repeating ? form.untilDate : null,
      makesWeekGoal: form.makesWeekGoal,
      notes: form.notes,
      objectiveIds: form.objectiveIds,
    };
  }

  const save = () =>
    run(() => (event ? updateEvent(event.id, body()) : createEvent({ id: crypto.randomUUID(), ...body(), ...(preset?.fromEntryId ? { fromEntryId: preset.fromEntryId } : {}) })));

  async function create(name: string, areaId: string): Promise<string> {
    const id = crypto.randomUUID();
    await createActivity({ id, name, areaId, ...(form.minutes ? { defaultMinutes: form.minutes } : {}) });
    await queryClient.invalidateQueries({ queryKey: getGetCatalogQueryKey() });
    return id;
  }

  const weeklyInvalid = form.repeat === "weekly" && form.weekdays.length === 0;

  return (
    <dialog onClick={closeOnBackdrop} ref={dialog} className="dialog sheet" aria-labelledby="event-heading" onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <fieldset className="stack plain-fieldset" disabled={disabled}>
          <h2 id="event-heading" className="sheet-heading">
            {event ? t("event.edit") : t("event.new")}
          </h2>
          <label className="field">
            {t("event.title")}
            <input value={form.title} maxLength={200} required onChange={(e) => set("title", e.target.value)} />
          </label>

          <div className="card">
            <ActivityPicker catalog={catalog.data?.data} value={form.activityId} disabled={disabled} onChange={(id) => set("activityId", id)} onCreate={create} />
            <div className="card__divider" />
            <div className="card__pair">
              <label className="card__field">
                {form.repeat === "none" ? t("event.date") : t("event.firstDate")}
                <input type="date" value={form.onDate} required onChange={(e) => set("onDate", e.target.value)} />
              </label>
              <label className="card__field">
                {t("event.time")}
                <input type="time" value={form.startTime ?? ""} onChange={(e) => set("startTime", e.target.value || null)} />
              </label>
            </div>
            <div className="card__divider" />
            <label className="card__field">
              {t("event.duration")}
              <DurationInput label={t("event.duration")} value={form.minutes} allowEmpty onChange={(m) => set("minutes", m > 0 ? m : null)} />
            </label>
          </div>

          <label className="field">
            {t("event.repeat")}
            <select value={form.repeat} onChange={(e) => set("repeat", e.target.value as Repeat)}>
              {REPEATS.map((r) => (
                <option key={r} value={r}>
                  {t(REPEAT_LABEL[r])}
                </option>
              ))}
            </select>
          </label>
          {form.repeat === "weekly" ? (
            <fieldset className="stack plain-fieldset">
              <legend className="field">{t("event.days")}</legend>
              <ul className="chips">
                {names.map((name, d) => (
                  <li key={name}>
                    <button type="button" className="chip" aria-pressed={form.weekdays.includes(d)} onClick={() => toggleDay(d)}>
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : null}
          {form.repeat !== "none" ? (
            <label className="field">
              {t("event.until")}
              <input type="date" value={form.untilDate ?? ""} min={form.onDate} onChange={(e) => set("untilDate", e.target.value || null)} />
            </label>
          ) : null}

          <label className="toggle">
            <input type="checkbox" checked={form.makesWeekGoal} onChange={(e) => set("makesWeekGoal", e.target.checked)} />
            <span>
              {t("event.weekGoal")}
              <span className="muted small"> · {t("event.weekGoalHint")}</span>
            </span>
          </label>

          {form.makesWeekGoal && (goals.length > 0 || chosenGoals.length > 0) ? (
            <div className="card">
              <GoalPicker
                label={t("event.countsFor")}
                options={goals}
                value={form.objectiveIds}
                chosen={chosenGoals}
                disabled={disabled}
                onChange={(ids) => set("objectiveIds", ids)}
              />
            </div>
          ) : null}

          <label className="field">
            {t("event.notes")}
            <textarea value={form.notes} maxLength={10_000} rows={2} onChange={(e) => set("notes", e.target.value)} />
          </label>

          {error ? (
            <p role="alert" className="notice notice--error">
              {error}
            </p>
          ) : null}
          <div className="sheet__footer">
            {event ? (
              <button
                type="button"
                className="icon-button icon-button--surface icon-button--danger"
                aria-label={t("event.delete")}
                onClick={() => {
                  if (window.confirm(t("event.deleteConfirm", { title: event.title }))) void run(() => deleteEvent(event.id) as Promise<{ data: unknown }>);
                }}
              >
                <Trash />
              </button>
            ) : null}
            <button type="submit" className="primary-button sheet__save" disabled={weeklyInvalid || !form.title.trim()}>
              {t("common.save")}
            </button>
          </div>
        </fieldset>
      </form>
    </dialog>
  );
}
