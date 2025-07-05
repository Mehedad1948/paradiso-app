import {
  addMovieToRoomInputs,
  CreateRoomInputs,
  JoinRoomInputs,
  Room,
} from "@/types/rooms";
import { WebServices } from "..";
import { MovieWithRatings, PaginatedResponse } from "@/types";

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

  getRoomById(roomId: number) {
    return this.webService.get<Room>(`/rooms/${roomId}`);
  }

  getRoomRatings(roomId: number, options?: { search?: string }) {
    return this.webService.get<PaginatedResponse<MovieWithRatings>>(
      `/rooms/${roomId}/rating?${options?.search ? `search=${options.search}` : ""}`,
    );
  }

  createRoom(data: CreateRoomInputs) {
    return this.webService.post<Room>(`/rooms`, { body: data });
  }

  joinRoom(data: JoinRoomInputs) {
    return this.webService.post<{ message: string }>(`/rooms/join`, {
      body: data,
    });
  }

  addMovieToRoom(data: addMovieToRoomInputs) {

    return this.webService.post<{ message: string }>(
      `/rooms/add-movie/${data.roomId}`,
      {
        body: {
          dbId: data.dbId,
        },
      },
    );
  }
}
