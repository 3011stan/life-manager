"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  getGetWorkspaceSettingsQueryKey,
  useGetWorkspaceSettings,
  useUpdateWorkspaceSettings,
} from "@/lib/api/generated/settings/settings";
import { ApiError, ReadOnlyError } from "@/lib/api/mutator";
import { useT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { useConnectivity } from "@/lib/offline/use-connectivity";

const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

const LOCALES = [
  { value: "pt-BR", label: "Português" },
  { value: "en", label: "English" },
] as const;

function timeZones(current: string): string[] {
  const all = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return all.includes(current) ? all : [current, ...all];
}

type FieldErrors = Partial<
  Record<"weekStartDay" | "timeZone" | "defaultDailyCapacityMinutes" | "locale" | "longHorizonStartYear", string>
>;

export function SettingsForm() {
  const queryClient = useQueryClient();
  const t = useT();
  const { readOnly } = useConnectivity();
  const settings = useGetWorkspaceSettings();
  const update = useUpdateWorkspaceSettings();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ kind: "saved" | "error"; key: MessageKey }>();

  if (!settings.data) {
    return <section className="panel">{settings.isError ? <p className="notice notice--error">{t("settings.loadFailed")}</p> : <p>{t("common.loading")}</p>}</section>;
  }
  const current = settings.data.data;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setFieldErrors({});
    setMessage(undefined);
    try {
      const result = await update.mutateAsync({
        data: {
          weekStartDay: Number(form.get("weekStartDay")),
          timeZone: String(form.get("timeZone")),
          defaultDailyCapacityMinutes: Number(form.get("defaultDailyCapacityMinutes")),
          locale: String(form.get("locale")) as (typeof LOCALES)[number]["value"],
          longHorizonStartYear: Number(form.get("longHorizonStartYear")),
        },
      });
      queryClient.setQueryData(getGetWorkspaceSettingsQueryKey(), result);
      setMessage({ kind: "saved", key: "common.saved" });
    } catch (error) {
      // FR-015: the stored value stays; nothing unsaved is shown as saved.
      if (error instanceof ApiError && error.problem?.errors) {
        setFieldErrors(Object.fromEntries(error.problem.errors.map((e) => [e.field, e.message])) as FieldErrors);
        setMessage({ kind: "error", key: "settings.checkFields" });
      } else if (error instanceof ReadOnlyError) {
        setMessage({ kind: "error", key: "common.readOnly" });
      } else {
        setMessage({ kind: "error", key: "settings.saveFailed" });
      }
    }
  }

  return (
    <section className="panel">
      <h1>{t("settings.title")}</h1>
      <form className="stack" onSubmit={(e) => void save(e)} key={current.version}>
        <fieldset className="stack plain-fieldset" disabled={readOnly || update.isPending}>
          <label className="field">
            {t("settings.weekStart")}
            <select name="weekStartDay" defaultValue={current.weekStartDay} aria-invalid={Boolean(fieldErrors.weekStartDay)}>
              {WEEK_DAYS.map((day) => (
                <option key={day} value={day}>
                  {t(`weekday.${day}`)}
                </option>
              ))}
            </select>
            {fieldErrors.weekStartDay ? <span className="field-error">{fieldErrors.weekStartDay}</span> : null}
          </label>
          <label className="field">
            {t("settings.timeZone")}
            <select name="timeZone" defaultValue={current.timeZone} aria-invalid={Boolean(fieldErrors.timeZone)}>
              {timeZones(current.timeZone).map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            {fieldErrors.timeZone ? <span className="field-error">{fieldErrors.timeZone}</span> : null}
          </label>
          <label className="field">
            {t("settings.capacity")}
            <input
              name="defaultDailyCapacityMinutes"
              type="number"
              inputMode="numeric"
              defaultValue={current.defaultDailyCapacityMinutes}
              aria-invalid={Boolean(fieldErrors.defaultDailyCapacityMinutes)}
            />
            {fieldErrors.defaultDailyCapacityMinutes ? (
              <span className="field-error">{fieldErrors.defaultDailyCapacityMinutes}</span>
            ) : null}
          </label>
          <label className="field">
            {t("settings.language")}
            <select name="locale" defaultValue={current.locale} aria-invalid={Boolean(fieldErrors.locale)}>
              {LOCALES.map((option) => (
                <option key={option.value} value={option.value} lang={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.locale ? <span className="field-error">{fieldErrors.locale}</span> : null}
          </label>
          <label className="field">
            {t("settings.longHorizonStart")}
            <input
              name="longHorizonStartYear"
              type="number"
              inputMode="numeric"
              min={2000}
              max={2100}
              defaultValue={current.longHorizonStartYear}
              aria-invalid={Boolean(fieldErrors.longHorizonStartYear)}
            />
            {fieldErrors.longHorizonStartYear ? <span className="field-error">{fieldErrors.longHorizonStartYear}</span> : null}
          </label>
          <button type="submit" className="primary-button">
            {update.isPending ? t("common.saving") : t("common.save")}
          </button>
        </fieldset>
      </form>
      {message ? (
        <p role={message.kind === "error" ? "alert" : "status"} className={`notice ${message.kind === "error" ? "notice--error" : "notice--ok"}`}>
          {t(message.key)}
        </p>
      ) : null}
    </section>
  );
}
