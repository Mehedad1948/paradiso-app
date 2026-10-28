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
import type {
  InvitableRoom,
  Invitation,
  InvitationResponse,
  InvitationStatus,
  SentInvitationsResponse,
} from "@/types/invitations";
import type { PaginatedResponse } from "@/types/request";
import type { WatchlistItem } from "@/types/watchlist";
import type { MovieDetails } from "@/types/movies";
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
  watchlist: (page: number, limit: number, signal?: AbortSignal) =>
    bffRequest<PaginatedResponse<WatchlistItem>>(
      `/watchlist${queryString({ page, limit })}`,
      { signal },
    ),
  inWatchlist: (movieId: string, signal?: AbortSignal) =>
    bffRequest<BackendResponse<"/watchlist/{movieId}", "get">>(
      `/watchlist/${encodeURIComponent(movieId)}`,
      { signal },
    ),
  addToWatchlist: (movieId: string) =>
    bffRequest<BackendResponse<"/watchlist/{movieId}", "put">>(
      `/watchlist/${encodeURIComponent(movieId)}`,
      { method: "PUT" },
    ),
  removeFromWatchlist: (movieId: string) =>
    bffRequest<BackendResponse<"/watchlist/{movieId}", "delete">>(
      `/watchlist/${encodeURIComponent(movieId)}`,
      { method: "DELETE" },
    ),
  movieDetails: (id: string, signal?: AbortSignal) =>
    bffRequest<MovieDetails>(`/movies/${encodeURIComponent(id)}/details`, {
      signal,
      // The BFF marks these public and long-lived, so the browser cache answers repeat visits.
      cache: "default",
    }),
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
  leaveRoom: ({ roomId, clearVotes }: { roomId: string; clearVotes: boolean }) =>
    bffRequest<BackendResponse<"/rooms/{id}/leave", "post">>(`${roomPath(roomId)}/leave`, {
      method: "POST",
      body: json({ clearVotes }),
    }),
  kickMember: ({ roomId, userId }: { roomId: string; userId: number }) =>
    bffRequest<BackendResponse<"/rooms/{id}/members/{userId}", "delete">>(
      `${roomPath(roomId)}/members/${userId}`,
      { method: "DELETE" },
    ),
  banMember: ({
    roomId,
    userId,
    reason,
  }: {
    roomId: string;
    userId: number;
    reason?: string;
  }) =>
    bffRequest<BackendResponse<"/rooms/{id}/bans", "post">>(`${roomPath(roomId)}/bans`, {
      method: "POST",
      body: json({ userId, reason }),
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
  invitations: (
    roomId: string,
    page: number,
    signal?: AbortSignal,
    status?: InvitationStatus,
    limit = 5,
  ) =>
    bffRequest<PaginatedResponse<Invitation>>(
      `${roomPath(roomId)}/invitations${queryString({ page, limit, status })}`,
      { signal },
    ),
  inviteUser: ({ roomId, ...target }: { roomId: string | number } & ({ email: string } | { userId: number })) =>
    bffRequest<InvitationResponse>(`${roomPath(roomId)}/invitations`, {
      method: "POST",
      body: json(target),
    }),
  invitableRooms: (userId: number, signal?: AbortSignal) =>
    bffRequest<{ data: InvitableRoom[] }>(`/users/${encodeURIComponent(userId)}/invitable-rooms`, { signal }),
  myInvitations: (
    { page, status, limit = 10 }: { page: number; status?: InvitationStatus; limit?: number },
    signal?: AbortSignal,
  ) =>
    bffRequest<PaginatedResponse<Invitation>>(
      `/me/room-invitations${queryString({ page, limit, status })}`,
      { signal },
    ),
  sentInvitations: (
    { page, status, limit = 5 }: { page: number; status?: InvitationStatus; limit?: number },
    signal?: AbortSignal,
  ) =>
    bffRequest<SentInvitationsResponse>(
      `/me/sent-room-invitations${queryString({ page, limit, status })}`,
      { signal },
    ),
  respondInvitation: ({ id, action }: { id: number; action: "accept" | "decline" | "approve" | "reject" }) =>
    bffRequest<InvitationResponse>(`/room-invitations/${encodeURIComponent(id)}/${action}`, {
      method: "POST",
    }),
  cancelInvitation: (id: number) =>
    bffRequest<InvitationResponse>(`/room-invitations/${encodeURIComponent(id)}`, {
      method: "DELETE",
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
  acceptEmailInvite: (token: string) =>
    bffRequest<BackendResponse<"/room-invitations/accept", "post">>(
      "/room-invitations/accept",
      { method: "POST", body: json({ token }) },
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
