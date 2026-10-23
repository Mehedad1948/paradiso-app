import type { components } from "./generated/backend";
import type { BackendRequestBody } from "./backend";

export type CommunityPost = components["schemas"]["CommunityPost"];
export type CommunityComment = components["schemas"]["CommunityComment"];
export type CommunityProfile = components["schemas"]["CommunityProfileResponse"];
export type CommunityUser = components["schemas"]["PublicUser"];
export type CommunityMovie = NonNullable<CommunityPost["movie"]>;
export type CommunityPromotion = NonNullable<CommunityPost["promotion"]>;

/** Cursor page shared by every community list route. */
export type CursorPage<T> = { data: T[]; nextCursor: number | null };

export type CreatePostInputs = BackendRequestBody<"/community/posts", "post">;
export type UpdatePostInputs = BackendRequestBody<"/community/posts/{postId}", "patch">;

/** A film resolved to its local id, ready to be recommended. */
export type ResolvedMovie = Pick<CommunityMovie, "id" | "title" | "poster_path"> & {
  dbId: number | null;
};

export type FeedScope =
  | { kind: "global"; authorId?: number; movieId?: string }
  | { kind: "following" }
  | { kind: "room"; roomId: number };

export const COMMUNITY_LIMITS = {
  text: 4000,
  comment: 2000,
  imageUrl: 2048,
  pageSize: 20,
} as const;
