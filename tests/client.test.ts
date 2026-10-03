import { afterEach, expect, it, vi } from "vitest";
import { bffRequest, queryString } from "@/lib/api/client";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { assertSameOrigin } from "@/lib/bff/validation";

afterEach(() => vi.unstubAllGlobals());
it("accepts same-origin mutations when Next uses an internal request URL", () => {
  const request = new Request("http://localhost:3100/api/bff/rooms", {
    method: "POST",
    headers: { origin: "http://127.0.0.1:3100", host: "127.0.0.1:3100" },
  });
  expect(() => assertSameOrigin(request)).not.toThrow();
});
it("accepts the public HTTPS host behind a deployment proxy", () => {
  const request = new Request("http://localhost:3000/api/bff/rooms", {
    method: "POST",
    headers: {
      origin: "https://paradiso.example",
      "x-forwarded-host": "paradiso.example",
      "x-forwarded-proto": "https",
    },
  });
  expect(() => assertSameOrigin(request)).not.toThrow();
});
it("uses only same-origin BFF requests and passes cancellation", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      Response.json({ result: { id: 1 }, response: { ok: true } }),
    );
  vi.stubGlobal("fetch", fetch);
  const signal = new AbortController().signal;
  expect(await bffRequest("/me", { signal })).toEqual({ id: 1 });
  expect(fetch).toHaveBeenCalledWith(
    "/api/bff/me",
    expect.objectContaining({
      signal,
      credentials: "same-origin",
      cache: "no-store",
    }),
  );
});
it("turns authorization failures into typed errors for query retry decisions", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { result: null, response: { ok: false, message: "Sign in" } },
          { status: 401 },
        ),
      ),
  );
  await expect(bffRequest("/me")).rejects.toMatchObject({
    status: 401,
    message: "Sign in",
    name: "BffError",
  });
});
it("encodes search strings and preserves zero/false filter values", () => {
  const query = new URLSearchParams(
    queryString({
      search: "a&b? c",
      isWatchTogether: false,
      rate: 0,
      empty: undefined,
    }).slice(1),
  );
  expect(query.get("search")).toBe("a&b? c");
  expect(query.get("isWatchTogether")).toBe("false");
  expect(query.get("rate")).toBe("0");
  expect(query.has("empty")).toBe(false);
});
it.each(["https://evil.test", "//evil.test", "/\\evil.test"])(
  "rejects external session redirect %s",
  (url) => {
    expect(safeRedirectPath(url, "/rooms")).toBe("/rooms");
  },
);
