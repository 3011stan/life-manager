"use client";

import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";
import { en, type Dictionary, type MessageKey } from "./en";
import { ptBR } from "./pt-BR";

// Research R9: two typed dictionaries, no locale routing.
export type Locale = "pt-BR" | "en";

const DICTIONARIES: Record<Locale, Dictionary> = { en, "pt-BR": ptBR };

export function browserLocale(): Locale {
  if (typeof navigator === "undefined") return "pt-BR";
  return navigator.language.toLowerCase().startsWith("en") ? "en" : "pt-BR";
}

export type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

export function translator(locale: Locale): Translate {
  const dictionary = DICTIONARIES[locale];
  return (key, values) =>
    dictionary[key].replace(/\{(\w+)\}/g, (match, name: string) => (values && name in values ? String(values[name]) : match));
}

const I18nContext = createContext<{ locale: Locale; t: Translate }>({ locale: "en", t: translator("en") });

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return <I18nContext.Provider value={{ locale, t: translator(locale) }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT(): Translate {
  const { t } = useI18n();
  return useCallback<Translate>((key, values) => t(key, values), [t]);
}

export function formatDate(locale: Locale, date: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
