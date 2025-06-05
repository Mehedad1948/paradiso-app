import { refreshAccessToken } from "@/app/actions/auth/refresh-token";
import { cookies } from "next/headers";
import { AuthServices } from "./auth/authServices";

type RequestResult<T> = {
  result: T | null;
  response?: Response;
  error?: string;
};
// utils/WebServices.ts
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface RequestOptions extends Omit<RequestInit, "method" | "body"> {
  params?: Record<string, any>;
  body?: any;
  withAuth?: boolean;
}

export class WebServices {
  private subBaseUrl?: string;
  constructor(subBaseUrl?: string) {
    this.subBaseUrl = subBaseUrl;
  }
  private buildQueryString(params?: Record<string, any>): string {
    if (!params) return "";
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null)
        query.append(key, String(value));
    });
    return `?${query.toString()}`;
  }

  private async request<T>(
    url: string,
    method: HttpMethod,
    options: RequestOptions = {},
  ): Promise<RequestResult<T>> {
    const { params, body, headers = {}, withAuth = true, ...rest } = options;
    const fullUrl = `${process.env.BASE_API_URL}${this.subBaseUrl || ""}${url}${this.buildQueryString(params)}`;

    const normalizedHeaders = new Headers(headers);

    if (withAuth) {
      const cookieStore = await cookies();
      const token = cookieStore.get("token")?.value;

      if (token) {
        normalizedHeaders.set("Authorization", `Bearer ${token}`);
      }
    }

    if (body && !(body instanceof FormData)) {
      normalizedHeaders.set("Content-Type", "application/json");
    }

    const init: RequestInit = {
      method,
      headers: normalizedHeaders,
      ...rest,
    };

    if (body instanceof FormData) {
      init.body = body;
    } else if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(fullUrl, init);

      const contentType = response.headers.get("content-type");
      let parsed: any = null;

      if (contentType?.includes("application/json")) {
        parsed = await response.json();
      } else {
        parsed = await response.text();
      }

      if (!response.ok) {
        return {
          result: parsed,
          response,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        result: parsed as T,
        response,
      };
    } catch (error: any) {
      return {
        result: null,
        error: error.message || "Unknown fetch error",
      };
    }
  }

  public get<T>(
    url: string,
    options?: RequestOptions,
  ): Promise<RequestResult<T>> {
    return this.request<T>(url, "GET", options);
  }

  public post<T>(
    url: string,
    options?: RequestOptions,
  ): Promise<RequestResult<T>> {
    return this.request<T>(url, "POST", options);
  }

  public put<T>(
    url: string,
    options?: RequestOptions,
  ): Promise<RequestResult<T>> {
    return this.request<T>(url, "PUT", options);
  }

  public delete<T>(
    url: string,
    options?: RequestOptions,
  ): Promise<RequestResult<T>> {
    return this.request<T>(url, "DELETE", options);
  }

  public patch<T>(
    url: string,
    options?: RequestOptions,
  ): Promise<RequestResult<T>> {
    return this.request<T>(url, "PATCH", options);
  }
}

function normalizeHeaders(
  headers: HeadersInit | undefined,
): Record<string, string> {
  const result: Record<string, string> = {};

  if (!headers) return result;

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key] = value;
    });
  } else if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => {
      result[key] = value;
    });
  } else {
    Object.assign(result, headers);
  }

  return result;
}
