"use client";
import { useQuery } from "@tanstack/react-query";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";
import { usePanelMutation, type MutationOptions } from "./usePanelMutation";
export const useInvitations = (id: string, page = 1) =>
  useQuery({
    queryKey: [...panelKeys.invitations(id), page],
    queryFn: ({ signal }) => panelApi.invitations(id, page, signal),
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
  options?: MutationOptions<{ message: string }>,
) =>
  usePanelMutation(panelApi.inviteUser, [panelKeys.invitations(id)], options);
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
