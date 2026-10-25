"use client";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { addToast } from "@heroui/toast";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";
import type { PaginatedResponse } from "@/types/request";
import type { WatchlistItem } from "@/types/watchlist";

export const WATCHLIST_PAGE_SIZE = 20;

type Pages = InfiniteData<PaginatedResponse<WatchlistItem>, number>;

export const useWatchlist = (enabled = true) =>
  useInfiniteQuery({
    queryKey: panelKeys.watchlist,
    queryFn: ({ signal, pageParam }) =>
      panelApi.watchlist(pageParam, WATCHLIST_PAGE_SIZE, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.currentPage < last.meta.totalPages ? last.meta.currentPage + 1 : undefined,
    enabled,
    select: (data) => data.pages.flatMap((page) => page.data),
  });

const statusKey = (movieId: string) => [...panelKeys.watchlist, "has", movieId] as const;

/** Whether the signed-in user already has this movie on their watchlist. */
export const useInWatchlist = (movieId: string, enabled = true) =>
  useQuery({
    queryKey: statusKey(movieId),
    queryFn: ({ signal }) => panelApi.inWatchlist(movieId, signal),
    enabled,
    staleTime: 60_000,
    select: (data) => data.inWatchlist,
  });

/** Flips the saved state at once; a failure rolls it back. */
export function useToggleWatchlist(movieId: string, title: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (on: boolean) =>
      on ? panelApi.addToWatchlist(movieId) : panelApi.removeFromWatchlist(movieId),
    retry: false,
    onMutate: async (on) => {
      await client.cancelQueries({ queryKey: statusKey(movieId) });
      const previous = client.getQueryData(statusKey(movieId));
      client.setQueryData(statusKey(movieId), (data: { inWatchlist: boolean } | undefined) => ({
        ...data,
        inWatchlist: on,
      }));
      return { previous };
    },
    onSuccess: (_, on) =>
      addToast({ title: on ? `${title} added to your watchlist` : `${title} removed from your watchlist`, color: "success" }),
    onError: (error, _, context) => {
      client.setQueryData(statusKey(movieId), context?.previous);
      addToast({ title: error.message, color: "danger" });
    },
    onSettled: () => client.invalidateQueries({ queryKey: panelKeys.watchlist }),
  });
}

/** Drops the movie from the cached list at once; a failure puts it back by refetching. */
export function useRemoveFromWatchlist() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (movieId: string) => panelApi.removeFromWatchlist(movieId),
    retry: false,
    onMutate: (movieId) => {
      client.setQueryData<Pages>(panelKeys.watchlist, (data) =>
        data && {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            data: page.data.filter((item) => item.movie.id !== movieId),
          })),
        },
      );
    },
    onError: (error) => addToast({ title: error.message, color: "danger" }),
    onSettled: () => client.invalidateQueries({ queryKey: panelKeys.watchlist }),
  });
}
