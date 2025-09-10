import {
  addMovieToRoomInputs,
  CreateRoomInputs,
  JoinRoomInputs,
  Room,
  RoomRatingFilters,
} from "@/types/rooms";
import { WebServices } from "..";
import { MovieWithRatings, PaginatedResponse } from "@/types";
import { invitation } from "@/types/invitations";
import { NEXT_TAGS } from "@/constants/tags";

class RoomsServices {
  private webService = new WebServices("/rooms");

  getRooms({
    page,
    limit,
    usersRoom = false,
  }: {
    page: number;
    limit: number;
    usersRoom?: boolean;
  }) {
    return this.webService.get<PaginatedResponse<Room>>(``, {
      params: {
        page,
        limit,
        usersRoom,
      },
    });
  }

  getRoomById(roomId: number) {
    return this.webService.get<Room>(`/${roomId}`);
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
      `/${roomId}/rating?${params.toString()}`,
      { next: { tags: [`${NEXT_TAGS.ROOM_RATINGS}-${roomId}`] } },
    );
  }

  createRoom(data: CreateRoomInputs) {
    return this.webService.post<Room>(``, { body: data });
  }

  joinRoom(data: JoinRoomInputs) {
    return this.webService.post<{ message: string }>(`/join`, {
      body: data,
    });
  }

  inviteUser(roomId: string, email: string) {
    return this.webService.post<{ message: string }>(`/${roomId}/invitations`, {
      body: { email },
    });
  }

  invitations(roomId: string) {
    return this.webService.get<{ invitations: invitation[] }>(
      `/${roomId}/invitations`,
      {
        next: {
          tags: [`invitations-${roomId}`],
        },
      },
    );
  }

  addMovieToRoom(data: addMovieToRoomInputs) {
    return this.webService.post<{ message: string }>(
      `/add-movie/${data.roomId}`,
      {
        body: {
          dbId: data.dbId,
        },
      },
    );
  }

  deleteMovie({ roomId, movieId }: { roomId: string; movieId: string }) {
    return this.webService.delete<{ message: string }>(
      `/delete-movie/${roomId}`,
      {
        body: {
          movieId: movieId,
        },
      },
    );
  }
}
const roomsServices = new RoomsServices();
export default roomsServices;
