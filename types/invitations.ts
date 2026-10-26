import type { components } from "./generated/backend";

export type Invitation = components["schemas"]["Invitation"];
export type InvitationResponse = components["schemas"]["InvitationResponse"];
export type InvitationStatus = Invitation["status"];
/** @deprecated Use InvitationStatus. */
export type InvitationStatusesType = InvitationStatus;
export type InvitableRoom = components["schemas"]["InvitableRoom"];
export type RoomInvitePolicy = components["schemas"]["CurrentUserResponse"]["roomInvitePolicy"];

export const INVITATION_STATUSES = [
  "awaiting_approval",
  "pending",
  "accepted",
  "declined",
  "rejected",
  "cancelled",
  "expired",
] as const satisfies readonly InvitationStatus[];

/** What the invitee may filter by; they never see invitations before approval. */
export const INVITEE_STATUSES = [
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "expired",
] as const satisfies readonly InvitationStatus[];

export const ROOM_INVITE_POLICIES = ["everyone", "following", "nobody"] as const satisfies readonly RoomInvitePolicy[];

/** Invitations that can still change. */
export const isOpen = (status: InvitationStatus) =>
  status === "pending" || status === "awaiting_approval";
