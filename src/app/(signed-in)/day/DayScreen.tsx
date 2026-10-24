"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { useGetCatalog } from "@/lib/api/generated/catalog/catalog";
import { useGetDay } from "@/lib/api/generated/days/days";
import { useGetWorkspaceSettings } from "@/lib/api/generated/settings/settings";
import { ApiError, ReadOnlyError } from "@/lib/api/mutator";
import { addDays, deviceTimeZone, formatMinutes, isDate, todayIn } from "@/lib/day/dates";
import type { Activity, Entry } from "@/lib/day/types";
import { formatDate, useI18n } from "@/lib/i18n";
import { useConnectivity } from "@/lib/offline/use-connectivity";
import { pillarColor } from "@/components/ActivityPicker";
import { AddEntry } from "./AddEntry";
import { CapturePanel } from "./CapturePanel";
import { CopyDialog } from "./CopyDialog";
import { EntrySheet } from "./EntrySheet";
import { Timeline } from "./Timeline";
import { useDayMutations } from "./use-day";

export function DayScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const settings = useGetWorkspaceSettings();
  const timeZone = settings.data?.data.timeZone ?? deviceTimeZone();
  const requested = params.get("date");
  const date = isDate(requested) ? requested : todayIn(timeZone);
  const day = useGetDay(date, { query: { refetchInterval: 15_000, refetchOnWindowFocus: true } });
  const catalog = useGetCatalog();
  const mutations = useDayMutations(date);
  const { readOnly } = useConnectivity();
  const [editing, setEditing] = useState<string>();
  const [error, setError] = useState<string>();
  // The pending delete rides along, so Undo restores only after it landed.
  const [undo, setUndo] = useState<{ id: string; title: string; deleted: Promise<unknown> }>();
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function remove(entry: Entry) {
    setEditing(undefined);
    const deleted = mutations.remove.mutateAsync(entry.id).catch(report);
    setUndo({ id: entry.id, title: entry.title, deleted });
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(undefined), 5000);
  }

  const activities = useMemo(() => new Map<string, Activity>((catalog.data?.data.activities ?? []).map((a) => [a.id, a])), [catalog.data]);
  const colorOf = useCallback((id: string | null) => (id ? pillarColor(catalog.data?.data, activities.get(id)?.areaId) : undefined), [catalog.data, activities]);

  function go(target: string) {
    router.push(`/day?date=${target}`);
  }

  function report(e: unknown) {
    if (e instanceof ReadOnlyError) setError(t("common.readOnly"));
    else if (e instanceof ApiError && e.problem?.type?.endsWith("/close-required")) setError(undefined);
    else setError(t("common.saveFailed"));
  }

  const data = day.data?.data;
  const today = data?.today ?? todayIn(timeZone);
  const heading = formatDate(locale, date, { weekday: "long", day: "numeric", month: "long" });
  const differentZone = timeZone !== deviceTimeZone();
  const entry: Entry | undefined = data?.entries.find((e) => e.id === editing);

  return (
    <section className="day">
      <header className="day-header">
        <button type="button" className="icon-button" aria-label={t("day.previous")} onClick={() => go(addDays(date, -1))}>
          <ChevronLeft />
        </button>
        <div className="day-header__title">
          <h1>{heading}</h1>
          {date !== today ? (
            <button type="button" className="link-button" onClick={() => go(today)}>
              {t("day.today")}
            </button>
          ) : null}
        </div>
        <button type="button" className="icon-button" aria-label={t("day.next")} onClick={() => go(addDays(date, 1))}>
          <ChevronRight />
        </button>
      </header>
      {differentZone ? <p className="muted small">{t("day.timeZoneNote", { zone: timeZone })}</p> : null}

      {data ? (
        <>
          <div className="day-summary">
            <Ring planned={data.totals.planned} capacity={data.totals.capacity} />
            <p className={`capacity ${data.totals.remaining < 0 ? "capacity--over" : ""}`} data-testid="capacity">
              {t("day.capacity", { planned: formatMinutes(data.totals.planned), capacity: formatMinutes(data.totals.capacity) })}
              {" · "}
              {data.totals.remaining < 0
                ? t("day.over", { n: formatMinutes(-data.totals.remaining) })
                : t("day.left", { n: formatMinutes(data.totals.remaining) })}
            </p>
          </div>
          {data.weekEssentials.length > 0 ? (
            <Link href={`/cycles?h=week&date=${date}`} className="week-line">
              {t("day.weekEssentials")}: {data.weekEssentials.map((o) => `${o.title} ${String(Math.round(Math.min(o.progress, 1) * 100))}%`).join(" · ")}
            </Link>
          ) : null}
          {data.cycle.closedAt ? (
            <p className="notice notice--ok">
              {t("day.closed")}
              {" · "}
              {t("close.execution")} {data.scores.execution === null ? t("close.noPlanned") : `${String(Math.round(data.scores.execution * 100))}%`}
              {" · "}
              {t("close.alignment")} {data.scores.alignment === null ? t("close.noWork") : `${String(Math.round(data.scores.alignment * 100))}%`}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="notice notice--error">
              {error}
            </p>
          ) : null}

          {data.entries.length === 0 ? <p className="muted">{t("day.empty")}</p> : null}
          <Timeline
            entries={data.entries}
            activities={activities}
            colorOf={colorOf}
            disabled={readOnly}
            onOpen={setEditing}
            onMove={(id, orderKey) => mutations.update.mutateAsync({ id, patch: { orderKey } }).catch(report)}
            onDelete={remove}
            onToggle={(e) =>
              mutations.update
                .mutateAsync({ id: e.id, patch: { status: e.status === "planned" ? "completed" : "planned" } })
                .catch(report)
            }
          />

          <AddEntry
            activities={catalog.data?.data.activities ?? []}
            closeRequired={date === today ? data.closeRequired : null}
            disabled={readOnly}
            onAdd={(body) => mutations.create.mutateAsync(body).then(() => setError(undefined), report)}
          />

          {undo ? (
            <p className="toast" role="status">
              {t("day.deleted", { title: undo.title })}{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  void undo.deleted.then(() => mutations.restore.mutateAsync(undo.id)).catch(report);
                  setUndo(undefined);
                }}
              >
                {t("day.undo")}
              </button>
            </p>
          ) : null}

          <CapturePanel
            key={`${date}-capture`}
            text={data.cycle.captureText}
            activities={catalog.data?.data.activities ?? []}
            disabled={readOnly}
            onSaveText={(body) => mutations.updateDay.mutateAsync(body).catch(report)}
            onAdd={(body) => mutations.create.mutateAsync(body).then(() => setError(undefined), report)}
          />

          <div className="day-tools">
            {!data.cycle.closedAt && data.entries.length > 0 ? (
              <Link className="ghost-button button-link" href={`/day/close?date=${date}`}>
                {t("close.open")}
              </Link>
            ) : null}
            <CopyDialog
              date={date}
              present={new Set(data.entries.flatMap((e) => [e.carriedFromEntryId, e.copiedFromEntryId]).filter((id): id is string => id !== null))}
              disabled={readOnly} onCopy={(fromDate, entryIds) => mutations.copy.mutateAsync({ fromDate, entryIds }).then(() => undefined, report)} />
          </div>

          {entry ? (
            <EntrySheet
              key={entry.id}
              entry={entry}
              entries={data.entries}
              objectives={data.objectives}
              catalog={catalog.data?.data}
              disabled={readOnly}
              onClose={() => setEditing(undefined)}
              onSave={(patch) => mutations.update.mutateAsync({ id: entry.id, patch }).then(() => setEditing(undefined), report)}
              onDelete={async () => remove(entry)}
            />
          ) : null}
        </>
      ) : (
        <p>{day.isError ? t("common.connectOnce") : t("common.loading")}</p>
      )}
    </section>
  );
}

// 005 D4: how much of the day's capacity is planned, as a ring.
function Ring({ planned, capacity }: { planned: number; capacity: number }) {
  const share = capacity > 0 ? planned / capacity : 0;
  const pct = Math.round(Math.min(share, 1) * 100);
  return (
    <span className={`ring ${share > 1 ? "ring--over" : ""}`} style={{ "--value": `${String(pct)}%` } as React.CSSProperties} aria-hidden="true">
      <span>{Math.round(share * 100)}%</span>
    </span>
  );
}
