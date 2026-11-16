"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronLeft } from "@/components/icons";
import { closeCycle, getGetCycleQueryKey, useGetCycleClose } from "@/lib/api/generated/objectives/objectives";
import { addDays, isDate } from "@/lib/day/dates";
import { progressText } from "@/lib/day/objectives";
import { HORIZONS, type CycleHorizon } from "@/lib/day/types";
import { formatDate, useI18n } from "@/lib/i18n";
import { useConnectivity } from "@/lib/offline/use-connectivity";
import { cycleName } from "../CyclesScreen";

// The last day of a period that starts at `start`.
function endOf(horizon: CycleHorizon, start: string): string {
  const year = Number(start.slice(0, 4));
  switch (horizon) {
    case "week":
      return addDays(start, 6);
    case "month": {
      const month = Number(start.slice(5, 7));
      return addDays(month === 12 ? `${String(year + 1)}-01-01` : `${String(year)}-${String(month + 1).padStart(2, "0")}-01`, -1);
    }
    case "year":
      return `${String(year)}-12-31`;
    default:
      return `${String(year + ({ y5: 5, y10: 10, y15: 15, y20: 20 }[horizon] ?? 1) - 1)}-12-31`;
  }
}

// FR-038, FR-040: final progress, carry or drop each unfinished objective,
// long-horizon checkpoints at the annual close, notes.
export function CycleCloseScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { readOnly } = useConnectivity();
  const horizon: CycleHorizon = HORIZONS.find((h) => h === params.get("h")) ?? "week";
  const date = isDate(params.get("date")) ? (params.get("date") ?? "current") : "current";
  const preview = useGetCycleClose(horizon, date);
  const [decisions, setDecisions] = useState<Record<string, "carried" | "dropped">>({});
  const [checkpoints, setCheckpoints] = useState<Record<string, { relevant: boolean; onTrack: boolean; note: string }>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const data = preview.data?.data;
  if (!data) return <p>{t("common.loading")}</p>;
  const undecided = data.unfinished.some((o) => !decisions[o.id]);
  // 009 G4: the periods inside close first.
  const blocked = data.openInside.length > 0;

  async function submit() {
    if (!data) return;
    setBusy(true);
    setError(false);
    try {
      await closeCycle(horizon, data.startDate, {
        notes,
        carries: data.unfinished.map((o) => ({ objectiveId: o.id, decision: decisions[o.id] ?? "dropped" })),
        checkpoints: data.checkpoints.map((o) => ({ objectiveId: o.id, ...(checkpoints[o.id] ?? { relevant: true, onTrack: true, note: "" }) })),
      });
      await queryClient.invalidateQueries({ queryKey: getGetCycleQueryKey(horizon, data.startDate) });
      router.push(`/cycles?h=${horizon}&date=${data.startDate}`);
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <section className="panel close">
      <Link href={`/cycles?h=${horizon}&date=${data.startDate}`} className="link-button">
        <ChevronLeft size={16} /> {t(`horizon.${horizon}`)}
      </Link>
      <h1>{t("cycleClose.title", { name: cycleName(data, locale, t) })}</h1>

      {blocked ? (
        <section className="stack notice" role="status" data-testid="open-inside">
          <h2>{t("cycleClose.openInside")}</h2>
          <ul className="check-list">
            {data.openInside.map((p) => (
              <li key={`${p.horizon}:${p.startDate}`}>
                <Link
                  className="link-button"
                  href={p.horizon === "day" ? `/day/close?date=${p.startDate}` : `/cycles/close?h=${p.horizon}&date=${p.startDate}`}
                >
                  {p.horizon === "day"
                    ? formatDate(locale, p.startDate, { weekday: "short", day: "numeric", month: "short" })
                    : cycleName({ horizon: p.horizon as CycleHorizon, startDate: p.startDate, endDate: endOf(p.horizon as CycleHorizon, p.startDate) }, locale, t)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="stack">
        <h2>{t("cycleClose.final")}</h2>
        <ul className="check-list">
          {data.objectives.map((o) => (
            <li key={o.id} className="resolve-row">
              <span className="catalog-item__name">{o.title}</span>
              <span className="muted">{progressText(o)}</span>
            </li>
          ))}
        </ul>
      </section>

      {data.unfinished.length > 0 ? (
        <section className="stack">
          <h2>{t("cycleClose.unfinished")}</h2>
          <ul className="check-list">
            {data.unfinished.map((o) => (
              <li key={o.id} className="resolve-row" data-testid="unfinished">
                <span className="catalog-item__name">{o.title}</span>
                {(["carried", "dropped"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={decisions[o.id] === d}
                    className={decisions[o.id] === d ? "primary-button" : "ghost-button"}
                    onClick={() => setDecisions((all) => ({ ...all, [o.id]: d }))}
                  >
                    {d === "carried" ? t("cycleClose.carry") : t("cycleClose.drop")}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.renews.length > 0 ? (
        <section className="stack">
          <h2>{t("cycleClose.renews")}</h2>
          <p className="muted">{t("cycleClose.renewsHint")}</p>
          <ul className="check-list">
            {data.renews.map((o) => (
              <li key={o.id} className="resolve-row" data-testid="renews">
                <span className="catalog-item__name">{o.title}</span>
                <span className="muted">{progressText(o)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.checkpoints.length > 0 ? (
        <section className="stack">
          <h2>{t("cycleClose.checkpoints")}</h2>
          {data.checkpoints.map((o) => {
            const c = checkpoints[o.id] ?? { relevant: true, onTrack: true, note: "" };
            const set = (change: Partial<typeof c>) => setCheckpoints((all) => ({ ...all, [o.id]: { ...c, ...change } }));
            return (
              <div key={o.id} className="stack">
                <strong>{o.title}</strong>
                <label className="toggle">
                  <input type="checkbox" checked={c.relevant} onChange={(e) => set({ relevant: e.target.checked })} />
                  {t("cycleClose.relevant")}
                </label>
                <label className="toggle">
                  <input type="checkbox" checked={c.onTrack} onChange={(e) => set({ onTrack: e.target.checked })} />
                  {t("cycleClose.onTrack")}
                </label>
                <input aria-label={t("close.notes")} value={c.note} maxLength={1000} onChange={(e) => set({ note: e.target.value })} />
              </div>
            );
          })}
        </section>
      ) : null}

      <label className="field">
        {t("close.notes")}
        <textarea value={notes} rows={3} maxLength={10_000} onChange={(e) => setNotes(e.target.value)} />
      </label>
      {error ? (
        <p role="alert" className="notice notice--error">
          {t("cycleClose.failed")}
        </p>
      ) : null}
      <button type="button" className="primary-button" disabled={readOnly || busy || undecided || blocked} onClick={() => void submit()}>
        {busy ? t("close.closing") : t("cycleClose.submit")}
      </button>
    </section>
  );
}
