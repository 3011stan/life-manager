"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  createActivity,
  createArea,
  createPillar,
  deleteActivity,
  deleteArea,
  deletePillar,
  getGetCatalogQueryKey,
  updateActivity,
  updateArea,
  updatePillar,
  useGetCatalog,
} from "@/lib/api/generated/catalog/catalog";
import { ApiError } from "@/lib/api/mutator";
import type { Activity } from "@/lib/day/types";
import { formatMinutes } from "@/lib/day/dates";
import { useT } from "@/lib/i18n";
import { useConnectivity } from "@/lib/offline/use-connectivity";
import { ActivitySheet } from "./ActivitySheet";

type Kind = "pillar" | "area" | "activity";

const REMOVE = { pillar: deletePillar, area: deleteArea, activity: deleteActivity };
const ARCHIVE = {
  pillar: (id: string, archived: boolean) => updatePillar(id, { archived }),
  area: (id: string, archived: boolean) => updateArea(id, { archived }),
  activity: (id: string, archived: boolean) => updateActivity(id, { archived }),
};

// US3: the user's own catalog. Items in use are archived, never deleted (FR-029).
export function CatalogScreen() {
  const t = useT();
  const queryClient = useQueryClient();
  const catalog = useGetCatalog();
  const { readOnly } = useConnectivity();
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Activity | "new">();
  const [newActivityArea, setNewActivityArea] = useState<string>();
  const [error, setError] = useState<string>();
  const [organize, setOrganize] = useState(false);
  const [query, setQuery] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetCatalogQueryKey() });

  async function run(action: () => Promise<unknown>) {
    setError(undefined);
    try {
      await action();
    } catch {
      setError(t("common.saveFailed"));
    } finally {
      await refresh();
    }
  }

  async function remove(kind: Kind, id: string, name: string) {
    if (!window.confirm(t("catalog.deleteConfirm", { name }))) return;
    try {
      await REMOVE[kind](id);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && window.confirm(t("catalog.inUse"))) await ARCHIVE[kind](id, true);
      else if (!(e instanceof ApiError && e.status === 409)) setError(t("common.saveFailed"));
    }
    await refresh();
  }

  function rename(kind: Kind, id: string, current: string) {
    const name = window.prompt(t("catalog.rename"), current)?.trim();
    if (!name || name === current) return;
    void run(() => (kind === "pillar" ? updatePillar(id, { name }) : kind === "area" ? updateArea(id, { name }) : updateActivity(id, { name })));
  }

  function add(kind: Exclude<Kind, "activity">, pillarId?: string) {
    const name = window.prompt(kind === "pillar" ? t("catalog.pillarName") : t("catalog.areaName"))?.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    void run(() => (kind === "pillar" ? createPillar({ id, name }) : createArea({ id, name, pillarId: pillarId ?? "" })));
  }

  const data = catalog.data?.data;
  if (!data) return <section className="panel">{catalog.isError ? t("common.connectOnce") : t("common.loading")}</section>;
  const visible = <T extends { archivedAt: string | null }>(items: T[]) => items.filter((i) => showArchived || !i.archivedAt);

  const actions = (kind: Kind, item: { id: string; name: string; archivedAt: string | null }) => (
    <>
      <button type="button" className="link-button" disabled={readOnly} onClick={() => (kind === "activity" ? setEditing(data.activities.find((a) => a.id === item.id)) : rename(kind, item.id, item.name))}>
        {kind === "activity" ? t("common.edit") : t("catalog.rename")}
      </button>
      <button type="button" className="link-button" disabled={readOnly} onClick={() => void run(() => ARCHIVE[kind](item.id, !item.archivedAt))}>
        {item.archivedAt ? t("common.restore") : t("common.archive")}
      </button>
      <button type="button" className="link-button" disabled={readOnly} onClick={() => void remove(kind, item.id, item.name)}>
        {t("common.delete")}
      </button>
    </>
  );

  const sheet = editing ? (
    <ActivitySheet
      activity={editing === "new" ? undefined : editing}
      areaId={editing === "new" ? (newActivityArea ?? data.areas.find((a) => !a.archivedAt)?.id ?? "") : editing.areaId}
      areas={data.areas.filter((a) => !a.archivedAt)}
      onClose={() => setEditing(undefined)}
      onArchive={
        editing === "new"
          ? undefined
          : () => run(() => ARCHIVE.activity(editing.id, !editing.archivedAt)).then(() => setEditing(undefined))
      }
      onDelete={editing === "new" ? undefined : () => remove("activity", editing.id, editing.name).then(() => setEditing(undefined))}
      onSave={(body) =>
        run(() => (editing === "new" ? createActivity({ id: crypto.randomUUID(), ...body }) : updateActivity(editing.id, body))).then(() => setEditing(undefined))
      }
    />
  ) : null;

  // 004 US5: a flat, searchable list; pillars and areas live under "Organize".
  if (!organize) {
    const fold = (v: string) => v.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    const areaById = new Map(data.areas.map((a) => [a.id, a.name]));
    const list = visible(data.activities)
      .filter((a) => fold(a.name).includes(fold(query.trim())))
      .sort((a, b) => a.name.localeCompare(b.name));
    return (
      <section className="panel">
        <h1>{t("catalog.title")}</h1>
        {error ? (
          <p role="alert" className="notice notice--error">
            {error}
          </p>
        ) : null}
        <div className="add-entry__row">
          <input aria-label={t("catalog.search")} placeholder={t("catalog.search")} value={query} onChange={(e) => setQuery(e.target.value)} />
          <button
            type="button"
            className="primary-button"
            disabled={readOnly}
            onClick={() => {
              setNewActivityArea(undefined);
              setEditing("new");
            }}
          >
            {t("catalog.addActivity")}
          </button>
        </div>
        <ul className="timeline" data-testid="activity-list">
          {list.map((a) => (
            <li key={a.id}>
              <button type="button" className={`activity-row ${a.archivedAt ? "catalog-item--archived" : ""}`} onClick={() => setEditing(a)}>
                <span className="catalog-item__name">{a.name}</span>
                <span className="muted small">
                  {[
                    areaById.get(a.areaId),
                    formatMinutes(a.defaultMinutes),
                    a.defaultSegments.length > 0 ? t("catalog.parts", { n: a.defaultSegments.length }) : null,
                    a.archivedAt ? t("catalog.archived") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <label className="toggle">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          {t("catalog.showArchived")}
        </label>
        <button type="button" className="link-button" onClick={() => setOrganize(true)}>
          {t("catalog.organize")}
        </button>
        {sheet}
      </section>
    );
  }

  return (
    <section className="panel">
      <button type="button" className="link-button" onClick={() => setOrganize(false)}>
        ‹ {t("catalog.title")}
      </button>
      <h1>{t("catalog.organize")}</h1>
      {error ? (
        <p role="alert" className="notice notice--error">
          {error}
        </p>
      ) : null}
      <label className="toggle">
        <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
        {t("catalog.showArchived")}
      </label>
      <ul className="catalog-tree">
        {visible(data.pillars).map((p) => (
          <li key={p.id}>
            <div className={`catalog-item ${p.archivedAt ? "catalog-item--archived" : ""}`}>
              <strong className="catalog-item__name">{p.name}</strong>
              {actions("pillar", p)}
            </div>
            <ul>
              {visible(data.areas.filter((a) => a.pillarId === p.id)).map((area) => (
                <li key={area.id}>
                  <div className={`catalog-item ${area.archivedAt ? "catalog-item--archived" : ""}`}>
                    <span className="catalog-item__name">{area.name}</span>
                    {actions("area", area)}
                  </div>
                  <ul>
                    {visible(data.activities.filter((a) => a.areaId === area.id)).map((act) => (
                      <li key={act.id} className={`catalog-item ${act.archivedAt ? "catalog-item--archived" : ""}`}>
                        <span className="catalog-item__name">
                          {act.name} <span className="muted small">{act.defaultMinutes} min</span>
                        </span>
                        {actions("activity", act)}
                      </li>
                    ))}
                    <li>
                      <button
                        type="button"
                        className="link-button"
                        disabled={readOnly}
                        onClick={() => {
                          setNewActivityArea(area.id);
                          setEditing("new");
                        }}
                      >
                        {t("catalog.addActivity")}
                      </button>
                    </li>
                  </ul>
                </li>
              ))}
              <li>
                <button type="button" className="link-button" disabled={readOnly} onClick={() => add("area", p.id)}>
                  {t("catalog.addArea")}
                </button>
              </li>
            </ul>
          </li>
        ))}
      </ul>
      <button type="button" className="ghost-button" disabled={readOnly} onClick={() => add("pillar")}>
        {t("catalog.addPillar")}
      </button>
      {sheet}
    </section>
  );
}
