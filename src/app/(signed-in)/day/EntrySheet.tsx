"use client";

import { useEffect, useRef, useState } from "react";
import { Close } from "@/components/icons";
import { closeOnBackdrop } from "@/components/dialog";
import { DurationInput } from "@/components/DurationInput";
import { createActivity } from "@/lib/api/generated/catalog/catalog";
import type { UpdateEntryBody } from "@/lib/api/generated/lifeManagerAPI.schemas";
import { formatMinutes } from "@/lib/day/dates";
import { chainOf, siblingsOf } from "@/lib/day/groups";
import { keyForMove } from "@/lib/day/order";
import type { Catalog, Day, Entry, Segment } from "@/lib/day/types";
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
}

// FR-001: every attribute beyond title, time, and status lives here. A group
// heading only has a title and notes (004 D1).
export function EntrySheet({ entry, entries, objectives, catalog, disabled, onClose, onSave, onDelete }: Props) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState(entry);
  const [newActivityArea, setNewActivityArea] = useState<string>();

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const set = <K extends keyof Entry>(key: K, value: Entry[K]) => setForm((f) => ({ ...f, [key]: value }));
  const heading = entry.kind === "heading";
  const segmentsTotal = form.segments.reduce((n, s) => n + s.minutes, 0);
  const activities = (catalog?.activities ?? []).filter((a) => !a.archivedAt || a.id === entry.activityId);
  const liveAreas = (catalog?.areas ?? []).filter((a) => !a.archivedAt);
  const headings = entries.filter((e) => e.kind === "heading");
  const siblings = siblingsOf(entries, entry);
  const index = siblings.findIndex((e) => e.id === entry.id);

  function patch(): UpdateEntryBody {
    const changed: Record<string, unknown> = {};
    const keys = heading
      ? (["title", "notes"] as const)
      : (["title", "activityId", "startTime", "plannedMinutes", "actualMinutes", "status", "isTimeBlock", "timeValue", "deepWork", "notes", "groupId"] as const);
    for (const key of keys) {
      if (form[key] !== entry[key]) changed[key] = form[key];
    }
    if (!heading) {
      if (JSON.stringify(form.segments) !== JSON.stringify(entry.segments)) changed.segments = form.segments;
      if (JSON.stringify(form.objectiveIds) !== JSON.stringify(entry.objectiveIds)) changed.objectiveIds = form.objectiveIds;
      if (changed.segments) delete changed.plannedMinutes;
      if (changed.status && changed.status !== "completed") delete changed.actualMinutes;
    }
    return changed as UpdateEntryBody;
  }

  async function save() {
    const body = patch();
    if (Object.keys(body).length === 0) return close();
    await onSave(body);
  }

  async function createFromTitle() {
    if (!newActivityArea) return;
    const id = crypto.randomUUID();
    await createActivity({ id, name: form.title, areaId: newActivityArea, defaultMinutes: form.plannedMinutes });
    await onSave({ activityId: id });
  }

  async function move(delta: number) {
    const to = index + delta;
    if (to < 0 || to >= siblings.length) return;
    await onSave({ orderKey: keyForMove(siblings, entry.id, to) });
  }

  function close() {
    dialog.current?.close();
    onClose();
  }

  function updateSegment(id: string, change: Partial<Segment>) {
    set(
      "segments",
      form.segments.map((s) => (s.id === id ? { ...s, ...change } : s)),
    );
  }

  const counted = entry.contributesTo.map((id) => chainOf(objectives, id)).filter((chain) => chain.length > 0);

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
          <label className="field">
            {heading ? t("group.title") : t("entry.title")}
            <input id="entry-title" value={form.title} maxLength={200} required onChange={(e) => set("title", e.target.value)} />
          </label>

          {heading ? null : (
            <>
              <label className="field">
                {t("entry.activity")}
                <select value={form.activityId ?? ""} onChange={(e) => set("activityId", e.target.value || null)}>
                  <option value="">{t("entry.noActivity")}</option>
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              {!entry.activityId && !entry.isTimeBlock ? (
                <div className="inline-create">
                  <select aria-label={t("catalog.area")} value={newActivityArea ?? ""} onChange={(e) => setNewActivityArea(e.target.value || undefined)}>
                    <option value="">{t("catalog.area")}…</option>
                    {liveAreas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="ghost-button" disabled={!newActivityArea} onClick={() => void createFromTitle()}>
                    {t("entry.createActivity", { name: form.title })}
                  </button>
                </div>
              ) : null}

              {headings.length > 0 ? (
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

              <div className="field-row">
                <label className="field">
                  {t("entry.start")}
                  <input type="time" value={form.startTime ?? ""} onChange={(e) => set("startTime", e.target.value || null)} />
                </label>
                <label className="field">
                  {t("entry.planned")}
                  {form.segments.length > 0 || form.isUnplanned ? (
                    <input value={formatMinutes(form.segments.length > 0 ? segmentsTotal : form.plannedMinutes)} disabled aria-label={t("entry.planned")} />
                  ) : (
                    <DurationInput label={t("entry.planned")} value={form.plannedMinutes} onChange={(m) => set("plannedMinutes", m)} />
                  )}
                </label>
                {form.status === "completed" ? (
                  <label className="field">
                    {t("entry.actual")}
                    <DurationInput label={t("entry.actual")} value={form.actualMinutes ?? form.plannedMinutes} onChange={(m) => set("actualMinutes", m)} />
                  </label>
                ) : null}
              </div>

              <fieldset className="stack plain-fieldset">
                <legend className="field">{t("entry.segments")}</legend>
                {form.segments.map((s) => (
                  <div key={s.id} className="segment-edit">
                    <input aria-label={t("entry.segmentTitle")} value={s.title} maxLength={120} onChange={(e) => updateSegment(s.id, { title: e.target.value })} />
                    <DurationInput label={t("entry.segmentMinutes")} value={s.minutes} onChange={(m) => updateSegment(s.id, { minutes: Math.max(1, m) })} />
                    <select aria-label={t("entry.timeValue")} value={s.timeValue} onChange={(e) => updateSegment(s.id, { timeValue: e.target.value as Segment["timeValue"] })}>
                      <option value="useful">{t("timeValue.useful")}</option>
                      <option value="support">{t("timeValue.support")}</option>
                    </select>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={t("entry.removeSegment")}
                      onClick={() =>
                        set(
                          "segments",
                          form.segments.filter((x) => x.id !== s.id),
                        )
                      }
                    >
                      <Close size={14} />
                    </button>
                  </div>
                ))}
                {form.segments.length > 0 ? <p className="muted small">{formatMinutes(segmentsTotal)}</p> : null}
                <button
                  type="button"
                  className="ghost-button"
                  disabled={form.segments.length >= 20}
                  onClick={() => set("segments", [...form.segments, { id: crypto.randomUUID(), title: t("entry.segmentTitle"), minutes: 15, timeValue: "useful" }])}
                >
                  {t("entry.addSegment")}
                </button>
              </fieldset>

              <fieldset className="stack plain-fieldset">
                <legend className="field">{t("objective.countsFor")}</legend>
                {counted.length === 0 ? <p className="muted small">{t("objective.countsForNone")}</p> : null}
                <ul className="check-list">
                  {counted.map((chain) => (
                    <li key={chain[0]?.id} className="muted small" data-testid="objective-chain">
                      {chain.map((o) => `${o.title} (${t(`horizon.${o.horizon}` as MessageKey)})`).join(" → ")}
                    </li>
                  ))}
                </ul>
                {objectives.length > 0 ? (
                  <details>
                    <summary className="link-button">{t("objective.linkByHand")}</summary>
                    <ul className="check-list check-list--scroll">
                      {objectives.map((o) => (
                        <li key={o.id}>
                          <label className="toggle">
                            <input
                              type="checkbox"
                              checked={form.objectiveIds.includes(o.id)}
                              onChange={(e) =>
                                set("objectiveIds", e.target.checked ? [...form.objectiveIds, o.id] : form.objectiveIds.filter((x) => x !== o.id))
                              }
                            />
                            {o.title} <span className="muted small">{t(`horizon.${o.horizon}` as MessageKey)}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </fieldset>

              <label className="toggle">
                <input type="checkbox" checked={form.isTimeBlock} onChange={(e) => set("isTimeBlock", e.target.checked)} />
                {t("entry.timeBlock")}
              </label>
              <label className="field">
                {t("entry.timeValue")}
                <select value={form.timeValue} onChange={(e) => set("timeValue", e.target.value as Entry["timeValue"])}>
                  <option value="useful">{t("timeValue.useful")}</option>
                  <option value="support">{t("timeValue.support")}</option>
                </select>
              </label>
              <label className="toggle">
                <input type="checkbox" checked={form.deepWork} onChange={(e) => set("deepWork", e.target.checked)} />
                {t("entry.deepWork")}
              </label>
            </>
          )}

          <label className="field">
            {t("entry.notes")}
            <textarea value={form.notes} maxLength={10_000} rows={3} onChange={(e) => set("notes", e.target.value)} />
          </label>

          <div className="button-row">
            <button type="button" className="ghost-button" disabled={index <= 0} onClick={() => void move(-1)}>
              {t("entry.moveUp")}
            </button>
            <button type="button" className="ghost-button" disabled={index >= siblings.length - 1} onClick={() => void move(1)}>
              {t("entry.moveDown")}
            </button>
          </div>

          <div className="button-row sheet__actions">
            <button type="button" className="danger-button" onClick={() => void onDelete()}>
              {heading ? t("group.delete") : t("entry.delete")}
            </button>
            <span className="spacer" />
            <button type="button" className="ghost-button" onClick={close}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="primary-button">
              {t("common.save")}
            </button>
          </div>
        </fieldset>
      </form>
    </dialog>
  );
}
