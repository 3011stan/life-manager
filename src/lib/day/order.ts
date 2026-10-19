import { generateKeyBetween } from "fractional-indexing";

// Research R3: a move changes only the moved entry's key.
export function keyForMove<T extends { id: string; orderKey: string }>(items: T[], id: string, toIndex: number): string {
  const others = items.filter((i) => i.id !== id);
  const before = others[toIndex - 1]?.orderKey ?? null;
  const after = others[toIndex]?.orderKey ?? null;
  return generateKeyBetween(before, after);
}
