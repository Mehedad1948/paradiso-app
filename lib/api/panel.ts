import { bffRequest, queryString } from "./client";
import type {
  Room,
  RoomListItem,
  CreateRoomInputs,
  UpdateRoomInputs,
  RoomRatingFilters,
  addMovieToRoomInputs,
} from "@/types/rooms";
import type { MovieWithRatings } from "@/types";
import type { CustomMovieBody } from "@/lib/movies/custom-movie";
import type { VoteType } from "@/types/ratings";
import type { ChangePasswordInputs, CurrentUser, UpdateMeInputs } from "@/types/user";
import type { Invitation } from "@/types/invitations";
import type { PaginatedResponse } from "@/types/request";
import type { BackendResponse } from "@/types/backend";
import type {
  RoomInviteLink,
  UpdateRoomInviteLinkInputs,
  DeleteRoomInviteLinkInputs,
} from "@/types/roomInviteLinks";

export type PanelRoom = Room & { imageUrl: string | null };
export type PanelRoomListItem = RoomListItem & { imageUrl: string | null };
const json = (body: unknown) => JSON.stringify(body);
const roomPath = (id: string | number) => `/rooms/${encodeURIComponent(id)}`;

export const panelApi = {
  me: (signal?: AbortSignal) => bffRequest<CurrentUser>("/me", { signal }),
  updateMe: (body: UpdateMeInputs) =>
    bffRequest<CurrentUser>("/me", { method: "PATCH", body: json(body) }),
  changePassword: (body: ChangePasswordInputs) =>
    bffRequest<{ ok: true }>("/me/password", { method: "POST", body: json(body) }),
  genres: (signal?: AbortSignal) =>
    bffRequest<BackendResponse<"/genres", "get">>("/genres", { signal }),
  rooms: (usersRoom: boolean, page: number, signal?: AbortSignal) =>
    bffRequest<PaginatedResponse<PanelRoomListItem>>(
      `/rooms${queryString({ usersRoom, page, limit: 10 })}`,
      { signal },
    ),
  myRooms: (page: number, signal?: AbortSignal) =>
    bffRequest<PaginatedResponse<PanelRoomListItem>>(
      `/rooms${queryString({ usersRoom: true, page, limit: 100 })}`,
      { signal },
    ),
  room: (id: string, signal?: AbortSignal) =>
    bffRequest<PanelRoom>(roomPath(id), { signal }),
  ratings: (id: string, filters: RoomRatingFilters, signal?: AbortSignal) =>
    bffRequest<PaginatedResponse<MovieWithRatings>>(
      `${roomPath(id)}/ratings${queryString(filters)}`,
      { signal },
    ),
  ratingSummary: (id: string, signal?: AbortSignal) =>
    bffRequest<BackendResponse<"/rooms/{roomId}/rating/summary", "get">>(
      `${roomPath(id)}/ratings/summary`,
      { signal },
    ),
  createRoom: (body: CreateRoomInputs) =>
    bffRequest<BackendResponse<"/rooms", "post"> & { imageUrl: string | null }>(
      "/rooms", { method: "POST", body: json(body) },
    ),
  updateRoom: ({ roomId, ...body }: UpdateRoomInputs) =>
    bffRequest<PanelRoom>(roomPath(roomId), { method: "PATCH", body: json(body) }),
  joinRoom: (roomId: number) =>
    bffRequest<BackendResponse<"/rooms/join", "post">>(`${roomPath(roomId)}/join`, {
      method: "POST",
    }),
  addMovie: ({ roomId, dbId, isWatchedTogether }: addMovieToRoomInputs) =>
    bffRequest<BackendResponse<"/rooms/add-movie/{id}", "post">>(`${roomPath(roomId)}/movies`, {
      method: "POST",
      body: json({ dbId, isWatchedTogether }),
    }),
  addCustomMovie: ({ roomId, ...body }: CustomMovieBody & { roomId: string }) =>
    bffRequest<BackendResponse<"/rooms/add-custom-movie/{id}", "post">>(
      `${roomPath(roomId)}/custom-movies`,
      { method: "POST", body: json(body) },
    ),
  updateMovie: ({
    roomId,
    movieId,
    ...body
  }: {
    roomId: string;
    movieId: string;
    title?: string;
    release_date?: string;
    isWatchedTogether?: boolean;
  }) =>
    bffRequest<BackendResponse<"/movies/{id}", "put">>(
      `${roomPath(roomId)}/movies/${encodeURIComponent(movieId)}`,
      { method: "PATCH", body: json(body) },
    ),
  removeMovie: ({ roomId, movieId }: { roomId: string; movieId: string }) =>
    bffRequest<BackendResponse<"/rooms/delete-movie/{id}", "delete">>(
      `${roomPath(roomId)}/movies/${encodeURIComponent(movieId)}`,
      { method: "DELETE" },
    ),
  vote: ({ roomId, ...body }: VoteType & { roomId: string }) =>
    bffRequest<BackendResponse<"/ratings/{id}", "post">>(`${roomPath(roomId)}/ratings`, {
      method: "POST",
      body: json(body),
    }),
  searchMovies: (query: string, signal?: AbortSignal) =>
    bffRequest<BackendResponse<"/movies/tmdb/search", "get">>(
      `/movies/search${queryString({ query })}`,
      { signal },
    ),
  invitations: (roomId: string, page: number, signal?: AbortSignal) =>
    bffRequest<PaginatedResponse<Invitation>>(
      `${roomPath(roomId)}/invitations${queryString({ page })}`,
      { signal },
    ),
  inviteUser: ({ roomId, email }: { roomId: string; email: string }) =>
    bffRequest<BackendResponse<"/rooms/{roomId}/invitations", "post">>(`${roomPath(roomId)}/invitations`, {
      method: "POST",
      body: json({ email }),
    }),
  inviteLinks: (roomId: string, page: number, signal?: AbortSignal) =>
    bffRequest<PaginatedResponse<RoomInviteLink>>(
      `${roomPath(roomId)}/invite-links${queryString({ page, limit: 10 })}`,
      { signal },
    ),
  acceptInvite: (token: string) =>
    bffRequest<BackendResponse<"/invite-links/verify/{token}", "post">>(
      `/invite-links/verify/${encodeURIComponent(token)}`,
      { method: "POST" },
    ),
  createInviteLink: (roomId: string) =>
    bffRequest<BackendResponse<"/rooms/{roomId}/invite-links", "post">>(`${roomPath(roomId)}/invite-links`, {
      method: "POST",
    }),
  updateInviteLink: ({ roomId, id, ...body }: UpdateRoomInviteLinkInputs) =>
    bffRequest<BackendResponse<"/rooms/{roomId}/invite-links/{id}", "patch">>(
      `${roomPath(roomId)}/invite-links/${encodeURIComponent(id)}`,
      { method: "PATCH", body: json(body) },
    ),
  deleteInviteLink: ({ roomId, id }: DeleteRoomInviteLinkInputs) =>
    bffRequest<BackendResponse<"/rooms/{roomId}/invite-links/{id}", "delete">>(
      `${roomPath(roomId)}/invite-links/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
  uploadImage: ({ file, folder }: { file: File; folder: string }) => {
    const body = new FormData();
    body.set("file", file);
    body.set("folder", folder);
    return bffRequest<BackendResponse<"/uploads/file", "post">>("/uploads", {
      method: "POST",
      body,
    });
  },
};
