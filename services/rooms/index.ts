import {
  addMovieToRoomInputs,
  CreateRoomInputs,
  JoinRoomInputs,
  Room,
  RoomRatingFilters,
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

  getRoomRatings(roomId: number, filters?: RoomRatingFilters) {
    const params = new URLSearchParams();

    if (filters?.search) params.set("search", filters.search);
    if (filters?.sortBy) params.set("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);
    if (filters?.sortByUserId) params.set("sortByUserId", filters.sortByUserId);
    if (filters?.startDate)
      params.set("startDate", filters.startDate.toISOString());
    if (filters?.endDate) params.set("endDate", filters.endDate.toISOString());
    if (filters?.isWatchTogether !== undefined)
      params.set("isWatchTogether", String(filters.isWatchTogether));

    return this.webService.get<PaginatedResponse<MovieWithRatings>>(
      `/rooms/${roomId}/rating?${params.toString()}`,
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
