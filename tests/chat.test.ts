import { describe, expect, it } from "vitest";
import {
  applyVote,
  initialCursor,
  mergeMessages,
  patchPinned,
  sortedMessages,
  syncDelay,
  toggleReaction,
} from "@/lib/chat/timeline";
import {
  insertMention,
  mentionQueryAt,
  mentionedUserIds,
  segmentText,
} from "@/lib/chat/mentions";
import type { ChatMessage } from "@/types/chat";

const alice = { id: 1, username: "alice", avatar: null };
const bob = { id: 2, username: "bob.k", avatar: null };

function message(id: number, patch: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id,
    roomId: 1,
    text: `message ${id}`,
    author: alice,
    replyTo: null,
    mentions: [],
    movies: [],
    reactions: [],
    poll: null,
    pinnedAt: null,
    pinnedById: null,
    editedAt: null,
    deletedAt: null,
    createdAt: "2026-10-17T10:00:00.000Z",
    updatedAt: "2026-10-17T10:00:00.000Z",
    ...patch,
  };
}
const later = "2026-10-17T10:05:00.000Z";

describe("chat timeline merging", () => {
  it("replaces a message only with a newer version from sync", () => {
    const store = new Map([[5, message(5)]]);
    expect(mergeMessages(store, [message(5, { text: "same time" })], "sync", true)).toBe(false);
    expect(store.get(5)?.text).toBe("message 5");
    expect(mergeMessages(store, [message(5, { text: "edited", updatedAt: later })], "sync", true)).toBe(true);
    expect(store.get(5)?.text).toBe("edited");
  });
  it("lets a mutation response win a timestamp tie", () => {
    const store = new Map([[5, message(5)]]);
    expect(mergeMessages(store, [message(5, { text: "mine" })], "mutation", true)).toBe(true);
    expect(store.get(5)?.text).toBe("mine");
  });
  it("never lets a stale sync overwrite a newer local version", () => {
    const store = new Map([[5, message(5, { text: "new", updatedAt: later })]]);
    expect(mergeMessages(store, [message(5)], "sync", true)).toBe(false);
    expect(store.get(5)?.text).toBe("new");
  });
  it("does not insert messages older than the loaded window", () => {
    const store = new Map([[10, message(10)], [11, message(11)]]);
    mergeMessages(store, [message(3, { updatedAt: later }), message(12)], "sync", false);
    expect(sortedMessages(store).map((item) => item.id)).toEqual([10, 11, 12]);
    mergeMessages(store, [message(4)], "mutation", false);
    expect(store.has(4)).toBe(false);
    mergeMessages(store, [message(9)], "history", false);
    expect(store.has(9)).toBe(true);
    mergeMessages(store, [message(3)], "sync", true);
    expect(store.has(3)).toBe(true);
  });
  it("starts sync from the newest server timestamp, or from a skewed client time", () => {
    expect(initialCursor([message(1), message(2, { updatedAt: later })], 0)).toBe(later);
    expect(initialCursor([], Date.parse(later))).toBe("2026-10-17T10:04:30.000Z");
  });
  it("backs off once the room goes quiet", () => {
    expect(syncDelay(0)).toBe(4_000);
    expect(syncDelay(6)).toBe(15_000);
    expect(syncDelay(20)).toBe(30_000);
  });
});

describe("optimistic chat updates", () => {
  it("toggles a reaction and drops chips that reach zero", () => {
    const added = toggleReaction(message(1), "🍿", 7, true);
    expect(added.reactions).toEqual([{ emoji: "🍿", count: 1, reactedByMe: true, userIds: [7] }]);
    expect(toggleReaction(added, "🍿", 7, true)).toBe(added);
    expect(toggleReaction(added, "🍿", 7, false).reactions).toEqual([]);
  });
  it("moves a single-choice vote and keeps the voter count", () => {
    const poll = message(1, {
      poll: {
        allowsMultiple: false,
        anonymous: false,
        closesAt: null,
        closedAt: null,
        isClosed: false,
        totalVoters: 1,
        options: [
          { id: 1, text: "A", movieId: null, votes: 1, votedByMe: true, voterIds: [7] },
          { id: 2, text: "B", movieId: null, votes: 0, votedByMe: false, voterIds: [] },
        ],
      },
    });
    const moved = applyVote(poll, [2], 7).poll!;
    expect(moved.totalVoters).toBe(1);
    expect(moved.options.map((option) => [option.votes, option.votedByMe, option.voterIds])).toEqual([
      [0, false, []],
      [1, true, [7]],
    ]);
    expect(applyVote(poll, [], 7).poll!.totalVoters).toBe(0);
  });
  it("keeps the pinned list in step with any message it sees", () => {
    const pinned = [message(1, { pinnedAt: "2026-10-17T09:00:00.000Z" })];
    const next = patchPinned(pinned, [message(2, { pinnedAt: later, updatedAt: later })]);
    expect(next.map((item) => item.id)).toEqual([2, 1]);
    expect(patchPinned(next, [message(2, { updatedAt: "2026-10-17T11:00:00.000Z" })]).map((item) => item.id)).toEqual([1]);
    expect(patchPinned(pinned, [message(9)])).toBe(pinned);
  });
});

describe("chat mentions", () => {
  it("finds the @query being typed at the caret", () => {
    expect(mentionQueryAt("hi @bo", 6)).toEqual({ query: "bo", start: 3 });
    expect(mentionQueryAt("mail a@bo", 9)).toBeNull();
  });
  it("replaces the typed query with the username", () => {
    expect(insertMention("hi @bo there", 3, 6, "bob.k")).toEqual({ text: "hi @bob.k there", caret: 10 });
  });
  it("sends ids only for members still named in the text", () => {
    expect(mentionedUserIds("@alice and @bob.k!", [alice, bob])).toEqual([1, 2]);
    expect(mentionedUserIds("@alicea and bob.k", [alice, bob])).toEqual([]);
  });
  it("segments mentions and links for rendering", () => {
    expect(segmentText("hey @bob.k see https://example.com.", [bob])).toEqual([
      { type: "text", value: "hey " },
      { type: "mention", value: "@bob.k", user: bob },
      { type: "text", value: " see " },
      { type: "link", value: "https://example.com" },
      { type: "text", value: "." },
    ]);
    expect(segmentText("me@bob.k", [bob])).toEqual([{ type: "text", value: "me@bob.k" }]);
  });
});
