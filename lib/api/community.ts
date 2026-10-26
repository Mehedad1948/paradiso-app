import { bffRequest, queryString } from "./client";
import type {
  CommunityComment,
  CommunityPost,
  CommunityProfile,
  CommunityRecommendation,
  CommunityUser,
  CreatePostInputs,
  CursorPage,
  FavoriteMovie,
  FeedScope,
  ResolvedMovie,
  UpdatePostInputs,
} from "@/types/community";

const json = (body: unknown) => JSON.stringify(body);
const postPath = (id: number) => `/community/posts/${encodeURIComponent(id)}`;
const userPath = (id: number) => `/community/users/${encodeURIComponent(id)}`;

type Cursor = { before?: number; limit?: number };

export const communityApi = {
  feed: (scope: FeedScope, cursor: Cursor, signal?: AbortSignal) => {
    const path =
      scope.kind === "room"
        ? `/community/rooms/${encodeURIComponent(scope.roomId)}/posts${queryString(cursor)}`
        : scope.kind === "following"
          ? `/community/following${queryString(cursor)}`
          : `/community/posts${queryString({ ...cursor, authorId: scope.authorId, movieId: scope.movieId })}`;
    return bffRequest<CursorPage<CommunityPost>>(path, { signal });
  },
  post: (id: number, signal?: AbortSignal) =>
    bffRequest<CommunityPost>(postPath(id), { signal }),
  create: (body: CreatePostInputs) =>
    bffRequest<CommunityPost>("/community/posts", { method: "POST", body: json(body) }),
  update: ({ id, ...body }: UpdatePostInputs & { id: number }) =>
    bffRequest<CommunityPost>(postPath(id), { method: "PATCH", body: json(body) }),
  remove: (id: number) =>
    bffRequest<{ message: string }>(postPath(id), { method: "DELETE" }),
  react: ({ postId, value }: { postId: number; value: 1 | -1 | null }) =>
    bffRequest<{ likeCount: number; dislikeCount: number; myReaction: 1 | -1 | null }>(
      `${postPath(postId)}/reaction`,
      value === null ? { method: "DELETE" } : { method: "PUT", body: json({ value }) },
    ),
  /** Reposting is idempotent; undoing takes the original post's id. */
  repost: ({ postId, on }: { postId: number; on: boolean; me: number }): Promise<CommunityPost | { message: string }> =>
    on
      ? bffRequest<CommunityPost>(`${postPath(postId)}/repost`, { method: "POST" })
      : bffRequest<{ message: string }>(`${postPath(postId)}/repost`, { method: "DELETE" }),
  comments: (postId: number, cursor: Cursor, signal?: AbortSignal) =>
    bffRequest<CursorPage<CommunityComment>>(
      `${postPath(postId)}/comments${queryString(cursor)}`,
      { signal },
    ),
  comment: ({ postId, text }: { postId: number; text: string }) =>
    bffRequest<CommunityComment>(`${postPath(postId)}/comments`, {
      method: "POST",
      body: json({ text }),
    }),
  removeComment: ({ postId, commentId }: { postId: number; commentId: number }) =>
    bffRequest<{ message: string }>(
      `${postPath(postId)}/comments/${encodeURIComponent(commentId)}`,
      { method: "DELETE" },
    ),
  profile: (userId: number, signal?: AbortSignal) =>
    bffRequest<CommunityProfile>(userPath(userId), { signal }),
  follow: ({ userId, follow }: { userId: number; follow: boolean }) =>
    bffRequest<{ message: string }>(`${userPath(userId)}/follow`, {
      method: follow ? "PUT" : "DELETE",
    }),
  people: (
    userId: number,
    kind: "followers" | "following",
    cursor: Cursor,
    signal?: AbortSignal,
  ) =>
    bffRequest<CursorPage<CommunityUser>>(
      `${userPath(userId)}/${kind}${queryString(cursor)}`,
      { signal },
    ),
  recommendations: (userId: number, cursor: Cursor, signal?: AbortSignal) =>
    bffRequest<CursorPage<CommunityRecommendation>>(
      `${userPath(userId)}/recommendations${queryString(cursor)}`,
      { signal },
    ),
  favorites: (userId: number, signal?: AbortSignal) =>
    bffRequest<{ data: FavoriteMovie[] }>(`/favorites/users/${encodeURIComponent(userId)}`, { signal }),
  /** Replaces the whole list; the order given is the display order. */
  setFavorites: (movieIds: string[]) =>
    bffRequest<{ data: FavoriteMovie[] }>("/favorites", { method: "PUT", body: json({ movieIds }) }),
  resolveMovie: (tmdbId: number) =>
    bffRequest<ResolvedMovie>("/community/movies/resolve", {
      method: "POST",
      body: json({ tmdbId }),
    }),
  uploadImage: (file: File) => {
    const body = new FormData();
    body.set("file", file);
    body.set("folder", "community");
    return bffRequest<{ url: string }>("/uploads", { method: "POST", body });
  },
};
