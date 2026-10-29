import { NextRequest, NextResponse } from "next/server";
import { accessTokenRole, isAccessTokenValid } from "@/lib/auth/session";
import { authHref } from "@/lib/auth/redirect";
import { publicOrigin } from "@/lib/bff/validation";
export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (await isAccessTokenValid(token)) {
    // The admin area does not exist for anyone else. The admin layout and the backend check the role again.
    if (
      /^\/admin(\/|$)/.test(request.nextUrl.pathname) &&
      (await accessTokenRole(token)) !== "admin"
    )
      return NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
    return NextResponse.next();
  }
  const origin = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return NextResponse.redirect(
    new URL(
      authHref("sign-in", {
        origin,
        reason:
          request.cookies.has("token") || request.cookies.has("refreshToken")
            ? "session-expired"
            : undefined,
        refresh: request.cookies.get("refreshToken")?.value
          ? "true"
          : undefined,
      }),
      publicOrigin(request),
    ),
  );
}
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/watchlist/:path*",
    // The /rooms list itself is open (public rooms); each room page stays behind sign-in.
    "/rooms/:path+",
    "/auth/onboarding",
    "/admin/:path*",
  ],
};
