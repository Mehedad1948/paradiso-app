import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  token: "session-token" as string | undefined,
  list: vi.fn(),
  sync: vi.fn(),
  send: vi.fn(),
  edit: vi.fn(),
  addReaction: vi.fn(),
  removeReaction: vi.fn(),
  vote: vi.fn(),
  markRead: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (mocks.token ? { value: mocks.token } : undefined),
  }),
}));
vi.mock("@/services/rooms/room-chat.service", () => ({ default: mocks }));
vi.mock("@/services/rooms", () => ({ default: {} }));
vi.mock("@/services/user", () => ({ default: {} }));
vi.mock("@/services/ratings", () => ({ default: {} }));
vi.mock("@/services/rooms/room-invite-link.service", () => ({ default: {} }));
vi.mock("@/services/storage", () => ({ default: {} }));
vi.mock("@/services/movies", () => ({ moviesServices: {} }));

import { handlePanelRequest } from "@/lib/bff/panel";

const ok = (result: unknown) => ({
  result,
  response: { ok: true, status: 200, statusText: "OK" },
});
const movieId = "3f1c2a9e-8d7b-4c6a-9e5f-0a1b2c3d4e5f";
function call(path: string, method = "GET", body?: unknown, origin?: string) {
  const request = new Request(`http://localhost/api/bff/${path}`, {
    method,
    headers: origin ? { origin } : undefined,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return handlePanelRequest(request, path.split("?")[0].split("/"));
}
beforeEach(() => {
  mocks.token = "session-token";
});

describe("BFF room chat", () => {
  it("pages history with a bounded limit", async () => {
    mocks.list.mockResolvedValue(ok({ data: [], nextCursor: null }));
    expect((await call("rooms/4/chat/messages?before=90")).status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith(4, 30, 90, expect.any(AbortSignal));
    expect((await call("rooms/4/chat/messages?limit=500")).status).toBe(400);
  });
  it("requires a valid sync cursor", async () => {
    mocks.sync.mockResolvedValue(ok({ data: [], cursor: "x", hasMore: false }));
    expect((await call("rooms/4/chat/messages/sync")).status).toBe(400);
    expect((await call("rooms/4/chat/messages/sync?since=2026-10-17T10:00:00.000Z")).status).toBe(200);
    expect(mocks.sync).toHaveBeenCalledWith(4, "2026-10-17T10:00:00.000Z", undefined, expect.any(AbortSignal));
  });
  it("rebuilds a send body from known fields only", async () => {
    mocks.send.mockResolvedValue(ok({ id: 1 }));
    const response = await call("rooms/4/chat/messages", "POST", {
      text: "  What do we watch?  ",
      authorId: 99,
      mentionedUserIds: [2, 2, 3],
      movies: [{ tmdbId: 603 }],
      poll: {
        options: [{ movieId }, { text: " Something else " }],
        anonymous: true,
        closesAt: "2026-10-18T10:00:00.000Z",
      },
    });
    expect(response.status).toBe(200);
    expect(mocks.send).toHaveBeenCalledWith(4, {
      text: "What do we watch?",
      mentionedUserIds: [2, 3],
      movies: [{ tmdbId: 603 }],
      poll: {
        options: [{ movieId }, { text: "Something else" }],
        allowsMultiple: false,
        anonymous: true,
        closesAt: "2026-10-18T10:00:00.000Z",
      },
    });
  });
  it.each([
    [{}],
    [{ text: "x".repeat(2001) }],
    [{ movies: [{ movieId, tmdbId: 1 }] }],
    [{ movies: [{ movieId: "not-a-uuid" }] }],
    [{ text: "Poll", poll: { options: [{ text: "only one" }] } }],
    [{ poll: { options: [{ text: "a" }, { text: "b" }] } }],
    [{ text: "hi", mentionedUserIds: Array.from({ length: 21 }, (_, index) => index + 1) }],
  ])("rejects an invalid message %#", async (body) => {
    expect((await call("rooms/4/chat/messages", "POST", body)).status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("sends the reaction emoji in the DELETE body and rejects plain text", async () => {
    mocks.removeReaction.mockResolvedValue(ok({ id: 7 }));
    expect((await call("rooms/4/chat/messages/7/reactions", "DELETE", { emoji: "🍿" })).status).toBe(200);
    expect(mocks.removeReaction).toHaveBeenCalledWith(4, 7, "🍿");
    expect((await call("rooms/4/chat/messages/7/reactions", "PUT", { emoji: "lol" })).status).toBe(400);
    expect(mocks.addReaction).not.toHaveBeenCalled();
  });
  it("accepts an empty vote to retract", async () => {
    mocks.vote.mockResolvedValue(ok({ id: 7 }));
    expect((await call("rooms/4/chat/messages/7/poll/vote", "PUT", { optionIds: [] })).status).toBe(200);
    expect(mocks.vote).toHaveBeenCalledWith(4, 7, []);
  });
  it("passes rate limiting through for the client toast", async () => {
    mocks.send.mockResolvedValue({
      result: null,
      response: { ok: false, status: 429, statusText: "", message: "You are sending messages too quickly" },
    });
    expect((await call("rooms/4/chat/messages", "POST", { text: "hi" })).status).toBe(429);
  });
  it("rejects cross-origin chat writes", async () => {
    const response = await call("rooms/4/chat/read", "PUT", { messageId: 3 }, "https://attacker.test");
    expect(response.status).toBe(403);
    expect(mocks.markRead).not.toHaveBeenCalled();
  });
  it("rejects unknown chat resources", async () => {
    expect((await call("rooms/4/chat/messages/7/admin", "POST")).status).toBe(404);
    expect((await call("rooms/4/chat/everything")).status).toBe(404);
  });
});
