"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  getGetWorkspaceSettingsQueryKey,
  useGetWorkspaceSettings,
  useUpdateWorkspaceSettings,
} from "@/lib/api/generated/settings/settings";
import { ApiError, ReadOnlyError } from "@/lib/api/mutator";
import { useConnectivity } from "@/lib/offline/use-connectivity";

const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function timeZones(current: string): string[] {
  const all = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return all.includes(current) ? all : [current, ...all];
}

type FieldErrors = Partial<Record<"weekStartDay" | "timeZone" | "defaultDailyCapacityMinutes", string>>;

export function SettingsForm() {
  const queryClient = useQueryClient();
  const { readOnly } = useConnectivity();
  const settings = useGetWorkspaceSettings();
  const update = useUpdateWorkspaceSettings();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ kind: "saved" | "error"; text: string }>();

  if (!settings.data) {
    return <section className="panel">{settings.isError ? <p className="notice notice--error">Could not load settings.</p> : <p>Loading…</p>}</section>;
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
        },
      });
      queryClient.setQueryData(getGetWorkspaceSettingsQueryKey(), result);
      setMessage({ kind: "saved", text: "Saved." });
    } catch (error) {
      // FR-015: the stored value stays; nothing unsaved is shown as saved.
      if (error instanceof ApiError && error.problem?.errors) {
        setFieldErrors(Object.fromEntries(error.problem.errors.map((e) => [e.field, e.message])) as FieldErrors);
        setMessage({ kind: "error", text: "Check the highlighted fields." });
      } else if (error instanceof ReadOnlyError) {
        setMessage({ kind: "error", text: error.message });
      } else {
        setMessage({ kind: "error", text: "Could not save. Your previous settings are unchanged." });
      }
    }
  }

  return (
    <section className="panel">
      <h1>Settings</h1>
      <form className="stack" onSubmit={(e) => void save(e)} key={current.version}>
        <fieldset className="stack plain-fieldset" disabled={readOnly || update.isPending}>
          <label className="field">
            Week starts on
            <select name="weekStartDay" defaultValue={current.weekStartDay} aria-invalid={Boolean(fieldErrors.weekStartDay)}>
              {WEEK_DAYS.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
            {fieldErrors.weekStartDay ? <span className="field-error">{fieldErrors.weekStartDay}</span> : null}
          </label>
          <label className="field">
            Time zone
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
            Daily capacity (minutes)
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
          <button type="submit" className="primary-button">
            {update.isPending ? "Saving…" : "Save"}
          </button>
        </fieldset>
      </form>
      {message ? (
        <p role={message.kind === "error" ? "alert" : "status"} className={`notice ${message.kind === "error" ? "notice--error" : "notice--ok"}`}>
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
