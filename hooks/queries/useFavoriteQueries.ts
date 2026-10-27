"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addToast } from "@heroui/toast";
import { communityApi } from "@/lib/api/community";
import { communityKeys } from "@/lib/query/community-keys";
import type { FavoriteMovie } from "@/types/community";
import { patchAccountStats } from "./useMe";

/** How many posters `/me` previews from the top of the favorites list. */
const PREVIEW_POSTERS = 4;

type Favorites = { data: FavoriteMovie[] };

/** How the backend stores a note: trimmed, and blank means none. */
export const normalizeNote = (note: string | null | undefined) => note?.trim() || null;

/** A member's favorite films, in their chosen order. Public. */
export const useFavorites = (userId: number) =>
  useQuery({
    queryKey: communityKeys.favorites(userId),
    queryFn: ({ signal }) => communityApi.favorites(userId, signal),
    enabled: Number.isSafeInteger(userId) && userId > 0,
    staleTime: 60_000,
    select: (data) => data.data,
  });

/**
 * Saves the whole list in one go, so adding, removing and reordering share one path.
 * `notes` holds only the notes that changed; they're written once the list exists,
 * since a film has to be a favorite before it can carry a note.
 */
export function useSetFavorites(me: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ movieIds, notes = {} }: { movieIds: string[]; notes?: Record<string, string | null> }) => {
      const list = await communityApi.setFavorites(movieIds);
      const changed = Object.entries(notes).filter(([id]) => movieIds.includes(id));
      if (!changed.length) return list;
      // Each PATCH answers with the list as it stood then, so parallel replies can
      // race; fold the notes we sent onto the saved list instead of trusting the last one.
      await Promise.all(changed.map(([movieId, note]) => communityApi.setFavoriteNote({ movieId, note })));
      return {
        ...list,
        data: list.data.map((item) =>
          item.movie.id in notes ? { ...item, note: normalizeNote(notes[item.movie.id]) } : item,
        ),
      };
    },
    retry: false,
    onSuccess: (result) => {
      client.setQueryData<Favorites>(communityKeys.favorites(me), result);
      // The saved list is the whole truth, so the account totals can be set exactly.
      patchAccountStats(client, () => ({
        favoritesCount: result.data.length,
        favoritePosters: result.data.slice(0, PREVIEW_POSTERS).map((item) => item.movie.poster_path ?? null),
      }));
      addToast({ title: "Favorites saved", color: "success" });
    },
    onError: (error) => {
      // The list may have saved even if a note didn't; show what actually landed.
      void client.invalidateQueries({ queryKey: communityKeys.favorites(me) });
      addToast({ title: error.message, color: "danger" });
    },
  });
}

/** Edits one note in place. The shelf updates at once and rolls back if the save fails. */
export function useSetFavoriteNote(me: number) {
  const client = useQueryClient();
  const key = communityKeys.favorites(me);
  return useMutation({
    mutationFn: communityApi.setFavoriteNote,
    retry: false,
    onMutate: async ({ movieId, note }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<Favorites>(key);
      client.setQueryData<Favorites>(key, (list) =>
        list && {
          ...list,
          data: list.data.map((item) => (item.movie.id === movieId ? { ...item, note: normalizeNote(note) } : item)),
        },
      );
      return { previous };
    },
    onSuccess: (result, { note }) => {
      client.setQueryData<Favorites>(key, result);
      addToast({ title: normalizeNote(note) ? "Note saved" : "Note removed", color: "success" });
    },
    onError: (error, _, context) => {
      client.setQueryData(key, context?.previous);
      addToast({ title: error.message, color: "danger" });
    },
  });
}
