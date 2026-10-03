import type { FreeformSuggestion, ItemStatus } from "@/types/life-manager";
import { createId } from "./timeline";

const durationPatterns = [
  /(\d+(?:[.,]\d+)?)\s*h(?:oras?)?/i,
  /(\d+)\s*(?:m|min|minutos?)/i,
];

export function parseFreeformText(text: string): FreeformSuggestion[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      id: createId("suggestion"),
      sourceText: line,
      title: inferTitle(line),
      plannedMinutes: inferMinutes(line),
      actualMinutes: inferMinutes(line),
      plannedStart: inferStart(line),
      status: inferStatus(line),
      accepted: false,
    }));
}

function inferTitle(line: string): string {
  return line
    .replace(durationPatterns[0], "")
    .replace(durationPatterns[1], "")
    .replace(/\b(?:fiz|feito|conclui|concluí|preciso|amanha|amanhã|hoje)\b/gi, "")
    .replace(/\b\d{1,2}h(?:\d{2})?\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (match) => match.toUpperCase()) || line;
}

function inferMinutes(line: string): number | undefined {
  const hourMatch = line.match(durationPatterns[0]);
  if (hourMatch?.[1]) {
    return Math.round(Number(hourMatch[1].replace(",", ".")) * 60);
  }

  const minuteMatch = line.match(durationPatterns[1]);
  if (minuteMatch?.[1]) {
    return Number(minuteMatch[1]);
  }

  return undefined;
}

function inferStart(line: string): string | undefined {
  const match = line.match(/\b(\d{1,2})h(?:(\d{2}))?\b/i);
  if (!match) {
    return undefined;
  }

  const hour = match[1].padStart(2, "0");
  const minute = match[2] ?? "00";
  return `${hour}:${minute}`;
}

function inferStatus(line: string): ItemStatus {
  const normalized = line.toLowerCase();

  if (/\b(n[aã]o fiz|nao fiz|não fiz|pul(ei|ado)|skip)/i.test(normalized)) {
    return "skipped";
  }

  if (/\b(fiz|feito|conclui|concluí|terminei|trabalhei)\b/i.test(normalized)) {
    return "completed";
  }

  return "planned";
}
