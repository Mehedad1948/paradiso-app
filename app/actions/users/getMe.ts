"use server";

import usersServices from "@/services/user";
;

export async function getMe() {
  const res = await usersServices.getMe();

  return res;
}
