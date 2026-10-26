import type { Locale } from "@/lib/i18n";

// 006: helpers for the agenda section and its sheet.

export function weekdayNames(locale: Locale): string[] {
  const format = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  // 2023-01-01 was a Sunday.
  return Array.from({ length: 7 }, (_, i) => format.format(new Date(Date.UTC(2023, 0, 1 + i))).replace(/\.$/, ""));
}

// "Sun–Fri" for a run of three or more days (wrapping past Saturday), else a list.
export function weekdaysLabel(days: number[], names: string[], everyDay: string): string {
  const set = [...new Set(days)].sort((a, b) => a - b);
  if (set.length === 7) return everyDay;
  const name = (d: number) => names[d] ?? String(d);
  if (set.length >= 3) {
    for (const first of set) {
      const run = Array.from({ length: set.length }, (_, i) => (first + i) % 7);
      if (run.every((d) => set.includes(d))) return `${name(first)}–${name(run.at(-1) ?? first)}`;
    }
  }
  return set.map(name).join(", ");
}

// D4: today's month and the months after it that hold something; today's and
// the next are open, the rest collapsed.
export function agendaMonths<T extends { date: string }>(today: string, items: T[]): { month: string; open: boolean; items: T[] }[] {
  const current = today.slice(0, 7);
  const next = nextMonth(current);
  const months = new Set([current, ...items.map((i) => i.date.slice(0, 7))]);
  return [...months]
    .sort()
    .map((month) => ({
      month,
      open: month === current || month === next,
      items: items.filter((i) => i.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .filter((m) => m.items.length > 0 || m.month === current);
}

function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return m === 12 ? `${String(y + 1)}-01` : `${String(y)}-${String(m + 1).padStart(2, "0")}`;
}

// The queries an agenda change or a checked task can move: the agenda, days,
// cycles, the goals tree, and templates (D7 archives them).
export function isPlanningKey(key: readonly unknown[]): boolean {
  const path = key[0];
  return typeof path === "string" && /^\/v1\/(agenda|days|cycles|goals|objective-templates|weeks)/.test(path);
}
