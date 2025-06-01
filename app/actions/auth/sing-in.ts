"use server";

import { AuthServices } from "@/services/auth/authServices";
import { SignInInputs } from "@/services/auth/types";
import { formatResponse } from "@/utils/formatResponse";

export async function signIn(data: SignInInputs) {
  console.log("➡️➡️➡️", data);

  const res = await new AuthServices().signIn(data);

  return formatResponse(res);
}
