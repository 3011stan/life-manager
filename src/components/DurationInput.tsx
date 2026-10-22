"use client";

import { useState } from "react";
import { formatMinutes } from "@/lib/day/dates";
import { parseDuration } from "@/lib/day/duration";
import { useT } from "@/lib/i18n";

interface Props {
  value: number | null;
  onChange: (minutes: number) => void;
  label?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
}

// 004 FR-011: one field for every duration; "1h30" and "90" both mean 90 minutes.
export function DurationInput({ value, onChange, label, disabled, allowEmpty }: Props) {
  const t = useT();
  const [text, setText] = useState(value === null ? "" : formatMinutes(value));
  const [invalid, setInvalid] = useState(false);

  function commit() {
    if (allowEmpty && text.trim() === "") return setInvalid(false);
    const minutes = parseDuration(text);
    if (minutes === null) return setInvalid(true);
    setInvalid(false);
    setText(formatMinutes(minutes));
    onChange(minutes);
  }

  return (
    <>
      <input
        aria-label={label}
        value={text}
        inputMode="text"
        autoComplete="off"
        disabled={disabled}
        aria-invalid={invalid}
        placeholder="1h30"
        onChange={(e) => {
          setText(e.target.value);
          const minutes = parseDuration(e.target.value);
          if (minutes !== null) onChange(minutes);
        }}
        onBlur={commit}
      />
      {invalid ? <span className="field-error">{t("duration.invalid")}</span> : null}
    </>
  );
}
