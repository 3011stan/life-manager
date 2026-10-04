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

let readOnly = false;

// Set by the connectivity layer (ADR 0006). Mutations are refused while true.
export function setReadOnly(value: boolean): void {
  readOnly = value;
}

export function isReadOnly(): boolean {
  return readOnly;
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
  if (mutating && readOnly) throw new ReadOnlyError();

  const headers = new Headers(options.headers);
  if (mutating) {
    if (!headers.has("idempotency-key")) headers.set("idempotency-key", crypto.randomUUID());
    if (options.body !== undefined && !headers.has("content-type")) headers.set("content-type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}${url}`, { ...options, method, headers, credentials: "include" });
  if (!res.ok) throw new ApiError(res.status, await readProblem(res));

  const data: unknown = res.status === 204 ? undefined : await res.json();
  return { data, status: res.status, headers: res.headers } as T;
}
