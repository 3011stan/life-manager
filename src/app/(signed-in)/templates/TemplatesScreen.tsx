"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useGetCatalog } from "@/lib/api/generated/catalog/catalog";
import {
  createObjectiveTemplate,
  deleteObjectiveTemplate,
  getListObjectiveTemplatesQueryKey,
  updateObjectiveTemplate,
  useListObjectiveTemplates,
} from "@/lib/api/generated/templates/templates";
import { useT } from "@/lib/i18n";
import { useConnectivity } from "@/lib/offline/use-connectivity";

const TIERS = ["essential", "secondary", "parked"] as const;

// FR-041: weekly objective templates, proposed when a week is planned.
export function TemplatesScreen() {
  const t = useT();
  const queryClient = useQueryClient();
  const { readOnly } = useConnectivity();
  const list = useListObjectiveTemplates();
  const catalog = useGetCatalog();
  const [error, setError] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListObjectiveTemplatesQueryKey() });

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React clears currentTarget once the handler awaits.
    const element = event.currentTarget;
    const form = new FormData(element);
    const type = String(form.get("targetType")) as "count" | "duration";
    const target = Number(form.get("target"));
    const activity = String(form.get("activity") ?? "");
    setError(false);
    try {
      await createObjectiveTemplate({
        id: crypto.randomUUID(),
        title: String(form.get("title")),
        tier: String(form.get("tier")) as (typeof TIERS)[number],
        targetType: type,
        ...(type === "count" ? { targetCount: target } : { targetMinutes: Math.round(target * 60) }),
        activityIds: activity ? [activity] : [],
      });
      element.reset();
    } catch {
      setError(true);
    }
    await refresh();
  }

  const names = new Map((catalog.data?.data.activities ?? []).map((a) => [a.id, a.name]));
  const items = (list.data?.data ?? []).filter((x) => !x.archivedAt);

  return (
    <section className="panel">
      <h1>{t("templates.title")}</h1>
      {items.length === 0 ? <p className="muted">{t("templates.none")}</p> : null}
      <ul className="catalog-tree">
        {items.map((tpl) => (
          <li key={tpl.id} className="catalog-item">
            <span className="catalog-item__name">
              {tpl.title} <span className="muted small">{t(`tier.${tpl.tier}`)} · {tpl.activityIds.map((id) => names.get(id)).join(", ")}</span>
            </span>
            <button type="button" className="link-button" disabled={readOnly} onClick={() => void updateObjectiveTemplate(tpl.id, { archived: true }).then(refresh)}>
              {t("common.archive")}
            </button>
            <button
              type="button"
              className="link-button"
              disabled={readOnly}
              onClick={() => {
                if (window.confirm(t("catalog.deleteConfirm", { name: tpl.title }))) void deleteObjectiveTemplate(tpl.id).then(refresh);
              }}
            >
              {t("common.delete")}
            </button>
          </li>
        ))}
      </ul>
      <form className="stack" onSubmit={(e) => void add(e)}>
        <fieldset className="stack plain-fieldset" disabled={readOnly}>
          <h2>{t("templates.add")}</h2>
          <label className="field">
            {t("objective.title")}
            <input name="title" required maxLength={200} />
          </label>
          <div className="field-row">
            <label className="field">
              {t("objective.tier")}
              <select name="tier" defaultValue="essential">
                {TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {t(`tier.${tier}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              {t("objective.type")}
              <select name="targetType" defaultValue="count">
                <option value="count">{t("target.count")}</option>
                <option value="duration">{t("target.duration")}</option>
              </select>
            </label>
            <label className="field">
              {t("objective.targetCount")} / {t("objective.targetHours")}
              <input name="target" type="number" min={0.25} step={0.25} defaultValue={3} required />
            </label>
          </div>
          <label className="field">
            {t("entry.activity")}
            <select name="activity" defaultValue="">
              <option value="">—</option>
              {(catalog.data?.data.activities ?? [])
                .filter((a) => !a.archivedAt)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </label>
          {error ? (
            <p role="alert" className="notice notice--error">
              {t("common.saveFailed")}
            </p>
          ) : null}
          <button type="submit" className="primary-button">
            {t("templates.add")}
          </button>
        </fieldset>
      </form>
    </section>
  );
}
