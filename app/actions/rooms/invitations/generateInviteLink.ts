"use server";

import roomInviteLinksService from "@/services/rooms/room-invite-link.service";

export async function generateInviteLink(roomId: string) {
  console.log('Ⓜ️Ⓜ️Ⓜ️');
  
  return roomInviteLinksService.create({ roomId });
}
