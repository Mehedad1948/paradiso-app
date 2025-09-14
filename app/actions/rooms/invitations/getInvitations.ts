"use server";

import roomsServices from "@/services/rooms";

export async function getInvitations(roomId: string, page = 1) {
  return roomsServices.invitations(roomId, page);
}
