// 009b: a day that reopens keeps its check-in and notes, so its close starts
// from them instead of empty, and closing again does not erase them.
export type CheckInKey = "physicalEnergy" | "mentalEnergy" | "emotionalEnergy" | "satisfaction";
export type CheckIn = Record<CheckInKey, number | null>;

export const CHECK_IN: CheckInKey[] = ["physicalEnergy", "mentalEnergy", "emotionalEnergy", "satisfaction"];
export const EMPTY_CHECK_IN: CheckIn = { physicalEnergy: null, mentalEnergy: null, emotionalEnergy: null, satisfaction: null };

export function savedCheckIn(saved: CheckIn | null): CheckIn {
  return saved ? { ...EMPTY_CHECK_IN, ...saved } : { ...EMPTY_CHECK_IN };
}
