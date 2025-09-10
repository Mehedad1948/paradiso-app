"use server";

import { NEXT_TAGS } from "@/constatnts/tags";
import roomsServices from "@/services/rooms";
import { revalidateTag } from "next/cache";
export async function inviteUser({
  email,
  roomId,
}: {
  email: string;
  roomId: string;
}) {
  const res = await roomsServices.inviteUser(roomId, email);
  if (res.response.ok) {
    revalidateTag(`${NEXT_TAGS.INVITATIONS}-${roomId}`);
  }
  return res;
}
