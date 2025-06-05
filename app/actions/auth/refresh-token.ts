"use server";

import { cookies } from "next/headers";
import { AuthServices } from "@/services/auth/authServices";

export async function refreshAccessToken() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  
  if (!refreshToken) {
      return { error: "No refresh token", status: 401 };
    }
    
    const res = await new AuthServices().refreshToken({ refreshToken });
    console.log("❤️❤️❤️", res);

  if (res.response?.ok && res.result?.accessToken) {
    cookieStore.set("token", res.result.accessToken, {
      httpOnly: true,
      secure: true,
      path: "/",
      maxAge: 60 * 15, // 15 minutes
    });

    return { ok: true };
  }

  return { error: "Invalid refresh token", status: 401 };
}
