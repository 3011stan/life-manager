"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useGetCatalog } from "@/lib/api/generated/catalog/catalog";
import type { CreateObjectiveBody } from "@/lib/api/generated/lifeManagerAPI.schemas";
import { addMeasurement, createObjective, deleteObjective, getCycle, getGetCycleQueryKey, updateObjective } from "@/lib/api/generated/objectives/objectives";
import { ApiError } from "@/lib/api/mutator";
import { addDays, todayIn, deviceTimeZone } from "@/lib/day/dates";
import { progressText } from "@/lib/day/objectives";
import { HORIZONS, type CycleView, type Objective } from "@/lib/day/types";
import { useT } from "@/lib/i18n";

type TargetType = Objective["targetType"];
const BASIC: TargetType[] = ["count", "duration"];
const MORE: TargetType[] = ["value", "level", "milestone", "composite"];
const TIERS = ["essential", "secondary", "parked"] as const;

interface Props {
  view: CycleView;
  objective: Objective | undefined;
  disabled: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}

// FR-004a: count and duration first; the other four behind "More types".
export function ObjectiveSheet({ view, objective, disabled, onClose, onChanged }: Props) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const catalog = useGetCatalog();
  const horizon = view.horizon as (typeof HORIZONS)[number];
  const [form, setForm] = useState({
    title: objective?.title ?? "",
    tier: objective?.tier ?? ("essential" as const),
    targetType: objective?.targetType ?? ("count" as TargetType),
    targetCount: objective?.targetCount ?? 3,
    targetHours: (objective?.targetMinutes ?? 120) / 60,
    unit: objective?.unit ?? "",
    startValue: objective?.startValue ?? 0,
    targetValue: objective?.targetValue ?? 0,
    isCumulative: objective?.isCumulative ?? false,
    levels: (objective?.levelScale ?? []).join(", "),
    targetLevel: objective?.targetLevel ?? "",
    activityIds: objective?.activityIds ?? [],
    parentObjectiveId: objective?.parentObjectiveId ?? "",
  });
  const [showMore, setShowMore] = useState(MORE.includes(form.targetType));
  const [measure, setMeasure] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  // Parents come from the higher cycles that contain this one; a week counts
  // in the month holding most of its days (research R2).
  const anchor = horizon === "week" ? addDays(view.startDate, 3) : view.startDate;
  const higher = HORIZONS.slice(HORIZONS.indexOf(horizon) + 1);
  const parents = useQueries({
    queries: higher.map((h) => ({ queryKey: getGetCycleQueryKey(h, anchor), queryFn: () => getCycle(h, anchor) })),
  })
    .flatMap((q) => q.data?.data.objectives ?? [])
    .filter((o) => o.status === "active");

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const scale = form.levels
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // The target type is fixed once created; updates send the rest.
  function fields(): Omit<CreateObjectiveBody, "id" | "targetType"> {
    return {
      title: form.title.trim(),
      tier: form.tier,
      targetCount: form.targetType === "count" ? form.targetCount : null,
      targetMinutes: form.targetType === "duration" ? Math.round(form.targetHours * 60) : null,
      unit: form.targetType === "value" ? form.unit.trim() || null : null,
      startValue: form.targetType === "value" ? form.startValue : null,
      targetValue: form.targetType === "value" ? form.targetValue : null,
      isCumulative: form.targetType === "value" && form.isCumulative,
      levelScale: form.targetType === "level" ? scale : [],
      targetLevel: form.targetType === "level" ? form.targetLevel || null : null,
      activityIds: form.activityIds,
      parentObjectiveId: form.parentObjectiveId || null,
    };
  }

  async function run(action: () => Promise<unknown>, close = true) {
    setError(undefined);
    try {
      await action();
      await onChanged();
      if (close) {
        dialog.current?.close();
        onClose();
      }
    } catch (e) {
      setError(e instanceof ApiError ? (e.problem?.errors?.[0]?.message ?? e.message) : t("common.saveFailed"));
    }
  }

  const save = () =>
    run(() => {
      if (objective) return updateObjective(objective.id, fields());
      return createObjective(horizon, view.startDate, { id: crypto.randomUUID(), targetType: form.targetType, ...fields() });
    });

  const record = () =>
    objective &&
    run(
      () =>
        addMeasurement(objective.id, {
          id: crypto.randomUUID(),
          recordedOn: todayIn(deviceTimeZone()),
          ...(objective.targetType === "value" ? { value: Number(measure) } : { level: measure }),
        }),
      false,
    ).then(() => setMeasure(""));

  const activities = (catalog.data?.data.activities ?? []).filter((a) => !a.archivedAt || form.activityIds.includes(a.id));
  const types = showMore ? [...BASIC, ...MORE] : BASIC;

  return (
    <dialog ref={dialog} className="dialog sheet" aria-labelledby="objective-title" onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <fieldset className="stack plain-fieldset" disabled={disabled}>
          <label className="field">
            {t("objective.title")}
            <input id="objective-title" value={form.title} required maxLength={200} onChange={(e) => set("title", e.target.value)} />
          </label>
          {objective ? <p className="muted">{progressText(objective)}</p> : null}

          {objective && (objective.targetType === "value" || objective.targetType === "level") ? (
            <div className="add-entry__row">
              {objective.targetType === "level" ? (
                <select aria-label={t("objective.measurement")} value={measure} onChange={(e) => setMeasure(e.target.value)}>
                  <option value="">{t("objective.measurement")}</option>
                  {objective.levelScale.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              ) : (
                <input aria-label={t("objective.measurement")} type="number" step="0.01" value={measure} onChange={(e) => setMeasure(e.target.value)} />
              )}
              <button type="button" className="ghost-button" disabled={measure === ""} onClick={() => void record()}>
                {t("objective.record")}
              </button>
            </div>
          ) : null}
          {objective?.targetType === "milestone" ? (
            <button type="button" className="ghost-button" onClick={() => void run(() => updateObjective(objective.id, { markDone: objective.progress < 1 }), false)}>
              {objective.progress < 1 ? t("objective.markDone") : t("objective.markOpen")}
            </button>
          ) : null}

          <label className="field">
            {t("objective.tier")}
            <select value={form.tier} onChange={(e) => set("tier", e.target.value as (typeof TIERS)[number])}>
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {t(`tier.${tier}`)}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="stack plain-fieldset" disabled={objective !== undefined}>
            <legend className="field">{t("objective.type")}</legend>
            <div className="tabs">
              {types.map((type) => (
                <button key={type} type="button" aria-pressed={form.targetType === type} className={form.targetType === type ? "tab tab--active" : "tab"} onClick={() => set("targetType", type)}>
                  {t(`target.${type}`)}
                </button>
              ))}
              {!showMore ? (
                <button type="button" className="link-button" onClick={() => setShowMore(true)}>
                  {t("objective.moreTypes")}
                </button>
              ) : null}
            </div>
          </fieldset>

          {form.targetType === "count" ? (
            <label className="field">
              {t("objective.targetCount")}
              <input type="number" min={1} value={form.targetCount} onChange={(e) => set("targetCount", Number(e.target.value))} />
            </label>
          ) : null}
          {form.targetType === "duration" ? (
            <label className="field">
              {t("objective.targetHours")}
              <input type="number" min={0.25} step={0.25} value={form.targetHours} onChange={(e) => set("targetHours", Number(e.target.value))} />
            </label>
          ) : null}
          {form.targetType === "value" ? (
            <div className="field-row">
              <label className="field">
                {t("objective.unit")}
                <input value={form.unit} maxLength={20} required onChange={(e) => set("unit", e.target.value)} />
              </label>
              <label className="field">
                {t("objective.startValue")}
                <input type="number" step="0.01" value={form.startValue} onChange={(e) => set("startValue", Number(e.target.value))} />
              </label>
              <label className="field">
                {t("objective.targetValue")}
                <input type="number" step="0.01" value={form.targetValue} onChange={(e) => set("targetValue", Number(e.target.value))} />
              </label>
              <label className="toggle">
                <input type="checkbox" checked={form.isCumulative} onChange={(e) => set("isCumulative", e.target.checked)} />
                {t("objective.cumulative")}
              </label>
            </div>
          ) : null}
          {form.targetType === "level" ? (
            <>
              <label className="field">
                {t("objective.levels")}
                <input value={form.levels} placeholder="A2, B1, B2, C1" onChange={(e) => set("levels", e.target.value)} />
              </label>
              <label className="field">
                {t("objective.targetLevel")}
                <select value={form.targetLevel} onChange={(e) => set("targetLevel", e.target.value)}>
                  <option value="">—</option>
                  {scale.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {form.targetType === "count" || form.targetType === "duration" ? (
            <fieldset className="stack plain-fieldset">
              <legend className="field">{t("objective.activities")}</legend>
              <ul className="check-list check-list--scroll">
                {activities.map((a) => (
                  <li key={a.id}>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={form.activityIds.includes(a.id)}
                        onChange={(e) => set("activityIds", e.target.checked ? [...form.activityIds, a.id] : form.activityIds.filter((x) => x !== a.id))}
                      />
                      {a.name}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : null}

          {higher.length > 0 ? (
            <label className="field">
              {t("objective.parent")}
              <select value={form.parentObjectiveId} onChange={(e) => set("parentObjectiveId", e.target.value)}>
                <option value="">{t("objective.noParent")}</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {t(`horizon.${p.horizon as (typeof HORIZONS)[number]}`)} · {p.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {error ? (
            <p role="alert" className="notice notice--error">
              {error}
            </p>
          ) : null}
          <div className="button-row sheet__actions">
            {objective ? (
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  if (window.confirm(t("objective.deleteConfirm", { title: objective.title }))) void run(() => deleteObjective(objective.id));
                }}
              >
                {t("objective.delete")}
              </button>
            ) : null}
            <span className="spacer" />
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                dialog.current?.close();
                onClose();
              }}
            >
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
