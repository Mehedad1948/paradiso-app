import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  token: "session-token" as string | undefined,
  getRooms: vi.fn(),
  getMe: vi.fn(),
  joinRoom: vi.fn(),
  getRoomRatings: vi.fn(),
  castVote: vi.fn(),
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
vi.mock("@/services/rooms/room-invite-link.service", () => ({ default: {} }));
vi.mock("@/services/storage", () => ({ default: {} }));
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
    const response = await handlePanelRequest(request("rooms"), ["rooms"]);
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.getRooms).not.toHaveBeenCalled();
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
    const response = await handlePanelRequest(request("rooms?limit=1000000"), [
      "rooms",
    ]);
    expect(response.status).toBe(400);
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
});
