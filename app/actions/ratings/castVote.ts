"use server";

import ratingServices from '@/services/ratings';
import { VoteType } from "@/types/ratings";
;

export async function castVote(roomId: string, data: VoteType) {
  const res = await ratingServices.castVote(roomId, data);
  return res;
}
