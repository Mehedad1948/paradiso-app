"use server";

import { RoomsServices } from "@/services/rooms";
import { addMovieToRoomInputs } from "@/types/rooms";
import { formatResponse } from "@/utils/formatResponse";

export async function addMovieToRoom(data: addMovieToRoomInputs) {
  const res = await new RoomsServices().addMovieToRoom(data);
  return formatResponse(res);
}
