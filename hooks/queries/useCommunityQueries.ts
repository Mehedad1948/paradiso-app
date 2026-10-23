"use client";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { addToast } from "@heroui/toast";
import { communityApi } from "@/lib/api/community";
import { panelApi, type PanelRoomListItem } from "@/lib/api/panel";
import { communityKeys } from "@/lib/query/community-keys";
import { panelKeys } from "@/lib/query/panel-keys";
import type {
  CommunityComment,
  CommunityPost,
  CommunityProfile,
  CursorPage,
  FeedScope,
} from "@/types/community";

type Pages<T> = InfiniteData<CursorPage<T>, number | undefined>;
type Cursor = number | undefined;

const toastError = (error: Error) => addToast({ title: error.message, color: "danger" });

const infinite = <T,>(
  queryKey: readonly unknown[],
  fetchPage: (before: Cursor, signal: AbortSignal) => Promise<CursorPage<T>>,
  enabled = true,
) => ({
  queryKey,
  queryFn: ({ pageParam, signal }: { pageParam: Cursor; signal: AbortSignal }) =>
    fetchPage(pageParam, signal),
  initialPageParam: undefined as Cursor,
  getNextPageParam: (last: CursorPage<T>) => last.nextCursor ?? undefined,
  enabled,
});

// ---------------------------------------------------------------- cache surgery

/** Rewrites a post wherever it is cached; return null to drop it. Untouched posts keep their identity. */
function mapPosts(client: QueryClient, map: (post: CommunityPost) => CommunityPost | null) {
  client.setQueriesData<Pages<CommunityPost>>({ queryKey: communityKeys.feeds }, (data) => {
    if (!data) return data;
    let changed = false;
    const pages = data.pages.map((page) => {
      const next = page.data.flatMap((post) => {
        const result = map(post);
        if (result !== post) changed = true;
        return result ? [result] : [];
      });
      return next.length === page.data.length && next.every((post, i) => post === page.data[i])
        ? page
        : { ...page, data: next };
    });
    return changed ? { ...data, pages } : data;
  });
  client.setQueriesData<CommunityPost>({ queryKey: communityKeys.posts }, (post) =>
    post ? (map(post) ?? post) : post,
  );
}

function prepend<T extends { id: number }>(client: QueryClient, queryKey: readonly unknown[], item: T) {
  client.setQueryData<Pages<T>>(queryKey, (data) => {
    if (!data?.pages.length) return data;
    const [first, ...rest] = data.pages;
    return {
      ...data,
      pages: [{ ...first, data: [item, ...first.data.filter((value) => value.id !== item.id)] }, ...rest],
    };
  });
}

/** Lets a post page render instantly from any feed it was seen in. */
function cachedPost(client: QueryClient, id: number) {
  for (const [, data] of client.getQueriesData<Pages<CommunityPost>>({ queryKey: communityKeys.feeds })) {
    for (const page of data?.pages ?? []) {
      const post = page.data.find((item) => item.id === id);
      if (post) return post;
    }
  }
}

// ---------------------------------------------------------------- reads

export const useFeed = (scope: FeedScope, enabled = true) =>
  useInfiniteQuery({
    ...infinite(
      communityKeys.feed(scope),
      (before, signal) => communityApi.feed(scope, { before }, signal),
      enabled,
    ),
    staleTime: 60_000,
    // A refetch on focus would reshuffle the list under the reader; the "new posts" pill covers it.
    refetchOnWindowFocus: false,
  });

/** Polls the top of a feed and reports how many posts are newer than the one shown first. */
export const useFeedHead = (scope: FeedScope, newestId: number | undefined, enabled = true) =>
  useQuery({
    queryKey: communityKeys.feedHead(scope),
    queryFn: ({ signal }) => communityApi.feed(scope, { limit: 10 }, signal),
    enabled: enabled && newestId !== undefined,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 0,
    select: (page) => page.data.filter((post) => post.id > (newestId ?? Infinity)).length,
  });

