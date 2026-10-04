import "server-only";
import { cookies } from "next/headers";
import type { RequestResult } from "@/types/request";
import type {
  BackendMethod,
  BackendPath,
  BackendPathParams,
  BackendQuery,
  BackendRequestBody,
  BackendResponse,
} from "@/types/backend";

type RequestOptions<
  Path extends BackendPath,
  Method extends BackendMethod<Path>,
> = {
  pathParams?: BackendPathParams<Path, Method>;
  query?: BackendQuery<Path, Method>;
  body?: BackendRequestBody<Path, Method> | (Path extends "/uploads/file" ? FormData : never);
  signal?: AbortSignal;
  withAuth?: boolean;
};

function messageFrom(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || !("message" in value)) return;
  const message = value.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message))
    return message.filter((item): item is string => typeof item === "string").join(" ");
}

/** Server-only transport. Operation types come from the generated OpenAPI file. */
export async function backendRequest<
  Path extends BackendPath,
  Method extends BackendMethod<Path>,
>(
  path: Path,
  method: Method,
  options: RequestOptions<Path, Method> = {},
): Promise<RequestResult<BackendResponse<Path, Method>>> {
  const { pathParams, query, body, signal, withAuth = true } = options;
  try {
    const baseUrl = process.env.BASE_API_URL;
    if (!baseUrl) throw new Error("BASE_API_URL is not configured");
    const expandedPath = String(path).replace(/\{([^}]+)\}/g, (_, key: string) => {
      const value = (pathParams as Record<string, string | number> | undefined)?.[key];
      if (value === undefined || value === null) throw new Error(`Missing backend path parameter: ${key}`);
      return encodeURIComponent(String(value));
    });
    const url = new URL(`${baseUrl.replace(/\/$/, "")}${expandedPath}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
      }
    }

    const headers = new Headers();
    if (withAuth) {
      const token = (await cookies()).get("token")?.value;
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    if (body !== undefined && !(body instanceof FormData))
      headers.set("Content-Type", "application/json");

    const response = await fetch(url, {
      method: String(method).toUpperCase(),
      headers,
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(15_000)])
        : AbortSignal.timeout(15_000),
    });
    const contentType = response.headers.get("content-type");
    const parsed: unknown = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();
    const message = messageFrom(parsed);
    return {
      result: response.ok ? (parsed as BackendResponse<Path, Method>) : null,
      response: {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        ...(message ? { message } : {}),
      },
      error: response.ok ? undefined : message || `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";
    return {
      result: null,
      response: { ok: false, status: 0, statusText: "", message },
      error: message,
    };
  }
}
