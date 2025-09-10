"use server";

import roomsServices from "@/services/rooms";
import { formatResponse } from "@/utils/formatResponse";

export async function inviteUser({
  email,
  roomId,
}: {
  email: string;
  roomId: string;
}) {
  const res = await roomsServices.inviteUser(roomId, email);
  return formatResponse(res);
}
