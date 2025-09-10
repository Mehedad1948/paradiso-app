"use server";

import roomsServices from '@/services/rooms';
import { addMovieToRoomInputs } from "@/types/rooms";
;

export async function addMovieToRoom(data: addMovieToRoomInputs) {
  const res = await roomsServices.addMovieToRoom(data);
  return res;
}
