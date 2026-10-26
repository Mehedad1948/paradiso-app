import type { BackendQuery } from "@/types/backend";
import { backendRequest } from "../backend";

type RoomInvitationStatus = NonNullable<
  BackendQuery<"/rooms/{roomId}/invitations", "get">
>["status"];
type MyInvitationStatus = NonNullable<
  BackendQuery<"/me/room-invitations", "get">
>["status"];
export type InvitationAction = "accept" | "decline" | "approve" | "reject";

const actionPaths = {
  accept: "/room-invitations/{id}/accept",
  decline: "/room-invitations/{id}/decline",
  approve: "/room-invitations/{id}/approve",
  reject: "/room-invitations/{id}/reject",
} as const;

const roomInvitationsService = {
  /** Accepts an email invitation (JWT token). Requires a signed-in session. */
  accept(token: string) {
    return backendRequest("/room-invitations/accept", "post", {
      body: { token },
    });
  },
  /** The signed-in user's rooms, annotated for inviting `userId`. */
  invitableRooms(userId: number, signal?: AbortSignal) {
    return backendRequest("/users/{userId}/invitable-rooms", "get", {
      pathParams: { userId },
      signal,
    });
  },
  invite(roomId: number, body: { userId: number } | { email: string }) {
    return backendRequest("/rooms/{roomId}/invitations", "post", {
      pathParams: { roomId },
      body,
    });
  },
  forRoom(
    roomId: number,
    { page, limit, status }: { page: number; limit: number; status?: RoomInvitationStatus },
    signal?: AbortSignal,
  ) {
    return backendRequest("/rooms/{roomId}/invitations", "get", {
      pathParams: { roomId },
      query: { page, limit, status },
      signal,
    });
  },
  mine(
    { page, limit, status }: { page: number; limit: number; status?: MyInvitationStatus },
    signal?: AbortSignal,
  ) {
    return backendRequest("/me/room-invitations", "get", {
      query: { page, limit, status },
      signal,
    });
  },
  act(id: number, action: InvitationAction) {
    return backendRequest(actionPaths[action], "post", { pathParams: { id } });
  },
  cancel(id: number) {
    return backendRequest("/room-invitations/{id}", "delete", {
      pathParams: { id },
    });
  },
};

export default roomInvitationsService;
