// Research R8: deterministic suggestions from loose lines in Portuguese or
// English. A time mark is a start time or a duration, never both (001 F1).

export interface CaptureActivity {
  id: string;
  name: string;
}

export interface Suggestion {
  source: string;
  title: string;
  startTime: string | null;
  minutes: number | null;
  status: "planned" | "completed" | "skipped";
  activityId: string | null;
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const SKIPPED = /^(?:nao|não)\s+(?:fiz|fui|li|estudei|treinei)\b|^(?:didn'?t|did not|skipped|pulei)\b/i;
const DONE = /^(?:fiz|fui|terminei|trabalhei(?:\s+(?:no|na|em))?|estudei|treinei|li|did|done|finished|went(?:\s+to)?|worked(?:\s+on)?|studied)\b/i;
const PLANNED_CUES = /^(?:preciso(?:\s+de)?|vou|tenho que|need to|will|have to|must)\b/i;
const FILLER = /\b(?:amanh[aã]|tomorrow|hoje|today|umas?|uns|cerca de|about|around|for|por|durante)\b/gi;

const pad = (n: number) => String(n).padStart(2, "0");

interface TimeMark {
  startTime: string | null;
  minutes: number | null;
  rest: string;
}

function readTime(line: string): TimeMark {
  // Explicit starts: "às 7", "at 7pm", "18:30", "7pm".
  // "à" is not a word character, so the start is a space or the line start.
  const at = /(?:^|\s)(?:[àa]s|at)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|h)?\b/i.exec(line);
  const clock = /\b(\d{1,2}):(\d{2})\b/.exec(line);
  const meridiem = /\b(\d{1,2})\s*(am|pm)\b/i.exec(line);
  const start = at ?? clock ?? meridiem;
  if (start) {
    let hour = Number(start[1]);
    const minute = start === meridiem ? 0 : Number(start[2] ?? 0);
    const suffix = (start === meridiem ? start[2] : start === at ? start[3] : undefined)?.toLowerCase();
    if (suffix === "pm" && hour < 12) hour += 12;
    if (suffix === "am" && hour === 12) hour = 0;
    if (hour < 24 && minute < 60) return { startTime: `${pad(hour)}:${pad(minute)}`, minutes: null, rest: line.replace(start[0], " ") };
  }
  // Durations in words: "45 min", "2 horas", "2 hours".
  const words = /\b(\d+(?:[.,]\d+)?)\s*(min(?:utos?|utes?|s)?|h(?:oras?|ours?|rs?)?)\b/i.exec(line);
  // "19h", "9h30", "1h30", "2h": an hour mark of 6 or more without a duration
  // cue is a start time; short ones are durations.
  const compact = /\b(\d{1,2})h(\d{2})?\b/i.exec(line);
  if (compact) {
    const hour = Number(compact[1]);
    const minute = Number(compact[2] ?? 0);
    const before = line.slice(0, compact.index);
    const durationCue = /\b(?:umas?|uns|cerca de|about|around|for|por|durante|estudei|trabalhei|treinei|li)\s*$/i.test(before);
    if (hour >= 6 && !durationCue && hour < 24) return { startTime: `${pad(hour)}:${pad(minute)}`, minutes: null, rest: line.replace(compact[0], " ") };
    return { startTime: null, minutes: hour * 60 + minute, rest: line.replace(compact[0], " ") };
  }
  if (words) {
    const amount = Number((words[1] ?? "0").replace(",", "."));
    const isHours = /^h/i.test(words[2] ?? "");
    return { startTime: null, minutes: Math.round(isHours ? amount * 60 : amount), rest: line.replace(words[0], " ") };
  }
  return { startTime: null, minutes: null, rest: line };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function bestActivity(line: string, activities: CaptureActivity[]): CaptureActivity | undefined {
  const text = ` ${fold(line)} `;
  return activities
    .filter((a) => text.includes(` ${fold(a.name)} `) || text.includes(` ${fold(a.name)}`))
    .sort((a, b) => b.name.length - a.name.length)[0];
}

export function parseLine(source: string, activities: CaptureActivity[]): Suggestion {
  const line = source.trim();
  const status = SKIPPED.test(line) ? "skipped" : DONE.test(line) ? "completed" : "planned";
  const time = readTime(line);
  const title = time.rest
    .replace(SKIPPED, " ")
    .replace(DONE, " ")
    .replace(PLANNED_CUES, " ")
    .replace(FILLER, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(?:no|na|em|on|the\s+)?\s*/i, (m) => (/^the\s+/i.test(m) ? m : ""));
  const activity = bestActivity(line, activities);
  return {
    source: line,
    title: capitalize(title || line),
    startTime: time.startTime,
    minutes: time.minutes,
    status,
    activityId: activity?.id ?? null,
  };
}

export function parseCapture(text: string, activities: CaptureActivity[]): Suggestion[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => parseLine(l, activities));
}
