"use server";

import { NEXT_TAGS } from "@/constatnts/tags";
import ratingServices from "@/services/ratings";
import { VoteType } from "@/types/ratings";
import { revalidateTag } from "next/cache";
export async function castVote(roomId: string, data: VoteType) {
  const res = await ratingServices.castVote(roomId, data);

  if (res.response.ok) {
    revalidateTag(`${NEXT_TAGS.ROOM_RATINGS}-${roomId}`);
  }
  return res;
}
