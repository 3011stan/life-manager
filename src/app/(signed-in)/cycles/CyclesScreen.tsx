"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { applyEvents } from "@/lib/api/generated/agenda/agenda";
import { applyRhythms, getGetCycleQueryKey, useGetCycle } from "@/lib/api/generated/objectives/objectives";
import { applyTemplates, getGetTemplateProposalsQueryKey, useGetTemplateProposals } from "@/lib/api/generated/templates/templates";
import { addDays, isDate } from "@/lib/day/dates";
import { percent, progressText } from "@/lib/day/objectives";
import { HORIZONS, type CycleHorizon, type CycleView, type Objective } from "@/lib/day/types";
import { formatDate, useI18n, useT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { useConnectivity } from "@/lib/offline/use-connectivity";
import { ObjectiveSheet } from "./ObjectiveSheet";

const TIERS = ["essential", "secondary", "parked"] as const;

export function cycleName(view: Pick<CycleView, "horizon" | "startDate" | "endDate">, locale: "pt-BR" | "en", t: (k: MessageKey) => string): string {
  switch (view.horizon) {
    case "week":
      return `${formatDate(locale, view.startDate, { day: "numeric", month: "short" })} – ${formatDate(locale, view.endDate, { day: "numeric", month: "short" })}`;
    case "month":
      return formatDate(locale, view.startDate, { month: "long", year: "numeric" });
    case "year":
      return view.startDate.slice(0, 4);
    default:
      return `${t(`horizon.${view.horizon}` as MessageKey)} · ${view.startDate.slice(0, 4)}–${view.endDate.slice(0, 4)}`;
  }
}

// US6, US7: objectives of one cycle, grouped by tier, with progress and pace.
export function CyclesScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { readOnly } = useConnectivity();
  const horizon: CycleHorizon = HORIZONS.find((h) => h === params.get("h")) ?? "week";
  const date = isDate(params.get("date")) ? (params.get("date") ?? "current") : "current";
  const cycle = useGetCycle(horizon, date, { query: { refetchInterval: 15_000 } });
  const [editing, setEditing] = useState<Objective | "new">();

  const view = cycle.data?.data;
  const go = (h: CycleHorizon, d: string) => router.push(`/cycles?h=${h}&date=${d}`);
  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetCycleQueryKey(horizon, date) });

  // 005 D7: opening a week or a month creates its rhythm goals once.
  const applied = useRef<string>(undefined);
  useEffect(() => {
    if (!view || readOnly || (horizon !== "week" && horizon !== "month")) return;
    const key = `${horizon}:${view.startDate}`;
    if (applied.current === key) return;
    applied.current = key;
    // Refresh either way: another device may have created them meanwhile. A
    // week then gets its agenda items' tasks and goals (006 FR-004).
    void applyRhythms(horizon, view.startDate, {})
      .then(() => (horizon === "week" ? applyEvents(view.startDate, {}) : undefined))
      .then(refresh, () => undefined);
  });

  return (
    <section className="day">
      <nav className="tabs" aria-label={t("cycles.title")}>
        {HORIZONS.map((h) => (
          <button key={h} type="button" aria-pressed={h === horizon} className={h === horizon ? "tab tab--active" : "tab"} onClick={() => go(h, view?.startDate ?? "current")}>
            {t(`horizon.${h}`)}
          </button>
        ))}
      </nav>
      {view ? (
        <>
          <header className="day-header">
            <button type="button" className="icon-button" aria-label={t("cycles.previous")} onClick={() => go(horizon, addDays(view.startDate, -1))}>
              <ChevronLeft />
            </button>
            <div className="day-header__title">
              <h1>{cycleName(view, locale, t)}</h1>
              {!(view.today >= view.startDate && view.today <= view.endDate) ? (
                <button type="button" className="link-button" onClick={() => go(horizon, "current")}>
                  {t("cycles.current")}
                </button>
              ) : null}
            </div>
            <button type="button" className="icon-button" aria-label={t("cycles.next")} onClick={() => go(horizon, addDays(view.endDate, 1))}>
              <ChevronRight />
            </button>
          </header>
          {view.cycle.closedAt ? <p className="notice notice--ok">{t("cycles.closed")}</p> : null}
          {view.closeRequired ? (
            <p className="notice" role="status">
              {t("cycles.closeFirst", { horizon: t(`horizon.${horizon}`).toLowerCase() })}{" "}
              <Link className="link-button" href={`/cycles/close?h=${horizon}&date=${view.closeRequired.startDate}`}>
                {t("cycles.closePrevious")}
              </Link>
            </p>
          ) : null}

          {horizon === "week" && !view.closeRequired ? <Proposals date={view.startDate} disabled={readOnly} onApplied={refresh} /> : null}

          {view.objectives.length === 0 ? <p className="muted">{t("cycles.empty")}</p> : null}
          {TIERS.map((tier) => {
            const items = view.objectives.filter((o) => o.tier === tier);
            if (items.length === 0) return null;
            return (
              <section key={tier} className="stack">
                <h2>{t(`tier.${tier}`)}</h2>
                <ul className="timeline">
                  {items.map((o) => (
                    <li key={o.id} className={`objective-row objective-row--${o.status}`} data-testid="objective-row">
                      <button type="button" className="entry-row__main" onClick={() => setEditing(o)}>
                        <span className="entry-row__title">{o.title}</span>
                        <span className="entry-row__time">{progressText(o)}</span>
                        {o.status !== "active" ? <span className="mark">{t(`status.${o.status}`)}</span> : null}
                      </button>
                      <div className="pace" aria-label={t("cycles.pace", { elapsed: percent(o.pace) })}>
                        <span className="pace__progress" style={{ width: percent(Math.min(o.progress, 1)) }} />
                        <span className="pace__marker" style={{ left: percent(o.pace) }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <div className="day-tools">
            <button type="button" className="primary-button" disabled={readOnly || view.closeRequired !== null} onClick={() => setEditing("new")}>
              {t("cycles.add")}
            </button>
            {!view.cycle.closedAt && view.objectives.length > 0 ? (
              <Link className="ghost-button button-link" href={`/cycles/close?h=${horizon}&date=${view.startDate}`}>
                {t("cycleClose.submit")}
              </Link>
            ) : null}
            {horizon === "week" ? (
              <Link className="ghost-button button-link" href="/templates">
                {t("cycles.templates")}
              </Link>
            ) : null}
          </div>

          {editing ? (
            <ObjectiveSheet
              key={editing === "new" ? "new" : editing.id}
              horizon={horizon}
              startDate={view.startDate}
              objective={editing === "new" ? undefined : editing}
              disabled={readOnly}
              onClose={() => setEditing(undefined)}
              onChanged={async () => {
                await refresh();
              }}
            />
          ) : null}
        </>
      ) : (
        <p>{cycle.isError ? t("common.connectOnce") : t("common.loading")}</p>
      )}
    </section>
  );
}

function Proposals({ date, disabled, onApplied }: { date: string; disabled: boolean; onApplied: () => Promise<unknown> }) {
  const t = useT();
  const queryClient = useQueryClient();
  const proposals = useGetTemplateProposals(date);
  const items = proposals.data?.data.templates ?? [];
  if (items.length === 0) return null;

  async function decide(templateId: string, accept: boolean) {
    await applyTemplates(date, accept ? { accept: [{ templateId, objectiveId: crypto.randomUUID() }], skip: [] } : { accept: [], skip: [templateId] });
    await queryClient.invalidateQueries({ queryKey: getGetTemplateProposalsQueryKey(date) });
    await onApplied();
  }

  return (
    <section className="stack panel" aria-label={t("cycles.proposals")}>
      <h2>{t("cycles.proposals")}</h2>
      <ul className="check-list">
        {items.map((tpl) => (
          <li key={tpl.id} className="resolve-row" data-testid="proposal">
            <span className="catalog-item__name">{tpl.title}</span>
            <button type="button" className="primary-button" disabled={disabled} onClick={() => void decide(tpl.id, true)}>
              {t("cycles.accept")}
            </button>
            <button type="button" className="ghost-button" disabled={disabled} onClick={() => void decide(tpl.id, false)}>
              {t("cycles.skip")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
