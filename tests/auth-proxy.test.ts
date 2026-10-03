import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { randomBytes } from "node:crypto";
vi.mock("server-only", () => ({}));
import { proxy } from "@/proxy";

const secret = randomBytes(32).toString("hex");
beforeEach(() => vi.stubEnv("JWT_SECRET", secret));
afterEach(() => vi.unstubAllEnvs());
it("preserves the complete return destination when a session is missing", async () => {
  const response = await proxy(
    new NextRequest("http://localhost/rooms/3?search=a%26b&page=2"),
  );
  const redirect = new URL(response.headers.get("location")!);
  expect(redirect.pathname).toBe("/auth/sign-in");
  expect(redirect.searchParams.get("origin")).toBe(
    "/rooms/3?search=a%26b&page=2",
  );
  expect(redirect.searchParams.has("refresh")).toBe(false);
});
it("passes an opaque refresh token to backend renewal rather than verifying it with the access secret", async () => {
  const response = await proxy(
    new NextRequest("http://localhost/rooms/3", {
      headers: { cookie: "token=invalid; refreshToken=opaque-refresh" },
    }),
  );
  const redirect = new URL(response.headers.get("location")!);
  expect(redirect.searchParams.get("refresh")).toBe("true");
  expect(redirect.searchParams.get("reason")).toBe("session-expired");
});
it("allows a valid access session through", async () => {
  const token = await new SignJWT({ sub: "1" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
  const response = await proxy(
    new NextRequest("http://localhost/rooms", {
      headers: { cookie: `token=${token}` },
    }),
  );
  expect(response.headers.get("location")).toBeNull();
});
it("does not accept an access token when the verification secret is missing", async () => {
  vi.stubEnv("JWT_SECRET", "");
  const response = await proxy(
    new NextRequest("http://localhost/rooms", {
      headers: { cookie: "token=anything" },
    }),
  );
  expect(new URL(response.headers.get("location")!).pathname).toBe(
    "/auth/sign-in",
  );
});
