import type { RequestResult } from "@/types/request";

export class BffError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: Record<string, string>,
    /** Seconds to wait before retrying; set on a 429. */
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "BffError";
  }
}

export async function bffRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  return apiRequest<T>(`/api/bff${path}`, options);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers,
      credentials: "same-origin",
      // Private data skips the HTTP cache unless a caller opts in for public, slow-changing data.
      cache: options.cache ?? "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new BffError("Unable to connect. Please try again.", 0);
  }
  let payload: RequestResult<T>;
  try {
    payload = await response.json();
  } catch {
    // A platform-level limiter answers 429 without our JSON envelope.
    if (response.status === 429)
      throw new BffError(
        "Too many attempts. Try again later.",
        429,
        undefined,
        Number(response.headers.get("retry-after")) || undefined,
      );
    throw new BffError(
      "The service returned an unexpected response. Please try again.",
      response.status || 502,
    );
  }
  if (!payload?.response || typeof payload.response.ok !== "boolean")
    throw new BffError(
      "The service returned an unexpected response. Please try again.",
      502,
    );
  if (!response.ok || !payload.response.ok) {
    throw new BffError(
      payload.response.message || payload.error || "Request failed",
      response.status,
      payload.response.fieldErrors,
      payload.response.retryAfter,
    );
  }
  return payload.result as T;
}

export function queryString(params: Record<string, unknown>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(
        key,
        value instanceof Date ? value.toISOString() : String(value),
      );
    }
  }
  return query.size ? `?${query}` : "";
}
