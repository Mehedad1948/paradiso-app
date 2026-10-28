"use client";
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";

/** Details change about as often as a film is re-released: keep them for the whole session. */
const DETAILS_STALE = 24 * 60 * 60_000;
const DETAILS_GC = 60 * 60_000;

const detailsQuery = (movieId: string) => ({
  queryKey: panelKeys.movieDetails(movieId),
  queryFn: ({ signal }: { signal: AbortSignal }) => panelApi.movieDetails(movieId, signal),
  staleTime: DETAILS_STALE,
  gcTime: DETAILS_GC,
});

/** One film's details. */
export const useMovieDetails = (movieId: string) => useQuery(detailsQuery(movieId));

/** Warms the cache on hover, focus or touch, so the details are usually there before the click. */
export function usePrefetchMovieDetails() {
  const client = useQueryClient();
  return useCallback(
    (movieId: string) => void client.prefetchQuery(detailsQuery(movieId)),
    [client],
  );
}
