"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";
import type { RoomRatingFilters } from "@/types/rooms";
import { usePanelMutation, type MutationOptions } from "./usePanelMutation";

export const useRooms = (usersRoom: boolean, page = 1) =>
  useQuery({
    queryKey: [...panelKeys.rooms, { usersRoom, page }],
    queryFn: ({ signal }) => panelApi.rooms(usersRoom, page, signal),
    placeholderData: keepPreviousData,
  });
export const useRoom = (id: string) =>
  useQuery({
    queryKey: panelKeys.room(id),
    queryFn: ({ signal }) => panelApi.room(id, signal),
    enabled: !!id,
  });
export const useRoomRatings = (id: string, filters: RoomRatingFilters) =>
  useQuery({
    queryKey: [...panelKeys.ratings(id), filters],
    queryFn: ({ signal }) => panelApi.ratings(id, filters, signal),
    enabled: !!id,
    // Pagination can retain rows; switching rooms must never display another room's data.
    placeholderData: (previous, query) =>
      query?.queryKey[1] === id ? previous : undefined,
  });
export const useMovieSearch = (query: string, enabled = true) =>
  useQuery({
    queryKey: ["movie-search", query.trim()],
    queryFn: ({ signal }) => panelApi.searchMovies(query.trim(), signal),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 5 * 60_000,
  });
type Message = { message: string };
export const useCreateRoom = (
  options?: MutationOptions<Awaited<ReturnType<typeof panelApi.createRoom>>>,
) => usePanelMutation(panelApi.createRoom, [panelKeys.rooms], options);
export const useJoinRoom = (id: string, options?: MutationOptions<Message>) =>
  usePanelMutation(
    panelApi.joinRoom,
    [panelKeys.rooms, panelKeys.room(id)],
    options,
  );
export const useAddMovie = (id: string, options?: MutationOptions<Message>) =>
  usePanelMutation(
    panelApi.addMovie,
    [panelKeys.room(id), panelKeys.ratings(id)],
    options,
  );
export const useRemoveMovie = (
  id: string,
  options?: MutationOptions<Message>,
) =>
  usePanelMutation(
    panelApi.removeMovie,
    [panelKeys.room(id), panelKeys.ratings(id)],
    options,
  );
export const useVote = (id: string, options?: MutationOptions<unknown>) =>
  usePanelMutation(panelApi.vote, [panelKeys.ratings(id)], options);
export const useUploadImage = (
  options?: MutationOptions<Awaited<ReturnType<typeof panelApi.uploadImage>>>,
) => usePanelMutation(panelApi.uploadImage, [], options);
