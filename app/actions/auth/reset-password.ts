"use server";

import authServices from '@/services/auth/authServices';
import { ResetPasswordInputs } from "@/services/auth/types";
import { formatResponse } from "@/utils/formatResponse";

export async function resetPassword(data: ResetPasswordInputs) {
  const res = await authServices.resetPassword(data);

  return formatResponse(res);
}
