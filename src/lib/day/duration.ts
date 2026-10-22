// 004 FR-011: durations typed as "45", "1h", "1h30", "90m", "1.5h", "2 horas".
// Returns minutes, or null when the text is not a duration up to 24 hours.
export function parseDuration(text: string): number | null {
  const s = text.trim().toLowerCase().replace(",", ".");
  let minutes: number | null = null;
  const plain = /^(\d+)\s*(?:m|min|mins|minutos?|minutes?)?$/.exec(s);
  const hours = /^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|horas?|hours?)$/.exec(s);
  const mixed = /^(\d+)\s*h\s*(\d{1,2})\s*(?:m|min)?$/.exec(s);
  if (plain) minutes = Number(plain[1]);
  else if (hours) minutes = Math.round(Number(hours[1]) * 60);
  else if (mixed) {
    const extra = Number(mixed[2]);
    if (extra >= 60) return null;
    minutes = Number(mixed[1]) * 60 + extra;
  }
  return minutes !== null && minutes <= 1440 ? minutes : null;
}
