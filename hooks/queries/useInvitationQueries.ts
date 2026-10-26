"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { panelApi } from "@/lib/api/panel";
import { BffError } from "@/lib/api/client";
import { panelKeys } from "@/lib/query/panel-keys";
import { notificationKeys } from "@/lib/query/notification-keys";
import type { InvitableRoom, InvitationResponse, InvitationStatus } from "@/types/invitations";
import { usePanelMutation, type MutationOptions } from "./usePanelMutation";

export type InvitationAction = "accept" | "decline" | "approve" | "reject" | "cancel";

export const useInvitations = (
  id: string,
  page = 1,
  status?: InvitationStatus,
  { limit = 5, enabled = true }: { limit?: number; enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: [...panelKeys.invitations(id), status ?? "all", limit, page],
    queryFn: ({ signal }) => panelApi.invitations(id, page, signal, status, limit),
    enabled,
    placeholderData: (previous, query) =>
      query?.queryKey[1] === id ? previous : undefined,
  });

export const useInviteLinks = (id: string, page = 1) =>
  useQuery({
    queryKey: [...panelKeys.links(id), page],
    queryFn: ({ signal }) => panelApi.inviteLinks(id, page, signal),
    placeholderData: (previous, query) =>
      query?.queryKey[1] === id ? previous : undefined,
  });

export const useInviteUser = (
  id: string,
  options?: MutationOptions<InvitationResponse>,
) =>
  usePanelMutation(panelApi.inviteUser, [panelKeys.invitations(id), panelKeys.invitableRoomsAll], options);

/** The viewer's rooms, annotated for inviting `userId`. Fetched when the picker opens. */
export const useInvitableRooms = (userId: number, enabled = true) =>
  useQuery({
    queryKey: panelKeys.invitableRooms(userId),
    queryFn: ({ signal }) => panelApi.invitableRooms(userId, signal),
    select: (response) => response.data,
    enabled: enabled && Number.isSafeInteger(userId),
    staleTime: 30_000,
  });

/** Invites `userId` to one room; marks that room as invited in the picker right away. */
export function useInviteToRoom(userId: number) {
  const client = useQueryClient();
  const key = panelKeys.invitableRooms(userId);
  return useMutation({
    mutationFn: (room: InvitableRoom) => panelApi.inviteUser({ roomId: room.id, userId }),
    onSuccess: (_, room) => {
      client.setQueryData<{ data: InvitableRoom[] }>(key, (old) =>
        old && {
          ...old,
          data: old.data.map((item) => (item.id === room.id ? { ...item, hasPendingInvite: true } : item)),
        },
      );
      client.invalidateQueries({ queryKey: panelKeys.invitations(String(room.id)) });
    },
    onError: (error) => {
      // A conflict means the picker is out of date: they joined or someone else invited them.
      if (error instanceof BffError && error.status === 409) client.invalidateQueries({ queryKey: key });
    },
  });
}

/** Invitations sent to the viewer. */
export const useMyInvitations = (
  status?: InvitationStatus,
  { page = 1, enabled = true }: { page?: number; enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: [...panelKeys.myInvitations, status ?? "all", page],
    queryFn: ({ signal }) => panelApi.myInvitations({ page, status }, signal),
    enabled,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  });

const run = ({ id, action }: { id: number; action: InvitationAction }) =>
  action === "cancel" ? panelApi.cancelInvitation(id) : panelApi.respondInvitation({ id, action });

/** Accept, decline, approve, reject or cancel; refreshes everything an invitation shows up in. */
export function useInvitationAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSettled: (invitation, _, { action }) => {
      client.invalidateQueries({ queryKey: panelKeys.myInvitations });
      client.invalidateQueries({ queryKey: panelKeys.invitableRoomsAll });
      if (invitation) client.invalidateQueries({ queryKey: panelKeys.invitations(String(invitation.room.id)) });
      else client.invalidateQueries({ queryKey: ["room"], predicate: (query) => query.queryKey[2] === "invitations" });
      if (action === "accept") {
        client.invalidateQueries({ queryKey: panelKeys.rooms });
        if (invitation) client.invalidateQueries({ queryKey: panelKeys.room(String(invitation.room.id)) });
      }
      client.invalidateQueries({ queryKey: notificationKeys.lists, refetchType: "none" });
    },
  });
}

/** Human copy for the errors an invitation action can hit. */
export function invitationErrorMessage(error: Error, action?: InvitationAction) {
  if (!(error instanceof BffError)) return error.message;
  switch (error.status) {
    case 403:
      return action === "accept"
        ? "Verify your email address to accept this invitation."
        : error.message || "You can't do that with this invitation.";
    case 404:
      return "This invitation no longer exists.";
    case 409:
      return "This invitation was already answered.";
    case 410:
      return "This invitation has expired.";
    case 429:
      return "You've sent a lot of invitations today. Try again tomorrow.";
    default:
      return error.message;
  }
}

/** Errors after which an invitation will never be actionable again. */
export const isStaleInvitationError = (error: unknown) =>
  error instanceof BffError && [404, 409, 410].includes(error.status);

export const useCreateInviteLink = (
  id: string,
  options?: MutationOptions<
    Awaited<ReturnType<typeof panelApi.createInviteLink>>
  >,
) =>
  usePanelMutation(panelApi.createInviteLink, [panelKeys.links(id)], options);
export const useUpdateInviteLink = (
  id: string,
  options?: MutationOptions<
    Awaited<ReturnType<typeof panelApi.updateInviteLink>>
  >,
) =>
  usePanelMutation(panelApi.updateInviteLink, [panelKeys.links(id)], options);
export const useDeleteInviteLink = (
  id: string,
  options?: MutationOptions<{ message: string }>,
) =>
  usePanelMutation(panelApi.deleteInviteLink, [panelKeys.links(id)], options);
