import { PaginatedResponse } from "@/types/request";
import {
  RoomInviteLink,
  CreateRoomInviteLinkInputs,
  UpdateRoomInviteLinkInputs,
  InviteLinkInfo,
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
    const { id, roomId, ...body } = data;
    return this.webService.patch<RoomInviteLink>(
      `/${roomId}/invite-links/${id}`,
      { body: body },
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
      `/invite-links/verify/${token}`,
    );
  }

  tokenInfo(token: string) {
    return new WebServices().get<InviteLinkInfo>(`/invite-links/${token}`);
  }
}

const roomInviteLinksService = new RoomInviteLinksService();
export default roomInviteLinksService;
