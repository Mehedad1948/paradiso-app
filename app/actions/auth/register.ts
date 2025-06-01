"use server";

import { AuthServices } from "@/services/auth/authServices";
import { RegisterInputs } from "@/services/auth/types";
import { formatResponse } from "@/utils/formatResponse";

export async function register(data: RegisterInputs) {
  const res = await new AuthServices().register(data);

  return formatResponse(res);
}
