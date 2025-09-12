"use server";

import roomInviteLinksService from "@/services/rooms/room-invite-link.service";

export async function generateInviteLink(roomId: string) {
  return roomInviteLinksService.create({ roomId });
}
