import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  signIn: vi.fn(),
  verifyEmail: vi.fn(),
  register: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  refreshToken: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mocks.get, set: mocks.set }),
}));
vi.mock("@/services/auth/authServices", () => ({ default: mocks }));
vi.mock("@/services/user", () => ({ default: mocks }));
import { handleAuthRequest } from "@/lib/bff/auth";
import { tokenLifetime } from "@/lib/auth/session";
import { authHref, safeRedirectPath } from "@/lib/auth/redirect";

const ok = (result: unknown = null) => ({
  result,
  response: { ok: true, status: 200, statusText: "OK" },
});
const fail = (status: number, message = "Backend error") => ({
  result: null,
  response: { ok: false, status, statusText: "", message },
});
let pair = { accessToken: "", refreshToken: "fixture-refresh" };
function request(
  operation: string,
  body?: unknown,
  origin = "http://localhost",
) {
  return new Request(`http://localhost/api/auth/${operation}`, {
    method: "POST",
    headers: { origin },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
beforeEach(async () => {
  vi.resetAllMocks();
  const secret = crypto.randomUUID();
  vi.stubEnv("JWT_SECRET", secret);
  pair = {
    accessToken: await new SignJWT({ sub: "fixture-user" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode(secret)),
    refreshToken: "fixture-refresh",
  };
});
afterEach(() => vi.unstubAllEnvs());
describe("auth BFF", () => {
  it("rejects cross-origin auth requests before calling services", async () => {
    const response = await handleAuthRequest(
      request(
        "sign-in",
        { email: "user@example.test", password: "secret" },
        "https://evil.test",
      ),
      "sign-in",
    );
    expect(response.status).toBe(403);
    expect(mocks.signIn).not.toHaveBeenCalled();
  });
  it("rejects unsupported operations and GET session changes", async () => {
    expect((await handleAuthRequest(request("admin"), "admin")).status).toBe(
      404,
    );
    expect(
      (
        await handleAuthRequest(
          new Request("http://localhost/api/auth/sign-out"),
          "sign-out",
        )
      ).status,
    ).toBe(405);
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("writes both secure session cookies without exposing tokens to the client", async () => {
    mocks.signIn.mockResolvedValue(ok(pair));
    const response = await handleAuthRequest(
      request("sign-in", {
        email: " user@example.test ",
        password: "  keep spaces  ",
      }),
      "sign-in",
    );
    expect(response.status).toBe(200);
    expect(mocks.signIn).toHaveBeenCalledWith({
      email: "user@example.test",
      password: "  keep spaces  ",
    });
    expect(mocks.set).toHaveBeenCalledWith(
      "token",
      pair.accessToken,
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: expect.any(Number),
      }),
    );
    expect(mocks.set).toHaveBeenCalledWith(
      "refreshToken",
      pair.refreshToken,
      expect.objectContaining({ maxAge: 604800 }),
    );
    const result = await response.json();
    expect(result.result.authenticated).toBe(true);
    expect(JSON.stringify(result)).not.toContain(pair.accessToken);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("does not report an authenticated session when a token is missing", async () => {
    mocks.signIn.mockResolvedValue(ok({ accessToken: "fixture-access" }));
    expect(
      (
        await handleAuthRequest(
          request("sign-in", {
            email: "user@example.test",
            password: "secret",
          }),
          "sign-in",
        )
      ).status,
    ).toBe(502);
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("rejects an access token the route guard cannot validate instead of redirecting in a loop", async () => {
    mocks.get.mockReturnValue({ value: "refresh" });
    mocks.refreshToken.mockResolvedValue(
      ok({ ...pair, accessToken: "invalid" }),
    );
    const response = await handleAuthRequest(
      request("refresh-token"),
      "refresh-token",
    );
    expect(response.status).toBe(502);
    expect(mocks.set).not.toHaveBeenCalled();
    expect((await response.json()).response.message).toContain("sign in again");
  });
  it("supports verification without automatically establishing a session", async () => {
    mocks.verifyEmail.mockResolvedValue(ok({ message: "Verified" }));
    const response = await handleAuthRequest(
      request("verify", { email: "user@example.test", code: "1234" }),
      "verify",
    );
    expect((await response.json()).result.authenticated).toBe(false);
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("validates registration on the server", async () => {
    const response = await handleAuthRequest(
      request("register", {
        email: "user@example.test",
        username: "   ",
        password: "secret",
      }),
      "register",
    );
    expect(response.status).toBe(400);
    expect(mocks.register).not.toHaveBeenCalled();
  });
  it.each(["123", "12345", "abcd", undefined])(
    "rejects invalid verification code %s",
    async (code) => {
      const response = await handleAuthRequest(
        request("verify", { email: "user@example.test", code }),
        "verify",
      );
      expect(response.status).toBe(400);
      expect(mocks.verifyEmail).not.toHaveBeenCalled();
    },
  );
  it("rotates both tokens and uses the cookie refresh token rather than client input", async () => {
    mocks.get.mockReturnValue({ value: "opaque-refresh-token" });
    mocks.refreshToken.mockResolvedValue(ok(pair));
    const response = await handleAuthRequest(
      request("refresh-token", { refreshToken: "client-controlled" }),
      "refresh-token",
    );
    expect(response.status).toBe(200);
    expect(mocks.refreshToken).toHaveBeenCalledWith({
      refreshToken: "opaque-refresh-token",
    });
    expect(mocks.set).toHaveBeenCalledTimes(2);
  });
  it("clears invalid sessions and returns an actionable expired-session message", async () => {
    mocks.get.mockReturnValue({ value: "expired" });
    mocks.refreshToken.mockResolvedValue(fail(401));
    const response = await handleAuthRequest(
      request("refresh-token"),
      "refresh-token",
    );
    expect(response.status).toBe(401);
    expect(mocks.set).toHaveBeenCalledWith(
      "token",
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
    expect(mocks.set).toHaveBeenCalledWith(
      "refreshToken",
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
    expect((await response.json()).response.message).toContain("Sign in");
  });
  it("keeps the refresh cookie on a transient backend failure and hides infrastructure details", async () => {
    mocks.get.mockReturnValue({ value: "refresh" });
    mocks.refreshToken.mockResolvedValue(fail(503, "private-host:secret"));
    const response = await handleAuthRequest(
      request("refresh-token"),
      "refresh-token",
    );
    expect(response.status).toBe(502);
    expect(mocks.set).not.toHaveBeenCalled();
    expect(JSON.stringify(await response.json())).not.toContain("private-host");
  });
  it("clears the session after a successful password reset", async () => {
    mocks.resetPassword.mockResolvedValue(ok());
    const response = await handleAuthRequest(
      request("reset-password", {
        email: "user@example.test",
        code: "1234",
        password: "new-password",
      }),
      "reset-password",
    );
    expect(response.status).toBe(200);
    expect(mocks.set).toHaveBeenCalledTimes(2);
    expect((await response.json()).result.authenticated).toBe(false);
  });
  it("signs out even when the session has already expired", async () => {
    expect(
      (await handleAuthRequest(request("sign-out"), "sign-out")).status,
    ).toBe(200);
    expect(mocks.set).toHaveBeenCalledTimes(2);
  });
  it("normalizes invalid credentials into a useful message", async () => {
    mocks.signIn.mockResolvedValue(fail(401, "Unauthorized"));
    const response = await handleAuthRequest(
      request("sign-in", { email: "user@example.test", password: "wrong" }),
      "sign-in",
    );
    expect((await response.json()).response.message).toBe(
      "Your email or password is incorrect.",
    );
  });
  it("handles unexpected service exceptions without leaking diagnostics", async () => {
    mocks.forgotPassword.mockRejectedValue(new Error("private-host"));
    const response = await handleAuthRequest(
      request("forgot-password", { email: "user@example.test" }),
      "forgot-password",
    );
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("private-host");
  });
});
describe("return destinations", () => {
  it.each([
    "//evil.test",
    "https://evil.test",
    "/\\evil.test",
    "/%2f%2fevil.test",
    "/\t/evil.test",
    "/auth/sign-in",
    "/%61uth/sign-in",
    "/api/auth/refresh-token",
    "/rooms/../auth/sign-in",
    "/%broken",
  ])("rejects unsafe or looping redirect %s", (target) => {
    expect(safeRedirectPath(target, "/rooms")).toBe("/rooms");
  });
  it("preserves room query strings and safely encodes email/return context", () => {
    const target = "/rooms/3?search=a%26b&page=2";
    expect(safeRedirectPath(target)).toBe(target);
    const link = new URL(
      authHref("verify", { email: "user+tag@example.test", origin: target }),
      "http://localhost",
    );
    expect(link.searchParams.get("email")).toBe("user+tag@example.test");
    expect(link.searchParams.get("origin")).toBe(target);
  });
  it("uses JWT expiry instead of hard-coded conflicting access cookie lifetimes", () => {
    const token = [
      "e30",
      Buffer.from(JSON.stringify({ exp: 1600 })).toString("base64url"),
      "signature",
    ].join(".");
    expect(tokenLifetime(token, 900, 1000_000)).toBe(600);
    expect(tokenLifetime(token, 900, 1700_000)).toBe(0);
    expect(tokenLifetime("opaque", 604800)).toBe(604800);
  });
});
