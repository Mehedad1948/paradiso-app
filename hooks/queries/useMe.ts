"use client";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";
import type { CurrentUser } from "@/types/user";

export type AccountStats = CurrentUser["stats"];

/**
 * Edits the account totals cached with `/me`, so counts move the moment an action is taken.
 * Anything that can't be patched exactly (a failed request, other people following you) is
 * settled by refetching `/me`, which also happens on window focus.
 */
export function patchAccountStats(client: QueryClient, patch: (stats: AccountStats) => Partial<AccountStats>) {
  client.setQueryData<CurrentUser>(panelKeys.me, (me) => me && { ...me, stats: { ...me.stats, ...patch(me.stats) } });
}

export const refreshAccountStats = (client: QueryClient) =>
  client.invalidateQueries({ queryKey: panelKeys.me });
export const useMe = () =>
  useQuery({
    queryKey: panelKeys.me,
    queryFn: ({ signal }) => panelApi.me(signal),
    retry: false,
  });
export const useUpdateMe = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: panelApi.updateMe,
    onSuccess: (user) => client.setQueryData(panelKeys.me, user),
  });
};
export const useChangePassword = () =>
  useMutation({ mutationFn: panelApi.changePassword });
export const useGenres = () =>
  useQuery({
    queryKey: panelKeys.genres,
    queryFn: ({ signal }) => panelApi.genres(signal),
    select: (response) => response.data,
    staleTime: Infinity,
  });
