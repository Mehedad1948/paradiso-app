import { CreateRoomInputs, Room } from "@/types/rooms";
import { WebServices } from "..";
import { PaginatedResponse } from "@/types";

export class RoomsServices {
  private webService = new WebServices();

  getRooms({
    page,
    limit,
    usersRoom = false,
  }: {
    page: number;
    limit: number;
    usersRoom?: boolean;
  }) {
    return this.webService.get<PaginatedResponse<Room>>(`/rooms`, {
      params: {
        page,
        limit,
        usersRoom,
      },
    });
  }
  createRoom(data: CreateRoomInputs) {
    return this.webService.post<Room>(`/rooms`, { body: data });
  }
}
