"use client";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { CurrentUser } from "@/types/user";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";
import type { RoomRatingFilters } from "@/types/rooms";
import { usePanelMutation, type MutationOptions } from "./usePanelMutation";

export const usePublicRooms = (page = 1, enabled = true) =>
  useQuery({
    queryKey: [...panelKeys.publicRooms, { page }],
    queryFn: ({ signal }) => panelApi.publicRooms(page, signal),
    enabled,
    placeholderData: keepPreviousData,
  });
export const useMyRoomsPage = (page = 1, enabled = true) =>
  useQuery({
    queryKey: [...panelKeys.myRooms, { page }],
    queryFn: ({ signal }) => panelApi.myRooms(page, signal, 10),
    placeholderData: keepPreviousData,
    enabled,
  });
/**
 * The public list can be a minute stale upstream, so the viewer's own join or leave is written
 * into it directly; refetching it right away would only bring the stale copy back.
 */
function patchPublicMembers(
  client: QueryClient,
  roomId: number,
  joined: boolean,
) {
  const me = client.getQueryData<CurrentUser>(panelKeys.me);
  if (!me) return;
  const member = { id: me.id, username: me.username, avatar: me.avatar };
  client.setQueriesData<Awaited<ReturnType<typeof panelApi.publicRooms>>>(
    { queryKey: panelKeys.publicRooms },
    (list) =>
      list && {
        ...list,
        data: list.data.map((room) =>
          room.id !== roomId
            ? room
            : {
                ...room,
                users: joined
                  ? room.users.some((user) => user.id === me.id)
                    ? room.users
                    : [...room.users, member]
                  : room.users.filter((user) => user.id !== me.id),
              },
        ),
      },
  );
}
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
export const useJoinRoom = (id: string, options?: MutationOptions<Message>) => {
  const client = useQueryClient();
  return usePanelMutation(
    async (roomId: number) => {
      const result = await panelApi.joinRoom(roomId);
      patchPublicMembers(client, roomId, true);
      return result;
    },
    [panelKeys.myRooms, panelKeys.viewerRooms, panelKeys.room(id)],
    options,
  );
};
/** Leaving drops the member's access, so every cache that depends on the room goes stale. */
export const useLeaveRoom = (
  id: string,
  options?: MutationOptions<Awaited<ReturnType<typeof panelApi.leaveRoom>>>,
) => {
  const client = useQueryClient();
  return usePanelMutation(
    async (input: Parameters<typeof panelApi.leaveRoom>[0]) => {
      const result = await panelApi.leaveRoom(input);
      patchPublicMembers(client, Number(input.roomId), false);
      return result;
    },
    [panelKeys.myRooms, panelKeys.viewerRooms, ["room", id]],
    options,
  );
};
/** Removing or banning a member changes the roster and what they rated. */
export const useKickMember = (
  id: string,
  options?: MutationOptions<Awaited<ReturnType<typeof panelApi.kickMember>>>,
) =>
  usePanelMutation(
    panelApi.kickMember,
    [panelKeys.room(id), panelKeys.ratings(id)],
    options,
  );
export const useBanMember = (
  id: string,
  options?: MutationOptions<Awaited<ReturnType<typeof panelApi.banMember>>>,
) =>
  usePanelMutation(
    panelApi.banMember,
    [panelKeys.room(id), panelKeys.ratings(id)],
    options,
  );
export const useAddMovie =(id: string, options?: MutationOptions<Message>) =>
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
