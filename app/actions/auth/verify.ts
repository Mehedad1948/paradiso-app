"use server";

import { AuthServices } from "@/services/auth/authServices";
import { VerifyEmailInputs } from "@/services/auth/types";
import { formatResponse } from "@/utils/formatResponse";
import { cookies } from "next/headers";

export async function verifyEmail(data: VerifyEmailInputs) {
  const res = await new AuthServices().verifyEmail(data);
  if (res.response?.ok && res.result) {
    const { accessToken, refreshToken } = res.result;

    // Set cookies securely
    const cookieStore = await cookies();

    cookieStore.set("token", accessToken, {
      httpOnly: true,
      secure: true,
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });

    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 1 week
    });
  }

  return formatResponse(res);
}
