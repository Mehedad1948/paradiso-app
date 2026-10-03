import { NextRequest, NextResponse } from "next/server";
import { isAccessTokenValid } from "@/lib/auth/session";
import { authHref } from "@/lib/auth/redirect";
import { publicOrigin } from "@/lib/bff/validation";
export async function proxy(request: NextRequest) {
  if (await isAccessTokenValid(request.cookies.get("token")?.value))
    return NextResponse.next();
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
    "/rooms/:path*",
  ],
};
