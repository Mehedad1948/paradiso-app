import { bffRequest, queryString } from "./client";
import type {
  Room,
  CreateRoomInputs,
  RoomRatingFilters,
  addMovieToRoomInputs,
} from "@/types/rooms";
import type { MovieWithRatings } from "@/types";
import type { VoteType } from "@/types/ratings";
import type { User } from "@/types/user";
import type { Invitation } from "@/types/invitations";
import type { PaginatedResponse } from "@/types/request";
import type { DbMovie } from "@/types/movies";
import type {
  RoomInviteLink,
  UpdateRoomInviteLinkInputs,
  DeleteRoomInviteLinkInputs,
} from "@/types/roomInviteLinks";

export type PanelRoom = Room & { imageUrl: string | null };
const json = (body: unknown) => JSON.stringify(body);
const roomPath = (id: string | number) => `/rooms/${encodeURIComponent(id)}`;

export const panelApi = {
  me: (signal?: AbortSignal) => bffRequest<User>("/me", { signal }),
  rooms: (usersRoom: boolean, page: number, signal?: AbortSignal) =>
    bffRequest<PaginatedResponse<PanelRoom>>(
      `/rooms${queryString({ usersRoom, page, limit: 10 })}`,
      { signal },
    ),
  room: (id: string, signal?: AbortSignal) =>
    bffRequest<PanelRoom>(roomPath(id), { signal }),
  ratings: (id: string, filters: RoomRatingFilters, signal?: AbortSignal) =>
    bffRequest<PaginatedResponse<MovieWithRatings>>(
      `${roomPath(id)}/ratings${queryString(filters)}`,
      { signal },
    ),
  createRoom: (body: CreateRoomInputs) =>
    bffRequest<PanelRoom>("/rooms", { method: "POST", body: json(body) }),
  joinRoom: (roomId: number) =>
    bffRequest<{ message: string }>(`${roomPath(roomId)}/join`, {
      method: "POST",
    }),
  addMovie: ({ roomId, dbId }: addMovieToRoomInputs) =>
    bffRequest<{ message: string }>(`${roomPath(roomId)}/movies`, {
      method: "POST",
      body: json({ dbId }),
    }),
  removeMovie: ({ roomId, movieId }: { roomId: string; movieId: string }) =>
    bffRequest<{ message: string }>(
      `${roomPath(roomId)}/movies/${encodeURIComponent(movieId)}`,
      { method: "DELETE" },
    ),
  vote: ({ roomId, ...body }: VoteType & { roomId: string }) =>
    bffRequest<unknown>(`${roomPath(roomId)}/ratings`, {
      method: "POST",
      body: json(body),
    }),
  searchMovies: (query: string, signal?: AbortSignal) =>
    bffRequest<{ results: DbMovie[] }>(
      `/movies/search${queryString({ query })}`,
      { signal },
    ),
  invitations: (roomId: string, page: number, signal?: AbortSignal) =>
    bffRequest<PaginatedResponse<Invitation>>(
      `${roomPath(roomId)}/invitations${queryString({ page })}`,
      { signal },
    ),
  inviteUser: ({ roomId, email }: { roomId: string; email: string }) =>
    bffRequest<{ message: string }>(`${roomPath(roomId)}/invitations`, {
      method: "POST",
      body: json({ email }),
    }),
  inviteLinks: (roomId: string, page: number, signal?: AbortSignal) =>
    bffRequest<PaginatedResponse<RoomInviteLink>>(
      `${roomPath(roomId)}/invite-links${queryString({ page, limit: 10 })}`,
      { signal },
    ),
  createInviteLink: (roomId: string) =>
    bffRequest<RoomInviteLink>(`${roomPath(roomId)}/invite-links`, {
      method: "POST",
    }),
  updateInviteLink: ({ roomId, id, ...body }: UpdateRoomInviteLinkInputs) =>
    bffRequest<RoomInviteLink>(
      `${roomPath(roomId)}/invite-links/${encodeURIComponent(id)}`,
      { method: "PATCH", body: json(body) },
    ),
  deleteInviteLink: ({ roomId, id }: DeleteRoomInviteLinkInputs) =>
    bffRequest<{ message: string }>(
      `${roomPath(roomId)}/invite-links/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
  uploadImage: ({ file, folder }: { file: File; folder: string }) => {
    const body = new FormData();
    body.set("file", file);
    body.set("folder", folder);
    return bffRequest<{ name: string; id: number; path: string }>("/uploads", {
      method: "POST",
      body,
    });
  },
};
