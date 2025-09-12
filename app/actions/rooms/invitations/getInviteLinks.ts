"use server";

import roomInviteLinksService from "@/services/rooms/room-invite-link.service";

export async function getInviteLinks(roomId: string, page = 1) {
  return roomInviteLinksService.getAll(roomId, { page });
}
