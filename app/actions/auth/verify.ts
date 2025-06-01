"use server";

import { AuthServices } from "@/services/auth/authServices";
import { VerifyEmailInputs } from "@/services/auth/types";
import { formatResponse } from "@/utils/formatResponse";

export async function verifyEmail(data: VerifyEmailInputs) {
  const res = await new AuthServices().verifyEmail(data);

  return formatResponse(res);
}
