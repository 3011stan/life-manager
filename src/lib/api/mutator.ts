import { connectivity } from "@/lib/offline/connectivity";

// ADR 0007: every generated API call goes through this function. It owns
// credentials, idempotency keys, error mapping, and the offline read-only guard.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface Problem {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  errors?: { field: string; message: string }[];
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: Problem | undefined,
  ) {
    super(problem?.detail ?? problem?.title ?? `Request failed with status ${String(status)}`);
  }
}

export class ReadOnlyError extends Error {
  constructor() {
    super("Offline: changes are disabled until the connection returns.");
  }
}

const SAFE_METHODS = new Set(["GET", "HEAD"]);

async function readProblem(res: Response): Promise<Problem | undefined> {
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("json")) return undefined;
  return (await res.json()) as Problem;
}

export async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const mutating = !SAFE_METHODS.has(method);
  if (mutating && connectivity.getSnapshot().readOnly) throw new ReadOnlyError();

  const headers = new Headers(options.headers);
  // FR-012: lets the API default a new workspace to this device's time zone.
  headers.set("x-time-zone", Intl.DateTimeFormat().resolvedOptions().timeZone);
  if (mutating) {
    if (!headers.has("idempotency-key")) headers.set("idempotency-key", crypto.randomUUID());
    if (options.body !== undefined && !headers.has("content-type")) headers.set("content-type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${url}`, { ...options, method, headers, credentials: "include" });
  } catch (error) {
    // A request cancelled by navigation says nothing about the connection.
    if (!(error instanceof DOMException && error.name === "AbortError")) connectivity.markApiReachable(false);
    throw error;
  }
  connectivity.markApiReachable(true);
  if (!res.ok) throw new ApiError(res.status, await readProblem(res));

  const isJson = (res.headers.get("content-type") ?? "").includes("json");
  const data: unknown = res.status === 204 ? undefined : isJson ? await res.json() : await res.text();
  return { data, status: res.status, headers: res.headers } as T;
}
