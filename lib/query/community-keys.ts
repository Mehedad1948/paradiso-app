import type { FeedScope } from "@/types/community";

export const communityKeys = {
  all: ["community"] as const,
  feeds: ["community", "feed"] as const,
  feed: (scope: FeedScope) => ["community", "feed", scope] as const,
  feedHead: (scope: FeedScope) => ["community", "feed-head", scope] as const,
  posts: ["community", "post"] as const,
  post: (id: number) => ["community", "post", id] as const,
  comments: (postId: number) => ["community", "comments", postId] as const,
  profile: (userId: number) => ["community", "profile", userId] as const,
  people: (userId: number, kind: "followers" | "following") =>
    ["community", "people", userId, kind] as const,
  followingIds: (me: number) => ["community", "following-ids", me] as const,
  myRooms: (me: number) => ["community", "my-rooms", me] as const,
};
