"use server";

import { RatingServices } from "@/services/ratings";
import { VoteType } from "@/types/ratings";
import { formatResponse } from "@/utils/formatResponse";

export async function castVote(roomId: string, data: VoteType) {
  const res = await new RatingServices().castVote(roomId, data);
  return formatResponse(res);
}
