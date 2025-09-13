"use server";

import roomInviteLinksService from "@/services/rooms/room-invite-link.service";
import { UpdateRoomInviteLinkInputs } from "@/types/roomInviteLinks";

export async function updateInviteLink(params: UpdateRoomInviteLinkInputs) {
  return roomInviteLinksService.update(params);
}
