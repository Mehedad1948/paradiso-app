"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { curationsApi } from "@/lib/api/curations";
import { curationKeys } from "@/lib/query/curation-keys";
import { usePanelMutation, type MutationOptions } from "./usePanelMutation";
import type { AdminEditorsPicks, AdminLandingGrid } from "@/types/curations";

/*
 * The admin editors for the landing's curated lists. Each list is loaded whole, edited locally
 * and saved whole; a save also refreshes the landing (the BFF expires its cache).
 */

export const useAdminLandingGrid = () =>
  useQuery({
    queryKey: curationKeys.landingGrid,
    queryFn: ({ signal }) => curationsApi.landingGrid(signal),
    // An editor's open draft must not be swapped under them by a background refetch.
    refetchOnWindowFocus: false,
  });

export const useAdminEditorsPicks = () =>
  useQuery({
    queryKey: curationKeys.editorsPicks,
    queryFn: ({ signal }) => curationsApi.editorsPicks(signal),
    refetchOnWindowFocus: false,
  });

export const useSaveLandingGrid = (options?: MutationOptions<AdminLandingGrid>) =>
  usePanelMutation(curationsApi.saveLandingGrid, [curationKeys.landingGrid], options);

export const useSaveEditorsPicks = (options?: MutationOptions<AdminEditorsPicks>) =>
  usePanelMutation(curationsApi.saveEditorsPicks, [curationKeys.editorsPicks], options);

/** Library films for the pickers; waits for two characters and keeps the last results while typing. */
export const useLibrarySearch = (search: string) => {
  const term = search.trim();
  return useQuery({
    queryKey: curationKeys.library(term),
    queryFn: ({ signal }) => curationsApi.searchLibrary(term, signal),
    enabled: term.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
};
