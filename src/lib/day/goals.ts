// 009 G2, G3, G8, G9: when two goals of one period are the same thing.

// The title without case, a trailing amount ("6×", "4h", "1h30", "45min",
// "20 h"), or a period label (" · Nov", " · 2099"): "Lumbar exercises 6×" and
// "Lumbar exercises" are the same title. The API uses the same rule.
export function baseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s·\s.*$/u, "")
    .replace(/\s+\d+(\.\d+)?\s*(×|x|h|min|h\d+)\s*$/iu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

export interface Alike {
  title: string;
  activityIds: string[];
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

// Same activities when both track some; otherwise the same base title.
export function sameThing(a: Alike, b: Alike): boolean {
  if (a.activityIds.length > 0 && b.activityIds.length > 0) return sameSet(a.activityIds, b.activityIds);
  const base = baseTitle(a.title);
  return base !== "" && base === baseTitle(b.title);
}
