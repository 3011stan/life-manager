"use client";

import { useEffect, useRef, useState } from "react";
import { GoalPicker } from "@/components/GoalPicker";
import { useGetCatalog } from "@/lib/api/generated/catalog/catalog";
import type { CreateObjectiveBody } from "@/lib/api/generated/lifeManagerAPI.schemas";
import { addMeasurement, createObjective, deleteObjective, updateObjective, useGetGoalsTree } from "@/lib/api/generated/objectives/objectives";
import { ApiError } from "@/lib/api/mutator";
import { goalOptions, nextHorizon, skipsLevel } from "@/lib/day/chain";
import { addDays, todayIn, deviceTimeZone } from "@/lib/day/dates";
import { chainOf } from "@/lib/day/groups";
import { progressText } from "@/lib/day/objectives";
import { type CycleHorizon, type Objective } from "@/lib/day/types";
import { useT } from "@/lib/i18n";
import { closeOnBackdrop } from "@/components/dialog";

type TargetType = Objective["targetType"];
const BASIC: TargetType[] = ["count", "duration"];
const MORE: TargetType[] = ["value", "level", "milestone", "composite"];
const TIERS = ["essential", "secondary", "parked"] as const;

interface Props {
  horizon: CycleHorizon;
  startDate: string;
  objective: Objective | undefined;
  // 005 D6: "+ Meta" under a goal starts the new one linked, with its activities.
  preset?: { parentIds?: string[]; activityIds?: string[]; title?: string };
  disabled: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}

type Rhythm = "week" | "month" | "";

// 005 D7: the rhythm that reaches the target, rounded up.
export function suggestRhythm(horizon: CycleHorizon, period: "week" | "month", target: number): number {
  const parts = horizon === "year" ? (period === "week" ? 52 : 12) : 4;
  return Math.max(1, Math.ceil(target / parts));
}

// FR-004a: count and duration first; the other four behind "More types".
export function ObjectiveSheet({ horizon, startDate, objective, preset, disabled, onClose, onChanged }: Props) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const catalog = useGetCatalog();
  const [form, setForm] = useState({
    title: objective?.title ?? preset?.title ?? "",
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
    activityIds: objective?.activityIds ?? preset?.activityIds ?? [],
    parentIds: objective?.parentIds ?? preset?.parentIds ?? [],
    rhythmPeriod: (objective?.rhythmPeriod ?? "") as Rhythm,
    rhythmCount: objective?.rhythmCount ?? 1,
    rhythmHours: (objective?.rhythmMinutes ?? 60) / 60,
  });
  const [showMore, setShowMore] = useState(MORE.includes(form.targetType));
  const [measure, setMeasure] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  // 007 E1: goals above come only from the horizon right above, in the period
  // that contains this one; a week counts in the month holding most of its
  // days (research R2). A link kept from before shows, marked.
  const anchor = horizon === "week" ? addDays(startDate, 3) : startDate;
  const above = nextHorizon(horizon);
  const tree = useGetGoalsTree({ date: anchor });
  const goals = tree.data?.data.objectives ?? [];
  const parents = above ? goalOptions(goals.filter((o) => o.status === "active"), above) : [];
  const chosenParents = form.parentIds.flatMap((id) => {
    const o = goals.find((x) => x.id === id);
    const path = chainOf(goals, id)
      .slice(1)
      .map((x) => x.title)
      .join(" › ");
    return o ? [{ id, title: o.title, horizon: o.horizon, path, skips: skipsLevel({ horizon }, o) }] : [];
  });

  const rhythmAllowed = (horizon === "year" || horizon === "month") && (form.targetType === "count" || form.targetType === "duration");
  const periods: ("week" | "month")[] = horizon === "year" ? ["week", "month"] : ["week"];

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
      parentIds: form.parentIds,
      rhythmPeriod: rhythmAllowed && form.rhythmPeriod ? form.rhythmPeriod : null,
      rhythmCount: rhythmAllowed && form.rhythmPeriod && form.targetType === "count" ? form.rhythmCount : null,
      rhythmMinutes: rhythmAllowed && form.rhythmPeriod && form.targetType === "duration" ? Math.round(form.rhythmHours * 60) : null,
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
      return createObjective(horizon, startDate, { id: crypto.randomUUID(), targetType: form.targetType, ...fields() });
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
    <dialog onClick={closeOnBackdrop} ref={dialog} className="dialog sheet" aria-labelledby="objective-title" onClose={onClose}>
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

          {rhythmAllowed ? (
            <div className="field-row">
              <label className="field">
                {t("objective.rhythm")}
                <select
                  value={form.rhythmPeriod}
                  onChange={(e) => {
                    const period = e.target.value as Rhythm;
                    setForm((f) => ({
                      ...f,
                      rhythmPeriod: period,
                      rhythmCount: period ? suggestRhythm(horizon, period, f.targetCount) : f.rhythmCount,
                      rhythmHours: period ? suggestRhythm(horizon, period, f.targetHours * 4) / 4 : f.rhythmHours,
                    }));
                  }}
                >
                  <option value="">{t("objective.rhythmNone")}</option>
                  {periods.map((p) => (
                    <option key={p} value={p}>
                      {t(`objective.rhythmPer.${p}`)}
                    </option>
                  ))}
                </select>
              </label>
              {form.rhythmPeriod && form.targetType === "count" ? (
                <label className="field">
                  {t("objective.targetCount")}
                  <input type="number" min={1} value={form.rhythmCount} onChange={(e) => set("rhythmCount", Number(e.target.value))} />
                </label>
              ) : null}
              {form.rhythmPeriod && form.targetType === "duration" ? (
                <label className="field">
                  {t("objective.targetHours")}
                  <input type="number" min={0.25} step={0.25} value={form.rhythmHours} onChange={(e) => set("rhythmHours", Number(e.target.value))} />
                </label>
              ) : null}
            </div>
          ) : null}

          {above && (parents.length > 0 || chosenParents.length > 0) ? (
            <div className="card">
              <GoalPicker
                label={t("goalPicker.parentOf", { horizon: t(`horizon.${above as CycleHorizon}`) })}
                options={parents}
                value={form.parentIds}
                chosen={chosenParents}
                disabled={disabled}
                onChange={(ids) => set("parentIds", ids)}
              />
            </div>
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
