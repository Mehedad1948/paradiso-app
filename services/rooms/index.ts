import type { BackendRequestBody } from "@/types/backend";
import type { RoomRatingFilters } from "@/types/rooms";
import { backendRequest } from "../backend";

type AddMovieBody = BackendRequestBody<"/rooms/add-movie/{id}", "post">;
type AddCustomMovieBody = BackendRequestBody<"/rooms/add-custom-movie/{id}", "post">;
type RemoveMovieBody = BackendRequestBody<"/rooms/delete-movie/{id}", "delete">;

const roomsServices = {
  /** Public rooms are the same for everyone, so the visitor's session is never sent. */
  getPublicRooms({ page, limit, signal }: {
    page: number;
    limit: number;
    signal?: AbortSignal;
  }) {
    return backendRequest("/rooms/public", "get", {
      query: { page, limit },
      signal,
      withAuth: false,
    });
  },
  getMyRooms({ page, limit, signal }: {
    page: number;
    limit: number;
    signal?: AbortSignal;
  }) {
    return backendRequest("/rooms/mine", "get", { query: { page, limit }, signal });
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
        hasVoted: filters.hasVoted,
      },
      signal,
    });
  },
  getRoomRatingSummary(roomId: number, signal?: AbortSignal) {
    return backendRequest("/rooms/{roomId}/rating/summary", "get", {
      pathParams: { roomId },
      signal,
    });
  },
  createRoom(body: BackendRequestBody<"/rooms", "post">) {
    return backendRequest("/rooms", "post", { body });
  },
  updateRoom(id: number, body: BackendRequestBody<"/rooms/{id}", "patch">) {
    return backendRequest("/rooms/{id}", "patch", { pathParams: { id }, body });
  },
  joinRoom(body: BackendRequestBody<"/rooms/join", "post">) {
    return backendRequest("/rooms/join", "post", { body });
  },
  leaveRoom(id: number, body: BackendRequestBody<"/rooms/{id}/leave", "post">) {
    return backendRequest("/rooms/{id}/leave", "post", { pathParams: { id }, body });
  },
  kickUser(id: number, userId: number) {
    return backendRequest("/rooms/{id}/members/{userId}", "delete", {
      pathParams: { id, userId },
    });
  },
  banUser(id: number, body: BackendRequestBody<"/rooms/{id}/bans", "post">) {
    return backendRequest("/rooms/{id}/bans", "post", { pathParams: { id }, body });
  },
  addMovieToRoom(id: number, body: AddMovieBody) {
    return backendRequest("/rooms/add-movie/{id}", "post", { pathParams: { id }, body });
  },
  addCustomMovieToRoom(id: number, body: AddCustomMovieBody) {
    return backendRequest("/rooms/add-custom-movie/{id}", "post", { pathParams: { id }, body });
  },
  deleteMovie(id: number, body: RemoveMovieBody) {
    return backendRequest("/rooms/delete-movie/{id}", "delete", { pathParams: { id }, body });
  },
};

export default roomsServices;
