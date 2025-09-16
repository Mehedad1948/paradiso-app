"use server";

import roomInviteLinksService from "@/services/rooms/room-invite-link.service";
import {
    DeleteRoomInviteLinkInputs
} from "@/types/roomInviteLinks";

export async function deleteInviteLink(params: DeleteRoomInviteLinkInputs) {
  return roomInviteLinksService.delete(params.roomId, String(params.id));
}
