import type { BackendRequestBody } from "./backend";
import type { components } from "./generated/backend";

export type RoomInviteLink = components["schemas"]["InviteLink"];
export type InviteLinkInfo = components["schemas"]["InvitePreviewResponse"];

type CreateBody = BackendRequestBody<"/rooms/{roomId}/invite-links", "post">;
type UpdateBody = BackendRequestBody<"/rooms/{roomId}/invite-links/{id}", "patch">;

// The BFF accepts Date objects from the client and serializes them for the backend.
export type CreateRoomInviteLinkInputs = Omit<CreateBody, "expiresAt"> & {
  roomId: number | string;
  expiresAt?: Date | null;
};
export type UpdateRoomInviteLinkInputs = Omit<UpdateBody, "expiresAt"> & {
  roomId: number | string;
  id: number | string;
  expiresAt?: Date | null;
};
export type DeleteRoomInviteLinkInputs = {
  roomId: number | string;
  id: number | string;
};
