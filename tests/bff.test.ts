import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  token: "session-token" as string | undefined,
  getPublicRooms: vi.fn(),
  getMyRooms: vi.fn(),
  getMe: vi.fn(),
  updateMe: vi.fn(),
  uploadImage: vi.fn(),
  signIn: vi.fn(),
  joinRoom: vi.fn(),
  getRoomRatings: vi.fn(),
  getRoomRatingSummary: vi.fn(),
  castVote: vi.fn(),
  updateRoom: vi.fn(),
  addCustomMovieToRoom: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (mocks.token ? { value: mocks.token } : undefined),
  }),
}));
vi.mock("@/services/rooms", () => ({ default: mocks }));
vi.mock("@/services/user", () => ({ default: mocks }));
vi.mock("@/services/ratings", () => ({ default: mocks }));
vi.mock("@/services/auth/authServices", () => ({ default: mocks }));
vi.mock("@/services/rooms/room-invite-link.service", () => ({ default: {} }));
vi.mock("@/services/storage", () => ({ default: mocks }));
vi.mock("@/services/movies", () => ({ MoviesServices: class {} }));

import { handlePanelRequest } from "@/lib/bff/panel";

const ok = (result: unknown) => ({
  result,
  response: { ok: true, status: 200, statusText: "OK" },
});
function request(
  path: string,
  method = "GET",
  body?: unknown,
  origin?: string,
) {
  return new Request(`http://localhost/api/bff/${path}`, {
    method,
    headers: origin ? { origin } : undefined,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
beforeEach(() => {
  mocks.token = "session-token";
});

describe("BFF boundaries", () => {
  it("rejects an unauthenticated request without touching backend services", async () => {
    mocks.token = undefined;
    const response = await handlePanelRequest(request("rooms/1"), ["rooms", "1"]);
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.getMyRooms).not.toHaveBeenCalled();
  });
  it("serves the public room list to a signed-out visitor with a short shared cache", async () => {
    mocks.token = undefined;
    mocks.getPublicRooms.mockResolvedValue(
      ok({ data: [{ id: 1, image: "rooms/a.jpg" }], meta: {} }),
    );
    const response = await handlePanelRequest(
      request("rooms/public?page=2&limit=10"),
      ["rooms", "public"],
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
    );
    expect(response.headers.get("vary")).toBeNull();
    expect(mocks.getPublicRooms).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 }),
    );
    expect((await response.json()).result.data[0].imageUrl).toContain("rooms/a.jpg");
  });
  it("keeps the viewer's own rooms behind the session and out of every cache", async () => {
    mocks.token = undefined;
    const anonymous = await handlePanelRequest(request("rooms/mine"), ["rooms", "mine"]);
    expect(anonymous.status).toBe(401);
    expect(mocks.getMyRooms).not.toHaveBeenCalled();
    mocks.token = "session-token";
    mocks.getMyRooms.mockResolvedValue(ok({ data: [], meta: {} }));
    const response = await handlePanelRequest(request("rooms/mine?page=1&limit=10"), [
      "rooms",
      "mine",
    ]);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.getMyRooms).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );
  });
  it("rejects cross-origin mutations", async () => {
    const response = await handlePanelRequest(
      request("rooms/1/join", "POST", undefined, "https://attacker.test"),
      ["rooms", "1", "join"],
    );
    expect(response.status).toBe(403);
    expect(mocks.joinRoom).not.toHaveBeenCalled();
  });
  it("derives joining identity from the session rather than supplied userId", async () => {
    mocks.getMe.mockResolvedValue(ok({ id: 42 }));
    mocks.joinRoom.mockResolvedValue(ok({ message: "Joined" }));
    const response = await handlePanelRequest(
      request("rooms/3/join", "POST", { userId: 999 }),
      ["rooms", "3", "join"],
    );
    expect(response.status).toBe(200);
    expect(mocks.joinRoom).toHaveBeenCalledWith({ roomId: 3, userId: 42 });
  });
  it.each(["0", "-1", "1.5", "1/evil", "999999999999999999999999"])(
    "rejects invalid room id %s",
    async (id) => {
      const response = await handlePanelRequest(
        request("rooms/invalid/ratings"),
        ["rooms", id, "ratings"],
      );
      expect(response.status).toBe(400);
      expect(mocks.getRoomRatings).not.toHaveBeenCalled();
    },
  );
  it("rejects arbitrary backend paths", async () => {
    const response = await handlePanelRequest(request("admin"), ["admin"]);
    expect(response.status).toBe(404);
  });
  it("rejects excessive pagination", async () => {
    for (const list of ["public", "mine"]) {
      const response = await handlePanelRequest(
        request(`rooms/${list}?limit=1000000`),
        ["rooms", list],
      );
      expect(response.status).toBe(400);
    }
  });
  it("parses dates and boolean false without dropping filters", async () => {
    mocks.getRoomRatings.mockResolvedValue(ok({ data: [] }));
    const response = await handlePanelRequest(
      request(
        "rooms/1/ratings?startDate=2026-01-01&isWatchTogether=false&sortBy=userRate&sortByUserId=42",
      ),
      ["rooms", "1", "ratings"],
    );
    expect(response.status).toBe(200);
    expect(mocks.getRoomRatings).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        startDate: new Date("2026-01-01"),
        isWatchTogether: false,
        sortByUserId: "42",
      }),
      expect.any(AbortSignal),
    );
  });
  it("forwards the unrated filter and serves the rating summary", async () => {
    mocks.getRoomRatings.mockResolvedValue(ok({ data: [] }));
    await handlePanelRequest(
      request("rooms/1/ratings?hasVoted=false&isWatchTogether=true"),
      ["rooms", "1", "ratings"],
    );
    expect(mocks.getRoomRatings).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ hasVoted: false, isWatchTogether: true }),
      expect.any(AbortSignal),
    );
    mocks.getRoomRatingSummary.mockResolvedValue(
      ok({ unrated: 4, unratedWatchedTogether: 2 }),
    );
    const response = await handlePanelRequest(
      request("rooms/1/ratings/summary"),
      ["rooms", "1", "ratings", "summary"],
    );
    expect(response.status).toBe(200);
    expect(mocks.getRoomRatingSummary).toHaveBeenCalledWith(
      1,
      expect.any(AbortSignal),
    );
  });
  it("rejects a malformed hasVoted filter", async () => {
    const response = await handlePanelRequest(
      request("rooms/1/ratings?hasVoted=maybe"),
      ["rooms", "1", "ratings"],
    );
    expect(response.status).toBe(400);
  });
  it("does not leak upstream network diagnostics", async () => {
    mocks.getMe.mockResolvedValue({
      result: null,
      response: { ok: false, status: 0, message: "internal-host:secret" },
    });
    const response = await handlePanelRequest(request("me"), ["me"]);
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain(
      "internal-host",
    );
  });
  it("preserves backend authorization failures", async () => {
    mocks.getMe.mockResolvedValue({
      result: null,
      response: { ok: false, status: 403, message: "Forbidden" },
    });
    const response = await handlePanelRequest(request("me"), ["me"]);
    expect(response.status).toBe(403);
  });
  it.each([-1, 11, "7", null])("rejects invalid vote %s", async (rate) => {
    const response = await handlePanelRequest(
      request("rooms/1/ratings", "POST", { rate, movieId: "movie-1" }),
      ["rooms", "1", "ratings"],
    );
    expect(response.status).toBe(400);
    expect(mocks.castVote).not.toHaveBeenCalled();
  });
  it("accepts a zero vote", async () => {
    mocks.castVote.mockResolvedValue(ok({ message: "Voted" }));
    const response = await handlePanelRequest(
      request("rooms/1/ratings", "POST", { rate: 0, movieId: "movie-1" }),
      ["rooms", "1", "ratings"],
    );
    expect(response.status).toBe(200);
    expect(mocks.castVote).toHaveBeenCalledWith(1, {
      rate: 0,
      movieId: "movie-1",
    });
  });
  it("forwards only supplied room fields and clears nullable ones", async () => {
    mocks.updateRoom.mockResolvedValue(ok({ id: 1, name: "Noir", image: null }));
    const response = await handlePanelRequest(
      request("rooms/1", "PATCH", {
        name: " Noir ",
        description: "",
        themeColor: "#ff5733",
        image: null,
      }),
      ["rooms", "1"],
    );
    expect(response.status).toBe(200);
    const [id, payload] = mocks.updateRoom.mock.calls.at(-1)!;
    expect(id).toBe(1);
    expect(JSON.parse(JSON.stringify(payload))).toEqual({
      name: "Noir",
      description: null,
      themeColor: "#ff5733",
      image: null,
    });
    expect((await response.json()).result.imageUrl).toBeNull();
  });
  it.each([{ themeColor: "red" }, { name: "" }, { isPublic: "yes" }])(
    "rejects invalid room update %j",
    async (body) => {
      mocks.updateRoom.mockClear();
      const response = await handlePanelRequest(
        request("rooms/1", "PATCH", body),
        ["rooms", "1"],
      );
      expect(response.status).toBe(400);
      expect(mocks.updateRoom).not.toHaveBeenCalled();
    },
  );
  it("rejects cross-origin room updates", async () => {
    mocks.updateRoom.mockClear();
    const response = await handlePanelRequest(
      request("rooms/1", "PATCH", { name: "x" }, "https://attacker.test"),
      ["rooms", "1"],
    );
    expect(response.status).toBe(403);
    expect(mocks.updateRoom).not.toHaveBeenCalled();
  });
  it("forwards a trimmed custom movie and omits empty optional fields", async () => {
    mocks.addCustomMovieToRoom.mockResolvedValue(
      ok({ message: "Added", movieId: "movie-1" }),
    );
    const response = await handlePanelRequest(
      request("rooms/1/custom-movies", "POST", {
        title: "  Home Movie ",
        year: 2019,
        imdbLink: "",
        overview: " Shot on VHS ",
        dbId: 99,
      }),
      ["rooms", "1", "custom-movies"],
    );
    expect(response.status).toBe(200);
    expect(mocks.addCustomMovieToRoom).toHaveBeenCalledWith(1, {
      title: "Home Movie",
      year: 2019,
      overview: "Shot on VHS",
    });
  });
  it.each([
    [{ title: " ", year: 2019 }, "title"],
    [{ title: "Matrix", year: "1999" }, "year"],
    [{ title: "Matrix", year: 1869 }, "year"],
    [{ title: "Matrix", year: 1999, overview: "x".repeat(2001) }, "overview"],
  ])("rejects invalid custom movie %j with field errors", async (body, field) => {
    mocks.addCustomMovieToRoom.mockClear();
    const response = await handlePanelRequest(
      request("rooms/1/custom-movies", "POST", body),
      ["rooms", "1", "custom-movies"],
    );
    expect(response.status).toBe(400);
    expect((await response.json()).response.fieldErrors).toHaveProperty(field);
    expect(mocks.addCustomMovieToRoom).not.toHaveBeenCalled();
  });
  it("maps backend validation messages to custom movie fields", async () => {
    mocks.addCustomMovieToRoom.mockResolvedValue({
      result: null,
      response: {
        ok: false,
        status: 400,
        message: "imdbLink must be a URL address",
        messages: ["imdbLink must be a URL address"],
      },
    });
    const response = await handlePanelRequest(
      request("rooms/1/custom-movies", "POST", {
        title: "Matrix",
        year: 1999,
        imdbLink: "not-imdb",
      }),
      ["rooms", "1", "custom-movies"],
    );
    expect(response.status).toBe(400);
    expect((await response.json()).response.fieldErrors).toEqual({
      imdbLink: "Must be a URL address",
    });
  });
  it("forwards only onboarding fields when updating the current user", async () => {
    mocks.updateMe.mockResolvedValue(ok({ id: 1, onboardedAt: "2026-10-23T00:00:00Z" }));
    const genreIds = ["3f2b8a1e-0c4d-4e5f-9a6b-7c8d9e0f1a2b"];
    const response = await handlePanelRequest(
      request("me", "PATCH", { avatar: "https://cdn.test/a.webp", genreIds, onboarded: true }),
      ["me"],
    );
    expect(response.status).toBe(200);
    expect(mocks.updateMe).toHaveBeenCalledWith({
      avatar: "https://cdn.test/a.webp",
      genreIds,
      onboarded: true,
    });
  });
  it.each([
    {},
    { onboarded: false },
    { password: "hunter22" },
    { username: "  " },
    { avatar: "data:image/png;base64,AAAA" },
    { genreIds: ["not-a-uuid"] },
    { genreIds: Array(2).fill("3f2b8a1e-0c4d-4e5f-9a6b-7c8d9e0f1a2b") },
    {
      genreIds: Array.from({ length: 11 }, (_, i) =>
        `3f2b8a1e-0c4d-4e5f-9a6b-7c8d9e0f1a${String(i).padStart(2, "0")}`,
      ),
    },
  ])("rejects invalid current user update %j", async (body) => {
    mocks.updateMe.mockClear();
    const response = await handlePanelRequest(request("me", "PATCH", body), ["me"]);
    expect(response.status).toBe(400);
    expect(mocks.updateMe).not.toHaveBeenCalled();
  });
  it.each([
    [new File(["x"], "a.gif", { type: "image/gif" }), 415],
    [new File([new Uint8Array(2 * 1024 * 1024 + 1)], "a.png", { type: "image/png" }), 413],
  ])("rejects an unsuitable avatar before uploading", async (file, status) => {
    mocks.uploadImage.mockClear();
    const form = new FormData();
    form.set("file", file);
    form.set("folder", "avatars");
    const response = await handlePanelRequest(
      new Request("http://localhost/api/bff/uploads", { method: "POST", body: form }),
      ["uploads"],
    );
    expect(response.status).toBe(status);
    expect(mocks.uploadImage).not.toHaveBeenCalled();
  });
  it("trims an edited username", async () => {
    mocks.updateMe.mockResolvedValue(ok({ id: 1 }));
    const response = await handlePanelRequest(
      request("me", "PATCH", { username: "  Ana " }),
      ["me"],
    );
    expect(response.status).toBe(200);
    expect(mocks.updateMe).toHaveBeenCalledWith({ username: "Ana" });
  });
  describe("password change", () => {
    const change = (body: unknown) =>
      handlePanelRequest(request("me/password", "POST", body), ["me", "password"]);
    beforeEach(() => {
      mocks.updateMe.mockReset().mockResolvedValue(ok({ id: 1 }));
      mocks.signIn.mockReset().mockResolvedValue(ok({ accessToken: "secret" }));
      mocks.getMe.mockResolvedValue(ok({ id: 1, email: "ana@example.test" }));
    });
    it("verifies the current password before setting the new one", async () => {
      const response = await change({ currentPassword: "old-pass", newPassword: "new-pass" });
      expect(response.status).toBe(200);
      expect(mocks.signIn).toHaveBeenCalledWith({ email: "ana@example.test", password: "old-pass" });
      expect(mocks.updateMe).toHaveBeenCalledWith({ password: "new-pass" });
      expect(JSON.stringify(await response.json())).not.toContain("secret");
    });
    it("rejects a wrong current password without updating", async () => {
      mocks.signIn.mockResolvedValue({
        result: null,
        response: { ok: false, status: 401, message: "Invalid credentials" },
      });
      const response = await change({ currentPassword: "wrong", newPassword: "new-pass" });
      expect(response.status).toBe(400);
      expect(mocks.updateMe).not.toHaveBeenCalled();
    });
    it.each([
      { currentPassword: "old-pass", newPassword: "short" },
      { currentPassword: "same-pass", newPassword: "same-pass" },
      { newPassword: "new-pass" },
    ])("rejects %j", async (body) => {
      const response = await change(body);
      expect(response.status).toBe(400);
      expect(mocks.signIn).not.toHaveBeenCalled();
    });
  });
  it("preserves duplicate custom movie conflicts", async () => {
    mocks.addCustomMovieToRoom.mockResolvedValue({
      result: null,
      response: { ok: false, status: 409, message: "Movie is already in the room" },
    });
    const response = await handlePanelRequest(
      request("rooms/1/custom-movies", "POST", { title: "Matrix", year: 1999 }),
      ["rooms", "1", "custom-movies"],
    );
    expect(response.status).toBe(409);
  });
});
