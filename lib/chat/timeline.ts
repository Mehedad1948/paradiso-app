import type { ChatMessage } from "@/types/chat";

export type MergeSource = "history" | "sync" | "mutation";

const time = (value: string | null | undefined) =>
  value ? Date.parse(value) : 0;

/**
 * Upserts `incoming` into `store` and reports whether anything changed.
 * - History pages always insert: they extend the loaded window.
 * - Sync can repeat messages, so equal `updatedAt` is not a change.
 * - A mutation response is the latest server state, so it wins ties.
 * - Only history inserts below the loaded window; anything else would leave a
 *   gap (e.g. unpinning an old message from the pinned bar).
 */
export function mergeMessages(
  store: Map<number, ChatMessage>,
  incoming: readonly ChatMessage[],
  source: MergeSource,
  historyComplete: boolean,
) {
  let oldest = Infinity;
  for (const id of Array.from(store.keys())) if (id < oldest) oldest = id;
  let changed = false;
  for (const message of incoming) {
    const existing = store.get(message.id);
    if (existing) {
      const delta = time(message.updatedAt) - time(existing.updatedAt);
      if (delta > 0 || (delta === 0 && source === "mutation")) {
        store.set(message.id, message);
        changed = true;
      }
    } else if (
      source === "history" ||
      historyComplete ||
      store.size === 0 ||
      message.id > oldest
    ) {
      store.set(message.id, message);
      changed = true;
    }
  }
  return changed;
}

export function sortedMessages(store: Map<number, ChatMessage>) {
  return Array.from(store.values()).sort((a, b) => a.id - b.id);
}

/** Sync cursor after the first page: server time when possible, else the client's. */
export function initialCursor(messages: readonly ChatMessage[], loadedAt: number) {
  let latest = 0;
  for (const message of messages) latest = Math.max(latest, time(message.updatedAt));
  // An empty room has no server timestamp; step back to absorb clock skew.
  return new Date(latest || loadedAt - 30_000).toISOString();
}

/** 4 s while the room is active, then 15 s, then 30 s once it has been quiet. */
export function syncDelay(idleTicks: number) {
  return idleTicks < 6 ? 4_000 : idleTicks < 20 ? 15_000 : 30_000;
}

export function toggleReaction(
  message: ChatMessage,
  emoji: string,
  userId: number,
  add: boolean,
): ChatMessage {
  const current = message.reactions.find((reaction) => reaction.emoji === emoji);
  if (add === !!current?.reactedByMe) return message;
  if (!current)
    return {
      ...message,
      reactions: [
        ...message.reactions,
        { emoji, count: 1, reactedByMe: true, userIds: [userId] },
      ],
    };
  return {
    ...message,
    reactions: message.reactions
      .map((reaction) =>
        reaction.emoji !== emoji
          ? reaction
          : {
              ...reaction,
              count: reaction.count + (add ? 1 : -1),
              reactedByMe: add,
              userIds: add
                ? [...reaction.userIds, userId]
                : reaction.userIds.filter((id) => id !== userId),
            },
      )
      .filter((reaction) => reaction.count > 0),
  };
}

export function applyVote(
  message: ChatMessage,
  optionIds: readonly number[],
  userId: number,
): ChatMessage {
  const poll = message.poll;
  if (!poll) return message;
  const hadVoted = poll.options.some((option) => option.votedByMe);
  const votes = optionIds.length > 0;
  return {
    ...message,
    poll: {
      ...poll,
      totalVoters: poll.totalVoters + (votes === hadVoted ? 0 : votes ? 1 : -1),
      options: poll.options.map((option) => {
        const selected = optionIds.includes(option.id);
        if (selected === option.votedByMe) return option;
        return {
          ...option,
          votedByMe: selected,
          votes: option.votes + (selected ? 1 : -1),
          voterIds: poll.anonymous
            ? option.voterIds
            : selected
              ? [...option.voterIds, userId]
              : option.voterIds.filter((id) => id !== userId),
        };
      }),
    },
  };
}

/** Keeps the pinned list current from any message the client sees. */
export function patchPinned(
  pinned: ChatMessage[],
  incoming: readonly ChatMessage[],
) {
  const byId = new Map(pinned.map((message) => [message.id, message]));
  let changed = false;
  for (const message of incoming) {
    const existing = byId.get(message.id);
    if (existing && time(existing.updatedAt) > time(message.updatedAt)) continue;
    const isPinned = !!message.pinnedAt && !message.deletedAt;
    if (isPinned) {
      if (existing !== message) changed = true;
      byId.set(message.id, message);
    } else if (existing) {
      byId.delete(message.id);
      changed = true;
    }
  }
  if (!changed) return pinned;
  return Array.from(byId.values()).sort(
    (a, b) => time(b.pinnedAt) - time(a.pinnedAt) || b.id - a.id,
  );
}

export function isPollClosed(poll: NonNullable<ChatMessage["poll"]>, now = Date.now()) {
  return poll.isClosed || (!!poll.closesAt && time(poll.closesAt) <= now);
}
