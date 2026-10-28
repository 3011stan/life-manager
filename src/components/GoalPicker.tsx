"use client";

import { useState } from "react";
import { Close, Plus } from "@/components/icons";
import { matchGoals, type GoalOption } from "@/lib/day/chain";
import { useT } from "@/lib/i18n";

interface Props {
  label: string;
  // Goals of the level right above, each with its path (007 E3).
  options: GoalOption[];
  // Goals already chosen; a kept link that skips a level comes in `chosen`
  // without being an option, marked.
  value: string[];
  chosen: (GoalOption & { skips?: boolean })[];
  disabled?: boolean;
  createLabel?: string;
  onChange: (ids: string[]) => void;
  onCreate?: () => void;
}

// 007 E3: what a task or a goal counts for, picked by typing among the goals
// of the level right above, at most 8 at a time, each with its path.
export function GoalPicker({ label, options, value, chosen, disabled, createLabel, onChange, onCreate }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const matches = matchGoals(options, query, value);

  function pick(id: string) {
    onChange([...value, id]);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="picker goal-picker" role="group" aria-label={label}>
      <span className="goal-picker__label muted small">{label}</span>
      {chosen.length > 0 ? (
        <ul className="picker__list" data-testid="goal-picker-chosen">
          {chosen.map((o) => (
            <li key={o.id} className="goal-picker__chosen">
              <span className="picker__value">
                <span className="picker__name">{o.title}</span>
                <span className="picker__path">
                  {o.skips ? <span className="skip-mark">{t("goals.skipsLevel")}</span> : null}
                  {o.path}
                </span>
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label={t("goalPicker.remove", { title: o.title })}
                disabled={disabled}
                onClick={() => onChange(value.filter((x) => x !== o.id))}
              >
                <Close size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <button type="button" className="picker__trigger picker__option--create" aria-expanded={open} disabled={disabled} onClick={() => setOpen((v) => !v)}>
        <Plus size={16} />
        <span className="picker__name">{t("goalPicker.add")}</span>
      </button>
      {open ? (
        <div className="picker__panel">
          <input aria-label={t("goalPicker.find")} placeholder={t("goalPicker.find")} value={query} autoFocus onChange={(e) => setQuery(e.target.value)} />
          <ul className="picker__list">
            {matches.map((o) => (
              <li key={o.id}>
                <button type="button" className="picker__option" onClick={() => pick(o.id)}>
                  <span className="picker__value">
                    <span className="picker__name">{o.title}</span>
                    {o.path ? <span className="picker__path">{o.path}</span> : null}
                  </span>
                </button>
              </li>
            ))}
            {matches.length === 0 ? <li className="muted small goal-picker__empty">{t("goalPicker.none")}</li> : null}
            {onCreate && createLabel ? (
              <li>
                <button
                  type="button"
                  className="picker__option picker__option--create"
                  onClick={() => {
                    setOpen(false);
                    onCreate();
                  }}
                >
                  <Plus size={16} />
                  <span className="picker__name">{createLabel}</span>
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