export function usePost(id: number) {
  const client = useQueryClient();
  return useQuery({
    queryKey: communityKeys.post(id),
    queryFn: ({ signal }) => communityApi.post(id, signal),
    enabled: Number.isSafeInteger(id) && id > 0,
    initialData: () => cachedPost(client, id),
    // Seeded data is shown at once but still revalidated.
    initialDataUpdatedAt: 0,
  });
}

export const useComments = (postId: number) =>
  useInfiniteQuery(
    infinite(communityKeys.comments(postId), (before, signal) =>
      communityApi.comments(postId, { before }, signal),
    ),
  );

export const useProfile = (userId: number) =>
  useQuery({
    queryKey: communityKeys.profile(userId),
    queryFn: ({ signal }) => communityApi.profile(userId, signal),
    enabled: Number.isSafeInteger(userId) && userId > 0,
  });

export const usePeople = (userId: number, kind: "followers" | "following") =>
  useInfiniteQuery(
    infinite(communityKeys.people(userId, kind), (before, signal) =>
      communityApi.people(userId, kind, { before }, signal),
    ),
  );

/** The backend has no isFollowing flag, so cache everyone the viewer follows. */
export const useFollowingIds = (me: number | undefined) =>
  useQuery({
    queryKey: communityKeys.followingIds(me ?? 0),
    enabled: !!me,
    staleTime: 5 * 60_000,
    queryFn: async ({ signal }) => {
      const ids: number[] = [];
      let before: Cursor;
      for (let index = 0; index < 50; index++) {
        const page = await communityApi.people(me!, "following", { before, limit: 100 }, signal);
        ids.push(...page.data.map((user) => user.id));
        if (page.nextCursor == null) break;
        before = page.nextCursor;
      }
      return ids;
    },
  });

/** Every room the viewer belongs to, for room-post permissions and the composer. */
export const useMyRooms = (me: number | undefined) =>
  useQuery({
    // Lives under the rooms key so creating or joining a room refreshes it.
    queryKey: [...panelKeys.rooms, "community", me ?? 0],
    enabled: !!me,
    staleTime: 2 * 60_000,
    queryFn: async ({ signal }) => {
      const rooms: PanelRoomListItem[] = [];
      for (let page = 1; page <= 10; page++) {
        const result = await panelApi.myRooms(page, signal);
        rooms.push(...result.data);
        if (page >= result.meta.totalPages) break;
      }
      return rooms;
    },
  });

// ---------------------------------------------------------------- writes

export function useCreatePost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: communityApi.create,
    onError: toastError,
    onSuccess: (post) => {
      const scopes: FeedScope[] = post.room
        ? [{ kind: "room", roomId: post.room.id }]
        : [
            { kind: "global" },
            { kind: "global", authorId: post.author.id },
            ...(post.movie ? [{ kind: "global" as const, movieId: post.movie.id }] : []),
          ];
      scopes.forEach((scope) => prepend(client, communityKeys.feed(scope), post));
      client.setQueryData(communityKeys.post(post.id), post);
      // Public-room posts also reach the global feeds; let those catch up when next shown.
      void client.invalidateQueries({ queryKey: communityKeys.feeds, refetchType: "none" });
    },
  });
}

export function useUpdatePost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: communityApi.update,
    onError: toastError,
    onSuccess: (updated) => mapPosts(client, (post) => (post.id === updated.id ? updated : post)),
  });
}

export function useDeletePost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: communityApi.remove,
    onError: toastError,
    onSuccess: (_, id) => {
      mapPosts(client, (post) => (post.id === id ? null : post));
      client.removeQueries({ queryKey: communityKeys.comments(id) });
    },
  });
}

