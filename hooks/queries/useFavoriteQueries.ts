"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addToast } from "@heroui/toast";
import { communityApi } from "@/lib/api/community";
import { communityKeys } from "@/lib/query/community-keys";
import type { FavoriteMovie } from "@/types/community";

type Favorites = { data: FavoriteMovie[] };

/** A member's favorite films, in their chosen order. Public. */
export const useFavorites = (userId: number) =>
  useQuery({
    queryKey: communityKeys.favorites(userId),
    queryFn: ({ signal }) => communityApi.favorites(userId, signal),
    enabled: Number.isSafeInteger(userId) && userId > 0,
    staleTime: 60_000,
    select: (data) => data.data,
  });

/** Saves the whole list in one go, so adding, removing and reordering share one path. */
export function useSetFavorites(me: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: communityApi.setFavorites,
    retry: false,
    onSuccess: (result) => {
      client.setQueryData<Favorites>(communityKeys.favorites(me), result);
      addToast({ title: "Favorites saved", color: "success" });
    },
    onError: (error) => addToast({ title: error.message, color: "danger" }),
  });
}
