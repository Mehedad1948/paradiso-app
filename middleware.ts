import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const protectedRoutes = ["/dashboard", "/profile", "/settings", "/room"];

async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch (err) {
    console.error("Invalid or expired token:", err);
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const pathname = req.nextUrl.pathname;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtected) {
    if (!token && refreshToken) {
      const redirectUrl = new URL("/auth/sign-in", req.url);
      redirectUrl.searchParams.set("origin", pathname);
      redirectUrl.searchParams.set("refresh", "true");
      return NextResponse.redirect(redirectUrl);
    }

    if (token) {
      const isValid = await verifyToken(token);
      if (!isValid) {
        const redirectUrl = new URL("/auth/sign-in", req.url);
        redirectUrl.searchParams.set("origin", pathname);
        if (refreshToken && (await verifyToken(refreshToken))) {
          redirectUrl.searchParams.set("refresh", "true");
        }
        redirectUrl.searchParams.set("invalid", "true");
        return NextResponse.redirect(redirectUrl);
      }
    } else {
      const redirectUrl = new URL("/auth/sign-in", req.url);
      redirectUrl.searchParams.set("origin", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}
