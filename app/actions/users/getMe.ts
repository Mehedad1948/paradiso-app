"use server";

import { UsersServices } from "@/services/user";
import { formatResponse } from "@/utils/formatResponse";

export async function getMe() {
  const res = await new UsersServices().getMe();

  return formatResponse(res);
}
