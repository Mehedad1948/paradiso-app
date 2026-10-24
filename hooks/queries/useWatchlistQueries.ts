"use client";
import {
  useInfiniteQuery,
  useMutation,
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
