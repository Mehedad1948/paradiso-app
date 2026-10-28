"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addToast } from "@heroui/toast";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";
import { useSignInHref } from "@/features/community/components/SignInLink";
import { movieHref } from "@/features/movies/format";
import { rememberMoviePreview } from "@/features/movies/preview";
import type { Person, PersonCredit } from "@/types/people";
import { useMe } from "./useMe";

/** A filmography changes slowly; an hour also lets newly added library films show up. */
const PERSON_STALE = 60 * 60_000;

const personQuery = (id: number) => ({
  queryKey: panelKeys.person(id),
  queryFn: ({ signal }: { signal: AbortSignal }) => panelApi.person(id, signal),
  staleTime: PERSON_STALE,
  gcTime: PERSON_STALE,
});

/** A director's or actor's profile and filmography. */
export const usePerson = (id: number) => useQuery(personQuery(id));

/** Warms the cache on hover, focus or touch, like film links do. */
export function usePrefetchPerson() {
  const client = useQueryClient();
  return useCallback((id: number) => void client.prefetchQuery(personQuery(id)), [client]);
}

/**
 * Opens a film from a filmography. Most of a filmography isn't in the library yet, so the film is
 * added first, which needs an account; the credit then remembers its new id for the next click.
 */
export function useOpenCredit(personId: number) {
  const router = useRouter();
  const client = useQueryClient();
  const signedIn = !!useMe().data;
  const signIn = useSignInHref();
  const resolve = useMutation({
    mutationFn: (credit: PersonCredit) => panelApi.resolveMovie(credit.tmdbId),
    retry: false,
    onSuccess: ({ id }, credit) => {
      client.setQueryData<Person>(panelKeys.person(personId), (person) => {
        if (!person) return person;
        const link = (credits: PersonCredit[]) =>
          credits.map((item) => (item.tmdbId === credit.tmdbId ? { ...item, movieId: id } : item));
        return {
          ...person,
          credits: {
            directing: link(person.credits.directing),
            acting: link(person.credits.acting),
            crew: link(person.credits.crew),
          },
        };
      });
      rememberMoviePreview({ id, title: credit.title, poster_path: credit.poster_path, release_date: credit.release_date });
      router.push(movieHref(id), { scroll: false });
    },
    onError: (error) => addToast({ title: error.message, color: "danger" }),
  });

  const open = useCallback(
    (credit: PersonCredit) => {
      if (resolve.isPending) return;
      if (signedIn) return resolve.mutate(credit);
      addToast({ title: "Sign in to open this film", description: "It isn't on Paradiso yet; opening it adds it." });
      router.push(signIn);
    },
    [resolve, signedIn, signIn, router],
  );

  return { open, opening: resolve.isPending ? resolve.variables?.tmdbId : undefined };
}
