"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "@/components/icons";
import type { Activity, Catalog } from "@/lib/day/types";
import { useT } from "@/lib/i18n";

interface Props {
  catalog: Catalog | undefined;
  value: string | null;
  disabled?: boolean;
  onChange: (activityId: string | null) => void;
  onCreate: (name: string, areaId: string) => Promise<string>;
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

// 005 D4: one dot color per pillar, by its place in the catalog.
const PILLAR_COLORS = ["#c7642b", "#3563b8", "#2f6b4f", "#7a4fa3", "#4a5568", "#a3473c"];

export function pillarColor(catalog: Catalog | undefined, areaId: string | undefined): string | undefined {
  if (!catalog || !areaId) return undefined;
  const area = catalog.areas.find((a) => a.id === areaId);
  const index = catalog.pillars.findIndex((p) => p.id === area?.pillarId);
  return index < 0 ? undefined : PILLAR_COLORS[index % PILLAR_COLORS.length];
}

export function areaPath(catalog: Catalog | undefined, areaId: string | undefined): string {
  const area = catalog?.areas.find((a) => a.id === areaId);
  const pillar = catalog?.pillars.find((p) => p.id === area?.pillarId);
  return [pillar?.name, area?.name].filter(Boolean).join(" · ");
}

// 005 D2: pick an activity by typing; an unknown name can be created with one
// more choice, its area.
export function ActivityPicker({ catalog, value, disabled, onChange, onCreate }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const activities = (catalog?.activities ?? []).filter((a) => !a.archivedAt || a.id === value);
  const current: Activity | undefined = activities.find((a) => a.id === value);
  const q = fold(query);
  const matches = q ? activities.filter((a) => fold(a.name).includes(q)) : activities;
  const exact = activities.some((a) => fold(a.name) === q);
  const areas = (catalog?.areas ?? []).filter((a) => !a.archivedAt);

  function pick(id: string | null) {
    onChange(id);
    setOpen(false);
    setQuery("");
    setCreating(false);
  }

  return (
    <div className="picker">
      <button
        type="button"
        className="picker__trigger"
        aria-expanded={open}
        aria-label={`${t("entry.activity")}: ${current?.name ?? t("entry.noActivity")}`}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        {current ? <span className="dot" style={{ background: pillarColor(catalog, current.areaId) }} aria-hidden="true" /> : null}
        <span className="picker__value">
          <span className="picker__name">{current?.name ?? t("entry.noActivity")}</span>
          {current ? <span className="picker__path">{areaPath(catalog, current.areaId)}</span> : null}
        </span>
        <ChevronDown />
      </button>
      {open ? (
        <div className="picker__panel">
          <input
            aria-label={t("entry.findActivity")}
            placeholder={t("entry.findActivity")}
            value={query}
            autoFocus
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              if (matches[0] && (exact || matches.length === 1)) pick(matches[0].id);
              else if (q) setCreating(true);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setCreating(false);
            }}
          />
          {creating ? (
            <div className="stack">
              <p className="muted small">{t("entry.pickArea", { name: query.trim() })}</p>
              <ul className="chips">
                {areas.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => {
                        void onCreate(query.trim(), a.id).then(pick);
                      }}
                    >
                      <span className="dot" style={{ background: pillarColor(catalog, a.id) }} aria-hidden="true" />
                      {areaPath(catalog, a.id)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ul className="picker__list">
              {matches.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <button type="button" className="picker__option" aria-pressed={a.id === value} onClick={() => pick(a.id)}>
                    <span className="dot" style={{ background: pillarColor(catalog, a.areaId) }} aria-hidden="true" />
                    <span className="picker__name">{a.name}</span>
                    <span className="picker__path">{areaPath(catalog, a.areaId)}</span>
                  </button>
                </li>
              ))}
              {q && !exact ? (
                <li>
                  <button type="button" className="picker__option picker__option--create" onClick={() => setCreating(true)}>
                    <Plus size={16} />
                    <span className="picker__name">{t("entry.createNamed", { name: query.trim() })}</span>
                  </button>
                </li>
              ) : null}
              {value ? (
                <li>
                  <button type="button" className="picker__option" onClick={() => pick(null)}>
                    <span className="picker__name muted">{t("entry.noActivity")}</span>
                  </button>
                </li>
              ) : null}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
