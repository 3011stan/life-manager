"use client";

import { useEffect, useRef, useState } from "react";
import { Close } from "@/components/icons";
import type { Activity, Catalog, Segment } from "@/lib/day/types";
import { useT } from "@/lib/i18n";
import { closeOnBackdrop } from "@/components/dialog";
import { DurationInput } from "@/components/DurationInput";
import { formatMinutes } from "@/lib/day/dates";

export interface ActivityBody {
  name: string;
  areaId: string;
  defaultMinutes: number;
  defaultDeepWork: boolean;
  defaultIsTimeBlock: boolean;
  defaultTimeValue: "useful" | "support";
  defaultSegments: Segment[];
  type: ActivityType | null;
}

type ActivityType = "habit" | "project" | "experience" | "maintenance";
const TYPES: ActivityType[] = ["habit", "project", "experience", "maintenance"];

interface Props {
  activity: Activity | undefined;
  areaId: string;
  areas: Catalog["areas"];
  pillars?: Catalog["pillars"];
  onClose: () => void;
  onSave: (body: ActivityBody) => Promise<void>;
  onArchive?: (() => Promise<void>) | undefined;
  onDelete?: (() => Promise<void>) | undefined;
}

// 005 D3: an activity says how its time counts: parts that count or support,
// or a routine that takes time and doesn't count. Entries follow it.
export function ActivitySheet({ activity, areaId, areas, pillars, onClose, onSave, onArchive, onDelete }: Props) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<ActivityBody>({
    name: activity?.name ?? "",
    areaId: activity?.areaId ?? areaId,
    defaultMinutes: activity?.defaultMinutes ?? 30,
    defaultDeepWork: activity?.defaultDeepWork ?? false,
    defaultIsTimeBlock: activity?.defaultIsTimeBlock ?? false,
    defaultTimeValue: activity?.defaultTimeValue ?? "useful",
    defaultSegments: activity?.defaultSegments ?? [],
    type: activity?.type ?? null,
  });

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const set = <K extends keyof ActivityBody>(key: K, value: ActivityBody[K]) => setForm((f) => ({ ...f, [key]: value }));
  const segmentTotal = form.defaultSegments.reduce((n, s) => n + s.minutes, 0);

  return (
    <dialog onClick={closeOnBackdrop} ref={dialog} className="dialog sheet" aria-labelledby="activity-name" onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          void onSave({
            ...form,
            defaultTimeValue: form.defaultIsTimeBlock ? "support" : "useful",
            defaultMinutes: form.defaultSegments.length > 0 ? segmentTotal : form.defaultMinutes,
          });
        }}
      >
        <label className="field">
          {t("catalog.activityName")}
          <input id="activity-name" value={form.name} required maxLength={80} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="field">
          {t("catalog.area")}
          <select value={form.areaId} onChange={(e) => set("areaId", e.target.value)}>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {[pillars?.find((p) => p.id === a.pillarId)?.name, a.name].filter(Boolean).join(" · ")}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          {t("catalog.defaultMinutes")}
          {form.defaultSegments.length > 0 ? (
            <input aria-label={t("catalog.defaultMinutes")} value={formatMinutes(segmentTotal)} disabled />
          ) : (
            <DurationInput label={t("catalog.defaultMinutes")} value={form.defaultMinutes} onChange={(m) => set("defaultMinutes", m)} />
          )}
        </label>
        <fieldset className="stack plain-fieldset">
          <legend className="field">{t("entry.segments")}</legend>
          {form.defaultSegments.map((s) => (
            <div key={s.id} className="segment-edit">
              <input
                aria-label={t("entry.segmentTitle")}
                value={s.title}
                maxLength={120}
                onChange={(e) => set("defaultSegments", form.defaultSegments.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))}
              />
              <DurationInput
                label={t("entry.segmentMinutes")}
                value={s.minutes}
                onChange={(m) => set("defaultSegments", form.defaultSegments.map((x) => (x.id === s.id ? { ...x, minutes: Math.max(1, m) } : x)))}
              />
              <select
                aria-label={t("entry.timeValue")}
                value={s.timeValue}
                onChange={(e) =>
                  set("defaultSegments", form.defaultSegments.map((x) => (x.id === s.id ? { ...x, timeValue: e.target.value as Segment["timeValue"] } : x)))
                }
              >
                <option value="useful">{t("part.counts")}</option>
                <option value="support">{t("part.support")}</option>
              </select>
              <button type="button" className="icon-button" aria-label={t("entry.removeSegment")} onClick={() => set("defaultSegments", form.defaultSegments.filter((x) => x.id !== s.id))}>
                <Close size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="ghost-button"
            onClick={() => set("defaultSegments", [...form.defaultSegments, { id: crypto.randomUUID(), title: t("entry.segmentTitle"), minutes: 15, timeValue: "useful" }])}
          >
            {t("entry.addSegment")}
          </button>
        </fieldset>
        <label className="toggle">
          <input type="checkbox" checked={form.defaultIsTimeBlock} onChange={(e) => set("defaultIsTimeBlock", e.target.checked)} />
          <span>
            {t("activity.routine")}
            <span className="muted small"> · {t("activity.routineHint")}</span>
          </span>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={form.defaultDeepWork} onChange={(e) => set("defaultDeepWork", e.target.checked)} />
          {t("entry.deepWork")}
        </label>
        <label className="field">
          {t("activity.type")}
          <select value={form.type ?? ""} onChange={(e) => set("type", (e.target.value || null) as ActivityType | null)}>
            <option value="">{t("activity.typeNone")}</option>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`activity.type.${type}`)}
              </option>
            ))}
          </select>
        </label>
        <div className="button-row">
          {onArchive ? (
            <button type="button" className="ghost-button" onClick={() => void onArchive()}>
              {activity?.archivedAt ? t("common.restore") : t("common.archive")}
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" className="ghost-button" onClick={() => void onDelete()}>
              {t("common.delete")}
            </button>
          ) : null}
          <span className="spacer" />
          <button type="button" className="ghost-button" onClick={() => dialog.current?.close()}>
            {t("common.cancel")}
          </button>
          <button type="submit" className="primary-button">
            {t("common.save")}
          </button>
        </div>
      </form>
    </dialog>
  );
}
