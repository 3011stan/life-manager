import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ReadOnlyError } from "@/lib/api/mutator";
import { connectivity } from "./connectivity";

afterEach(() => {
  connectivity.reset();
  vi.unstubAllGlobals();
});

function stubFetch(impl: () => Promise<Response>) {
  const fetchMock = vi.fn<typeof fetch>(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const ok = () => Promise.resolve(new Response("{}", { status: 200, headers: { "content-type": "application/json" } }));

describe("connectivity (FR-016)", () => {
  it("is read-only while the browser reports offline", () => {
    connectivity.setBrowserOnline(false);
    expect(connectivity.getSnapshot().readOnly).toBe(true);
    connectivity.setBrowserOnline(true);
    expect(connectivity.getSnapshot().readOnly).toBe(false);
  });

  it("becomes read-only when the API cannot be reached and recovers on the next success", async () => {
    stubFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    await expect(apiFetch("/v1/me", { method: "GET" })).rejects.toBeInstanceOf(TypeError);
    expect(connectivity.getSnapshot()).toMatchObject({ readOnly: true, apiReachable: false });

    stubFetch(ok);
    await apiFetch("/v1/me", { method: "GET" });
    expect(connectivity.getSnapshot()).toMatchObject({ readOnly: false, apiReachable: true });
  });

  it("blocks mutations in the data layer while read-only, without calling the network", async () => {
    const fetchMock = stubFetch(ok);
    connectivity.setBrowserOnline(false);
    await expect(apiFetch("/v1/workspace/settings", { method: "PATCH", body: "{}" })).rejects.toBeInstanceOf(ReadOnlyError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("notifies subscribers when the state changes", () => {
    const listener = vi.fn();
    const unsubscribe = connectivity.subscribe(listener);
    connectivity.setBrowserOnline(false);
    unsubscribe();
    connectivity.setBrowserOnline(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
