"use server";

import authServices from '@/services/auth/authServices';
import { cookies } from "next/headers";

export async function refreshAccessToken() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  
  if (!refreshToken) {
      return { error: "No refresh token", status: 401 };
    }

    const res = await authServices.refreshToken({ refreshToken });

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
