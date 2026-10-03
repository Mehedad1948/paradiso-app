import "server-only";
import { cookies } from "next/headers";
import { decodeJwt, jwtVerify } from "jose";
import type { TokenPair } from "@/types/auth";

const ACCESS_LIFETIME = 15 * 60;
const REFRESH_LIFETIME = 7 * 24 * 60 * 60;
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function tokenLifetime(
  token: string,
  fallback: number,
  now = Date.now(),
) {
  try {
    const { exp } = decodeJwt(token);
    return typeof exp === "number" && Number.isFinite(exp)
      ? Math.max(0, Math.floor(exp - now / 1000))
      : fallback;
  } catch {
    return fallback;
  }
}
export function hasTokenPair(value: unknown): value is TokenPair {
  if (!value || typeof value !== "object") return false;
  const pair = value as Partial<TokenPair>;
  return (
    typeof pair.accessToken === "string" &&
    !!pair.accessToken.trim() &&
    typeof pair.refreshToken === "string" &&
    !!pair.refreshToken.trim()
  );
}
export async function setSession(pair: TokenPair) {
  // A session must be usable by the route guard, otherwise refresh redirects loop.
  if (!(await isAccessTokenValid(pair.accessToken))) return false;
  const accessAge = tokenLifetime(pair.accessToken, ACCESS_LIFETIME);
  const refreshAge = tokenLifetime(pair.refreshToken, REFRESH_LIFETIME);
  if (!accessAge || !refreshAge) return false;
  const store = await cookies();
  store.set("token", pair.accessToken, { ...options, maxAge: accessAge });
  store.set("refreshToken", pair.refreshToken, {
    ...options,
    maxAge: refreshAge,
  });
  return true;
}
export async function clearSession() {
  const store = await cookies();
  store.set("token", "", { ...options, maxAge: 0 });
  store.set("refreshToken", "", { ...options, maxAge: 0 });
}
export async function isAccessTokenValid(token: string | undefined) {
  if (!token || !process.env.JWT_SECRET) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return true;
  } catch {
    return false;
  }
}
