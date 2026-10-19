import { describe, expect, it } from "vitest";
import { keyForMove } from "./order";

const items = [
  { id: "a", orderKey: "a0" },
  { id: "b", orderKey: "a1" },
  { id: "c", orderKey: "a2" },
];

describe("keyForMove", () => {
  it("places an item between its new neighbours", () => {
    const key = keyForMove(items, "c", 1);
    expect(key > "a0" && key < "a1").toBe(true);
  });

  it("moves to the start and to the end", () => {
    expect(keyForMove(items, "c", 0) < "a0").toBe(true);
    expect(keyForMove(items, "a", 2) > "a2").toBe(true);
  });
});
