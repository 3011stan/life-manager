import type { getDayResponse200 } from "@/lib/api/generated/days/days";
import type { getCatalogResponse200 } from "@/lib/api/generated/catalog/catalog";

export type Day = getDayResponse200["data"];
export type Entry = Day["entries"][number];
export type Segment = Entry["segments"][number];
export type Catalog = getCatalogResponse200["data"];
export type Activity = Catalog["activities"][number];
