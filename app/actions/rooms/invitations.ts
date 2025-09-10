"use server";

import roomsServices from "@/services/rooms";
;

export async function inviteUser({
  email,
  roomId,
}: {
  email: string;
  roomId: string;
}) {
  const res = await roomsServices.inviteUser(roomId, email);
  return res;
}
