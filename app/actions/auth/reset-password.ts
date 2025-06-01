"use server";

import { AuthServices } from "@/services/auth/authServices";
import { ForgotPasswordInputs, ResetPasswordInputs } from "@/services/auth/types";
import { formatResponse } from "@/utils/formatResponse";

export async function resetPassword(data: ResetPasswordInputs) {
  const res = await new AuthServices().resetPassword(data);

  return formatResponse(res);
}
