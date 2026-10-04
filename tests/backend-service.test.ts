import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ token: "session-token" as string | undefined }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (mocks.token ? { value: mocks.token } : undefined),
  }),
}));

import { backendRequest } from "@/services/backend";

beforeEach(() => {
  process.env.BASE_API_URL = "https://backend.example.test/api";
  mocks.token = "session-token";
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.BASE_API_URL;
});

describe("backend service transport", () => {
  it("builds an encoded route and query, sends auth, and disables caching", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ apiVersion: "1" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetcher);
    const result = await backendRequest("/invite-links/{token}", "get", {
      pathParams: { token: "a/b" },
    });
    expect(result.response.ok).toBe(true);
    const [url, init] = fetcher.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://backend.example.test/api/invite-links/a%2Fb");
    expect(init.cache).toBe("no-store");
    expect(init.method).toBe("GET");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer session-token");
    await backendRequest("/rooms", "get", {
      query: { page: 2, limit: 10, usersRoom: "false" },
    });
    const [roomsUrl] = fetcher.mock.calls[1] as [URL, RequestInit];
    expect(roomsUrl.searchParams.get("page")).toBe("2");
    expect(roomsUrl.searchParams.get("usersRoom")).toBe("false");
  });

  it("serializes JSON bodies and keeps public requests unauthenticated", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "ok" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetcher);
    await backendRequest("/auth/sign-in", "post", {
      body: { email: "a@example.test", password: "secret" },
      withAuth: false,
    });
    const [, init] = fetcher.mock.calls[0] as [URL, RequestInit];
    expect(new Headers(init.headers).get("authorization")).toBeNull();
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ email: "a@example.test", password: "secret" }));
  });

  it("preserves backend error status and message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ message: ["Invalid room", "Try again"] }),
      { status: 400, headers: { "content-type": "application/json" } },
    )));
    const result = await backendRequest("/rooms", "get");
    expect(result).toMatchObject({
      result: null,
      error: "Invalid room Try again",
      response: { ok: false, status: 400, message: "Invalid room Try again" },
    });
  });

  it("keeps multipart uploads as FormData without a JSON content type", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("{}", {
      status: 201, headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetcher);
    const body = new FormData();
    body.set("file", new Blob(["image"], { type: "image/png" }), "image.png");
    await backendRequest("/uploads/file", "post", { body });
    const [, init] = fetcher.mock.calls[0] as [URL, RequestInit];
    expect(init.body).toBe(body);
    expect(new Headers(init.headers).has("content-type")).toBe(false);
  });

  it("returns a network failure without fabricating a successful response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection lost")));
    const result = await backendRequest("/users/me", "get");
    expect(result).toMatchObject({
      result: null,
      error: "connection lost",
      response: { ok: false, status: 0 },
    });
  });
});