/** Optimistic like/dislike: pressing the active reaction again clears it. */
export function useReact() {
  const client = useQueryClient();
  const apply = (postId: number, counts: Pick<CommunityPost, "likeCount" | "dislikeCount" | "myReaction">) =>
    mapPosts(client, (post) => (post.id === postId ? { ...post, ...counts } : post));
  return useMutation({
    mutationFn: communityApi.react,
    onMutate: ({ postId, value }) => {
      let previous: Pick<CommunityPost, "likeCount" | "dislikeCount" | "myReaction"> | undefined;
      mapPosts(client, (post) => {
        if (post.id !== postId) return post;
        previous = { likeCount: post.likeCount, dislikeCount: post.dislikeCount, myReaction: post.myReaction };
        const was = post.myReaction;
        return {
          ...post,
          myReaction: value,
          likeCount: post.likeCount + (value === 1 ? 1 : 0) - (was === 1 ? 1 : 0),
          dislikeCount: post.dislikeCount + (value === -1 ? 1 : 0) - (was === -1 ? 1 : 0),
        };
      });
      return { previous };
    },
    onError: (error, { postId }, context) => {
      if (context?.previous) apply(postId, context.previous);
      toastError(error);
    },
    onSuccess: (counts, { postId }) => apply(postId, counts),
  });
}

const countComments = (client: QueryClient, postId: number, delta: number) =>
  mapPosts(client, (post) =>
    post.id === postId
      ? { ...post, commentCount: Math.max(0, post.commentCount + delta) }
      : post,
  );

export function useCreateComment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: communityApi.comment,
    onError: toastError,
    onSuccess: (comment: CommunityComment) => {
      prepend(client, communityKeys.comments(comment.postId), comment);
      countComments(client, comment.postId, 1);
    },
  });
}

export function useDeleteComment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: communityApi.removeComment,
    onError: toastError,
    onSuccess: (_, { postId, commentId }) => {
      client.setQueryData<Pages<CommunityComment>>(communityKeys.comments(postId), (data) =>
        data && {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            data: page.data.filter((comment) => comment.id !== commentId),
          })),
        },
      );
      countComments(client, postId, -1);
    },
  });
}

/** Optimistic follow toggle: the button and both counts move before the server answers. */
export function useFollow(me: number | undefined) {
  const client = useQueryClient();
  const idsKey = communityKeys.followingIds(me ?? 0);
  const bump = (userId: number, field: "followersCount" | "followingCount", delta: number) =>
    client.setQueryData<CommunityProfile>(communityKeys.profile(userId), (profile) =>
      profile && { ...profile, [field]: Math.max(0, profile[field] + delta) },
    );
  return useMutation({
    mutationFn: communityApi.follow,
    onMutate: async ({ userId, follow }) => {
      await client.cancelQueries({ queryKey: idsKey });
      const previous = client.getQueryData<number[]>(idsKey);
      const was = !!previous?.includes(userId);
      if (was === follow) return { previous, changed: false };
      client.setQueryData<number[]>(idsKey, (ids = []) =>
        follow ? [...ids, userId] : ids.filter((id) => id !== userId),
      );
      const delta = follow ? 1 : -1;
      bump(userId, "followersCount", delta);
      if (me) bump(me, "followingCount", delta);
      return { previous, changed: true };
    },
    onError: (error, { userId }, context) => {
      if (context?.changed) {
        client.setQueryData(idsKey, context.previous);
        void client.invalidateQueries({ queryKey: communityKeys.profile(userId) });
        if (me) void client.invalidateQueries({ queryKey: communityKeys.profile(me) });
      }
      toastError(error);
    },
    onSettled: (_, __, { userId }) => {
      void client.invalidateQueries({ queryKey: communityKeys.people(userId, "followers") });
      if (me) void client.invalidateQueries({ queryKey: communityKeys.people(me, "following") });
      void client.invalidateQueries({
        queryKey: communityKeys.feed({ kind: "following" }),
        refetchType: "none",
      });
    },
  });
}

export const useResolveMovie = () =>
  useMutation({ mutationFn: communityApi.resolveMovie, onError: toastError });

export const useUploadPostImage = () =>
  useMutation({ mutationFn: communityApi.uploadImage, onError: toastError });

