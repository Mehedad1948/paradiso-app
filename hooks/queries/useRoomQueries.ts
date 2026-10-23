"use client";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
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
export const ROOM_RATINGS_PAGE_SIZE = 25;
export const useRoomRatings = (id: string, filters: RoomRatingFilters) => {
  // Scrolling drives paging, so the page and limit are not part of the identity.
  const { page: _page, limit: _limit, ...rest } = filters;
  return useInfiniteQuery({
    queryKey: [...panelKeys.ratings(id), rest],
    queryFn: ({ signal, pageParam }) =>
      panelApi.ratings(
        id,
        { ...rest, page: pageParam, limit: ROOM_RATINGS_PAGE_SIZE },
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.currentPage < last.meta.totalPages
        ? last.meta.currentPage + 1
        : undefined,
    enabled: !!id,
    // Filters can retain rows; switching rooms must never display another room's data.
    placeholderData: (previous, query) =>
      query?.queryKey[1] === id ? previous : undefined,
    select: (data) => ({
      ...data.pages[data.pages.length - 1],
      data: data.pages.flatMap((page) => page.data),
    }),
  });
};
export const useRoomRatingSummary = (id: string, enabled = true) =>
  useQuery({
    queryKey: panelKeys.ratingSummary(id),
    queryFn: ({ signal }) => panelApi.ratingSummary(id, signal),
    enabled: enabled && !!id,
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
export const useUpdateRoom = (
  id: string,
  options?: MutationOptions<Awaited<ReturnType<typeof panelApi.updateRoom>>>,
) =>
  usePanelMutation(
    panelApi.updateRoom,
    [panelKeys.rooms, panelKeys.room(id)],
    options,
  );
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
export const useAddCustomMovie = (
  id: string,
  options?: MutationOptions<
    Awaited<ReturnType<typeof panelApi.addCustomMovie>>
  >,
) =>
  usePanelMutation(
    panelApi.addCustomMovie,
    [panelKeys.room(id), panelKeys.ratings(id)],
    options,
  );
export const useUpdateMovie = (
  id: string,
  options?: MutationOptions<Awaited<ReturnType<typeof panelApi.updateMovie>>>,
) =>
  usePanelMutation(
    panelApi.updateMovie,
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
