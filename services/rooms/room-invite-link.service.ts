import { PaginatedResponse } from "@/types/request";
import {
  RoomInviteLink,
  CreateRoomInviteLinkInputs,
  UpdateRoomInviteLinkInputs,
} from "@/types/roomInviteLinks";
import { WebServices } from "..";

class RoomInviteLinksService {
  private webService = new WebServices("/rooms");

  create(data: CreateRoomInviteLinkInputs) {
    return this.webService.post<RoomInviteLink>(
      `/${data.roomId}/invite-links`,
      { body: data },
    );
  }

  getAll(roomId: number | string, params?: { page?: number; limit?: number }) {
    return this.webService.get<PaginatedResponse<RoomInviteLink>>(
      `/${roomId}/invite-links`,
      { params },
    );
  }

  update(data: UpdateRoomInviteLinkInputs) {
    return this.webService.patch<RoomInviteLink>(
      `/${data.roomId}/invite-links/${data.id}`,
      { body: data },
    );
  }

  delete(roomId: number | string, id: string) {
    return this.webService.delete<{ message: string }>(
      `/${roomId}/invite-links/${id}`,
    );
  }

  verify(token: string) {
    // stays global, not tied to room
    return new WebServices().get<{ valid: boolean; roomId?: number }>(
      `/verify/${token}`,
    );
  }
}

const roomInviteLinksService = new RoomInviteLinksService();
export default roomInviteLinksService;
