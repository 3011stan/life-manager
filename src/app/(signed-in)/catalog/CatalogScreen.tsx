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

  return (
    <section className="panel">
      <h1>{t("catalog.title")}</h1>
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
      {editing ? (
        <ActivitySheet
          activity={editing === "new" ? undefined : editing}
          areaId={editing === "new" ? (newActivityArea ?? "") : editing.areaId}
          areas={data.areas.filter((a) => !a.archivedAt)}
          onClose={() => setEditing(undefined)}
          onSave={(body) =>
            run(() => (editing === "new" ? createActivity({ id: crypto.randomUUID(), ...body }) : updateActivity(editing.id, body))).then(() =>
              setEditing(undefined),
            )
          }
        />
      ) : null}
    </section>
  );
}
