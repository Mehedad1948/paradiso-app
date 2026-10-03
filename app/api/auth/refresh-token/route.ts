import { NextResponse } from "next/server";
import { handleAuthRequest } from "@/lib/bff/auth";
import { authHref, safeRedirectPath } from "@/lib/auth/redirect";
import { publicOrigin } from "@/lib/bff/validation";
export async function POST(request: Request) {
  return handleAuthRequest(request, "refresh-token");
}
// Compatibility for old links: navigation only. Session changes always use POST.
export async function GET(request: Request) {
  const origin = safeRedirectPath(
    new URL(request.url).searchParams.get("redirect"),
    "/rooms",
  );
  return NextResponse.redirect(
    new URL(
      authHref("sign-in", { origin, refresh: "true" }),
      publicOrigin(request),
    ),
    303,
  );
}
