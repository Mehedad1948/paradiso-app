import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AuthServices } from "@/services/auth/authServices";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get("redirect") || "/";

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  const res = await new AuthServices().refreshToken({ refreshToken });

  console.log('✨✨✨', res);

  if (res.response?.ok && res.result?.accessToken) {
    // ❗️Next.js doesn't let you set cookies directly in API routes like this
    // You must use `NextResponse` to set cookies

    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    response.cookies.set("token", res.result.accessToken, {
      httpOnly: true,
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    console.log("🚀🚀🚀🚀", response);

    return response;
  }

  return NextResponse.redirect(new URL("/auth/sign-in", request.url));
}
