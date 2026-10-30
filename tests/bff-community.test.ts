import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  token: "session-token" as string | undefined,
  revalidateTag: vi.fn(),
  community: {
    feed: vi.fn(),
    publicFeed: vi.fn(),
    publicPost: vi.fn(),
    following: vi.fn(),
    roomFeed: vi.fn(),
    post: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    repost: vi.fn(),
    undoRepost: vi.fn(),
    comments: vi.fn(),
    comment: vi.fn(),
    deleteComment: vi.fn(),
    profile: vi.fn(),
    follow: vi.fn(),
    unfollow: vi.fn(),
    followers: vi.fn(),
    followingUsers: vi.fn(),
  },
  movies: { tmdbMovie: vi.fn(), create: vi.fn(), list: vi.fn(), searchDbMovies: vi.fn() },
  storage: { uploadImage: vi.fn() },
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag,
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (mocks.token ? { value: mocks.token } : undefined),
  }),
}));
vi.mock("@/services/community", () => ({ default: mocks.community }));
vi.mock("@/services/movies", () => ({ moviesServices: mocks.movies }));
vi.mock("@/services/storage", () => ({ default: mocks.storage }));
vi.mock("@/services/rooms", () => ({ default: {} }));
vi.mock("@/services/user", () => ({ default: {} }));
vi.mock("@/services/ratings", () => ({ default: {} }));
vi.mock("@/services/rooms/room-invite-link.service", () => ({ default: {} }));
vi.mock("@/services/rooms/room-chat.service", () => ({ default: {} }));

import { handlePanelRequest } from "@/lib/bff/panel";

