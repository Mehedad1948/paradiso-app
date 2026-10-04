import type { BackendRequestBody } from "@/types/backend";
import type { RoomRatingFilters } from "@/types/rooms";
import { backendRequest } from "../backend";

type AddMovieBody = BackendRequestBody<"/rooms/add-movie/{id}", "post">;
type RemoveMovieBody = BackendRequestBody<"/rooms/delete-movie/{id}", "delete">;

const roomsServices = {
  getRooms({ page, limit, usersRoom = false, signal }: {
    page: number;
    limit: number;
    usersRoom?: boolean;
    signal?: AbortSignal;
  }) {
    return backendRequest("/rooms", "get", {
      query: { page, limit, usersRoom: String(usersRoom) as "true" | "false" },
      signal,
    });
  },
  getRoomById(id: number, signal?: AbortSignal) {
    return backendRequest("/rooms/{id}", "get", { pathParams: { id }, signal });
  },
  getRoomRatings(roomId: number, filters: RoomRatingFilters = {}, signal?: AbortSignal) {
    return backendRequest("/rooms/{roomId}/rating", "get", {
      pathParams: { roomId },
      query: {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        sortByUserId: filters.sortByUserId ? Number(filters.sortByUserId) : undefined,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        isWatchTogether: filters.isWatchTogether,
      },
      signal,
    });
  },
  createRoom(body: BackendRequestBody<"/rooms", "post">) {
    return backendRequest("/rooms", "post", { body });
  },
  joinRoom(body: BackendRequestBody<"/rooms/join", "post">) {
    return backendRequest("/rooms/join", "post", { body });
  },
  inviteUser(roomId: number, email: string) {
    return backendRequest("/rooms/{roomId}/invitations", "post", {
      pathParams: { roomId }, body: { email },
    });
  },
  invitations(roomId: number, page = 1, signal?: AbortSignal) {
    return backendRequest("/rooms/{roomId}/invitations", "get", {
      pathParams: { roomId }, query: { page, limit: 5 }, signal,
    });
  },
  addMovieToRoom(id: number, body: AddMovieBody) {
    return backendRequest("/rooms/add-movie/{id}", "post", { pathParams: { id }, body });
  },
  deleteMovie(id: number, body: RemoveMovieBody) {
    return backendRequest("/rooms/delete-movie/{id}", "delete", { pathParams: { id }, body });
  },
};

export default roomsServices;
