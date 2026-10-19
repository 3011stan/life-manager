"use client";

import { useRef, useState } from "react";
import { getDay } from "@/lib/api/generated/days/days";
import { addDays } from "@/lib/day/dates";
import type { Entry } from "@/lib/day/types";
import { useT } from "@/lib/i18n";

// FR-016: copy chosen entries from another day; the routine stand-in until
// recurrence exists.
export function CopyDialog({ date, disabled, onCopy }: { date: string; disabled: boolean; onCopy: (fromDate: string, ids: string[]) => Promise<void> }) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const [fromDate, setFromDate] = useState(addDays(date, -1));
  const [entries, setEntries] = useState<Entry[]>();
  const [chosen, setChosen] = useState<Set<string>>(new Set());

  async function load(target: string) {
    setFromDate(target);
    const res = await getDay(target);
    setEntries(res.data.entries);
    setChosen(new Set(res.data.entries.map((e) => e.id)));
  }

  function open() {
    dialog.current?.showModal();
    void load(addDays(date, -1));
  }

  async function copy() {
    await onCopy(fromDate, [...chosen]);
    dialog.current?.close();
  }

  return (
    <>
      <button type="button" className="ghost-button" onClick={open} disabled={disabled}>
        {t("day.copyFrom")}
      </button>
      <dialog ref={dialog} className="dialog" aria-labelledby="copy-title">
        <div className="stack">
          <h2 id="copy-title">{t("day.copyPick")}</h2>
          <input type="date" aria-label={t("day.copyPick")} value={fromDate} onChange={(e) => void load(e.target.value)} />
          {entries && entries.length === 0 ? <p className="muted">{t("day.copyNone")}</p> : null}
          <ul className="check-list">
            {entries?.map((e) => (
              <li key={e.id}>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={chosen.has(e.id)}
                    onChange={(ev) =>
                      setChosen((prev) => {
                        const next = new Set(prev);
                        if (ev.target.checked) next.add(e.id);
                        else next.delete(e.id);
                        return next;
                      })
                    }
                  />
                  {e.title}
                </label>
              </li>
            ))}
          </ul>
          <div className="button-row">
            <button type="button" className="ghost-button" onClick={() => dialog.current?.close()}>
              {t("common.cancel")}
            </button>
            <button type="button" className="primary-button" disabled={chosen.size === 0} onClick={() => void copy()}>
              {t("day.copySelected")}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
