import { afterEach, describe, expect, it, vi } from "vitest";
import { connectivity } from "@/lib/offline/connectivity";
import { ApiError, ReadOnlyError, apiFetch } from "./mutator";

afterEach(() => {
  connectivity.reset();
  vi.unstubAllGlobals();
});

function stubFetch(makeResponse: () => Response) {
  const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(makeResponse()));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("apiFetch", () => {
  it("sends credentials and returns data with status", async () => {
    const fetchMock = stubFetch(() => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }));
    const result = await apiFetch<{ data: unknown; status: number }>("/health", { method: "GET" });
    expect(result).toMatchObject({ data: { ok: true }, status: 200 });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: "include" });
  });

  it("returns non-JSON bodies as text", async () => {
    stubFetch(() => new Response("# Export\n", { status: 200, headers: { "content-type": "text/markdown; charset=utf-8" } }));
    const result = await apiFetch<{ data: unknown }>("/v1/export?format=markdown", { method: "GET" });
    expect(result.data).toBe("# Export\n");
  });

  it("adds an idempotency key to mutations", async () => {
    const fetchMock = stubFetch(() => new Response(null, { status: 204 }));
    await apiFetch("/v1/thing", { method: "PATCH", body: "{}" });
    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get("idempotency-key")).toMatch(/^[0-9a-f-]{36}$/);
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("maps problem+json errors", async () => {
    stubFetch(() => new Response(JSON.stringify({ title: "Not Found", status: 404 }), { status: 404, headers: { "content-type": "application/problem+json" } }));
    await expect(apiFetch("/v1/missing", { method: "GET" })).rejects.toMatchObject({ status: 404, problem: { title: "Not Found" } });
    await expect(apiFetch("/v1/missing", { method: "GET" }).catch((e: unknown) => e)).resolves.toBeInstanceOf(ApiError);
  });

  it("refuses mutations while read-only, but still allows reads", async () => {
    const fetchMock = stubFetch(() => new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } }));
    connectivity.setBrowserOnline(false);
    await expect(apiFetch("/v1/thing", { method: "PATCH", body: "{}" })).rejects.toBeInstanceOf(ReadOnlyError);
    await apiFetch("/health", { method: "GET" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
