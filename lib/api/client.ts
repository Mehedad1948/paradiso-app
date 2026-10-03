import type { RequestResult } from "@/types/request";

export class BffError extends Error {
  constructor(
    message: string,
    public readonly status: number,
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
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new BffError("Unable to connect. Please try again.", 0);
  }
  let payload: RequestResult<T>;
  try {
    payload = await response.json();
  } catch {
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
