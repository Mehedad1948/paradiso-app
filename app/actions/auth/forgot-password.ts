"use server";

import authServices from '@/services/auth/authServices';
import { ForgotPasswordInputs } from "@/services/auth/types";
import { formatResponse } from "@/utils/formatResponse";

export async function forgotPassword(data: ForgotPasswordInputs) {
  const res = await authServices.forgotPassword(data);

  return formatResponse(res);
}
