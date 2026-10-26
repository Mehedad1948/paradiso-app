import type { BackendQuery, BackendRequestBody } from "@/types/backend";
import { backendRequest } from "../backend";

type FeedQuery = BackendQuery<"/community/posts", "get">;
type PageQuery = { limit: number; before?: number };
type CreateBody = BackendRequestBody<"/community/posts", "post">;
type UpdateBody = BackendRequestBody<"/community/posts/{postId}", "patch">;

const postPath = "/community/posts/{postId}" as const;

/** Every route sends the session token when there is one; anonymous reads still work. */
const communityServices = {
  feed(query: FeedQuery, signal?: AbortSignal) {
    return backendRequest("/community/posts", "get", { query, signal });
  },
  following(query: FeedQuery, signal?: AbortSignal) {
    return backendRequest("/community/following", "get", { query, signal });
  },
  roomFeed(roomId: number, query: PageQuery, signal?: AbortSignal) {
    return backendRequest("/community/rooms/{roomId}/posts", "get", {
      pathParams: { roomId }, query, signal,
    });
  },
  post(postId: number, signal?: AbortSignal) {
    return backendRequest(postPath, "get", { pathParams: { postId }, signal });
  },
  create(body: CreateBody) {
    return backendRequest("/community/posts", "post", { body });
  },
  update(postId: number, body: UpdateBody) {
    return backendRequest(postPath, "patch", { pathParams: { postId }, body });
  },
  delete(postId: number) {
    return backendRequest(postPath, "delete", { pathParams: { postId } });
  },
  react(postId: number, value: 1 | -1) {
    return backendRequest("/community/posts/{postId}/reaction", "put", {
      pathParams: { postId }, body: { value },
    });
  },
  removeReaction(postId: number) {
    return backendRequest("/community/posts/{postId}/reaction", "delete", { pathParams: { postId } });
  },
  repost(postId: number) {
    return backendRequest("/community/posts/{postId}/repost", "post", { pathParams: { postId } });
  },
  undoRepost(postId: number) {
    return backendRequest("/community/posts/{postId}/repost", "delete", { pathParams: { postId } });
  },
  comments(postId: number, query: PageQuery, signal?: AbortSignal) {
    return backendRequest("/community/posts/{postId}/comments", "get", {
      pathParams: { postId }, query, signal,
    });
  },
  comment(postId: number, text: string) {
    return backendRequest("/community/posts/{postId}/comments", "post", {
      pathParams: { postId }, body: { text },
    });
  },
  deleteComment(postId: number, commentId: number) {
    return backendRequest("/community/posts/{postId}/comments/{commentId}", "delete", {
      pathParams: { postId, commentId },
    });
  },
  suggestedUsers(limit: number, signal?: AbortSignal) {
    return backendRequest("/community/users/suggested", "get", { query: { limit }, signal });
  },
  profile(userId: number, signal?: AbortSignal) {
    return backendRequest("/community/users/{userId}", "get", { pathParams: { userId }, signal });
  },
  follow(userId: number) {
    return backendRequest("/community/users/{userId}/follow", "put", { pathParams: { userId } });
  },
  unfollow(userId: number) {
    return backendRequest("/community/users/{userId}/follow", "delete", { pathParams: { userId } });
  },
  followers(userId: number, query: PageQuery, signal?: AbortSignal) {
    return backendRequest("/community/users/{userId}/followers", "get", {
      pathParams: { userId }, query, signal,
    });
  },
  followingUsers(userId: number, query: PageQuery, signal?: AbortSignal) {
    return backendRequest("/community/users/{userId}/following", "get", {
      pathParams: { userId }, query, signal,
    });
  },
  recommendations(userId: number, query: PageQuery, signal?: AbortSignal) {
    return backendRequest("/community/users/{userId}/recommendations", "get", {
      pathParams: { userId }, query, signal,
    });
  },
};

export default communityServices;
