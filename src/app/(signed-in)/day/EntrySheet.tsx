"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ActivityPicker } from "@/components/ActivityPicker";
import { closeOnBackdrop } from "@/components/dialog";
import { DurationInput } from "@/components/DurationInput";
import { GoalPicker } from "@/components/GoalPicker";
import { Check, ChevronDown, Repeat, Trash } from "@/components/icons";
import { createActivity, getGetCatalogQueryKey } from "@/lib/api/generated/catalog/catalog";
import type { UpdateEntryBody } from "@/lib/api/generated/lifeManagerAPI.schemas";
import { createObjective } from "@/lib/api/generated/objectives/objectives";
import { isPlanningKey } from "@/lib/day/agenda";
import { goalOptions, skipsLevel } from "@/lib/day/chain";
import { formatMinutes } from "@/lib/day/dates";
import { chainOf, countedPaths } from "@/lib/day/groups";
import type { Catalog, Day, Entry } from "@/lib/day/types";
import { useT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";

type Status = Entry["status"];
const STATUSES: Status[] = ["planned", "completed", "skipped", "cancelled"];

interface Props {
  entry: Entry;
  entries: Entry[];
  objectives: Day["objectives"];
  catalog: Catalog | undefined;
  disabled: boolean;
  onClose: () => void;
  onSave: (patch: UpdateEntryBody) => Promise<void>;
  onDelete: () => Promise<void>;
  // 006 D8: turn the task into a weekly item.
  onRepeat?: () => void;
}

// 005 D2: title, activity, start, duration, and what it counts for. Parts,
// routine, and deep work come from the activity; the rest sits under "More".
// A group heading only has a title and notes (004 D1).
export function EntrySheet({ entry, entries, objectives, catalog, disabled, onClose, onSave, onDelete, onRepeat }: Props) {
  const t = useT();
  const queryClient = useQueryClient();
  const dialog = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState(entry);
  const [more, setMore] = useState(false);
  // 007 US3.2: a week goal made from the task, with the month goal above it.
  const [newGoal, setNewGoal] = useState<{ title: string; parentIds: string[] } | null>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const set = <K extends keyof Entry>(key: K, value: Entry[K]) => setForm((f) => ({ ...f, [key]: value }));
  const heading = entry.kind === "heading";
  const done = form.status === "completed";
  const headings = entries.filter((e) => e.kind === "heading");

  function patch(): UpdateEntryBody {
    const changed: Record<string, unknown> = {};
    const keys = heading
      ? (["title", "notes"] as const)
      : (["title", "activityId", "startTime", "plannedMinutes", "actualMinutes", "status", "notes", "groupId"] as const);
    for (const key of keys) {
      if (form[key] !== entry[key]) changed[key] = form[key];
    }
    if (!heading) {
      if (JSON.stringify(form.objectiveIds) !== JSON.stringify(entry.objectiveIds)) changed.objectiveIds = form.objectiveIds;
      if (changed.status && changed.status !== "completed") delete changed.actualMinutes;
    }
    return changed as UpdateEntryBody;
  }

  async function save() {
    const body = patch();
    if (Object.keys(body).length === 0) return close();
    await onSave(body);
  }

  async function create(name: string, areaId: string): Promise<string> {
    const id = crypto.randomUUID();
    await createActivity({ id, name, areaId, defaultMinutes: form.plannedMinutes });
    await queryClient.invalidateQueries({ queryKey: getGetCatalogQueryKey() });
    return id;
  }

  function close() {
    dialog.current?.close();
    onClose();
  }

  const counted = countedPaths(objectives, entry.contributesTo);
  // 007 FR-002: a task is linked by hand only to goals of its week; a link
  // kept from before shows, marked.
  const weekGoals = goalOptions(objectives, "week");
  const pathOf = (id: string) =>
    chainOf(objectives, id)
      .slice(1)
      .map((o) => o.title)
      .join(" › ");
  const chosen = form.objectiveIds.flatMap((id) => {
    const o = objectives.find((x) => x.id === id);
    return o ? [{ id, title: o.title, horizon: o.horizon, path: pathOf(id), skips: skipsLevel({ horizon: "day" }, o) }] : [];
  });
  const monthGoals = goalOptions(objectives, "month");

  async function createWeekGoal() {
    if (!newGoal?.title.trim()) return;
    const id = crypto.randomUUID();
    await createObjective("week", entry.date, {
      id,
      title: newGoal.title.trim(),
      targetType: "count",
      targetCount: 1,
      activityIds: form.activityId ? [form.activityId] : [],
      parentIds: newGoal.parentIds,
    });
    await queryClient.invalidateQueries({ predicate: (q) => isPlanningKey(q.queryKey) });
    set("objectiveIds", [...form.objectiveIds, id]);
    setNewGoal(null);
  }

  return (
    <dialog onClick={closeOnBackdrop} ref={dialog} className="dialog sheet" aria-labelledby="entry-title" onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <fieldset className="stack plain-fieldset" disabled={disabled}>
          <div className="sheet-title">
            {heading ? null : (
              <button
                type="button"
                className={`status-button ${done ? "status-button--done" : ""}`}
                aria-label={done ? t("day.markPlanned", { title: form.title }) : t("day.markDone", { title: form.title })}
                aria-pressed={done}
                onClick={() => set("status", done ? "planned" : "completed")}
              >
                {done ? <Check size={14} /> : null}
              </button>
            )}
            <label className="sheet-title__field">
              <span className="visually-hidden">{heading ? t("group.title") : t("entry.title")}</span>
              <input id="entry-title" value={form.title} maxLength={200} required onChange={(e) => set("title", e.target.value)} />
            </label>
          </div>

          {heading ? null : (
            <>
              <div className="card">
                <ActivityPicker catalog={catalog} value={form.activityId} disabled={disabled} onChange={(id) => set("activityId", id)} onCreate={create} />
                <div className="card__divider" />
                <div className="card__pair">
                  <label className="card__field">
                    {t("entry.start")}
                    <input type="time" value={form.startTime ?? ""} onChange={(e) => set("startTime", e.target.value || null)} />
                  </label>
                  <label className="card__field">
                    {done ? t("entry.actualDuration") : t("entry.duration")}
                    {done ? (
                      <DurationInput
                        key="actual"
                        label={t("entry.actualDuration")}
                        value={form.actualMinutes ?? form.plannedMinutes}
                        onChange={(m) => set("actualMinutes", m)}
                      />
                    ) : (
                      <DurationInput
                        key="planned"
                        label={t("entry.duration")}
                        value={form.plannedMinutes}
                        disabled={form.isUnplanned}
                        onChange={(m) => set("plannedMinutes", m)}
                      />
                    )}
                    {done ? <span className="muted small">{t("entry.plannedHint", { n: formatMinutes(form.plannedMinutes) })}</span> : null}
                  </label>
                </div>
                {entry.segments.length > 0 ? (
                  <>
                    <div className="card__divider" />
                    <div className="card__parts">
                      <ol className="segments" aria-label={t("entry.segments")}>
                        {entry.segments.map((s) => (
                          <li key={s.id} className={`segment segment--${s.timeValue}`}>
                            <span>{s.title}</span>
                            <span>{formatMinutes(s.minutes)}</span>
                          </li>
                        ))}
                      </ol>
                      <p className="muted small">{t("entry.partsFromActivity")}</p>
                    </div>
                  </>
                ) : null}
              </div>

              <section className="card card--padded" aria-label={t("objective.countsFor")}>
                <span className="muted small">{t("objective.countsFor")}</span>
                {counted.length === 0 ? <p className="muted small">{t("objective.countsForNone")}</p> : null}
                {counted.map((chain) => (
                  <ol key={chain[0]?.id} className="segments" data-testid="objective-chain">
                    {chain.map((o) => (
                      <li key={o.id} className="segment segment--useful">
                        <span>{o.title}</span>
                        <span className="muted">{t(`horizon.${o.horizon}` as MessageKey)}</span>
                      </li>
                    ))}
                  </ol>
                ))}
              </section>
            </>
          )}

          <button type="button" className="more-toggle" aria-expanded={more} onClick={() => setMore((v) => !v)}>
            {t("entry.more")}
            <ChevronDown />
          </button>
          {more ? (
            <div className="stack">
              {!heading && headings.length > 0 ? (
                <label className="field">
                  {t("group.label")}
                  <select value={form.groupId ?? ""} onChange={(e) => set("groupId", e.target.value || null)}>
                    <option value="">{t("group.none")}</option>
                    {headings.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {heading ? null : (
                <label className="field">
                  {t("entry.status")}
                  <select value={form.status} onChange={(e) => set("status", e.target.value as Status)} disabled={form.isUnplanned}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t(`status.${s}`)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!heading && !entry.eventId && onRepeat ? (
                <button type="button" className="ghost-button" onClick={onRepeat}>
                  <Repeat size={16} />
                  {t("entry.repeat")}
                </button>
              ) : null}
              <label className="field">
                {t("entry.notes")}
                <textarea value={form.notes} maxLength={10_000} rows={3} onChange={(e) => set("notes", e.target.value)} />
              </label>
              {heading ? null : (
                <div className="card">
                  <GoalPicker
                    label={t("objective.linkByHand")}
                    options={weekGoals}
                    value={form.objectiveIds}
                    chosen={chosen}
                    disabled={disabled}
                    createLabel={t("goalPicker.newWeek")}
                    onChange={(ids) => set("objectiveIds", ids)}
                    onCreate={() => setNewGoal({ title: form.title, parentIds: [] })}
                  />
                </div>
              )}
              {newGoal ? (
                <div className="card card--padded stack" role="group" aria-label={t("goalPicker.newWeekTitle")}>
                  <span className="muted small">{t("goalPicker.newWeekTitle")}</span>
                  <label className="field">
                    {t("entry.title")}
                    <input value={newGoal.title} maxLength={200} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} />
                  </label>
                  <GoalPicker
                    label={t("goalPicker.monthAbove")}
                    options={monthGoals}
                    value={newGoal.parentIds}
                    chosen={newGoal.parentIds.flatMap((id) => monthGoals.filter((o) => o.id === id))}
                    disabled={disabled}
                    onChange={(ids) => setNewGoal({ ...newGoal, parentIds: ids })}
                  />
                  <div className="button-row">
                    <button type="button" className="ghost-button" onClick={() => setNewGoal(null)}>
                      {t("common.cancel")}
                    </button>
                    <button type="button" className="primary-button" onClick={() => void createWeekGoal()}>
                      {t("goalPicker.create")}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="sheet__footer">
            <button
              type="button"
              className="icon-button icon-button--surface icon-button--danger"
              aria-label={heading ? t("group.delete") : t("entry.delete")}
              onClick={() => void onDelete()}
            >
              <Trash />
            </button>
            <button type="submit" className="primary-button sheet__save">
              {t("common.save")}
            </button>
          </div>
        </fieldset>
      </form>
    </dialog>
  );
}
