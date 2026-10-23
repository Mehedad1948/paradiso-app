"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";
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
