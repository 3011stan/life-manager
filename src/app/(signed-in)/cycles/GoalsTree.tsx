"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LinkIcon, Plus } from "@/components/icons";
import { applyEvents } from "@/lib/api/generated/agenda/agenda";
import { applyRhythms, getGetGoalsTreeQueryKey, useGetGoalsTree } from "@/lib/api/generated/objectives/objectives";
import type { GetGoalsTree200 } from "@/lib/api/generated/lifeManagerAPI.schemas";
import { isDate } from "@/lib/day/dates";
import { percent, progressText } from "@/lib/day/objectives";
import { HORIZONS, type CycleHorizon, type Objective } from "@/lib/day/types";
import { useT } from "@/lib/i18n";
import { useConnectivity } from "@/lib/offline/use-connectivity";
import { AgendaSection } from "./AgendaSection";
import { ObjectiveSheet } from "./ObjectiveSheet";

type Goal = GetGoalsTree200["objectives"][number];
type Editing = { goal: Goal } | { horizon: CycleHorizon; startDate: string; parent?: Goal; title?: string };

const RANK: Record<string, number> = { week: 0, month: 1, year: 2, y5: 3, y10: 4, y15: 5, y20: 6 };

// The horizon right below; a 5-year goal is planned through the year.
function below(horizon: string): CycleHorizon | null {
  const i = HORIZONS.indexOf(horizon as CycleHorizon);
  return i > 0 ? (HORIZONS[i - 1] ?? null) : null;
}

