"use server";

import { RegisterInputs } from "@/services/auth/types";
import usersServices from '@/services/user';
;

export async function register(data: RegisterInputs) {
  const res = await usersServices.register(data);

  return res;
}
