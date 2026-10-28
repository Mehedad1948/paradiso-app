"use client";
import { useCallback } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { addToast } from "@heroui/toast";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";
import type { MovieComment, MovieCommentInput, MovieCommentPage } from "@/types/movies";
import { useMe } from "./useMe";

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

type CommentPages = InfiniteData<MovieCommentPage, number | undefined>;

/** What people said about a film, newest first, a page at a time. */
export const useMovieComments = (movieId: string) =>
  useInfiniteQuery({
    queryKey: panelKeys.movieComments(movieId),
    queryFn: ({ pageParam, signal }: { pageParam: number | undefined; signal: AbortSignal }) =>
      panelApi.movieComments(movieId, pageParam, signal),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last: MovieCommentPage) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });

/** Applies `change` to every loaded comment and moves the total by `delta`. */
function patchComments(
  client: QueryClient,
  movieId: string,
  change: (comments: MovieComment[], page: number) => MovieComment[],
  delta = 0,
) {
  client.setQueryData<CommentPages>(panelKeys.movieComments(movieId), (data) =>
    data && {
      ...data,
      pages: data.pages.map((page, index) => ({
        ...page,
        data: change(page.data, index),
        total: Math.max(0, page.total + delta),
      })),
    },
  );
}

let draftId = 0;

/** Posts a comment and shows it at once; a failure takes it back out and reports why. */
export function useCreateMovieComment(movieId: string) {
  const client = useQueryClient();
  const me = useMe().data;
  return useMutation({
    mutationFn: (input: MovieCommentInput) => panelApi.commentOnMovie({ movieId, ...input }),
    retry: false,
    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: panelKeys.movieComments(movieId) });
      // Negative ids mark comments the server hasn't confirmed yet.
      const id = --draftId;
      const now = new Date().toISOString();
      if (me)
        patchComments(
          client,
          movieId,
          (comments, page) =>
            page === 0
              ? [
                  {
                    id,
                    movieId,
                    text: input.text,
                    spoiler: !!input.spoiler,
                    parentId: null,
                    replyCount: 0,
                    author: { id: me.id, username: me.username, avatar: me.avatar ?? null },
                    createdAt: now,
                    updatedAt: now,
                  },
                  ...comments,
                ]
              : comments,
          1,
        );
      return { id };
    },
    onSuccess: (comment, _, context) =>
      patchComments(client, movieId, (comments) =>
        comments.map((item) => (item.id === context.id ? comment : item)),
      ),
    onError: (error, _, context) => {
      if (context) patchComments(client, movieId, (comments) => comments.filter((item) => item.id !== context.id), -1);
      addToast({ title: error.message, color: "danger" });
    },
  });
}

/** Saves an edit; the comment shows the new words while the request is out. */
export function useEditMovieComment(movieId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: MovieCommentInput & { commentId: number }) =>
      panelApi.editMovieComment({ movieId, ...input }),
    retry: false,
    onMutate: async ({ commentId, ...input }) => {
      await client.cancelQueries({ queryKey: panelKeys.movieComments(movieId) });
      const previous = client.getQueryData<CommentPages>(panelKeys.movieComments(movieId));
      patchComments(client, movieId, (comments) =>
        comments.map((item) =>
          item.id === commentId ? { ...item, ...input, updatedAt: new Date().toISOString() } : item,
        ),
      );
      return { previous };
    },
    onSuccess: (comment) =>
      patchComments(client, movieId, (comments) => comments.map((item) => (item.id === comment.id ? comment : item))),
    onError: (error, _, context) => {
      client.setQueryData(panelKeys.movieComments(movieId), context?.previous);
      addToast({ title: error.message, color: "danger" });
    },
  });
}

export function useDeleteMovieComment(movieId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => panelApi.deleteMovieComment({ movieId, commentId }),
    retry: false,
    onSuccess: (_, commentId) =>
      patchComments(client, movieId, (comments) => comments.filter((item) => item.id !== commentId), -1),
    onError: (error) => addToast({ title: error.message, color: "danger" }),
  });
}
