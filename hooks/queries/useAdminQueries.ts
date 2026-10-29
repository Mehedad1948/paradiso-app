"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, type CandidateFilter } from "@/lib/api/admin";
import { adminKeys } from "@/lib/query/admin-keys";
import { panelKeys } from "@/lib/query/panel-keys";
import { usePanelMutation, type MutationOptions } from "./usePanelMutation";

/** The featured-artist schedule between two UTC days (`YYYY-MM-DD`). */
export const useFeaturedDays = (from: string, to: string) =>
  useQuery({
    queryKey: adminKeys.featuredDays(from, to),
    queryFn: ({ signal }) => adminApi.featuredDays(from, to, signal),
  });

export const useSetFeaturedDay = (options?: MutationOptions<unknown>) =>
  usePanelMutation(adminApi.setFeaturedDay, [adminKeys.featuredDaysAll, adminKeys.peopleAll], options);

export const useRemoveFeaturedDay = (options?: MutationOptions<unknown>) =>
  usePanelMutation(adminApi.removeFeaturedDay, [adminKeys.featuredDaysAll, adminKeys.peopleAll], options);

export const useCandidates = (filter: CandidateFilter, page: number) =>
  useQuery({
    queryKey: adminKeys.candidates(filter, page),
    queryFn: ({ signal }) => adminApi.candidates(filter, page, signal),
    placeholderData: keepPreviousData,
  });

const candidateKeys = [adminKeys.candidatesAll, adminKeys.peopleAll, ["admin", "featured", "preview"]] as const;

export const useSaveCandidate = (options?: MutationOptions<unknown>) =>
  usePanelMutation(adminApi.saveCandidate, candidateKeys, options);

export const useRemoveCandidate = (options?: MutationOptions<unknown>) =>
  usePanelMutation(adminApi.removeCandidate, candidateKeys, options);

/** People by name; waits for two characters and keeps the last results while typing. */
export const usePeopleSearch = (query: string, page: number) => {
  const term = query.trim();
  return useQuery({
    queryKey: adminKeys.people(term, page),
    queryFn: ({ signal }) => adminApi.searchPeople(term, page, signal),
    enabled: term.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
};

export const usePersonPreview = (id: number | null) =>
  useQuery({
    queryKey: adminKeys.preview(id ?? 0),
    queryFn: ({ signal }) => adminApi.previewPerson(id as number, signal),
    enabled: id !== null,
    staleTime: 15_000,
  });

export const useSyncGenres = (options?: MutationOptions<unknown>) =>
  usePanelMutation(adminApi.syncGenres, [panelKeys.genres], options);

export const useRenameGenre = (options?: MutationOptions<unknown>) =>
  usePanelMutation(adminApi.renameGenre, [panelKeys.genres], options);

export const useRemoveGenre = (options?: MutationOptions<unknown>) =>
  usePanelMutation(adminApi.removeGenre, [panelKeys.genres], options);

/** TMDb films for the picker's "not in the library yet" tab. */
export const useTmdbSearch = (query: string, enabled: boolean) => {
  const term = query.trim();
  return useQuery({
    queryKey: adminKeys.tmdb(term),
    queryFn: ({ signal }) => adminApi.searchTmdb(term, signal),
    enabled: enabled && term.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
};

export const useImportFilm = (options?: MutationOptions<{ id: string }>) =>
  usePanelMutation(adminApi.importFilm, [], options);
