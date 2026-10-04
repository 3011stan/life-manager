import { hydrate } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryClient } from "./create-query-client";

afterEach(() => {
  vi.useRealTimers();
});

describe("createQueryClient", () => {
  // Regression: a 30-day gcTime exceeds the maximum setTimeout delay, so the
  // timer fired immediately and restored offline data was garbage-collected
  // before any screen could read it.
  it("keeps restored data that no screen is using yet", () => {
    vi.useFakeTimers();
    const client = createQueryClient();
    hydrate(client, {
      mutations: [],
      queries: [
        {
          queryKey: ["/v1/me"],
          queryHash: '["/v1/me"]',
          dehydratedAt: Date.now(),
          state: {
            data: { data: { ok: true } },
            dataUpdateCount: 1,
            dataUpdatedAt: Date.now(),
            error: null,
            errorUpdateCount: 0,
            errorUpdatedAt: 0,
            fetchFailureCount: 0,
            fetchFailureReason: null,
            fetchMeta: null,
            isInvalidated: false,
            status: "success",
            fetchStatus: "idle",
          },
        },
      ],
    });
    vi.advanceTimersByTime(60_000);
    expect(client.getQueryData(["/v1/me"])).toEqual({ data: { ok: true } });
  });
});
