"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useGetCatalog } from "@/lib/api/generated/catalog/catalog";
import { useGetDay } from "@/lib/api/generated/days/days";
import { useGetWorkspaceSettings } from "@/lib/api/generated/settings/settings";
import { ApiError, ReadOnlyError } from "@/lib/api/mutator";
import { addDays, deviceTimeZone, formatMinutes, isDate, todayIn } from "@/lib/day/dates";
import type { Activity, Entry } from "@/lib/day/types";
import { formatDate, useI18n } from "@/lib/i18n";
import { useConnectivity } from "@/lib/offline/use-connectivity";
import { AddEntry } from "./AddEntry";
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

  const activities = useMemo(() => new Map<string, Activity>((catalog.data?.data.activities ?? []).map((a) => [a.id, a])), [catalog.data]);

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
          ‹
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
          ›
        </button>
      </header>
      {differentZone ? <p className="muted small">{t("day.timeZoneNote", { zone: timeZone })}</p> : null}

      {data ? (
        <>
          <p className={`capacity ${data.totals.remaining < 0 ? "capacity--over" : ""}`} data-testid="capacity">
            {t("day.capacity", { planned: formatMinutes(data.totals.planned), capacity: formatMinutes(data.totals.capacity) })}
            {" · "}
            {data.totals.remaining < 0
              ? t("day.over", { n: formatMinutes(-data.totals.remaining) })
              : t("day.left", { n: formatMinutes(data.totals.remaining) })}
          </p>
          {data.cycle.closedAt ? <p className="notice notice--ok">{t("day.closed")}</p> : null}
          {error ? (
            <p role="alert" className="notice notice--error">
              {error}
            </p>
          ) : null}

          {data.entries.length === 0 ? <p className="muted">{t("day.empty")}</p> : null}
          <Timeline
            entries={data.entries}
            activities={activities}
            disabled={readOnly}
            onOpen={setEditing}
            onMove={(id, orderKey) => mutations.update.mutateAsync({ id, patch: { orderKey } }).catch(report)}
            onToggle={(e) =>
              mutations.update
                .mutateAsync({ id: e.id, patch: { status: e.status === "planned" ? "completed" : "planned" } })
                .catch(report)
            }
          />

          <AddEntry
            activities={catalog.data?.data.activities ?? []}
            closeRequired={date === today ? data.closeRequired : null}
            disabled={readOnly || mutations.create.isPending}
            onAdd={(body) => mutations.create.mutateAsync(body).then(() => setError(undefined), report)}
          />

          <div className="day-tools">
            <CopyDialog date={date} disabled={readOnly} onCopy={(fromDate, entryIds) => mutations.copy.mutateAsync({ fromDate, entryIds }).then(() => undefined, report)} />
          </div>

          {entry ? (
            <EntrySheet
              key={entry.id}
              entry={entry}
              entries={data.entries}
              catalog={catalog.data?.data}
              disabled={readOnly}
              onClose={() => setEditing(undefined)}
              onSave={(patch) => mutations.update.mutateAsync({ id: entry.id, patch }).then(() => setEditing(undefined), report)}
              onDelete={() => mutations.remove.mutateAsync(entry.id).then(() => setEditing(undefined), report)}
            />
          ) : null}
        </>
      ) : (
        <p>{day.isError ? t("common.connectOnce") : t("common.loading")}</p>
      )}
    </section>
  );
}
