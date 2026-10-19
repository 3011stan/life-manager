import type { getCatalogResponse200 } from "@/lib/api/generated/catalog/catalog";
import type { getDayResponse200 } from "@/lib/api/generated/days/days";
import type { getCycleResponse200 } from "@/lib/api/generated/objectives/objectives";

export type Day = getDayResponse200["data"];
export type Entry = Day["entries"][number];
export type Segment = Entry["segments"][number];
export type Catalog = getCatalogResponse200["data"];
export type Activity = Catalog["activities"][number];

export type CycleView = getCycleResponse200["data"];
export type Objective = CycleView["objectives"][number];
export type CycleHorizon = "week" | "month" | "year" | "y5" | "y10" | "y20";
export const HORIZONS: CycleHorizon[] = ["week", "month", "year", "y5", "y10", "y20"];