const ok = (result: unknown) => ({
  result,
  response: { ok: true, status: 200, statusText: "OK" },
});
const failed = (status: number) => ({
  result: null,
  response: { ok: false, status, statusText: "", message: "nope" },
});
const movieId = "3f1c2a9e-8d7b-4c6a-9e5f-0a1b2c3d4e5f";
const post = (extra: Record<string, unknown> = {}) => ({
  id: 1,
  text: "Watch it",
  rating: 8,
  promotion: null,
  ...extra,
});
function call(path: string, method = "GET", body?: unknown) {
  const request = new Request(`http://localhost/api/bff/${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return handlePanelRequest(request, path.split("?")[0].split("/"));
}
beforeEach(() => {
  mocks.token = "session-token";
  vi.clearAllMocks();
  process.env.AWS_BASE_URL = "https://cdn.example/";
});

describe("BFF community", () => {
  it("serves feeds to anonymous readers with bounded cursors", async () => {
    mocks.token = undefined;
    mocks.community.publicFeed.mockResolvedValue(ok({ data: [], nextCursor: null }));
    const response = await call(`community/posts?before=40&authorId=3&movieId=${movieId}`);
    expect(response.status).toBe(200);
    // No abort signal: one reader leaving must not cancel a fetch that fills a shared entry.
    expect(mocks.community.publicFeed).toHaveBeenCalledWith({ limit: 20, before: 40, authorId: 3, movieId });
    expect((await call("community/posts?limit=101")).status).toBe(400);
    expect((await call("community/posts?movieId=42")).status).toBe(400);
  });

  it("reads the shared signed-out view only for anonymous readers", async () => {
    mocks.community.feed.mockResolvedValue(ok({ data: [], nextCursor: null }));
    mocks.community.post.mockResolvedValue(ok(post()));
    expect((await call("community/posts")).status).toBe(200);
    expect((await call("community/posts/5")).status).toBe(200);
    // A signed-in reader's feed carries their reactions, so it is never the shared one.
    expect(mocks.community.feed).toHaveBeenCalledTimes(1);
    expect(mocks.community.post).toHaveBeenCalledTimes(1);
    expect(mocks.community.publicFeed).not.toHaveBeenCalled();
    expect(mocks.community.publicPost).not.toHaveBeenCalled();

    mocks.token = undefined;
    mocks.community.publicFeed.mockResolvedValue(ok({ data: [], nextCursor: null }));
    mocks.community.publicPost.mockResolvedValue(ok(post()));
    expect((await call("community/posts")).status).toBe(200);
    expect((await call("community/posts/5")).status).toBe(200);
    expect(mocks.community.publicFeed).toHaveBeenCalledTimes(1);
    expect(mocks.community.publicPost).toHaveBeenCalledTimes(1);
    expect(mocks.community.feed).toHaveBeenCalledTimes(1);
    expect(mocks.community.post).toHaveBeenCalledTimes(1);
    // Following and room feeds depend on the reader, so they are never shared.
    mocks.community.following.mockResolvedValue(ok({ data: [], nextCursor: null }));
    expect((await call("community/following")).status).toBe(401);
    expect(mocks.community.following).not.toHaveBeenCalled();
  });

  it("expires the shared feeds when a post is created, edited, deleted or reposted", async () => {
    mocks.community.create.mockResolvedValue(ok(post()));
    mocks.community.update.mockResolvedValue(ok(post()));
    mocks.community.delete.mockResolvedValue(ok({ message: "ok" }));
    mocks.community.repost.mockResolvedValue(ok(post()));
    mocks.community.undoRepost.mockResolvedValue(ok({ message: "ok" }));
    await call("community/posts", "POST", { text: "Hi" });
    await call("community/posts/5", "PATCH", { text: "Hi again" });
    await call("community/posts/5", "DELETE");
    await call("community/posts/5/repost", "POST");
    await call("community/posts/5/repost", "DELETE");
    expect(mocks.revalidateTag).toHaveBeenCalledTimes(5);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("community-posts", { expire: 0 });

    // A write the backend refused changed nothing, so nothing is expired.
    mocks.revalidateTag.mockClear();
    mocks.community.delete.mockResolvedValue(failed(403));
    await call("community/posts/5", "DELETE");
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("asks anonymous readers to sign in before any write", async () => {
    mocks.token = undefined;
    expect((await call("community/following")).status).toBe(401);
    expect((await call("community/posts", "POST", {})).status).toBe(401);
    expect((await call("community/posts/1/comments", "POST", { text: "hi" })).status).toBe(401);
    expect((await call("community/users/2/follow", "PUT")).status).toBe(401);
    expect(mocks.community.create).not.toHaveBeenCalled();
    // A room itself stays behind the session (only the public list is open).
    expect((await call("rooms/1")).status).toBe(401);
  });

  it("rebuilds a post from known fields and mirrors the backend rules", async () => {
    mocks.community.create.mockResolvedValue(ok(post()));
    const response = await call("community/posts", "POST", {
      movieId,
      text: "  A quiet masterpiece.  ",
      rating: 9.5,
      roomId: 4,
      authorId: 99,
    });
    expect(response.status).toBe(200);
    expect(mocks.community.create).toHaveBeenCalledWith({
      movieId,
      text: "A quiet masterpiece.",
      rating: 9.5,
      roomId: 4,
    });
    const invalid = [
      { movieId, text: "   ", rating: 5 },
      { movieId, text: "ok", rating: 7.25 },
      { movieId, text: "ok", rating: 11 },
      { movieId, text: "ok", rating: 5, imageUrl: "http://insecure.example/a.jpg" },
      { movieId: "603", text: "ok", rating: 5 },
      { movieId, text: "x".repeat(4001), rating: 5 },
    ];
    for (const body of invalid)
      expect((await call("community/posts", "POST", body)).status).toBe(400);
    expect(mocks.community.create).toHaveBeenCalledTimes(1);
  });

  it("requires at least one field to edit and never clears the image", async () => {
    expect((await call("community/posts/5", "PATCH", {})).status).toBe(400);
    expect((await call("community/posts/5", "PATCH", { imageUrl: null })).status).toBe(400);
    mocks.community.update.mockResolvedValue(ok(post()));
    expect((await call("community/posts/5", "PATCH", { rating: 7.3 })).status).toBe(200);
    expect(mocks.community.update).toHaveBeenCalledWith(5, { rating: 7.3 });
  });

  it("turns promoted room images into absolute URLs", async () => {
    mocks.community.post.mockResolvedValue(
      ok(post({ promotion: { room: { id: 2, name: "Noir", image: "rooms/a.jpg" }, canJoin: true, token: movieId } })),
    );
    const payload = await (await call("community/posts/1")).json();
    expect(payload.result.promotion.room.image).toBe("https://cdn.example/rooms/a.jpg");
  });

  it("finds the existing library copy when TMDb says the film already exists", async () => {
    mocks.movies.tmdbMovie.mockResolvedValue(
      ok({ id: 603, title: "The Matrix", release_date: "", genres: [{ id: 1, name: "Action" }] }),
    );
    mocks.movies.create.mockResolvedValue(failed(409));
    mocks.movies.list
      .mockResolvedValueOnce(ok({ data: [{ id: "a", dbId: 1, title: "Other" }], meta: { totalPages: 2 } }))
      .mockResolvedValueOnce(
        ok({ data: [{ id: movieId, dbId: 603, title: "The Matrix", poster_path: "/m.jpg" }], meta: { totalPages: 2 } }),
      );
    const payload = await (await call("community/movies/resolve", "POST", { tmdbId: 603 })).json();
    expect(payload.result).toEqual({ id: movieId, dbId: 603, title: "The Matrix", poster_path: "/m.jpg" });
    expect(mocks.movies.create).toHaveBeenCalledWith(
      expect.objectContaining({ dbId: 603, release_date: null, genres: [{ id: 1, name: "Action" }] }),
    );
  });

  it("uploads community stills and returns an HTTPS address", async () => {
    mocks.storage.uploadImage.mockResolvedValue(ok({ name: "community/s.jpg", path: "/tmp/s.jpg" }));
    const form = new FormData();
    form.set("file", new File(["x"], "s.jpg", { type: "image/jpeg" }));
    form.set("folder", "community");
    const response = await handlePanelRequest(
      new Request("http://localhost/api/bff/uploads", { method: "POST", body: form }),
      ["uploads"],
    );
    expect((await response.json()).result.url).toBe("https://cdn.example/community/s.jpg");
  });
});
