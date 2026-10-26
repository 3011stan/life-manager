"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, ChevronDown, Plus, Repeat } from "@/components/icons";
import { useGetAgenda } from "@/lib/api/generated/agenda/agenda";
import { updateObjectiveTemplate } from "@/lib/api/generated/templates/templates";
import { agendaMonths, isPlanningKey, weekdayNames, weekdaysLabel } from "@/lib/day/agenda";
import { formatDate, useI18n } from "@/lib/i18n";
import { EventSheet, type AgendaEvent, type EventPreset } from "./EventSheet";

interface Props {
  readOnly: boolean;
}

type Archived = { id: string; title: string }[];

// 006 D1, D4: the months ahead under the goals tree. A weekly item shows once
// with its days; one-off and yearly items show on their dates.
export function AgendaSection({ readOnly }: Props) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const agenda = useGetAgenda(undefined, { query: { refetchInterval: 60_000 } });
  const [editing, setEditing] = useState<{ event?: AgendaEvent; preset?: EventPreset }>();
  const [toggled, setToggled] = useState<Set<string>>(new Set());
  const [archived, setArchived] = useState<Archived>();
  const [notice, setNotice] = useState<string>();

  const data = agenda.data?.data;
  const names = weekdayNames(locale);
  const refresh = () => queryClient.invalidateQueries({ predicate: (q) => isPlanningKey(q.queryKey) });

  if (!data) return null;
  const events = new Map(data.events.map((e) => [e.id, e]));
  const weekly = data.events.filter((e) => e.repeat === "weekly");
  const months = agendaMonths(data.today, data.occurrences);
  const isOpen = (m: { month: string; open: boolean }) => (toggled.has(m.month) ? !m.open : m.open);

  async function undo(list: Archived) {
    setArchived(undefined);
    await Promise.all(list.map((tpl) => updateObjectiveTemplate(tpl.id, { archived: false })));
    setNotice(t("agenda.restored"));
    await refresh();
  }

  return (
    <section className="agenda" aria-labelledby="agenda-heading">
      <div className="agenda__head">
        <h2 id="agenda-heading">{t("agenda.title")}</h2>
        <button type="button" className="add-under" disabled={readOnly} aria-label={t("agenda.addLabel")} onClick={() => setEditing({ preset: { onDate: data.today } })}>
          <Plus size={14} />
          {t("agenda.add")}
        </button>
      </div>

      {weekly.length > 0 ? (
        <div className="agenda__group">
          <h3 className="eyebrow">{t("agenda.weekly")}</h3>
          <ul className="agenda__list">
            {weekly.map((e) => (
              <li key={e.id}>
                <button type="button" className="agenda-row" data-testid="agenda-row" onClick={() => setEditing({ event: e })}>
                  <Repeat size={16} aria-label={t("agenda.weekly")} />
                  <span className="agenda-row__title">{e.title}</span>
                  <span className="agenda-row__when">
                    {e.weekdays.length === 7 ? t("agenda.everyDay") : t("agenda.every", { days: weekdaysLabel(e.weekdays, names, t("agenda.everyDay")) })}
                    {e.startTime ? ` · ${e.startTime}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {months.length === 1 && months[0]?.items.length === 0 && weekly.length === 0 ? <p className="muted">{t("agenda.empty")}</p> : null}
      {months.map((m) => {
        const open = isOpen(m);
        const label = formatDate(locale, `${m.month}-01`, { month: "long", year: "numeric" });
        return (
          <div key={m.month} className="agenda__group">
            <h3 className="agenda__month">
              <button
                type="button"
                className="more-toggle"
                aria-expanded={open}
                aria-label={t("agenda.month", { month: label, n: String(m.items.length) })}
                onClick={() =>
                  setToggled((s) => {
                    const next = new Set(s);
                    if (next.has(m.month)) next.delete(m.month);
                    else next.add(m.month);
                    return next;
                  })
                }
              >
                {label}
                <span className="muted small">{m.items.length}</span>
                <ChevronDown />
              </button>
            </h3>
            {open ? (
              m.items.length === 0 ? (
                <p className="muted small">{t("agenda.monthEmpty")}</p>
              ) : (
                <ul className="agenda__list">
                  {m.items.map((o) => (
                    <li key={`${o.eventId}-${o.date}`}>
                      <button type="button" className="agenda-row" data-testid="agenda-row" onClick={() => setEditing({ event: events.get(o.eventId) })}>
                        <span className="agenda-row__date">
                          <span className="agenda-row__day">{formatDate(locale, o.date, { day: "numeric" })}</span>
                          <span className="muted small">{formatDate(locale, o.date, { weekday: "short" })}</span>
                        </span>
                        <span className="agenda-row__title">
                          {o.title}
                          {o.repeat === "yearly" ? <Repeat size={14} aria-label={t("agenda.yearly")} /> : null}
                        </span>
                        <span className="agenda-row__when">{o.startTime ?? <Calendar size={14} />}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </div>
        );
      })}

      {archived && archived.length > 0 ? (
        <p className="toast" role="status">
          {t("agenda.archived", { titles: archived.map((a) => `“${a.title}”`).join(", ") })}{" "}
          <button type="button" className="link-button" onClick={() => void undo(archived)}>
            {t("day.undo")}
          </button>
        </p>
      ) : notice ? (
        <p className="toast" role="status">
          {notice}
        </p>
      ) : null}

      {editing ? (
        <EventSheet
          key={editing.event?.id ?? "new"}
          event={editing.event}
          preset={editing.preset}
          today={data.today}
          disabled={readOnly}
          onClose={() => setEditing(undefined)}
          onSaved={async (list) => {
            setNotice(undefined);
            setArchived(list.length > 0 ? list : undefined);
            await refresh();
          }}
        />
      ) : null}
    </section>
  );
}
