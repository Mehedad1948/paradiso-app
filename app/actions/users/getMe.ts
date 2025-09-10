"use server";

import usersServices from "@/services/user";
import { formatResponse } from "@/utils/formatResponse";

export async function getMe() {
  const res = await usersServices.getMe();

  return formatResponse(res);
}
