"use server";

import { NEXT_TAGS } from "@/constants/tags";
import roomsServices from "@/services/rooms";
import { addMovieToRoomInputs } from "@/types/rooms";
import { revalidateTag } from "next/cache";
export async function addMovieToRoom(data: addMovieToRoomInputs) {
  const res = await roomsServices.addMovieToRoom(data);
  if (res.response.ok) {
    revalidateTag(`${NEXT_TAGS.ROOM_RATINGS}-${data.roomId}`);
  }
  return res;
}
