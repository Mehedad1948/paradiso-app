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
import { patchAccountStats, refreshAccountStats } from "./useMe";
import type { PaginatedResponse } from "@/types/request";
import type { WatchlistItem } from "@/types/watchlist";

export const WATCHLIST_PAGE_SIZE = 20;

type Pages = InfiniteData<PaginatedResponse<WatchlistItem>, number>;

const watchlistQuery = {
  queryKey: panelKeys.watchlist,
  queryFn: ({ signal, pageParam }: { signal: AbortSignal; pageParam: number }) =>
    panelApi.watchlist(pageParam, WATCHLIST_PAGE_SIZE, signal),
  initialPageParam: 1,
  getNextPageParam: (last: PaginatedResponse<WatchlistItem>) =>
    last.meta.currentPage < last.meta.totalPages ? last.meta.currentPage + 1 : undefined,
};

export const useWatchlist = (enabled = true) =>
  useInfiniteQuery({
    ...watchlistQuery,
    enabled,
    select: (data) => data.pages.flatMap((page) => page.data),
  });

const statusKey = (movieId: string) => [...panelKeys.watchlist, "has", movieId] as const;

/**
 * Whether the signed-in user already has this movie on their watchlist.
 * `seed` is the answer the server already gave (e.g. on a community post): with it, nothing is
 * requested on mount, and a later toggle still refreshes the status.
 */
export const useInWatchlist = (movieId: string, enabled = true, seed?: boolean) =>
  useQuery({
    queryKey: statusKey(movieId),
    queryFn: ({ signal }) => panelApi.inWatchlist(movieId, signal),
    enabled,
    // Only `inWatchlist` is read from the answer; the version tag is the server's own bookkeeping.
    initialData: () => (seed === undefined ? undefined : { inWatchlist: seed, apiVersion: "" }),
    staleTime: seed === undefined ? 60_000 : Infinity,
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
      const previous = client.getQueryData<{ inWatchlist: boolean }>(statusKey(movieId));
      client.setQueryData(statusKey(movieId), (data: { inWatchlist: boolean } | undefined) => ({
        ...data,
        inWatchlist: on,
      }));
      // Only count a real change: re-saving a saved movie must not bump the total.
      const changed = previous?.inWatchlist !== on;
      if (changed) patchAccountStats(client, (stats) => ({ watchlistCount: Math.max(0, stats.watchlistCount + (on ? 1 : -1)) }));
      return { previous, changed };
    },
    onSuccess: (_, on) =>
      addToast({ title: on ? `${title} added to your watchlist` : `${title} removed from your watchlist`, color: "success" }),
    onError: (error, _, context) => {
      client.setQueryData(statusKey(movieId), context?.previous);
      if (context?.changed) void refreshAccountStats(client);
      addToast({ title: error.message, color: "danger" });
    },
    onSettled: () => client.invalidateQueries({ queryKey: panelKeys.watchlist }),
  });
}

/**
 * Saves a film without needing to know beforehand whether it's saved (the call is idempotent), for
 * lists of many films where asking each one's state would cost a request per row.
 */
export function useAddToWatchlist() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ movieId }: { movieId: string; title: string }) => panelApi.addToWatchlist(movieId),
    retry: false,
    onSuccess: (_, { movieId, title }) => {
      client.setQueryData(statusKey(movieId), { inWatchlist: true });
      void client.invalidateQueries({ queryKey: panelKeys.watchlist });
      void refreshAccountStats(client);
      addToast({ title: `${title} added to your watchlist`, color: "success" });
    },
    onError: (error) => addToast({ title: error.message, color: "danger" }),
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
      patchAccountStats(client, (stats) => ({ watchlistCount: Math.max(0, stats.watchlistCount - 1) }));
    },
    onError: (error) => {
      void refreshAccountStats(client);
      addToast({ title: error.message, color: "danger" });
    },
    onSettled: () => client.invalidateQueries({ queryKey: panelKeys.watchlist }),
  });
}
