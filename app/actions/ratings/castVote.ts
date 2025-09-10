"use server";

import ratingServices from '@/services/ratings';
import { VoteType } from "@/types/ratings";
import { formatResponse } from "@/utils/formatResponse";

export async function castVote(roomId: string, data: VoteType) {
  const res = await ratingServices.castVote(roomId, data);
  return formatResponse(res);
}
