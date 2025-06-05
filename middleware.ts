import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/profile", "/settings", "/room"]; // Add more as needed

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  console.log("Token:", token);
  console.log("Refresh Token:", refreshToken);

  const pathname = req.nextUrl.pathname;

  // Check if it's a protected route
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtected && !token && refreshToken) {
    const redirectUrl = new URL("/auth/sign-in", req.url);
    redirectUrl.searchParams.set("origin", pathname);
    redirectUrl.searchParams.set("refresh", "true");

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}