// 005 D6: one tree from the longest horizon down to this week. A goal that
// counts for several goals above shows under each, with a link mark.
export function GoalsTree() {
  const t = useT();
  const queryClient = useQueryClient();
  const { readOnly } = useConnectivity();
  const params = useSearchParams();
  const date = isDate(params.get("date")) ? (params.get("date") ?? "current") : "current";
  const tree = useGetGoalsTree({ date }, { query: { refetchInterval: 30_000 } });
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Editing>();
  const [title, setTitle] = useState("");
  const [horizon, setHorizon] = useState<CycleHorizon>("y5");
  const applied = useRef<string>(undefined);

  const data = tree.data?.data;
  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetGoalsTreeQueryKey({ date }) });

  // 005 D7: rhythms create this week's and this month's goals once; then the
  // week's agenda items get their tasks and goals (006 FR-004).
  useEffect(() => {
    if (!data || readOnly || applied.current === data.date) return;
    applied.current = data.date;
    void Promise.allSettled([applyRhythms("month", data.date, {}), applyRhythms("week", data.date, {})])
      .then(() => applyEvents(data.date, {}))
      .catch(() => undefined)
      .then(refresh);
  });

  if (!data) return <p>{tree.isError ? t("common.connectOnce") : t("common.loading")}</p>;

  const goals = data.objectives.filter((o) => o.status !== "dropped");
  const ids = new Set(goals.map((o) => o.id));
  const childrenOf = (id: string) => goals.filter((o) => o.parentIds.includes(id)).sort((a, b) => RANK[b.horizon]! - RANK[a.horizon]! || (a.orderKey < b.orderKey ? -1 : 1));
  const tops = goals
    .filter((o) => !o.parentIds.some((p) => ids.has(p)))
    .sort((a, b) => RANK[b.horizon]! - RANK[a.horizon]! || (a.orderKey < b.orderKey ? -1 : 1));
  const startOf = (h: CycleHorizon) => data.cycles.find((c) => c.horizon === h)?.startDate ?? data.date;
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // A goal and every goal above it, so the card holding a new goal opens.
  function ancestors(id: string): string[] {
    const seen: string[] = [];
    const queue = [id];
    while (queue.length > 0) {
      const next = queue.shift();
      const goal = goals.find((o) => o.id === next);
      if (!goal || seen.includes(goal.id)) continue;
      seen.push(goal.id);
      queue.push(...goal.parentIds);
    }
    return seen;
  }

  function addUnder(parent: Goal) {
    const h = below(parent.horizon);
    if (h) setEditing({ horizon: h, startDate: startOf(h), parent });
  }

  function Node({ goal, depth }: { goal: Goal; depth: number }) {
    const kids = depth < 6 ? childrenOf(goal.id) : [];
    return (
      <li className="goal-node" data-testid="goal-node">
        <button type="button" className="goal-node__main" onClick={() => setEditing({ goal })}>
          <span className="goal-node__title">
            {goal.title}
            {goal.parentIds.length > 1 ? <LinkIcon size={13} aria-label={t("goals.shared")} /> : null}
          </span>
          <span className="goal-node__value">{progressText(goal as unknown as Objective)}</span>
        </button>
        <span className="bar" aria-hidden="true">
          <span style={{ width: percent(Math.min(goal.progress, 1)) }} />
        </span>
        {kids.length > 0 || below(goal.horizon) ? (
          <ol className="goal-tree">
            {kids.map((k) => (
              <Node key={k.id} goal={k} depth={depth + 1} />
            ))}
            {below(goal.horizon) && depth < 2 ? (
              <li>
                <button type="button" className="add-under" disabled={readOnly} onClick={() => addUnder(goal)}>
                  <Plus size={14} />
                  {t("goals.add")}
                </button>
              </li>
            ) : null}
          </ol>
        ) : null}
      </li>
    );
  }

  return (
    <section className="day goals">
      <h1>{t("goals.title")}</h1>
      {tops.length === 0 ? <p className="muted">{t("goals.empty")}</p> : null}
      <ul className="goal-cards">
        {tops.map((goal) => {
          const expanded = open.has(goal.id);
          return (
            <li key={goal.id} className="goal-card" data-testid="goal-card">
              <div className="goal-card__head">
                <button type="button" className="goal-card__title" onClick={() => setEditing({ goal })}>
                  <span className="eyebrow">{t(`horizon.${goal.horizon as CycleHorizon}`)}</span>
                  <span className="goal-card__name">{goal.title}</span>
                </button>
                <span className="ring ring--small" style={{ "--value": percent(Math.min(goal.progress, 1)) } as React.CSSProperties} aria-hidden="true" />
                <button type="button" className="icon-button" aria-expanded={expanded} aria-label={t("goals.toggle", { title: goal.title })} onClick={() => toggle(goal.id)}>
                  <ChevronDown />
                </button>
              </div>
              {expanded ? (
                <ol className="goal-tree goal-tree--root">
                  {childrenOf(goal.id).map((k) => (
                    <Node key={k.id} goal={k} depth={1} />
                  ))}
                  {below(goal.horizon) ? (
                    <li>
                      <button type="button" className="add-under" disabled={readOnly} onClick={() => addUnder(goal)}>
                        <Plus size={14} />
                        {t("goals.add")}
                      </button>
                    </li>
                  ) : null}
                </ol>
              ) : null}
            </li>
          );
        })}
      </ul>

      <form
        className="add-entry__row"
        onSubmit={(e) => {
          e.preventDefault();
          setEditing({ horizon, startDate: startOf(horizon), title: title.trim() });
          setTitle("");
        }}
      >
        <input aria-label={t("goals.new")} placeholder={t("goals.new")} value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
        <select aria-label={t("goals.horizon")} className="bare-select" value={horizon} onChange={(e) => setHorizon(e.target.value as CycleHorizon)}>
          {[...HORIZONS].reverse().map((h) => (
            <option key={h} value={h}>
              {t(`horizon.${h}`)}
            </option>
          ))}
        </select>
        <button type="submit" className="primary-button" aria-label={t("goals.create")} disabled={readOnly || !title.trim()}>
          <Plus size={16} />
        </button>
      </form>

      <AgendaSection readOnly={readOnly} />

      <nav className="period-links" aria-label={t("goals.periods")}>
        <span className="muted small">{t("goals.periods")}</span>
        {HORIZONS.map((h) => (
          <Link key={h} href={`/cycles?h=${h}&date=current`} className="chip">
            {t(`horizon.${h}`)}
          </Link>
        ))}
      </nav>

      {editing ? (
        <ObjectiveSheet
          key={"goal" in editing ? editing.goal.id : `${editing.horizon}-${editing.parent?.id ?? "top"}`}
          horizon={"goal" in editing ? (editing.goal.horizon as CycleHorizon) : editing.horizon}
          startDate={"goal" in editing ? editing.goal.startDate : editing.startDate}
          objective={"goal" in editing ? (editing.goal as unknown as Objective) : undefined}
          preset={"goal" in editing ? undefined : { parentIds: editing.parent ? [editing.parent.id] : [], activityIds: editing.parent?.activityIds ?? [], title: editing.title }}
          disabled={readOnly}
          onClose={() => setEditing(undefined)}
          onChanged={async () => {
            const parent = "goal" in editing ? undefined : editing.parent;
            if (parent) setOpen((s) => new Set([...s, ...ancestors(parent.id)]));
            await refresh();
          }}
        />
      ) : null}
    </section>
  );
}
